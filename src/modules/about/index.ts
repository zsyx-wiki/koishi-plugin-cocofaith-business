import { defineGameplay } from "@mueo/cocofaith-sdk/gameplay";
import { version as koishiVersion } from "koishi";
import { adaptGameplayDefinition } from "../../framework/gameplay-adapter";
import { MESSAGES } from "../../shared/messages";
import { COCOFAITH_BUSINESS_VERSION } from "../../version";
export function createAboutGameplay() {
    return defineGameplay({
        name: "about",
        commands: [{
                id: "about",
                triggers: ["关于椰子水"],
                description: "查看 CoCoFaith 运行架构与组件版本",
                guest: true,
                run({ event, core }) {
                    const adapter = event.adapter
                        ? `${event.adapter.name} ${event.adapter.version}`
                        : `${event.identity?.adapter ?? "未知"}（版本未知）`;
                    return MESSAGES.about(koishiVersion, core.runtime.version ?? `API ${core.runtime.apiVersion}`, COCOFAITH_BUSINESS_VERSION, adapter);
                },
            }],
    });
}
export function createAboutModule() {
    return adaptGameplayDefinition(createAboutGameplay());
}
export const aboutModule = createAboutModule();
