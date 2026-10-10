import type { WallSnapshotDTO } from "@boothwall/shared";
import {
  DEMO_PHOTO_COUNT,
  parseWallEvent,
  PING_MS,
  reconnectDelayMs,
  simulatedSnapshot,
  wallSocketUrl,
} from "@boothwall/wall-ui";
import { useEffect, useState } from "react";

import { appConfig } from "@/app/app.config";
import { applyWallEvent } from "@/features/wall/data/applyWallEvent";
import { fetchWallSnapshot } from "@/features/wall/data/liveWallApi";

export type LiveWallStatus = "demo" | "connecting" | "live";

export interface LiveWall {
  snapshot: WallSnapshotDTO | null;
  status: LiveWallStatus;
}

/**
 * The wall's photos for the phone feed: a snapshot over HTTP, then live events over the same
 * socket the TVs use, with the same backoff and keepalive. The snapshot is fetched again on
 * every reconnect and whenever the tab comes back, so nothing is missed while the phone slept.
 * In demo mode it's the bundled photos.
 */
export function useLiveWall(demo: boolean): LiveWall {
  const [snapshot, setSnapshot] = useState<WallSnapshotDTO | null>(() =>
    demo ? simulatedSnapshot(DEMO_PHOTO_COUNT) : null,
  );
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (demo) return;
    let socket: WebSocket | undefined;
    let retry: number | undefined;
    let ping: number | undefined;
    let attempt = 0;
    let stopped = false;

    const refresh = () => {
      fetchWallSnapshot()
        .then((next) => !stopped && setSnapshot(next))
        .catch(() => undefined);
    };
    const connect = () => {
      const ws = new WebSocket(wallSocketUrl(appConfig.apiBaseUrl));
      socket = ws;
      ws.onopen = () => {
        setLive(true);
        refresh();
        ping = window.setInterval(() => ws.send("ping"), PING_MS);
      };
      ws.onmessage = ({ data }) => {
        attempt = 0;
        const event = parseWallEvent(data);
        if (event) setSnapshot((current) => current && applyWallEvent(current, event));
      };
      ws.onclose = () => {
        window.clearInterval(ping);
        setLive(false);
        if (!stopped) retry = window.setTimeout(connect, reconnectDelayMs(attempt++));
      };
    };
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      refresh();
      if (socket?.readyState === WebSocket.CLOSED) {
        window.clearTimeout(retry);
        attempt = 0;
        connect();
      }
    };

    refresh();
    connect();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      window.clearTimeout(retry);
      window.clearInterval(ping);
      document.removeEventListener("visibilitychange", onVisible);
      socket?.close();
    };
  }, [demo]);

  return { snapshot, status: demo ? "demo" : live ? "live" : "connecting" };
}
