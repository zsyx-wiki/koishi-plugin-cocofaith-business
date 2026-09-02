import { BusinessError } from "../../errors";
import type { JunkConfig } from "./types";

export const DEFAULT_JUNK_CONFIG: Readonly<JunkConfig> = Object.freeze({ itemCount: 3, paidGoldCost: 200, paidAscensionCost: 5 });

export function validateJunkConfig(value: unknown): JunkConfig {
  if (!value || typeof value !== "object") throw new BusinessError("CONFIG_INVALID", "捡垃圾配置必须是对象。");
  const input = value as Record<string, unknown>, result = { ...DEFAULT_JUNK_CONFIG };
  for (const key of Object.keys(result) as (keyof JunkConfig)[]) {
    const number = input[key];
    if (!Number.isSafeInteger(number) || (number as number) < 0 || (number as number) > 1_000_000) throw new BusinessError("CONFIG_INVALID", `捡垃圾配置 ${key} 必须是非负安全整数。`);
    result[key] = number as number;
  }
  if (result.itemCount < 1 || result.itemCount > 100) throw new BusinessError("CONFIG_INVALID", "每次捡垃圾的物品数量必须在 1-100 之间。");
  return result;
}
