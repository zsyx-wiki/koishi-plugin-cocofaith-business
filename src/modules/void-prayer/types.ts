import type { FaithItemDefinition } from "@mueo/koishi-plugin-faith-core";

export const VOID_PRAYER_LEVELS = ["SP", "SSS", "SS", "S", "A", "B", "C", "D"] as const;
export type VoidPrayerLevel = typeof VOID_PRAYER_LEVELS[number];
export interface VoidPrayerConfig extends Record<string, unknown> {
  baseCost: number;
  extraCost: number;
  baseCostDraws: number;
  dailyLimit: number;
  maxDrawsPerCommand: number;
  easterEggChance: number;
  probabilities: Readonly<Record<VoidPrayerLevel, number>>;
  upSpItems: readonly string[];
}
export interface VoidPrayerState extends Record<string, unknown> {
  date: string;
  dailyUsed: number;
  permanentExtra: number;
  temporaryExtra: number;
  temporaryDate: string;
  consumableExtra: number;
  costReduction: number;
}
export interface VoidPrayerDraw { item: Readonly<FaithItemDefinition>; easterEgg: boolean; }
export interface VoidPrayerResult {
  requested: number; actual: number; cost: number; date: string; used: number; dailyLimit: number;
  remaining: number; draws: readonly VoidPrayerDraw[]; counts: Readonly<Record<string, number>>;
}
