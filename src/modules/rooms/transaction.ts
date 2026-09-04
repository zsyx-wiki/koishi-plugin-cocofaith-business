import type { FaithAtomicScope } from "@mueo/koishi-plugin-cocofaith-core";
import { createHash } from "node:crypto";
import type { RoomTransaction } from "./types";

export const progressKey = (uid: number, owner: string) => createHash("sha256").update(`player:${owner}:${uid}`).digest("hex");
export function roomTransaction(scopes: ReadonlyMap<number, FaithAtomicScope>, owner: string): RoomTransaction {
  const rows = new Map<number, any>();
  return Object.freeze({ player(uid: number) {
    const scope = scopes.get(uid);
    if (!scope) throw new Error("事务不能访问未参赛的用户");
    const key = progressKey(uid, owner);
    const load = async () => {
      if (!rows.has(uid)) rows.set(uid, (await scope.table.get({ key }))[0] ?? null);
      return rows.get(uid);
    };
    return Object.freeze({
      user: scope.users, economy: scope.economy, items: scope.items,
      async progress<T extends Record<string, unknown>>(initial: T): Promise<T> {
        return structuredClone((await load())?.room.progress ?? initial);
      },
      async saveProgress(value: Record<string, unknown>) {
        const previous = await load(), room = { progress: structuredClone(value) }, version = (previous?.version ?? 0) + 1;
        if (!previous) await scope.table.create({ key, active: false, version, room });
        else {
          const result = await scope.table.set({ key, version: previous.version }, { room, version });
          if (result.matched !== 1) throw new Error("玩家战绩更新冲突");
        }
        rows.set(uid, { key, active: false, room, version });
      },
    });
  } });
}
