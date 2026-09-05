import { BusinessError } from "../../framework/errors";
import { defineBusinessModule } from "../../framework/types";
import { DEFAULT_JUNK_CONFIG, validateJunkConfig } from "./config";
import { JunkService } from "./service";
import type { JunkConfig } from "./types";
import { formatItem } from "../../shared/item-format";
import { MESSAGES } from "../../../messages";

export function createJunkModule() {
  let service: JunkService;
  return defineBusinessModule<never, never, JunkConfig>({
    name: "junk", dependencies: ["faith"], defaultConfig: DEFAULT_JUNK_CONFIG, validateConfig: validateJunkConfig,
    init(context) { service = new JunkService(context.core, context.config); },
    reload(context) { service = new JunkService(context.core, context.config); },
    commands: [{ id: "junk", commands: ["捡垃圾"], scenes: ["group"], description: "从虚空中捞取可开启物品", async execute(ctx) {
      if (ctx.uid === null) throw new BusinessError("UNREGISTERED");
      const result = await service.pick(ctx.uid), counts = new Map<string, number>();
      for (const name of result.items) counts.set(name, (counts.get(name) ?? 0) + 1);
      return { type: "text", content: MESSAGES.junk.result(result.cost, [...counts].map(([name, count]) => `${formatItem(ctx.core.items.require(name))}×${count}`).join("\n")) };
    } }],
  });
}

export const junkModule = createJunkModule();
