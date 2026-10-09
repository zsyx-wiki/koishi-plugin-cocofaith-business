import { defineGameplayContribution, defineGameplayInterface } from "@mueo/cocofaith-sdk/gameplay";
import type { FaithAdminCommandsApi } from "../modules/faith-admin/commands";
import type { FaithAdminNumericFieldsApi } from "../modules/faith-admin/fields";
import type { GameRoomsApi } from "../modules/rooms";
import type { RouletteGameplayApi } from "../modules/roulette";
import type { TitleServiceApi } from "../modules/title";
export const TITLE_API = defineGameplayInterface<TitleServiceApi>("title");
export const ROOMS_API = defineGameplayInterface<GameRoomsApi>("rooms");
export const ROULETTE_API = defineGameplayInterface<RouletteGameplayApi>("roulette");
export const ADMIN_FIELDS_API = defineGameplayInterface<FaithAdminNumericFieldsApi>("faith_admin", "numeric-fields");
export const ADMIN_COMMANDS_API = defineGameplayInterface<FaithAdminCommandsApi>("faith_admin", "commands");
export const FAITH_INFO = defineGameplayContribution<{
    uid: number;
}, string>("faith.info");
export const FAITH_BEFORE_ABANDON = defineGameplayContribution<{
    uid: number;
    targetFaith: string;
}, string>("faith.before-abandon");
