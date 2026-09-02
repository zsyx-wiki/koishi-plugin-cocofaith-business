import { BusinessError } from "../../errors";
import { VOID_PRAYER_LEVELS, type VoidPrayerConfig, type VoidPrayerLevel } from "./types";

export const DEFAULT_VOID_PRAYER_CONFIG: VoidPrayerConfig = Object.freeze({
  baseCost: 45, extraCost: 80, baseCostDraws: 3, dailyLimit: 10, maxDrawsPerCommand: 100,
  easterEggChance: 0.05,
  probabilities: Object.freeze({ SP: 0.0005, SSS: 0.0043, SS: 0.0152, S: 0.0374, A: 0.0897, B: 0.1608, C: 0.3188, D: 0.3733 }),
  upSpItems: Object.freeze(["真理仪轨", "忆妄之镜", "骨仆赎罪者子嗣之戒", "骨仆乐乐尔之戒"]),
});

export function validateVoidPrayerConfig(value: unknown): VoidPrayerConfig {
  if (!value || typeof value !== "object") throw new BusinessError("CONFIG_INVALID", "虚空祈求配置必须是对象。");
  const input = value as Partial<VoidPrayerConfig>, integer = (key: keyof VoidPrayerConfig, fallback: number, min: number, max: number) => {
    const current = input[key] ?? fallback;
    if (!Number.isSafeInteger(current) || (current as number) < min || (current as number) > max) throw new BusinessError("CONFIG_INVALID", `虚空祈求配置 ${key} 无效。`);
    return current as number;
  };
  const source = input.probabilities ?? DEFAULT_VOID_PRAYER_CONFIG.probabilities, probabilities = {} as Record<VoidPrayerLevel, number>;
  let total = 0;
  for (const level of VOID_PRAYER_LEVELS) {
    const chance = source[level];
    if (!Number.isFinite(chance) || chance < 0 || chance > 1) throw new BusinessError("CONFIG_INVALID", `虚空祈求 ${level} 概率无效。`);
    probabilities[level] = chance; total += chance;
  }
  if (Math.abs(total - 1) > 1e-9) throw new BusinessError("CONFIG_INVALID", `虚空祈求概率总和必须为 1，当前为 ${total}。`);
  const easterEggChance = input.easterEggChance ?? DEFAULT_VOID_PRAYER_CONFIG.easterEggChance;
  if (!Number.isFinite(easterEggChance) || easterEggChance < 0 || easterEggChance > 1) throw new BusinessError("CONFIG_INVALID", "彩蛋概率必须为 0-1。");
  const upSpItems = input.upSpItems ?? DEFAULT_VOID_PRAYER_CONFIG.upSpItems;
  if (!Array.isArray(upSpItems) || upSpItems.length > 100 || upSpItems.some((name) => typeof name !== "string" || !name.trim())) throw new BusinessError("CONFIG_INVALID", "SP UP 物品列表无效。");
  return Object.freeze({
    baseCost: integer("baseCost", 45, 0, 1_000_000_000), extraCost: integer("extraCost", 80, 0, 1_000_000_000),
    baseCostDraws: integer("baseCostDraws", 3, 0, 10_000), dailyLimit: integer("dailyLimit", 10, 1, 10_000),
    maxDrawsPerCommand: integer("maxDrawsPerCommand", 100, 1, 1_000), easterEggChance,
    probabilities: Object.freeze(probabilities), upSpItems: Object.freeze(upSpItems.map((name) => name.trim())),
  });
}
