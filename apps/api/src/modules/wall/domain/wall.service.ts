import type { WallEvent } from "@boothwall/shared";

import type { WallRoom } from "@/modules/wall/realtime/wall.room";

const ROOM_NAME = "main";

const room = (namespace: DurableObjectNamespace<WallRoom>) =>
  namespace.get(namespace.idFromName(ROOM_NAME));

export const wallService = {
  broadcaster(namespace: DurableObjectNamespace<WallRoom>) {
    return {
      async broadcast(event: WallEvent) {
        await room(namespace).broadcast(JSON.stringify(event));
      },
    };
  },

  connect(namespace: DurableObjectNamespace<WallRoom>, request: Request): Promise<Response> {
    return room(namespace).fetch(request);
  },
};
