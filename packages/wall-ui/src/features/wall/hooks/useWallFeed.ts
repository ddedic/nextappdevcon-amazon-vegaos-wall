import type { RemoteCommand } from "@boothwall/shared";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AppState } from "react-native";

import { appConfig } from "../../../app/app.config";
import { EARLY_SNAPSHOT_MS, PING_MS, SILENT_SOCKET_MS } from "../constants/feed";
import { fetchWall } from "../data/fetchWall";
import { simulatedSnapshot, startSimulatedEvents } from "../data/simulatedFeed";
import { parseWallEvent, reconnectDelayMs, wallSocketUrl } from "../data/wallSocket";
import { connectionPhase, type FeedStatus } from "../state/connectionPhase";
import { initialWallState, type WallAction, wallReducer } from "../state/wallState";

type LiveOptions = {
  /** false in simulation: keep the socket for remote commands, ignore photo traffic. */
  photos: boolean;
  dispatch: (action: WallAction) => void;
  setStatus: (status: FeedStatus) => void;
  onLoaded: () => void;
  onFailure: () => void;
  onRemote: (command: RemoteCommand) => void;
};

/** HTTP snapshot, then live events over the socket; the snapshot is refetched on every reconnect. */
function connectLive({ photos, dispatch, setStatus, onLoaded, onFailure, onRemote }: LiveOptions) {
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let snapshotTimer: ReturnType<typeof setTimeout> | undefined;
  let attempt = 0;
  let snapshotAttempt = 0;
  let lastHeard = 0;
  let disposed = false;
  let snapshotSeq = 0;

  const loadSnapshot = () => {
    if (!photos) return;
    if (snapshotTimer !== undefined) clearTimeout(snapshotTimer);
    const seq = ++snapshotSeq;
    fetchWall()
      .then((snapshot) => {
        if (disposed || seq !== snapshotSeq) return;
        snapshotAttempt = 0;
        dispatch({ type: "snapshot", snapshot });
        onLoaded();
      })
      .catch(() => {
        if (disposed || seq !== snapshotSeq) return;
        // On a live socket, dropping it makes the reconnect backoff retry both together.
        // Without one (still connecting, or HTTP-only), retry the snapshot on its own backoff.
        if (socket?.readyState === WebSocket.OPEN) drop();
        else snapshotTimer = setTimeout(loadSnapshot, reconnectDelayMs(snapshotAttempt++));
      });
  };

  const handleClose = () => {
    socket = null;
    if (pingTimer !== undefined) clearInterval(pingTimer);
    if (disposed) return;
    if (photos) {
      setStatus("offline");
      onFailure();
    }
    retryTimer = setTimeout(connect, reconnectDelayMs(attempt++));
  };

  /** Close without waiting for the close handshake, which a dead link may never finish. */
  const drop = () => {
    const dead = socket;
    if (!dead) return;
    dead.onopen = dead.onmessage = dead.onerror = dead.onclose = null;
    try {
      dead.close();
    } catch {
      // Already closed.
    }
    handleClose();
  };

  const connect = () => {
    if (retryTimer !== undefined) clearTimeout(retryTimer);
    const ws = new WebSocket(wallSocketUrl(appConfig.apiBaseUrl));
    socket = ws;

    ws.onopen = () => {
      // The socket beat the early HTTP fallback: the snapshot below covers start-up too.
      clearTimeout(earlyTimer);
      lastHeard = Date.now();
      if (photos) setStatus("live");
      loadSnapshot();
      pingTimer = setInterval(() => {
        // Two missed pongs, or a wake from sleep: the link is gone even if no close arrived.
        if (Date.now() - lastHeard > SILENT_SOCKET_MS) drop();
        else if (ws.readyState === WebSocket.OPEN) ws.send("ping");
      }, PING_MS);
    };

    ws.onmessage = ({ data }) => {
      lastHeard = Date.now();
      // Reset the backoff only once the server actually talks: a socket that opens and drops
      // straight away would otherwise retry every second.
      attempt = 0;
      // Pongs, malformed and unknown events are dropped quietly.
      const event = parseWallEvent(data);
      if (!event) return;
      if (event.type === "remote.command") onRemote(event.command);
      else if (photos) dispatch({ type: "event", event });
    };

    ws.onclose = handleClose;
    ws.onerror = drop;
  };

  // Back from the background or a sleeping screen: reconnect now and refetch, instead of
  // waiting out a long backoff or a stale socket.
  const appState = AppState.addEventListener("change", (next) => {
    if (next !== "active" || disposed) return;
    if (socket?.readyState === WebSocket.OPEN) {
      if (Date.now() - lastHeard > SILENT_SOCKET_MS) drop();
      else loadSnapshot();
    } else if (!socket) {
      attempt = 0;
      connect();
    }
  });

  // Skip the HTTP snapshot when the socket opens quickly (its onopen fetches one); keep it as
  // the fallback when the socket can't connect at all.
  const earlyTimer = setTimeout(loadSnapshot, EARLY_SNAPSHOT_MS);
  connect();

  return () => {
    disposed = true;
    appState.remove();
    clearTimeout(earlyTimer);
    if (retryTimer !== undefined) clearTimeout(retryTimer);
    if (snapshotTimer !== undefined) clearTimeout(snapshotTimer);
    if (pingTimer !== undefined) clearInterval(pingTimer);
    if (socket) {
      socket.onopen = socket.onmessage = socket.onerror = socket.onclose = null;
      socket.close();
    }
  };
}

type WallFeedOptions = {
  onRemote: (command: RemoteCommand) => void;
  /** Forces demo mode on or off; defaults to boothwall.config.ts. */
  demo?: boolean;
};

export function useWallFeed({ onRemote, demo }: WallFeedOptions) {
  const [state, dispatch] = useReducer(wallReducer, initialWallState);
  const simulation = useMemo(
    () => ({ ...appConfig.simulation, enabled: demo ?? appConfig.simulation.enabled }),
    [demo],
  );
  const [status, setStatus] = useState<FeedStatus>(simulation.enabled ? "simulated" : "connecting");
  const [loaded, setLoaded] = useState(false);
  const [attempts, setAttempts] = useState(0);
  // Latest handler without reconnecting the socket when it changes.
  const remoteRef = useRef(onRemote);
  remoteRef.current = onRemote;

  useEffect(() => {
    const disconnect = connectLive({
      photos: !simulation.enabled,
      dispatch,
      setStatus,
      onLoaded: () => setLoaded(true),
      onFailure: () => setAttempts((n) => n + 1),
      onRemote: (command) => remoteRef.current(command),
    });
    if (!simulation.enabled) return disconnect;

    const snapshot = simulatedSnapshot(simulation.photos);
    dispatch({ type: "snapshot", snapshot });
    const stopSimulation = startSimulatedEvents(
      snapshot.photos,
      simulation.newPhotoEveryMs,
      (event) => dispatch({ type: "event", event }),
    );
    return () => {
      stopSimulation();
      disconnect();
    };
  }, [simulation]);

  const settle = useCallback((photoId: string) => dispatch({ type: "settled", photoId }), []);
  const rotate = useCallback(() => dispatch({ type: "rotate" }), []);
  const show = useCallback((photoId: string) => dispatch({ type: "show", photoId }), []);
  const pin = useCallback((ids: string[]) => dispatch({ type: "pin", ids }), []);

  const connection = { phase: connectionPhase(status, loaded), attempts };

  return { state, status, connection, settle, rotate, show, pin };
}
