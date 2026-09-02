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
  },
  dispose() { admin.fields.clear(); },
  commands: [{
    id: "faith_admin", commands: ["信仰管理"], description: "创造者管理命令",
    children: [{
      id: "numeric", commands: ["数值"], async execute(ctx) {
        if (ctx.args.length !== 4) throw new BusinessError("INVALID_INPUT", "格式：信仰管理 数值 [数值名] [qq|uid] [目标] [变化值]");
        if (ctx.uid === null) throw new BusinessError("UNREGISTERED");
        const result = await admin.change(ctx.uid, ctx.args[0], ctx.args[1], ctx.args[2], ctx.args[3]);
        const content = typeof result.message === "string" ? result.message : `已为 UID ${result.targetUid} 调整 ${ctx.args[0]}：${result.delta > 0 ? "+" : ""}${result.delta}`;
        return { type: "text", content };
      },
    }],
  }],
  });
}

export const faithAdminModule = createFaithAdminModule();
