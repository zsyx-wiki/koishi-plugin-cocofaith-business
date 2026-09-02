import { Schema } from "koishi";
import type { Config as BusinessConfig } from "./src/types";

const faithDefaults = { abandonBaseAscensionCost: 1200, abandonAscensionCostPerUse: 1000, abandonMaxAscensionCost: 10000, changeProfessionGoldCost: 1000, changeProfessionAscensionCost: 50 };
const probabilityDefaults = { SP: 0.0005, SSS: 0.0043, SS: 0.0152, S: 0.0374, A: 0.0897, B: 0.1608, C: 0.3188, D: 0.3733 };
const upDefaults = ["真理仪轨", "忆妄之镜", "骨仆赎罪者子嗣之戒", "骨仆乐乐尔之戒"];
const voidDefaults = { baseCost: 45, extraCost: 80, baseCostDraws: 3, dailyLimit: 10, maxDrawsPerCommand: 100, easterEggChance: 0.05, probabilities: probabilityDefaults, upSpItems: upDefaults };
const dailyDefaults = { baseLimit: 1, ascensionMin: -10, ascensionMax: 75, goldMin: -25, goldMax: 400 };
const junkDefaults = { itemCount: 3, paidGoldCost: 200, paidAscensionCost: 5 };

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
