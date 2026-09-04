import { BusinessError } from "../../framework/errors";
import type { RouletteConfig } from "./types";
export const DEFAULT_ROULETTE_CONFIG: RouletteConfig = { turnSeconds: 45, normalMin: 4, gamblerMin: 5, crazyMin: 8, entryFee: 100 };
export function validateRouletteConfig(value: unknown): RouletteConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BusinessError("CONFIG_INVALID");
  const config = { ...DEFAULT_ROULETTE_CONFIG, ...value } as RouletteConfig;
  const ranges = { turnSeconds: [5, 300], normalMin: [2, 12], gamblerMin: [2, 15], crazyMin: [2, 16], entryFee: [0, 1000000] };
  for (const [key, [min, max]] of Object.entries(ranges)) if (!Number.isSafeInteger(config[key]) || config[key] < min || config[key] > max) throw new BusinessError("CONFIG_INVALID", `轮盘配置 ${key} 超出范围。`);
  return config;
}
