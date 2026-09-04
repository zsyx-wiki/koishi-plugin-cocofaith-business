import { defineBusinessModule } from "../../framework/types";
import { GameRoomService } from "./service";
export function createRoomsModule() {
  let rooms: GameRoomService;
  return defineBusinessModule({
    name: "rooms",
    init(ctx) {
      ctx.core.registerTable({ key: "string", active: "boolean", version: "unsigned", room: "json" }, { primary: "key", indexes: ["active"] });
      rooms = new GameRoomService(ctx.core);
      ctx.provide("default", {
        register: rooms.register.bind(rooms), create: rooms.create.bind(rooms),
        command: rooms.command.bind(rooms), progress: rooms.progress.bind(rooms),
      });
    },
    ready: () => rooms.load(),
    dispose: () => rooms.close(),
  });
}
export const roomsModule = createRoomsModule();
export * from "./types";
export * from "./service";
