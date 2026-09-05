import type { InventoryMutation } from "@mueo/koishi-plugin-cocofaith-core";
import { defineBusinessModule, type BusinessCommandContext } from "../../framework/types";
import { BusinessError } from "../../framework/errors";
import type { TitleServiceApi } from "../title";
import type { FaithAdminCommandsApi } from "../faith-admin";
import { CollectionService } from "./service";
import type { CollectionRule } from "./catalog";
import { MESSAGES } from "../../../messages";

export interface CollectionApi {
  state: CollectionService["state"];
  has: CollectionService["has"];
  progress: CollectionService["progress"];
  details: CollectionService["details"];
  refresh: CollectionService["refresh"];
  configure(itemId: string, rule: CollectionRule): () => void;
}

export function createCollectionModule() {
  let service: CollectionService;
  const uid = (ctx: BusinessCommandContext) => {
    if (ctx.uid === null) throw new BusinessError("UNREGISTERED");
    return ctx.uid;
  };
  const details = (limited: boolean) => async (ctx: BusinessCommandContext) => {
    if (ctx.args.length > 1 || (ctx.args[0] !== undefined && !/^[1-9]\d*$/.test(ctx.args[0]))) throw new BusinessError("INVALID_INPUT", "格式：图鉴 详情/限定详情 [页码]");
    const user = uid(ctx); await service.refresh(user);
    const result = await service.details(user, limited, Number(ctx.args[0] ?? 1));
    return { type: "text" as const, content: MESSAGES.collection.page(limited, result.page, result.pages, result.entries.map((e) => `${e.collected ? "✓" : "○"} [${e.item.level === "??" ? "彩蛋" : e.item.level}] ${e.item.name}${e.pool ? `（${e.pool}）` : ""}`)) };
  };
  return defineBusinessModule({
    name: "collection", dependencies: ["title", "faith_admin"],
    init(ctx) {
      ctx.core.registerTable({ uid: "unsigned", items: "json", updated_at: "timestamp" }, { primary: "uid" });
      service = new CollectionService(ctx.core, ctx.use<TitleServiceApi>("title"));
      ctx.provide<CollectionApi>("default", Object.freeze({
        state: service.state.bind(service), has: service.has.bind(service), progress: service.progress.bind(service),
        details: service.details.bind(service), refresh: service.refresh.bind(service),
        configure: (itemId: string, rule: CollectionRule) => service.catalog.configure(itemId, rule),
      }));
      ctx.core.lifecycle.track(ctx.core.hooks.on<InventoryMutation>("inventory/changed", async (event) => {
        if (event.delta > 0) await service.record(event.uid, [event.item_id]);
      }, { id: "collection-inventory", timeout: 0 }));
      ctx.core.lifecycle.track(ctx.use<FaithAdminCommandsApi>("faith_admin", "commands").register({
        business: "collection", command: "图鉴", description: "根据背包刷新图鉴",
        async execute({ args }) {
          if (args.length !== 1 || args[0] !== "刷新") throw new BusinessError("INVALID_INPUT", "格式：信仰管理 图鉴 刷新");
          const result = await service.refreshAll();
          return { type: "text", content: MESSAGES.collection.refreshed(result.checked, result.added, result.failed) };
        },
      }));
    },
    commands: [{
      id: "collection", commands: ["图鉴"], description: "查看收藏图鉴",
      execute() { return { type: "text", content: MESSAGES.collection.help }; },
      children: [
        { id: "view", commands: ["查看"], async execute(ctx) {
          const user = uid(ctx); await service.refresh(user);
          const rows = await service.progress(user);
          return { type: "text", content: MESSAGES.collection.progress(rows.map((r) => `${r.pool || "常规"}·${r.category}：${r.collected}/${r.total}`)) };
        } },
        { id: "details", commands: ["详情"], execute: details(false) },
        { id: "limited", commands: ["限定详情"], execute: details(true) },
      ],
    }],
  });
}
export * from "./service";
export * from "./catalog";
