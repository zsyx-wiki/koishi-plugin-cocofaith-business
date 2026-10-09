import {
  defineGameplayConfig,
  refineGameplayConfig,
  gameplayInteger,
  gameplayNumber,
} from "@mueo/cocofaith-sdk/gameplay";

const CONTAINER_FIELDS = defineGameplayConfig({
  maxCapacity: gameplayInteger(300, { min: 1, max: 1_000_000, description: "神性容器硬上限。" }),
  manualInfusionMax: gameplayInteger(250, { min: 1, max: 1_000_000, description: "允许手动投入达到的神性上限。" }),
  passiveMaxDivinity: gameplayInteger(150, { min: 0, max: 1_000_000 }),
  goldPerDivinity: gameplayNumber(0.002, { min: 0, max: 100 }),
  ascensionPerDivinity: gameplayNumber(0.0015, { min: 0, max: 100 }),
  maxConsecrationCharges: gameplayInteger(16, { min: 0, max: 1_000_000 }),
  dailyChargeRecovery: gameplayInteger(2, { min: 0, max: 1_000_000 }),
  consecrationDivinityCost: gameplayInteger(4, { min: 1, max: 1_000_000 }),
  consecrationAudienceReward: gameplayInteger(1, { min: 0, max: 1_000_000 }),
  subgodDivinityCost: gameplayInteger(150, { min: 1, max: 1_000_000 }),
  subgodGoldReward: gameplayInteger(5_000, { min: 0, max: 1_000_000_000 }),
  subgodAscensionReward: gameplayInteger(500, { min: 0, max: 1_000_000_000 }),
  subgodAudienceReward: gameplayInteger(5, { min: 0, max: 1_000_000_000 }),
  subgodGoldBonus: gameplayNumber(0.25, { min: 0, max: 100 }),
  subgodAscensionBonus: gameplayNumber(0.15, { min: 0, max: 100 }),
  subgodVoidPrayerBonus: gameplayInteger(10, { min: 0, max: 1_000_000 }),
  subgodDailyPrayerBonus: gameplayInteger(1, { min: 0, max: 1_000_000 }),
  truegodDivinityCost: gameplayInteger(250, { min: 1, max: 1_000_000 }),
  truegodBaseGoldCost: gameplayInteger(100_000, { min: 0, max: 1_000_000_000 }),
  truegodGoldIncrement: gameplayInteger(15_000, { min: 0, max: 1_000_000_000 }),
  truegodBaseAscensionCost: gameplayInteger(5_000, { min: 0, max: 1_000_000_000 }),
  truegodAscensionIncrement: gameplayInteger(1_500, { min: 0, max: 1_000_000_000 }),
  truegodGoldBonus: gameplayNumber(0.5, { min: 0, max: 100 }),
  truegodAscensionBonus: gameplayNumber(0.3, { min: 0, max: 100 }),
  truegodVoidPrayerBonus: gameplayInteger(50, { min: 0, max: 1_000_000 }),
});

export const CONTAINER_CONFIG = refineGameplayConfig(CONTAINER_FIELDS, config => {
  if (config.manualInfusionMax > config.maxCapacity) throw new RangeError("manualInfusionMax 不能超过 maxCapacity");
  if (config.subgodDivinityCost > config.maxCapacity || config.truegodDivinityCost > config.maxCapacity) throw new RangeError("登神所需神性不能超过容器上限");
});
export type ContainerConfig = ReturnType<typeof CONTAINER_CONFIG.parse>;
export const validateContainerConfig = CONTAINER_CONFIG.parse;
