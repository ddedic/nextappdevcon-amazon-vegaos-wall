import { type RemoteCommand, wallEventSchema } from "@vegaos-demo/shared";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { appConfig } from "@/app/app.config";
import { fetchWall } from "@/features/wall/data/fetchWall";
import { simulatedSnapshot, startSimulatedEvents } from "@/features/wall/data/simulatedFeed";
import { connectionPhase, type FeedStatus } from "@/features/wall/state/connectionPhase";
import { initialWallState, type WallAction, wallReducer } from "@/features/wall/state/wallState";

const PING_MS = 25_000;
const MAX_BACKOFF_MS = 15_000;

type LiveOptions = {
  /** false in simulation: keep the socket for remote commands, ignore photo traffic. */
  photos: boolean;
  dispatch: (action: WallAction) => void;
  setStatus: (status: FeedStatus) => void;
  onLoaded: () => void;
  onFailure: () => void;
  onRemote: (command: RemoteCommand) => void;
};

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** HTTP snapshot, then live events over the socket; the snapshot is refetched on every reconnect. */
function connectLive({ photos, dispatch, setStatus, onLoaded, onFailure, onRemote }: LiveOptions) {
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let pingTimer: ReturnType<typeof setInterval> | undefined;
  let attempt = 0;
  let disposed = false;
  let snapshotSeq = 0;

  // A failed snapshot drops the socket, so the reconnect backoff retries both together.
  const loadSnapshot = () => {
    if (!photos) return;
    const seq = ++snapshotSeq;
    fetchWall()
      .then((snapshot) => {
        if (disposed) return;
        dispatch({ type: "snapshot", snapshot });
        onLoaded();
      })
      .catch(() => {
        if (!disposed && seq === snapshotSeq) socket?.close();
      });
  };

  const connect = () => {
    socket = new WebSocket(`${appConfig.apiBaseUrl.replace(/^http/, "ws")}/wall/live`);

    socket.onopen = () => {
      attempt = 0;
      if (photos) setStatus("live");
      loadSnapshot();
      pingTimer = setInterval(() => socket?.send("ping"), PING_MS);
    };

    socket.onmessage = ({ data }) => {
      if (typeof data !== "string" || data === "pong") return;
      const parsed = wallEventSchema.safeParse(parseJson(data));
      if (!parsed.success) return;
      const event = parsed.data;
      if (event.type === "remote.command") onRemote(event.command);
      else if (photos) dispatch({ type: "event", event });
    };

    socket.onclose = () => {
      if (pingTimer !== undefined) clearInterval(pingTimer);
      if (disposed) return;
      if (photos) {
        setStatus("offline");
        onFailure();
      }
      retryTimer = setTimeout(connect, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt++));
    };

    socket.onerror = () => socket?.close();
  };

  loadSnapshot();
  connect();

  return () => {
    disposed = true;
    if (retryTimer !== undefined) clearTimeout(retryTimer);
    if (pingTimer !== undefined) clearInterval(pingTimer);
    socket?.close();
  };
}

export function useWallFeed({ onRemote }: { onRemote: (command: RemoteCommand) => void }) {
  const [state, dispatch] = useReducer(wallReducer, initialWallState);
  const { simulation } = appConfig;
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
  const rotate = useCallback((keep: string[]) => dispatch({ type: "rotate", keep }), []);
  const show = useCallback(
    (photoId: string, slot: number) => dispatch({ type: "show", photoId, slot }),
    [],
  );

  const connection = { phase: connectionPhase(status, loaded), attempts };

  return { state, status, connection, settle, rotate, show };
}
