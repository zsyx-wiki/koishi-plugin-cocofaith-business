import { BusinessError } from "../../errors";
import { defineBusinessModule } from "../../types";
import { BUILTIN_TITLES } from "./data";
import { TitleService } from "./service";
import type { TitleServiceApi } from "./types";

export function createTitleModule() {
  let service: TitleService;
  return defineBusinessModule({
    name: "title",
    init(context) {
      context.core.registerTable({
        uid: "unsigned", titles: "json", active: "string", updated_at: "timestamp",
      }, { primary: "uid", indexes: ["active"] });
      service = new TitleService(context.core);
      service.registerMany(BUILTIN_TITLES);
      context.core.lifecycle.track(context.core.bonuses.registerProvider(async ({ uid, type }) => {
        const state = await service.state(uid), result = [];
        for (const id of state.titles) {
          const title = service.get(id); if (!title) continue;
          for (const bonus of title.bonuses ?? []) if (bonus.type === type && (bonus.activeWhen !== "equipped" || state.active === id)) {
            result.push({ source: `title:${title.id}`, type, modifier: bonus.modifier, fixedBonus: bonus.fixedBonus, detail: bonus.detail ?? `称号【${title.name}】` });
          }
        }
        return result;
      }, { id: "title-bonuses" }));
      context.contribute<{ uid: number }, string>("faith.info", async ({ uid }) => {
        const active = await service.getActive(uid); return `称号：${active ? `【${active.name}】` : "无"}`;
      }, { id: "active-title", priority: 10 });
      context.provide<TitleServiceApi>("default", createPublicApi(service), { version: "1.0.0" });
    },
    dispose() { service.clearCache(); },
    commands: [{
      id: "title", commands: ["称号"], scenes: ["group"], description: "查看和使用称号",
      execute() { return { type: "text", content: "称号命令｜称号 列表｜称号 详情 [称号名]｜称号 使用 [称号名]" }; },
      children: [
        { id: "list", commands: ["列表"], async execute(ctx) {
          const titles = await service.listOwned(requireUid(ctx.uid)), active = await service.getActive(requireUid(ctx.uid));
          if (!titles.length) return { type: "text", content: "你尚未获得任何称号。" };
          return { type: "text", content: titles.map((title, index) => `${index + 1}. 【${title.name}】${active?.id === title.id ? "（使用中）" : ""}`).join("\n") };
        } },
        { id: "detail", commands: ["详情"], async execute(ctx) {
          const name = ctx.args.join(" ").trim(); if (!name) throw new BusinessError("INVALID_INPUT", "格式：称号 详情 [称号名]");
          const owned = await service.listOwned(requireUid(ctx.uid)), title = service.resolve(name);
          if (!title || !owned.some((item) => item.id === title.id)) throw new BusinessError("NOT_FOUND", `你尚未拥有称号【${name}】。`);
          const bonuses = title.bonuses?.length ? title.bonuses.map(formatBonus).join("、") : "无";
          return { type: "text", content: `【${title.name}】\n${title.description}\n来源：${title.source}\n加成：${bonuses}` };
        } },
        { id: "use", commands: ["使用", "佩戴"], async execute(ctx) {
          const name = ctx.args.join(" ").trim(); if (!name) throw new BusinessError("INVALID_INPUT", "格式：称号 使用 [称号名]");
          const title = await service.use(requireUid(ctx.uid), name);
          return { type: "text", content: `已使用称号【${title!.name}】。` };
        } },
      ],
    }],
  });
}

export const titleModule = createTitleModule();
function requireUid(uid: number | null) { if (uid === null) throw new BusinessError("UNREGISTERED"); return uid; }
function formatBonus(value: { modifier?: number; fixedBonus?: number; detail?: string }) { if (value.detail) return value.detail; return [value.modifier ? `${value.modifier > 0 ? "+" : ""}${value.modifier * 100}%` : "", value.fixedBonus ? `${value.fixedBonus > 0 ? "+" : ""}${value.fixedBonus}` : ""].filter(Boolean).join(" "); }
function createPublicApi(service: TitleService): TitleServiceApi {
  return Object.freeze({
    register: (value, options) => service.register(value, options), registerMany: (values, options) => service.registerMany(values, options),
    unregister: (value, options) => service.unregister(value, options), get: (id) => service.get(id), getByName: (name) => service.getByName(name),
    resolve: (value) => service.resolve(value), all: () => service.all(), listOwned: (uid) => service.listOwned(uid), getActive: (uid) => service.getActive(uid),
    grant: (uid, value) => service.grant(uid, value), revoke: (uid, value) => service.revoke(uid, value), use: (uid, value) => service.use(uid, value),
  });
}
