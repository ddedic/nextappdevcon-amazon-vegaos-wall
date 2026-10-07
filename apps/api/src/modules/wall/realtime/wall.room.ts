import { DurableObject } from "cloudflare:workers";

import type { AppBindings } from "@/core/runtime/bindings";

const MAX_SOCKETS = 50;

/** Hibernatable sockets: idle walls cost nothing and pings are answered without waking it. */
export class WallRoom extends DurableObject<AppBindings> {
  constructor(ctx: DurableObjectState, env: AppBindings) {
    super(ctx, env);
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  override async fetch(): Promise<Response> {
    // A booth has a handful of screens; this stops anyone from piling up open sockets.
    if (this.ctx.getWebSockets().length >= MAX_SOCKETS) {
      return new Response("Too many screens connected", { status: 503 });
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  /** RPC: fan a serialized wall event out to every connected screen. */
  broadcast(message: string): number {
    const sockets = this.ctx.getWebSockets();
    for (const socket of sockets) {
      try {
        socket.send(message);
      } catch {
        // Socket already closing; the runtime cleans it up.
      }
    }
    return sockets.length;
  }

  override webSocketClose(socket: WebSocket, code: number, reason: string): void {
    try {
      socket.close(code, reason);
    } catch {
      // 1005/1006 can't be echoed back; the socket is gone either way.
    }
  }
}
