import { BusinessError } from "../../framework/errors";
import type { DailyPrayerConfig } from "./types";

export const DEFAULT_DAILY_PRAYER_CONFIG: Readonly<DailyPrayerConfig> = Object.freeze({
  baseLimit: 1, ascensionMin: -10, ascensionMax: 75, goldMin: -25, goldMax: 400,
});

export function validateDailyPrayerConfig(value: unknown): DailyPrayerConfig {
  if (!value || typeof value !== "object") throw new BusinessError("CONFIG_INVALID", "每日祈祷配置必须是对象。");
  const input = value as Partial<DailyPrayerConfig>;
  const integer = (key: keyof DailyPrayerConfig, fallback: number, min: number, max: number) => {
    const current = input[key] ?? fallback;
    if (!Number.isSafeInteger(current) || (current as number) < min || (current as number) > max) throw new BusinessError("CONFIG_INVALID", `每日祈祷配置 ${key} 无效。`);
    return current as number;
  };
  const result = {
    baseLimit: integer("baseLimit", 1, 1, 10_000),
    ascensionMin: integer("ascensionMin", -10, -1_000_000, 1_000_000), ascensionMax: integer("ascensionMax", 75, -1_000_000, 1_000_000),
    goldMin: integer("goldMin", -25, -1_000_000, 1_000_000), goldMax: integer("goldMax", 400, -1_000_000, 1_000_000),
  };
  if (result.ascensionMin > result.ascensionMax || result.goldMin > result.goldMax) throw new BusinessError("CONFIG_INVALID", "每日祈祷奖励下限不能大于上限。");
  return Object.freeze(result);
}
