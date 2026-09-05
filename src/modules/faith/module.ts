import { BusinessError } from "../../framework/errors";
import { defineBusinessModule, type BusinessCommandContext, type BusinessResult } from "../../framework/types";
import { FaithGameplayService, formatFaithInfo, type FaithGameplayConfig } from "./service";
import { FaithSaleService, parseSaleArgs } from "./sale";
import { FaithOpenItemService } from "./open";
import { formatItem } from "../../shared/item-format";
import { MESSAGES } from "../../../messages";
import { DEFAULT_FAITH_CONFIG, validateFaithConfig } from "./config";

export function createFaithModule() {
  let gameplay: FaithGameplayService;
  let sale: FaithSaleService;
  let opener: FaithOpenItemService;
  const information = async (ctx: BusinessCommandContext): Promise<BusinessResult> => {
    const uid = requireUid(ctx.uid), user = await gameplay.info(uid);
    const profession = user.profession_id ? ctx.core.professions.get(user.profession_id) : undefined;
    const extensions = await ctx.collect<{ uid: number }, string>("faith.info", Object.freeze({ uid }));
    return { type: "text", content: [formatFaithInfo(user, profession), ...extensions.results].filter(Boolean).join("\n") };
  };
  return defineBusinessModule<never, never, FaithGameplayConfig>({
  name: "faith",
  defaultConfig: DEFAULT_FAITH_CONFIG,
  validateConfig: validateFaithConfig,
  init(context) {
    gameplay = new FaithGameplayService(context.core, context.config);
    sale = new FaithSaleService(context.core);
    opener = new FaithOpenItemService(context.core);
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
        return { type: "text", content: MESSAGES.faith.registered(user.faiths[0], user.gold) };
      } },
      { id: "abandon", commands: ["弃誓"], async execute(ctx) {
        const result = await gameplay.abandon(requireUid(ctx.uid), ctx.args.join(" "));
        return { type: "text", content: MESSAGES.faith.abandoned(result.oldFaith, result.newFaith, result.cost.ascensionCost, result.cost.audienceCost) };
      } },
      { id: "profession", commands: ["职业"], async execute(ctx) {
        const uid = requireUid(ctx.uid), name = ctx.args.join(" ").trim(), user = await gameplay.info(uid);
        if (!user.faiths[0]) throw new BusinessError("NOT_ALLOWED", "请先注册信仰。");
        if (!name) {
          const current = user.profession_id ? ctx.core.professions.get(user.profession_id) : undefined;
          if (current) return { type: "text", content: MESSAGES.faith.currentProfession(current.type, current.name) };
          const choices = gameplay.professions(user.faiths[0]);
          return { type: "text", content: MESSAGES.faith.professionChoices(user.faiths[0], choices) };
        }
        const profession = await gameplay.chooseProfession(uid, name);
        return { type: "text", content: MESSAGES.faith.professionChosen(profession.type, profession.name) };
      } },
      { id: "change_profession", commands: ["变更职业", "更换职业"], async execute(ctx) {
        const result = await gameplay.changeProfession(requireUid(ctx.uid), ctx.args.join(" "));
        return { type: "text", content: MESSAGES.faith.professionChanged(result.old?.name ?? "未知", result.profession.type, result.profession.name, result.cost.gold, result.cost.ascension) };
      } },
      { id: "sell", commands: ["卖出", "出售"], scenes: ["group"], async execute(ctx) {
        const input = parseSaleArgs(ctx.args), result = await sale.sell(requireUid(ctx.uid), input.item, input.quantity);
        return { type: "text", content: MESSAGES.faith.sold(formatItem(result.item!), result.quantity, result.gold) };
      } },
      { id: "sell_level", commands: ["卖出等级", "出售等级"], scenes: ["group"], async execute(ctx) {
        if (ctx.args.length !== 1) throw new BusinessError("INVALID_INPUT", "格式：信仰 卖出等级 [等级]");
        const result = await sale.sellLevel(requireUid(ctx.uid), ctx.args[0], false);
        return { type: "text", content: MESSAGES.faith.soldLevel(result.level!, result.kinds, result.quantity, result.gold, true) };
      } },
      { id: "force_sell_level", commands: ["强制卖出等级", "强制出售等级", "全卖等级"], scenes: ["group"], async execute(ctx) {
        if (ctx.args.length !== 1) throw new BusinessError("INVALID_INPUT", "格式：信仰 强制卖出等级 [等级]");
        const result = await sale.sellLevel(requireUid(ctx.uid), ctx.args[0], true);
        return { type: "text", content: MESSAGES.faith.soldLevel(result.level!, result.kinds, result.quantity, result.gold, false) };
      } },
      { id: "open", commands: ["打开", "开启"], scenes: ["group"], async execute(ctx) {
        const result = await opener.open(requireUid(ctx.uid), ctx.args);
        const currencies = [
          result.currencies.gold ? `金币 +${result.currencies.gold}` : "",
          result.currencies.ascension_score ? `登神分 +${result.currencies.ascension_score}` : "",
          result.currencies.audience_score ? `觐见分 +${result.currencies.audience_score}` : "",
        ].filter(Boolean);
        const items = Object.entries(result.items).map(([id, count]) => `${formatItem(ctx.core.items.require(id))}×${count}`);
        return { type: "text", content: MESSAGES.faith.opened(formatItem(result.item), result.quantity, [...currencies, ...items]) };
      } },
    ],
  }],
  });
}

export const faithModule = createFaithModule();
export * from "./sale";
export * from "./open";

function requireUid(uid: number | null) {
  if (uid === null) throw new BusinessError("UNREGISTERED", MESSAGES.common.unregistered);
  return uid;
}
