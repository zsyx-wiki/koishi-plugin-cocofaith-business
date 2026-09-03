import type { BusinessResult } from "../../types";
import type { GameRoom } from "../rooms";
import type { RouletteState } from "./types";
import type { RouletteRegistry } from "./registry";
const modes = { normal: "普通", gambler: "赌徒", crazy: "疯狂" };
export function renderRoulette(room: Readonly<GameRoom<RouletteState>>, registry: RouletteRegistry): BusinessResult {
  const s = room.state;
  if (room.status === "waiting") return { type: "text", content: `恶魔轮盘：${modes[s.mode]}模式\n人数：${room.members.length}/${room.max}（至少${room.min}人）\n${room.members.map((p, i) => `${i + 1}号：${p.name}`).join("\n")}\n发送「恶魔轮盘 加入」，房主发送「恶魔轮盘 开始」。\n等待房间15分钟后自动解散。` };
  const current = s.players.find((p) => p.uid === s.current), alive = s.players.filter((p) => p.alive);
  const header = `恶魔轮盘：${modes[s.mode]} · 第${s.round}轮${room.status === "ended" ? " · 已结束" : ""}`;
  const lines = (s.settled ? s.logs : s.logs.slice(-12)).map((line) => line.slice(0, 140));
  if (room.status === "ended" && room.log[0]?.match(/中止|解散/)) lines.push(room.log[0]);
  return { type: "text", content: [
    header, s.field ? `场地：${registry.field(s.field)?.name ?? s.field}${s.extra === "whispers" ? ` / 低语（恐惧${s.fear}）` : s.extra === "take_all" ? " / 通吃" : ""}` : "",
    ...lines,
    s.extra === "take_all" ? `庄家：${s.players.find((p) => p.uid === s.dealer)?.name}` : "",
    s.field === "crazy" ? `疯魔：${s.players.find((p) => p.uid === s.demon)?.name}` : "",
    room.status !== "ended" ? `存活：${alive.length}/${s.players.length}\n轮到：${current?.name ?? "结算中"}（${current?.path ?? ""}）\n发送「恶魔轮盘 开枪」；剩余${Math.max(0, Math.ceil((room.deadline - Date.now()) / 1000))}秒。` : "",
  ].filter(Boolean).join("\n") };
}
