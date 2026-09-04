import type { FaithBusinessService } from "../framework/service";
import type { FaithBusinessModule } from "../framework/types";
import { createFaithModule } from "./faith";
import { createFaithAdminModule } from "./faith-admin";
import { createVoidPrayerModule } from "./void-prayer";
import { createDailyPrayerModule } from "./daily-prayer";
import { createJunkModule } from "./junk";
import { createTitleModule } from "./title";
import { createRoomsModule } from "./rooms";
import { createRouletteModule } from "./roulette";
import { createAboutModule } from "./about";

export function createBuiltInBusinessModules(): readonly FaithBusinessModule<any, any, any>[] {
  return [createFaithModule(), createFaithAdminModule(), createVoidPrayerModule(), createDailyPrayerModule(),
    createJunkModule(), createTitleModule(), createRoomsModule(), createRouletteModule(), createAboutModule()];
}

/** 兼容旧的模块清单导出；注册新实例请使用工厂函数。 */
export const BUILT_IN_BUSINESS_MODULES = createBuiltInBusinessModules();

export function registerBuiltInBusinessModules(service: FaithBusinessService) {
  return createBuiltInBusinessModules().map((module) => service.register(module));
}

export * from "./faith";
export * from "./faith-admin";
export * from "./void-prayer";
export * from "./daily-prayer";
export * from "./junk";
export * from "./title";
export * from "./rooms";
export * from "./roulette";
export * from "./about";
