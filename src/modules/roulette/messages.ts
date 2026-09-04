export const rouletteText = Object.freeze({
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
});
