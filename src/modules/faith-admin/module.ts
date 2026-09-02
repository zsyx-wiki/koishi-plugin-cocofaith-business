import { BusinessError } from "../../errors";
import { defineBusinessModule } from "../../types";
import { FaithAdminService } from "./service";

export function createFaithAdminModule() {
  let admin: FaithAdminService;
  return defineBusinessModule({
  name: "faith_admin",
  dependencies: ["faith"],
  init(context) {
    admin = new FaithAdminService(context.core);
    context.provide("numeric-fields", Object.freeze({ register: admin.fields.register.bind(admin.fields), get: admin.fields.get.bind(admin.fields), list: admin.fields.list.bind(admin.fields) }), { version: "1.0.0" });
    context.provide("commands", Object.freeze({ register: admin.commands.register.bind(admin.commands), list: admin.commands.list.bind(admin.commands) }), { version: "1.0.0" });
    context.core.lifecycle.track(admin.commands.register({ business: "faith_admin", command: "数值", description: "调整用户数值", async execute({ actorUid, args }) {
      if (args.length !== 4) throw new BusinessError("INVALID_INPUT", "格式：信仰管理 数值 [数值名] [qq|uid] [目标] [变化值]");
      const result = await admin.change(actorUid, args[0], args[1], args[2], args[3], true);
      const content = typeof result.message === "string" ? result.message : `已为 UID ${result.targetUid} 调整 ${args[0]}：${result.delta > 0 ? "+" : ""}${result.delta}`;
      return { type: "text", content };
    } }));
  },
  dispose() { admin.fields.clear(); admin.commands.clear(); },
  commands: [{
    id: "faith_admin", commands: ["信仰管理"], description: "创造者管理命令", allowUnregistered: true,
    async execute(ctx) {
      if (ctx.uid === null || !(await admin.isCreator(ctx.uid))) return { type: "silent" };
      const [name, ...args] = ctx.args, command = name ? admin.commands.get(name) : undefined;
      if (!command) throw new BusinessError("INVALID_INPUT", `可用管理命令：${admin.commands.list().map((item) => item.command).join("、")}`);
      return command.execute({ actorUid: ctx.uid, args, core: ctx.core });
    },
  }],
  });
}

export const faithAdminModule = createFaithAdminModule();
