import type { FaithAdminNumericFieldsApi } from "../faith-admin";
import { formatItem } from "../../shared/item-format";
import { BusinessError } from "../../framework/errors";
import { defineBusinessModule, type BusinessResult } from "../../framework/types";
import { DEFAULT_VOID_PRAYER_CONFIG, validateVoidPrayerConfig } from "./config";
import { VoidPrayerService, type VoidPrayerAdjustment } from "./service";
import { VOID_PRAYER_LEVELS, type VoidPrayerConfig, type VoidPrayerResult } from "./types";
import { MESSAGES } from "../../../messages";

export function createVoidPrayerModule() {
  let service: VoidPrayerService;
  return defineBusinessModule<never, never, VoidPrayerConfig>({
    name: "void_prayer",
    dependencies: ["faith", "faith_admin"],
    defaultConfig: DEFAULT_VOID_PRAYER_CONFIG,
    validateConfig: validateVoidPrayerConfig,
    init(context) {
      service = new VoidPrayerService(context.core, context.config);
      const admin = context.use<FaithAdminNumericFieldsApi>("faith_admin", "numeric-fields");
      registerAdminField(admin, context, service, "奖励祈求", "consumableExtra", "可在每日次数耗尽后使用的额外祈求次数");
      registerAdminField(admin, context, service, "祈求上限", "permanentExtra", "永久增加每日虚空祈求上限");
      registerAdminField(admin, context, service, "额外祈求", "temporaryExtra", "仅当前游戏日有效的额外祈求次数");
      context.provide("default", Object.freeze({ status: (uid: number) => service.status(uid) }), { version: "1.0.0" });
    },
    reload(context) { service = new VoidPrayerService(context.core, context.config); },
    commands: [{
      id: "void_prayer", commands: ["虚空祈求"], description: "消耗金币从虚空中获取物品", scenes: ["group"],
      async execute(ctx): Promise<BusinessResult> {
        if (ctx.uid === null) throw new BusinessError("UNREGISTERED");
        const count = parseCount(ctx.args);
        const result = await service.pray(ctx.uid, count);
        await ctx.core.hooks.emit("completed", Object.freeze({ uid: ctx.uid, date: result.date, cost: result.cost, counts: result.counts, spItems: result.draws.filter((draw) => draw.item.level === "SP").map((draw) => draw.item.name) }));
        return { type: "text", content: formatResult(result, ctx.core.items.levels.compare) };
      },
      children: [{
        id: "status", commands: ["次数", "状态"], scenes: ["group"], async execute(ctx) {
          if (ctx.uid === null) throw new BusinessError("UNREGISTERED");
          const value = await service.status(ctx.uid);
          return { type: "text", content: MESSAGES.voidPrayer.status(value.dailyUsed, value.dailyLimit, value.remaining, value.consumableExtra, value.costReduction) };
        },
      }],
    }],
  });
}

export const voidPrayerModule = createVoidPrayerModule();

function parseCount(args: readonly string[]) {
  if (!args.length) return 1;
  if (args.length !== 1 || !/^\d+$/.test(args[0])) throw new BusinessError("INVALID_INPUT", "格式：虚空祈求 [次数]");
  return Number(args[0]);
}
function formatResult(result: VoidPrayerResult, compare: (a: string, b: string) => number) {
  const levels = Object.keys(result.counts).sort((a, b) => compare(b, a)).map((level) => `${level}×${result.counts[level]}`).join(" · ");
  const top = [...result.draws].sort((a, b) => compare(b.item.level, a.item.level)).slice(0, 5);
  return MESSAGES.voidPrayer.result(result.actual, result.requested, result.cost, levels, top.map((draw) => formatItem(draw.item)).join("\n"), result.used, result.dailyLimit, result.remaining);
}
function registerAdminField(admin: FaithAdminNumericFieldsApi, context: Parameters<NonNullable<ReturnType<typeof defineBusinessModule>["init"]>>[0], service: VoidPrayerService, name: string, field: VoidPrayerAdjustment, description: string) {
  context.core.lifecycle.track(admin.register({ name, description, async change({ targetUid, delta }) {
    const after = await service.adjust(targetUid, field, delta);
    return MESSAGES.voidPrayer.adjusted(targetUid, name, delta, after);
  } }));
}
