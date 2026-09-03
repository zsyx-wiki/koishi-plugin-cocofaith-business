import type { FaithBusinessService } from "../service";
import type { FaithBusinessModule } from "../types";
import { faithModule } from "./faith";
import { faithAdminModule } from "./faith-admin";
import { voidPrayerModule } from "./void-prayer";
import { dailyPrayerModule } from "./daily-prayer";
import { junkModule } from "./junk";
import { titleModule } from "./title";
import { roomsModule } from "./rooms";
import { rouletteModule } from "./roulette";

export const BUILT_IN_BUSINESS_MODULES: readonly FaithBusinessModule<any, any, any>[] = [faithModule, faithAdminModule, voidPrayerModule, dailyPrayerModule, junkModule, titleModule, roomsModule, rouletteModule];

export function registerBuiltInBusinessModules(service: FaithBusinessService) {
  return BUILT_IN_BUSINESS_MODULES.map((module) => service.register(module));
}

export * from "./faith";
export * from "./faith-admin";
export * from "./void-prayer";
export * from "./daily-prayer";
export * from "./junk";
export * from "./title";
export * from "./rooms";
export * from "./roulette";
