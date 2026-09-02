import { BusinessError } from "../../errors";
import { defineBusinessModule, type BusinessCommandContext, type BusinessResult } from "../../types";
import { FaithGameplayService, formatFaithInfo, type FaithGameplayConfig } from "./service";
import { FaithSaleService, parseSaleArgs } from "./sale";

const DEFAULT_CONFIG: FaithGameplayConfig = Object.freeze({
  abandonBaseAscensionCost: 1_200,
  abandonAscensionCostPerUse: 1_000,
  abandonMaxAscensionCost: 10_000,
  changeProfessionGoldCost: 1_000,
  changeProfessionAscensionCost: 50,
});
const CONFIG_KEYS = [
  "abandonBaseAscensionCost", "abandonAscensionCostPerUse", "abandonMaxAscensionCost",
  "changeProfessionGoldCost", "changeProfessionAscensionCost",
] as const;

export function createFaithModule() {
  let gameplay: FaithGameplayService;
  let sale: FaithSaleService;
  const information = async (ctx: BusinessCommandContext): Promise<BusinessResult> => {
    const uid = requireUid(ctx.uid), user = await gameplay.info(uid);
    const profession = user.profession_id ? ctx.core.professions.get(user.profession_id) : undefined;
    return { type: "text", content: formatFaithInfo(user, profession) };
  };
  return defineBusinessModule<never, never, FaithGameplayConfig>({
  name: "faith",
  defaultConfig: DEFAULT_CONFIG,
  validateConfig(value): FaithGameplayConfig {
    if (!value || typeof value !== "object") throw new BusinessError("CONFIG_INVALID", "信仰业务配置必须是对象。");
    const input = value as Record<string, unknown>;
    const config: FaithGameplayConfig = { ...DEFAULT_CONFIG };
    for (const key of CONFIG_KEYS) {
      const number = input[key];
      if (!Number.isSafeInteger(number) || (number as number) < 0 || (number as number) > 1_000_000_000) throw new BusinessError("CONFIG_INVALID", `信仰业务配置 ${key} 必须是非负安全整数。`);
      config[key] = number as number;
    }
    if (config.abandonMaxAscensionCost < config.abandonBaseAscensionCost) throw new BusinessError("CONFIG_INVALID", "弃誓登神分上限不能低于基础消耗。");
    return config;
  },
  init(context) {
    gameplay = new FaithGameplayService(context.core, context.config);
    sale = new FaithSaleService(context.core);
    context.provide("registry", Object.freeze({
      get: context.core.faiths.get, has: context.core.faiths.has, all: context.core.faiths.all, byPath: context.core.faiths.byPath,
    }), { version: "1.0.0" });
  },
  commands: [{
    id: "faith", commands: ["信仰"], description: "信仰基础功能", execute: information,
    children: [
      { id: "info", commands: ["信息", "info"], execute: information },
      { id: "register", commands: ["注册", "register"], allowUnregistered: true, async execute(ctx) {
        if (!ctx.event.identity) throw new BusinessError("INVALID_INPUT", "注册事件缺少平台身份。");
        const faith = ctx.args.join(" ").trim();
        const user = await gameplay.register(ctx.event.identity, faith);
        return { type: "text", content: `你已信仰【${user.faiths[0]}】！初始获得 ${user.gold} 金币。` };
      } },
      { id: "abandon", commands: ["弃誓"], async execute(ctx) {
        const result = await gameplay.abandon(requireUid(ctx.uid), ctx.args.join(" "));
        return { type: "text", content: `你已弃誓【${result.oldFaith}】，转而信仰【${result.newFaith}】。\n消耗：${result.cost.ascensionCost} 登神分、${result.cost.audienceCost} 觐见分。` };
      } },
      { id: "profession", commands: ["职业"], async execute(ctx) {
        const uid = requireUid(ctx.uid), name = ctx.args.join(" ").trim(), user = await gameplay.info(uid);
        if (!user.faiths[0]) throw new BusinessError("NOT_ALLOWED", "请先注册信仰。");
        if (!name) {
          const current = user.profession_id ? ctx.core.professions.get(user.profession_id) : undefined;
          if (current) return { type: "text", content: `你当前的职业是【${current.type} - ${current.name}】。如需更换，请使用“信仰 变更职业 [职业名]”。` };
          const choices = gameplay.professions(user.faiths[0]);
          return { type: "text", content: choices.length ? `【${user.faiths[0]}】可选职业：\n${choices.map((item) => `${item.type}：${item.name}`).join("\n")}` : `【${user.faiths[0]}】暂无可选职业。` };
        }
        const profession = await gameplay.chooseProfession(uid, name);
        return { type: "text", content: `选择成功！你现在的职业是【${profession.type} - ${profession.name}】。` };
      } },
      { id: "change_profession", commands: ["变更职业", "更换职业"], async execute(ctx) {
        const result = await gameplay.changeProfession(requireUid(ctx.uid), ctx.args.join(" "));
        return { type: "text", content: `付出 ${result.cost.gold} 金币和 ${result.cost.ascension} 登神分后，职业从【${result.old?.name ?? "未知"}】变更为【${result.profession.type} - ${result.profession.name}】。` };
      } },
      { id: "sell", commands: ["卖出", "出售"], scenes: ["group"], async execute(ctx) {
        const input = parseSaleArgs(ctx.args), result = await sale.sell(requireUid(ctx.uid), input.item, input.quantity);
        return { type: "text", content: `已出售【${result.item!.name}】×${result.quantity}｜金币 +${result.gold}` };
      } },
      { id: "sell_level", commands: ["卖出等级", "出售等级"], scenes: ["group"], async execute(ctx) {
        if (ctx.args.length !== 1) throw new BusinessError("INVALID_INPUT", "格式：信仰 卖出等级 [等级]");
        const result = await sale.sellLevel(requireUid(ctx.uid), ctx.args[0], false);
        return { type: "text", content: `${result.level} 级出售完成｜${result.kinds} 种，共 ${result.quantity} 件｜金币 +${result.gold}\n每种物品已保留 1 件。` };
      } },
      { id: "force_sell_level", commands: ["强制卖出等级", "强制出售等级", "全卖等级"], scenes: ["group"], async execute(ctx) {
        if (ctx.args.length !== 1) throw new BusinessError("INVALID_INPUT", "格式：信仰 强制卖出等级 [等级]");
        const result = await sale.sellLevel(requireUid(ctx.uid), ctx.args[0], true);
        return { type: "text", content: `${result.level} 级全部出售｜${result.kinds} 种，共 ${result.quantity} 件｜金币 +${result.gold}` };
      } },
    ],
  }],
  });
}

export const faithModule = createFaithModule();
export * from "./sale";

function requireUid(uid: number | null) {
  if (uid === null) throw new BusinessError("UNREGISTERED", "你尚未注册，只能使用“信仰 注册 [信仰名]”。");
  return uid;
}
