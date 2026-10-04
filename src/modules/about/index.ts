import { version as koishiVersion } from "koishi";
import { defineBusinessModule } from "../../framework/types";
import { COCOFAITH_BUSINESS_VERSION } from "../../version";
import { MESSAGES } from "../../../messages";

export function createAboutModule() {
  return defineBusinessModule({
    name: "about",
    commands: [{
      id: "about",
      commands: ["关于椰子水"],
      description: "查看 CoCoFaith 运行架构与组件版本",
      allowUnregistered: true,
      execute({ event, core }) {
        const adapter = event.adapter
          ? `${event.adapter.name} ${event.adapter.version}`
          : `${event.identity?.adapter ?? "未知"}（版本未知）`;
        return {
          type: "text" as const,
          content: MESSAGES.about(koishiVersion, core.runtime.version ?? `API ${core.runtime.apiVersion}`, COCOFAITH_BUSINESS_VERSION, adapter),
        };
      },
    }],
  });
}

export const aboutModule = createAboutModule();
