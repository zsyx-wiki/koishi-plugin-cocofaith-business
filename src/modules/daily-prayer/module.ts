import { BusinessError } from "../../framework/errors";
import { defineBusinessModule, type BusinessResult } from "../../framework/types";
import { DEFAULT_DAILY_PRAYER_CONFIG, validateDailyPrayerConfig } from "./config";
import { PRAYER_BY_WORD } from "./data";
import { DailyPrayerService } from "./service";
import type { DailyPrayerConfig, DailyPrayerResult } from "./types";
import type { FaithAdminNumericFieldsApi } from "../faith-admin";
import { MESSAGES } from "../../../messages";

export function createDailyPrayerModule() {
  let service: DailyPrayerService;
  return defineBusinessModule<never, never, DailyPrayerConfig>({
    name: "daily_prayer", dependencies: ["faith", "faith_admin"], defaultConfig: DEFAULT_DAILY_PRAYER_CONFIG, validateConfig: validateDailyPrayerConfig,
    init(context) {
      service = new DailyPrayerService(context.core, context.config);
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
    commands: [...PRAYER_BY_WORD].map(([word, prayer], index) => ({
      id: `pray_${index + 1}`, commands: [word], description: `${prayer.faith}信仰每日祈祷`, scenes: ["group"],
      async execute(ctx): Promise<BusinessResult> {
        if (ctx.uid === null) throw new BusinessError("UNREGISTERED");
        const result = await service.pray(ctx.uid, prayer.faith, prayer.god);
        await ctx.core.hooks.emit("completed", result);
        return { type: "text", content: formatResult(result) };
      },
    })),
  });
}

export const dailyPrayerModule = createDailyPrayerModule();

function formatResult(result: DailyPrayerResult) {
  return MESSAGES.dailyPrayer.result(result.god, result.reward.ascension_score, result.reward.gold, result.count, result.limit);
}
