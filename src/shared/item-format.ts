import type { FaithItemDefinition } from "@mueo/koishi-plugin-cocofaith-core";

export function formatItem(item: Pick<FaithItemDefinition, "name" | "level">) {
  return `【${item.level}｜${item.name}】`;
}
