import type { FaithItemDefinition } from "@mueo/koishi-plugin-faith-core";

/** 面向用户的紧凑物品标签，所有玩法保持同一种等级展示格式。 */
export function formatItem(item: Pick<FaithItemDefinition, "name" | "level">) {
  return `【${item.level}｜${item.name}】`;
}
