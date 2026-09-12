import { defineBusinessModule } from "../../framework/types";
import { BusinessError } from "../../framework/errors";
import { MESSAGES } from "../../../messages";
import { BindingService } from "./service";
import { DEFAULT_BINDING_CONFIG, validateBindingConfig, type BindingConfig } from "./config";

export function createBindingModule() {
  let service: BindingService;
  return defineBusinessModule<never, never, BindingConfig>({
    name: "binding",
    defaultConfig: DEFAULT_BINDING_CONFIG,
    validateConfig: validateBindingConfig,
    init(ctx) {
      service = new BindingService(ctx.core, ctx.config);
      ctx.provide("default", Object.freeze({ userInfo: service.userInfo.bind(service) }), { version: "1.0.0" });
    },
    reload(ctx) { service.configure(ctx.config); },
    dispose() { service.dispose(); },
    commands: [{
      id: "coconut_water",
      commands: ["椰子水"],
      description: "查看身份或关联 OneBot QQ",
      allowUnregistered: true,
      execute() { return { type: "text", content: MESSAGES.binding.help }; },
      children: [
        {
          id: "request_link",
          commands: ["申请绑定"],
          allowUnregistered: true,
          async execute(ctx) {
            if (ctx.event.identity?.adapter === "onebot") {
              if (ctx.args.length) throw new BusinessError("INVALID_INPUT", "格式：椰子水 申请绑定");
              const result = await service.issue(ctx.event);
              if (result.kind === "already-bound") return { type: "text", content: MESSAGES.binding.alreadyBound(result.uid) };
              return { type: "text", content: MESSAGES.binding.tokenA(result.tokenA, result.expiresIn) };
            }
            if (ctx.args.length !== 1) throw new BusinessError("INVALID_INPUT", "格式：椰子水 申请绑定 [TokenA]");
            const result = await service.claim(ctx.event, ctx.args[0]);
            if (result.kind === "already-bound") return { type: "text", content: MESSAGES.binding.alreadyBound(result.uid) };
            return { type: "text", content: MESSAGES.binding.claimed(result.qq) };
          },
        },
        {
          id: "confirm_link",
          commands: ["确认绑定"],
          allowUnregistered: true,
          async execute(ctx) {
            if (ctx.args.length !== 1) throw new BusinessError("INVALID_INPUT", "格式：椰子水 确认绑定 [TokenB]");
            const result = await service.confirm(ctx.event, ctx.args[0]);
            return { type: "text", content: MESSAGES.binding.completed(result.uid, result.qq) };
          },
        },
        {
          id: "user_info",
          commands: ["用户信息"],
          allowUnregistered: true,
          async execute(ctx) {
            if (ctx.args.length) throw new BusinessError("INVALID_INPUT", "格式：椰子水 用户信息");
            const result = await service.userInfo(ctx.event);
            return { type: "text", content: MESSAGES.binding.info(result.adapter, result.uid, result.qqAccounts) };
          },
        },
      ],
    }],
  });
}

export const bindingModule = createBindingModule();
