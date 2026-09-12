import type { FaithCoreUserData, FaithProfessionDefinition } from "@mueo/koishi-plugin-cocofaith-core";

const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}`;

export const MESSAGES = Object.freeze({
  common: Object.freeze({
    unregistered: "你尚未注册，只能使用“信仰 注册 [信仰名]”。",
  }),
  binding: Object.freeze({
    help: "椰子水 申请绑定\n椰子水 申请绑定 [TokenA]\n椰子水 确认绑定 [TokenB]\n椰子水 用户信息",
    tokenA: (token: string, seconds: number) => `绑定申请已创建。\nTokenA：${token}\n请在 ${seconds} 秒内，使用已注册的 QQ 官方机器人账号在群聊发送：\n椰子水 申请绑定 ${token}`,
    tokenB: (token: string, uid: number, qq: string, seconds: number) => `QQ 官方身份验证已接收。\n目标 UID：${uid}\nOneBot QQ：${qq}\nTokenB：${token}\n请在 ${seconds} 秒内，使用当前 OneBot 私聊发送：\n椰子水 确认绑定 ${token}`,
    claimed: (qq: string) => `已验证 OneBot QQ ${qq} 的申请。TokenB 已发送至该 QQ 的 OneBot 私聊，请使用当前账号完成确认。`,
    completed: (uid: number, qq: string) => `绑定完成。\nUID：${uid}\nOneBot QQ：${qq}`,
    alreadyBound: (uid: number) => `当前 OneBot QQ 已绑定 UID ${uid}。`,
    info: (adapter: string, uid: number | null, qqs: readonly string[]) => [
      `平台：${adapter}`, `UID：${uid ?? "未注册"}`,
      `QQ：${qqs.length ? qqs.join("、") : "未绑定"}`,
    ].join("\n"),
  }),
  club: Object.freeze({
    help: "俱乐部 加入\n俱乐部 退出\n俱乐部 救济\n俱乐部 贡献 [金币|登神分] [数值]\n俱乐部 信息",
    firstJoin: (level: string, gold: number, ascension: number, titles: readonly string[]) => `欢迎加入椰汁俱乐部。\n已缴纳初次会费：${gold} 金币、${ascension} 登神分\n当前等级：${level}${titles.length ? `\n获得称号：${titles.join("、")}` : ""}`,
    rejoin: (level: string, charged: boolean, gold: number, ascension: number) => charged
      ? `欢迎回到椰汁俱乐部。\n已缴纳本日会费：${gold} 金币、${ascension} 登神分\n当前等级：${level}`
      : `欢迎回到椰汁俱乐部。\n今天已经缴过会费，本次不会重复收取。\n当前等级：${level}`,
    hallRejoin: (charged: boolean, gold: number, ascension: number) => charged
      ? `欢迎归来。每日会费已恢复。\n本日会费：${gold} 金币、${ascension} 登神分`
      : "每日会费已恢复。本日会费已经缴纳，不再重复收取。",
    quit: "你已退出椰汁俱乐部，在会期间的收益加成已经停止。历史贡献和永久称号仍会保留。",
    hallQuit: "殿堂椰汁的荣誉与权益将永久保留。每日会费已停止，重新加入后可继续缴纳。",
    donated: (type: string, amount: number, level: string, titles: readonly string[]) => `已向椰汁俱乐部贡献 ${amount} ${type}。\n当前等级：${level}${titles.length ? `\n获得称号：${titles.join("、")}` : ""}`,
    aided: (gold: number, ascension: number) => `椰汁俱乐部已提供救济：金币 +${gold}，登神分 +${ascension}。`,
    info: (level: string, active: boolean, duesEnabled: boolean, fees: number, gold: number, ascension: number, poolGold: number, poolAscension: number) => [`椰汁等级：${level}`, `身份状态：${active ? "生效" : "未激活"}`, `每日会费：${duesEnabled ? "收取中" : "已停止"}`, `累计缴费：${fees} 次`, `累计贡献金币：${gold}`, `累计贡献登神分：${ascension}`, `贡献池：${poolGold} 金币 / ${poolAscension} 登神分`].join("\n"),
    nonMemberInfo: (gold: number, ascension: number) => `你尚未加入椰汁俱乐部。\n贡献池：${gold} 金币 / ${ascension} 登神分`,
    distributed: (count: number, gold: number, ascension: number) => `分成完成：${count} 名椰汁获得共 ${gold} 金币、${ascension} 登神分。`,
    poolChanged: (gold: number, ascension: number) => `贡献池已调整：${gold} 金币 / ${ascension} 登神分。`,
    statsChanged: (uid: number, name: string, value: number) => `已调整 UID ${uid} 的${name}，当前值：${value}。`,
  }),
  faith: Object.freeze({
    help: "信仰 信息\n信仰 注册 [信仰名]\n信仰 弃誓 [目标信仰]\n信仰 职业 [职业名]\n信仰 变更职业 [职业名]\n信仰 卖出 [物品名] [数量/全部]\n信仰 打开 [物品名] [数量/全部]",
    registered: (faith: string, gold: number) => `你已信仰【${faith}】！初始获得 ${gold} 金币。`,
    abandoned: (oldFaith: string, newFaith: string, ascension: number, audience: number) => `你已弃誓【${oldFaith}】，转而信仰【${newFaith}】。\n消耗：${ascension} 登神分、${audience} 觐见分。`,
    currentProfession: (type: string, name: string) => `你当前的职业是【${type} - ${name}】。如需更换，请使用“信仰 变更职业 [职业名]”。`,
    professionChoices: (faith: string, choices: readonly { type: string; name: string }[]) => choices.length ? `【${faith}】可选职业：\n${choices.map((item) => `${item.type}：${item.name}`).join("\n")}` : `【${faith}】暂无可选职业。`,
    professionChosen: (type: string, name: string) => `选择成功！你现在的职业是【${type} - ${name}】。`,
    professionChanged: (oldName: string, type: string, name: string, gold: number, ascension: number) => `付出 ${gold} 金币和 ${ascension} 登神分后，职业从【${oldName}】变更为【${type} - ${name}】。`,
    sold: (item: string, quantity: number, gold: number) => `已出售${item}×${quantity}｜金币 +${gold}`,
    soldLevel: (level: string, kinds: number, quantity: number, gold: number, keepOne: boolean) => `${level} 级${keepOne ? "出售完成" : "全部出售"}｜${kinds} 种，共 ${quantity} 件｜金币 +${gold}${keepOne ? "\n每种物品已保留 1 件。" : ""}`,
    opened: (item: string, quantity: number, rewards: readonly string[]) => `已打开${item}×${quantity}\n${rewards.join(" · ") || "里面什么也没有。"}`,
    info: (user: FaithCoreUserData, profession?: Readonly<FaithProfessionDefinition>) => [
      `UID：${user.uid}`, `信仰：${user.faiths[0] ?? "无"}`, `弃誓次数：${user.abandon_count}`,
      `职业：${profession ? `${profession.type}-${profession.name}` : "无"}`, `登神分：${user.ascension_score}`,
      `觐见分：${user.audience_score}`, `觐见排名：${user.audience_rank > 0 ? user.audience_rank : "未上榜"}`, `金币：${user.gold}`,
    ].join("\n"),
  }),
  dailyPrayer: Object.freeze({
    result: (god: string, ascension: number, gold: number, count: number, limit: number) => `${god}回应了你｜登神分 ${signed(ascension)}｜金币 ${signed(gold)}\n今日祈祷 ${count}/${limit}`,
    adjusted: (uid: number, name: string, delta: number, after: number) => `已调整 UID ${uid} 的${name}：${signed(delta)}，当前为 ${after}。`,
  }),
  junk: Object.freeze({
    result: (cost: string, items: string) => `捡垃圾完成｜消耗：${cost}\n${items}`,
  }),
  voidPrayer: Object.freeze({
    status: (used: number, limit: number, remaining: number, extra: number, reduction: number) => `虚空祈求｜今日 ${used}/${limit}\n剩余 ${remaining} 次（奖励次数 ${extra}）\n费用减免 ${Math.round(reduction * 100)}%`,
    result: (actual: number, requested: number, cost: number, levels: string, items: string, used: number, limit: number, remaining: number) => [
      `虚空祈求 ×${actual}｜消耗 ${cost} 金币`, levels, `最高稀有物品：\n${items}`,
      `今日 ${used}/${limit}｜剩余 ${remaining} 次`, actual < requested ? `可用次数不足，已自动调整为 ${actual} 次。` : "",
    ].filter(Boolean).join("\n"),
    adjusted: (uid: number, name: string, delta: number, after: number) => `已调整 UID ${uid} 的${name}：${signed(delta)}，当前为 ${after}。`,
  }),
  title: Object.freeze({
    help: "称号命令｜称号 列表｜称号 详情 [称号名]｜称号 使用 [称号名]",
    empty: "你尚未获得任何称号。",
    list: (values: readonly { name: string; active: boolean }[]) => values.map((value, index) => `${index + 1}. 【${value.name}】${value.active ? "（使用中）" : ""}`).join("\n"),
    detail: (name: string, description: string, source: string, bonuses: string) => `【${name}】\n${description}\n来源：${source}\n加成：${bonuses}`,
    used: (name: string) => `已使用称号【${name}】。`,
    granted: (uid: number, name: string, changed: boolean) => changed ? `已向 UID ${uid} 给予称号【${name}】。` : `UID ${uid} 已拥有该称号。`,
    revoked: (uid: number, name: string, changed: boolean) => changed ? `已从 UID ${uid} 收回称号【${name}】。` : `UID ${uid} 未持有该称号。`,
    active: (name?: string) => `称号：${name ? `【${name}】` : "无"}`,
  }),
  collection: Object.freeze({
    help: "图鉴 查看\n图鉴 详情 [页码]\n图鉴 限定详情 [页码]",
    progress: (rows: readonly string[]) => ["图鉴进度", ...rows].join("\n"),
    page: (limited: boolean, page: number, pages: number, entries: readonly string[]) => [`${limited ? "限定" : "稀有"}图鉴：${page}/${pages} 页`, ...entries, ...(entries.length ? [] : ["暂无收藏品"])].join("\n"),
    refreshed: (checked: number, added: number, failed: number) => `图鉴刷新：检查 ${checked} 人，新增 ${added} 项，失败 ${failed} 人。`,
    refreshedOne: (uid: number, added: number) => `图鉴刷新：UID ${uid} 新增 ${added} 项。`,
  }),
  admin: Object.freeze({
    changed: (uid: number, field: string, delta: number) => `已为 UID ${uid} 调整 ${field}：${signed(delta)}`,
    changedAll: (field: string, delta: number, succeeded: number, skipped: number, failed: number) => `全体数值：${field} ${signed(delta)}\n范围：正常状态的已注册用户\n成功：${succeeded} 人\n已处理跳过：${skipped} 人\n失败：${failed} 人${failed ? "（详见日志）" : ""}`,
    commands: (commands: readonly string[]) => `可用管理命令：${commands.join("、")}`,
  }),
  roulette: Object.freeze({
    help: "恶魔轮盘\n发起 / 发起赌徒 / 发起疯狂\n加入 / 退出 / 开始 / 结束\n开枪 / 恐惧 / 无畏 / 退缩\n对局 / 状态 / 强制结束\n超时45秒自动开枪，累计第二次超时淘汰。QQ消息无法发送时对局仍继续。",
    stats: (s: { level: number; exp: number; honor: number; plays: number; normal: { wins: number; plays: number }; gambler: { wins: number; plays: number }; crazy: { wins: number; plays: number } }) => `轮盘等级：${s.level}\n经验：${s.exp}\n荣誉：${s.honor}\n总场次：${s.plays}\n普通：${s.normal.wins}/${s.normal.plays}胜\n赌徒：${s.gambler.wins}/${s.gambler.plays}胜\n疯狂：${s.crazy.wins}/${s.crazy.plays}胜`,
    started: (bullets: number, empties: number) => `赌局正式开始！左轮已装填 ${bullets} 颗实弹与 ${empties} 颗空仓。`,
    empty: (name: string) => `咔……清脆的空仓声。【${name}】活了下来。`,
    bullet: (name: string) => `砰！子弹击中了【${name}】。`,
    death: (name: string, reason: string) => `【${name}】${reason}，倒下出局。`,
    timeout: (name: string, count: number) => `【${name}】超过45秒未开枪（累计超时 ${count}/2）。`,
    timeoutDeath: (name: string) => `【${name}】累计超时两次，被恶魔拖入深渊。`,
    reload: (bullets: number, empties: number) => `弹仓已空，恶魔重新装填：${bullets} 实弹 / ${empties} 空仓。`,
    noWinner: "所有人都倒下了，没有幸存者。恶魔满意地收走了赌注。",
    winner: (name: string, gold: number, score: number) => `尘埃落定！【${name}】成为最后的幸存者，获得 ${gold} 金币和 ${score} 登神分。`,
    second: (name: string, gold: number, score: number) => `第二名【${name}】获得 ${gold} 金币和 ${score} 登神分。`,
    maxLevel: (names: readonly string[]) => `恶魔轮盘满级\n${names.join("\n")}\n达到10级，获得「恶魔赌徒」称号及满级奖励。`,
    joined: (name: string, count: number, max: number, min: number, creator: string) => `加入成功：${name}\n人数：${count}/${max}（至少${min}人）\n房主：${creator}`,
    waiting: (mode: string, count: number, max: number, min: number, members: readonly string[]) => `恶魔轮盘：${mode}模式\n人数：${count}/${max}（至少${min}人）\n${members.join("\n")}\n发送「恶魔轮盘 加入」，房主发送「恶魔轮盘 开始」。\n等待房间15分钟后自动解散。`,
    active: (parts: readonly (string | false | undefined)[]) => parts.filter(Boolean).join("\n"),
  }),
  about: (koishi: string, core: string, business: string, adapter: string) => ["关于椰子水", `架构：Koishi ${koishi}`, `Core：CoCoFaith Core ${core}`, `Business：CoCoFaith Business ${business}`, `Adapter：${adapter}`].join("\n"),
});

export type FaithMessages = typeof MESSAGES;
