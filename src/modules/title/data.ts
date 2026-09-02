import type { TitleDefinition } from "./types";

export const BUILTIN_TITLES: readonly TitleDefinition[] = Object.freeze([
  title("demon-gambler", "恶魔赌徒", "在无数次生死考验中征服了恶魔的传奇。", "恶魔轮盘赌等级达到 10 级。", false),
  title("void-connoisseur", "虚空鉴赏家", "在虚空竞标中穿透迷雾、洞悉万物本质的鉴赏家。", "虚空竞标达到 10 级。", false),
  title("final-sage", "终焉的智者", "拂散愚昧的表象，于混乱和谎言尽头推理出唯一真相的智者。", "愚昧迷宫达到 10 级。", false),
  title("mascot", "吉祥物", "可爱的吉祥物，大家都喜欢的存在。", "投票获得。", true),
  title("wiki-contributor", "WIKI贡献者", "诸神愚戏 WIKI 的贡献者。", "WIKI 贡献者专属。", true),
  title("easter-egg-collector", "彩蛋收藏家", "发掘了隐藏在世界深处秘密的收藏家。", "集齐所有彩蛋。", false, [
    { type: "void_prayer.daily_limit", fixedBonus: 5, detail: "虚空祈求每日次数 +5" },
  ]),
  title("great-collector", "大收藏家", "孜孜不倦，见证了无数传说奇物的收藏家。", "集齐所有 SSS 级收藏品。", false, [
    { type: "void_prayer.daily_limit", fixedBonus: 5, detail: "虚空祈求每日次数 +5" },
  ]),
  title("void-collector", "虚空收藏家", "屹立于收藏界顶点，连虚空终极造物亦在囊中。", "集齐所有 SP 级收藏品。", false, [
    { type: "void_prayer.daily_limit", fixedBonus: 10, detail: "虚空祈求每日次数 +10" },
    { type: "void_prayer.cost", modifier: -0.2, detail: "虚空祈求费用 -20%" },
  ]),
  title("master-of-wonders", "妙琅万象之主", "奇物与被遗忘的秘密，皆化作冠冕上的璀璨繁星。", "集齐图鉴中所有物品与非隐藏称号。", true),
  title("coconut-honor-member", "椰子水荣誉会员", "俱乐部的忠实支持者，为公益事业做出了持续贡献。", "累计支付俱乐部会费 50 次。", false),
  title("coconut-gold-member", "椰子水金牌会员", "俱乐部的重要赞助人，其慷慨为许多人带来了希望。", "累计贡献 15000 金币与 800 登神分。", false),
  title("coconut-lifetime-member", "椰子水终身会员", "俱乐部的基石与灵魂，其无私奉献将被铭记。", "达成最高俱乐部贡献里程碑。", false),
  title("coconut-shareholder", "椰子水股东", "椰子水珍视的同行者与守护者。", "通过爱发电投喂椰子水。", true),
  title("electrolyzed-coconut", "电解椰子水", "社区的活力之源与共建者。", "授予对社区有卓越贡献的玩家。", true),
]);

function title(id: string, name: string, description: string, source: string, hidden: boolean, bonuses: TitleDefinition["bonuses"] = []): TitleDefinition {
  return { id, name, description, source, hidden, custom: false, bonuses };
}
