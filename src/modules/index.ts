import type { FaithBusinessService } from "../framework/service";
import { createFaithModule } from "./faith";
import { createFaithAdminModule } from "./faith-admin";
import { createVoidPrayerModule } from "./void-prayer";
import { createDailyPrayerModule } from "./daily-prayer";
import { createJunkModule } from "./junk";
import { createTitleModule } from "./title";
import { createRoomsModule } from "./rooms";
import { createRouletteModule } from "./roulette";
import { createAboutModule } from "./about";
import { createCollectionModule } from "./collection";
import { createBindingModule } from "./binding";

export function createBuiltInBusinessModules() {
  return [createFaithModule(), createFaithAdminModule(), createVoidPrayerModule(), createDailyPrayerModule(),
    createJunkModule(), createTitleModule(), createRoomsModule(), createRouletteModule(), createAboutModule(), createCollectionModule(), createBindingModule()] as const;
}

/** 兼容旧的模块清单导出；注册新实例请使用工厂函数。 */
export const BUILT_IN_BUSINESS_MODULES = createBuiltInBusinessModules();

export function registerBuiltInBusinessModules(service: FaithBusinessService) {
  const [faith, admin, voidPrayer, dailyPrayer, junk, title, rooms, roulette, about, collection, binding] = createBuiltInBusinessModules();
  return [service.register(faith), service.register(admin), service.register(voidPrayer), service.register(dailyPrayer),
    service.register(junk), service.register(title), service.register(rooms), service.register(roulette), service.register(about), service.register(collection), service.register(binding)];
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
export * from "./collection";
export * from "./binding";
