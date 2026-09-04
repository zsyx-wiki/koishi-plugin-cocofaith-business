import type { FaithBusinessCoreScope } from "@mueo/koishi-plugin-faith-core";
import { BusinessError } from "../../framework/errors";
import { TitleRegistry } from "./registry";
import type { TitleDefinition, TitleServiceApi, UserTitleState } from "./types";

interface Row { uid: number; titles: string[]; active: string; updated_at: Date; }

export class TitleService extends TitleRegistry implements TitleServiceApi {
  private cache = new Map<number, UserTitleState>();
  private queues = new Map<number, Promise<void>>();
  private persisted = new Set<number>();
  constructor(private core: FaithBusinessCoreScope) { super(); }

  async state(uid: number): Promise<UserTitleState> {
    const cached = this.cache.get(uid); if (cached) return cached;
    const [, rows] = await Promise.all([this.core.users.require(uid), this.core.table.get({ uid })]), row = rows[0];
    if (row) this.persisted.add(uid); else this.persisted.delete(uid);
    return this.remember(normalizeRow(uid, row));
  }
  async listOwned(uid: number) { const state = await this.state(uid); return Object.freeze(state.titles.flatMap((id) => { const title = this.get(id); return title ? [title] : []; })); }
  async getActive(uid: number) { const state = await this.state(uid); return state.active ? this.get(state.active) ?? null : null; }
  grant(uid: number, value: string) { return this.serial(uid, async () => { const title = this.require(value), state = await this.state(uid); if (state.titles.includes(title.id)) return false; await this.write(state, [...state.titles, title.id], state.active); return true; }); }
  revoke(uid: number, value: string) { return this.serial(uid, async () => { const title = this.resolve(value); if (!title) return false; const state = await this.state(uid); if (!state.titles.includes(title.id)) return false; await this.write(state, state.titles.filter((id) => id !== title.id), state.active === title.id ? null : state.active); return true; }); }
  use(uid: number, value: string | null) { return this.serial(uid, async () => {
    const state = await this.state(uid);
    if (value === null) { await this.write(state, state.titles, null); return null; }
    const title = this.require(value);
    if (!state.titles.includes(title.id)) throw new BusinessError("NOT_ALLOWED", `你尚未拥有称号【${title.name}】。`);
    await this.write(state, state.titles, title.id); return title;
  }); }
  async unregister(value: string, options: { force?: boolean } = {}) {
    const title = this.resolve(value); if (!title) return false;
    if (!title.custom && !options.force) throw new BusinessError("NOT_ALLOWED", "内置称号不能注销。");
    const all = await this.core.table.get();
    const rows = (all as Row[]).filter((row) => Array.isArray(row.titles) && row.titles.includes(title.id));
    if (rows.length && !options.force) throw new BusinessError("CONFLICT", "仍有用户持有该称号，不能注销。");
    if (options.force) {
      for (const row of all as Row[]) if (row.titles.includes(title.id)) await this.serial(row.uid, () => this.write(normalizeRow(row.uid, row), row.titles.filter((id) => id !== title.id), row.active === title.id ? null : row.active));
    }
    return this.remove(title.id);
  }
  require(value: string) { const title = this.resolve(value); if (!title) throw new BusinessError("NOT_FOUND", `不存在称号【${value}】。`); return title; }
  clearCache() { this.cache.clear(); this.persisted.clear(); }

  private async write(previous: UserTitleState, titles: readonly string[], active: string | null) {
    const unique = [...new Set(titles)]; if (unique.length > 512) throw new BusinessError("LIMIT_REACHED", "单个用户最多持有 512 个称号。");
    const now = new Date(), patch = { titles: unique, active: active ?? "", updated_at: now };
    if (!this.persisted.has(previous.uid)) {
      try { await this.core.table.create({ uid: previous.uid, ...patch }); }
      catch { this.cache.delete(previous.uid); this.persisted.add(previous.uid); throw new BusinessError("CONFLICT", "称号数据刚刚发生变化，请重试。"); }
      this.persisted.add(previous.uid);
    } else {
      const result = await this.core.table.set({ uid: previous.uid, updated_at: previous.updatedAt }, patch) as { matched?: number };
      if (result.matched !== 1) { this.cache.delete(previous.uid); throw new BusinessError("CONFLICT", "称号数据刚刚发生变化，请重试。"); }
    }
    return this.remember({ uid: previous.uid, titles: Object.freeze(unique), active, updatedAt: now });
  }
  private remember(value: UserTitleState) { if (this.cache.size >= 10_000) this.cache.delete(this.cache.keys().next().value!); this.cache.set(value.uid, value); return value; }
  private async serial<T>(uid: number, task: () => Promise<T>) {
    const previous = this.queues.get(uid) ?? Promise.resolve(), gate = previous.catch(() => undefined).then(task);
    const queue = gate.then(() => undefined, () => undefined); this.queues.set(uid, queue);
    try { return await gate; } finally { if (this.queues.get(uid) === queue) this.queues.delete(uid); }
  }
}

function normalizeRow(uid: number, value?: Partial<Row>): UserTitleState {
  const titles = Array.isArray(value?.titles) ? [...new Set(value.titles.filter((id): id is string => typeof id === "string"))] : [];
  const active = typeof value?.active === "string" && titles.includes(value.active) ? value.active : null;
  return Object.freeze({ uid, titles: Object.freeze(titles), active, updatedAt: value?.updated_at instanceof Date ? value.updated_at : new Date(0) });
}
