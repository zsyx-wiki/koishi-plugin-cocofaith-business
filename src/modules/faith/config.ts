import { BusinessError } from "../../framework/errors";
import type { FaithGameplayConfig } from "./service";

export const DEFAULT_FAITH_CONFIG: Readonly<FaithGameplayConfig> = Object.freeze({
  abandonBaseAscensionCost: 1_200,
  abandonAscensionCostPerUse: 1_000,
  abandonMaxAscensionCost: 10_000,
  changeProfessionGoldCost: 1_000,
  changeProfessionAscensionCost: 50,
});

const KEYS = ["abandonBaseAscensionCost", "abandonAscensionCostPerUse", "abandonMaxAscensionCost", "changeProfessionGoldCost", "changeProfessionAscensionCost"] as const;

export function validateFaithConfig(value: unknown): FaithGameplayConfig {
  if (!value || typeof value !== "object") throw new BusinessError("CONFIG_INVALID", "信仰业务配置必须是对象。");
  const input = value as Record<string, unknown>, config = { ...DEFAULT_FAITH_CONFIG } as FaithGameplayConfig;
  for (const key of KEYS) {
    const number = input[key];
    if (!Number.isSafeInteger(number) || (number as number) < 0 || (number as number) > 1_000_000_000) throw new BusinessError("CONFIG_INVALID", `信仰业务配置 ${key} 必须是非负安全整数。`);
    config[key] = number as number;
  }
  if (config.abandonMaxAscensionCost < config.abandonBaseAscensionCost) throw new BusinessError("CONFIG_INVALID", "弃誓登神分上限不能低于基础消耗。");
  return config;
}
