import type { FaithAdminNumericFieldsApi } from "../faith-admin";
import { BusinessError } from "../../errors";
import { defineBusinessModule, type BusinessResult } from "../../types";
import { DEFAULT_VOID_PRAYER_CONFIG, validateVoidPrayerConfig } from "./config";
import { VoidPrayerService, type VoidPrayerAdjustment } from "./service";
import { VOID_PRAYER_LEVELS, type VoidPrayerConfig, type VoidPrayerResult } from "./types";

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
          return { type: "text", content: `虚空祈求｜今日 ${value.dailyUsed}/${value.dailyLimit}\n剩余 ${value.remaining} 次（奖励次数 ${value.consumableExtra}）\n费用减免 ${Math.round(value.costReduction * 100)}%` };
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
  const levels = ["彩蛋", ...VOID_PRAYER_LEVELS].filter((level) => result.counts[level]).map((level) => `${level}×${result.counts[level]}`).join(" · ");
  const top = [...result.draws].sort((a, b) => compare(b.easterEgg ? "彩蛋" : b.item.level, a.easterEgg ? "彩蛋" : a.item.level)).slice(0, 5);
  return [
    `虚空祈求 ×${result.actual}｜消耗 ${result.cost} 金币`,
    levels,
    `最高：${top.map((draw) => `【${draw.item.name}】`).join("、")}`,
    `今日 ${result.used}/${result.dailyLimit}｜剩余 ${result.remaining} 次`,
    result.actual < result.requested ? `可用次数不足，已自动调整为 ${result.actual} 次。` : "",
  ].filter(Boolean).join("\n");
}
function registerAdminField(admin: FaithAdminNumericFieldsApi, context: Parameters<NonNullable<ReturnType<typeof defineBusinessModule>["init"]>>[0], service: VoidPrayerService, name: string, field: VoidPrayerAdjustment, description: string) {
  context.core.lifecycle.track(admin.register({ name, description, async change({ targetUid, delta }) {
    const after = await service.adjust(targetUid, field, delta);
    return `已调整 UID ${targetUid} 的${name}：${delta > 0 ? "+" : ""}${delta}，当前为 ${after}。`;
  } }));
}
