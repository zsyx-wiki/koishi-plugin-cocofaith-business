import { Schema } from "koishi";
import type { Config as BusinessConfig } from "./src/framework/types";
import { DEFAULT_FAITH_CONFIG } from "./src/modules/faith/config";
import { DEFAULT_VOID_PRAYER_CONFIG } from "./src/modules/void-prayer/config";
import { DEFAULT_DAILY_PRAYER_CONFIG } from "./src/modules/daily-prayer/config";
import { DEFAULT_JUNK_CONFIG } from "./src/modules/junk/config";
import { DEFAULT_ROULETTE_CONFIG } from "./src/modules/roulette/config";

const faithDefaults = { ...DEFAULT_FAITH_CONFIG };
const probabilityDefaults = { ...DEFAULT_VOID_PRAYER_CONFIG.probabilities };
const upDefaults = [...DEFAULT_VOID_PRAYER_CONFIG.upSpItems];
const voidDefaults = { ...DEFAULT_VOID_PRAYER_CONFIG, probabilities: probabilityDefaults, upSpItems: upDefaults };
const dailyDefaults = { ...DEFAULT_DAILY_PRAYER_CONFIG };
const junkDefaults = { ...DEFAULT_JUNK_CONFIG };
const rouletteDefaults = { ...DEFAULT_ROULETTE_CONFIG };

export const Config: Schema<BusinessConfig> = Schema.object({
  faith: Schema.object({
    enabled: Schema.boolean().default(true),
    config: Schema.object({
      abandonBaseAscensionCost: integerInput(1200, "首次弃誓登神分消耗。默认 1200。"),
      abandonAscensionCostPerUse: integerInput(1000, "每次弃誓增加的登神分消耗。默认 1000。"),
      abandonMaxAscensionCost: integerInput(10000, "弃誓登神分消耗上限。默认 10000。"),
      changeProfessionGoldCost: integerInput(1000, "变更职业金币消耗。默认 1000。"),
      changeProfessionAscensionCost: integerInput(50, "变更职业登神分消耗。默认 50。"),
    }).default(faithDefaults),
  }).default({ enabled: true, config: faithDefaults }).description("信仰业务。"),
  voidPrayer: Schema.object({
    enabled: Schema.boolean().default(true),
    config: Schema.object({
      baseCost: integerInput(45, "每日前三次祈求的单次金币消耗。默认 45。"),
      extraCost: integerInput(80, "超过基础次数后的单次金币消耗。默认 80。"),
      baseCostDraws: integerInput(3, "每日使用基础价格的次数。默认 3。"),
      dailyLimit: integerInput(10, "每日基础祈求上限。默认 10。"),
      maxDrawsPerCommand: integerInput(100, "单条命令最大祈求次数。默认 100。"),
      easterEggChance: probabilityInput(0.05, "彩蛋概率。默认 0.05。"),
      probabilities: Schema.object({
        SP: probabilityInput(0.0005, "SP 概率。"), SSS: probabilityInput(0.0043, "SSS 概率。"), SS: probabilityInput(0.0152, "SS 概率。"),
        S: probabilityInput(0.0374, "S 概率。"), A: probabilityInput(0.0897, "A 概率。"), B: probabilityInput(0.1608, "B 概率。"),
        C: probabilityInput(0.3188, "C 概率。"), D: probabilityInput(0.3733, "D 概率。"),
      }).default(probabilityDefaults),
      upSpItems: Schema.array(Schema.string()).default(upDefaults),
    }).default(voidDefaults),
  }).default({ enabled: true, config: voidDefaults }).description("虚空祈求。"),
  dailyPrayer: Schema.object({
    enabled: Schema.boolean().default(true),
    config: Schema.object({
      baseLimit: integerInput(1, "每日基础祈祷次数。默认 1。"),
      ascensionMin: integerInput(-10, "登神分基础奖励下限。默认 -10。"),
      ascensionMax: integerInput(75, "登神分基础奖励上限。默认 75。"),
      goldMin: integerInput(-25, "金币基础奖励下限。默认 -25。"),
      goldMax: integerInput(400, "金币基础奖励上限。默认 400。"),
    }).default(dailyDefaults),
  }).default({ enabled: true, config: dailyDefaults }).description("每日祈祷。"),
  junk: Schema.object({
    enabled: Schema.boolean().default(true),
    config: Schema.object({
      itemCount: integerInput(3, "每次捡到的物品数量。默认 3。"),
      paidGoldCost: integerInput(200, "每日第二次捡垃圾消耗的金币。默认 200。"),
      paidAscensionCost: integerInput(5, "每日第二次捡垃圾消耗的登神分。默认 5。"),
    }).default(junkDefaults),
  }).default({ enabled: true, config: junkDefaults }).description("捡垃圾。每日首次免费，第二次付费。"),
  roulette: Schema.object({
    enabled: Schema.boolean().default(true),
    config: Schema.object({
      turnSeconds: integerInput(45, "每人操作时限，默认45秒，范围5-300。发送失败不暂停。"),
      normalMin: integerInput(4, "普通模式最低人数，默认4，范围2-12。"),
      gamblerMin: integerInput(5, "赌徒模式最低人数，默认5，范围2-15。"),
      crazyMin: integerInput(8, "疯狂模式最低人数，默认8，范围2-16。"),
      entryFee: integerInput(100, "疯狂模式基础门票，默认100金币；开局时按等级折扣统一扣费。"),
    }).default(rouletteDefaults),
  }).default({ enabled: true, config: rouletteDefaults }).description("恶魔轮盘。门票需足额支付，淘汰罚款可使余额为负。"),
  modules: Schema.dict(Schema.object({
    enabled: Schema.boolean().default(true),
    config: Schema.dict(Schema.any()).default({}),
  })).default({}).description("额外业务模块配置。"),
});

function integerInput(value: number, description: string) {
  return Schema.number().default(value).description(description);
}
function probabilityInput(value: number, description: string) {
  return Schema.number().default(value).description(`${description} 填写 0-1 之间的小数。`);
}

export type Config = BusinessConfig;
