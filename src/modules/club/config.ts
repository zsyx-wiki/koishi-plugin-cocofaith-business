import { BusinessError } from "../../framework/errors";

export interface ClubConfig {
  firstGoldFee: number; firstAscensionFee: number; dailyGoldFee: number; dailyAscensionFee: number;
  poolRate: number; aidGold: number; aidAscension: number; aidGoldThreshold: number; aidAscensionThreshold: number;
}
export const DEFAULT_CLUB_CONFIG: Readonly<ClubConfig> = Object.freeze({
  firstGoldFee: 2000, firstAscensionFee: 200, dailyGoldFee: 200, dailyAscensionFee: 20,
  poolRate: 1.1, aidGold: 300, aidAscension: 40, aidGoldThreshold: 2000, aidAscensionThreshold: 600,
});
export function validateClubConfig(value: unknown): ClubConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BusinessError("CONFIG_INVALID");
  const config = { ...DEFAULT_CLUB_CONFIG, ...value } as ClubConfig;
  for (const key of ["firstGoldFee", "firstAscensionFee", "dailyGoldFee", "dailyAscensionFee", "aidGold", "aidAscension", "aidGoldThreshold", "aidAscensionThreshold"] as const) {
    if (!Number.isSafeInteger(config[key]) || config[key] < 0) throw new BusinessError("CONFIG_INVALID", `俱乐部配置 ${key} 必须是非负安全整数。`);
  }
  if (!Number.isFinite(config.poolRate) || config.poolRate < 1 || config.poolRate > 10) throw new BusinessError("CONFIG_INVALID", "贡献池倍率必须在 1-10 之间。");
  return Object.freeze(config);
}
