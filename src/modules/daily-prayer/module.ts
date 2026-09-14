import { BusinessError } from "../../framework/errors";
import { defineBusinessModule, type BusinessResult } from "../../framework/types";
import { DEFAULT_DAILY_PRAYER_CONFIG, validateDailyPrayerConfig } from "./config";
import { DailyPrayerService } from "./service";
import type { DailyPrayerConfig, DailyPrayerResult } from "./types";
import type { FaithAdminNumericFieldsApi } from "../faith-admin";
import { MESSAGES } from "../../../messages";

export function createDailyPrayerModule() {
  let service: DailyPrayerService;
  let matchesPrayer = (_word: string) => false;
  return defineBusinessModule<never, never, DailyPrayerConfig>({
    name: "daily_prayer", dependencies: ["faith", "faith_admin"], defaultConfig: DEFAULT_DAILY_PRAYER_CONFIG, validateConfig: validateDailyPrayerConfig,
    init(context) {
      service = new DailyPrayerService(context.core, context.config);
      matchesPrayer = (word) => !!context.core.faiths.resolvePrayerWord(word);
      const admin = context.use<FaithAdminNumericFieldsApi>("faith_admin", "numeric-fields");
      context.core.lifecycle.track(admin.register({ name: "永久祈祷", description: "永久增加每日祈祷上限", async change({ targetUid, delta, operationId }) {
        const after = await service.adjust(targetUid, "permanentExtra", delta, operationId);
        return MESSAGES.dailyPrayer.adjusted(targetUid, "永久祈祷次数", delta, after);
      } }));
      context.core.lifecycle.track(admin.register({ name: "临时祈祷", description: "仅当前游戏日有效的额外祈祷次数", async change({ targetUid, delta, operationId }) {
        const after = await service.adjust(targetUid, "temporaryExtra", delta, operationId);
        return MESSAGES.dailyPrayer.adjusted(targetUid, "临时祈祷次数", delta, after);
      } }));
      context.provide("default", Object.freeze({ status: (uid: number) => service.status(uid) }), { version: "1.0.0" });
    },
    reload(context) { service = new DailyPrayerService(context.core, context.config); },
    commands: [{
      id: "pray", commands: [], match: (content) => matchesPrayer(content), description: "当前信仰每日祈祷", scenes: ["group"],
      async execute(ctx): Promise<BusinessResult> {
        if (ctx.uid === null) throw new BusinessError("UNREGISTERED");
        const faith = ctx.core.faiths.resolvePrayerWord(ctx.event.content);
        if (!faith) throw new BusinessError("NOT_FOUND", "这段祷词没有对应的信仰。");
        const result = await service.pray(ctx.uid, faith.name, faith.deity_name ?? faith.name);
        await ctx.core.hooks.emit("completed", result);
        return { type: "text", content: formatResult(result) };
      },
    }],
  });
}

export const dailyPrayerModule = createDailyPrayerModule();

function formatResult(result: DailyPrayerResult) {
  return MESSAGES.dailyPrayer.result(result.god, result.reward.ascension_score, result.reward.gold, result.count, result.limit);
}
