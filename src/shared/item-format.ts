import type { FaithItemDefinition } from "@mueo/cocofaith-sdk/core";

export function formatItem(item: Pick<FaithItemDefinition, "name" | "level">) {
  return `【${item.level}｜${item.name}】`;
}
