import type { FaithBusinessService } from "../service";
import type { FaithBusinessModule } from "../types";
import { faithModule } from "./faith";
import { faithAdminModule } from "./faith-admin";
import { voidPrayerModule } from "./void-prayer";
import { dailyPrayerModule } from "./daily-prayer";

export const BUILT_IN_BUSINESS_MODULES: readonly FaithBusinessModule[] = [faithModule, faithAdminModule, voidPrayerModule, dailyPrayerModule];

export function registerBuiltInBusinessModules(service: FaithBusinessService) {
  return BUILT_IN_BUSINESS_MODULES.map((module) => service.register(module));
}

export * from "./faith";
export * from "./faith-admin";
export * from "./void-prayer";
export * from "./daily-prayer";
