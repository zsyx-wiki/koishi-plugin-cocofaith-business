import { defineBusinessModule } from "../../types";
import type { BusinessCommandContext } from "../../types";
import type { GameRoomsApi } from "../rooms";
import type { TitleServiceApi } from "../title";
import { RouletteService } from "./service";
import { DEFAULT_ROULETTE_CONFIG, validateRouletteConfig } from "./config";
import type { RouletteConfig } from "./types";

export function createRouletteModule() {
  let service: RouletteService, registration: { dispose(): Promise<void> }, titles: TitleServiceApi;
  const run = (action: string) => async (ctx: BusinessCommandContext) => {
    const result = await service.command(ctx.event, action, ctx.args);
    return result;
  };
  async function grantMaxTitle(uid: number) { const stats = await service.stats(uid); if (stats.level >= 10) await titles.grant(uid, "demon-gambler"); }
  return defineBusinessModule<never, never, RouletteConfig>({
    name: "roulette", dependencies: ["rooms", "title"], defaultConfig: DEFAULT_ROULETTE_CONFIG, validateConfig: validateRouletteConfig,
    init(ctx) {
      const rooms = ctx.use<GameRoomsApi>("rooms");
      service = new RouletteService(ctx.core, rooms, ctx.config);
      titles = ctx.use<TitleServiceApi>("title");
      service.onCommitted = async (room) => {
        for (const uid of room.state.maxLevelUids) await titles.grant(uid, "demon-gambler");
        if (room.status === "ended") await ctx.core.hooks.emit("settled", {
          roomId: room.id, mode: room.state.mode, aborted: !!room.state.aborted,
          participants: room.members.map((p) => p.uid), maxLevelUids: [...room.state.maxLevelUids],
          rewards: structuredClone(room.state.rewards),
        });
      };
      registration = rooms.register(service);
      ctx.provide("default", Object.freeze({
        registerPath: service.rules.registerPath.bind(service.rules), registerField: service.rules.registerField.bind(service.rules),
        registerHook: service.rules.registerHook.bind(service.rules), stats: service.stats.bind(service),
      }));
    },
    reload(ctx) { service.configure(ctx.config); },
    dispose: () => registration.dispose(),
    commands: [{ id: "roulette", commands: ["恶魔轮盘"], scenes: ["group"],
      execute: () => ({ type: "text", content: "恶魔轮盘\n发起 / 发起赌徒 / 发起疯狂\n加入 / 退出 / 开始 / 结束\n开枪 / 恐惧 / 无畏 / 退缩\n对局 / 状态 / 强制结束\n超时45秒自动开枪，累计第二次超时淘汰。QQ消息无法发送时对局仍继续。" }),
      children: [
        { id: "create", commands: ["发起", "创建"], execute: (ctx) => service.create(ctx.event, "normal") },
        { id: "gambler", commands: ["发起赌徒"], execute: (ctx) => service.create(ctx.event, "gambler") },
        { id: "crazy", commands: ["发起疯狂"], execute: (ctx) => service.create(ctx.event, "crazy") },
        ...[["join", "加入"], ["leave", "退出"], ["start", "开始"], ["abort", "结束"], ["view", "对局"], ["force_abort", "强制结束"],
          ["开枪", "开枪"], ["恐惧", "恐惧"], ["无畏", "无畏"], ["退缩", "退缩"]].map(([action, command], i) => ({ id: `action_${i}`, commands: [command], execute: run(action) })),
        { id: "ability", commands: ["能力"], execute: (ctx) => service.command(ctx.event, ctx.args[0] ?? "", ctx.args.slice(1)) },
        { id: "stats", commands: ["状态"], async execute(ctx) {
          const s = await service.stats(ctx.uid!); await grantMaxTitle(ctx.uid!);
          return { type: "text", content: `轮盘等级：${s.level}\n经验：${s.exp}\n荣誉：${s.honor}\n总场次：${s.plays}\n普通：${s.normal.wins}/${s.normal.plays}胜\n赌徒：${s.gambler.wins}/${s.gambler.plays}胜\n疯狂：${s.crazy.wins}/${s.crazy.plays}胜` };
        } },
      ],
    }],
  });
}
export const rouletteModule = createRouletteModule();
export * from "./types";
export * from "./config";
export * from "./registry";
export * from "./engine";
export * from "./progress";
export * from "./service";
export * from "./protection";
