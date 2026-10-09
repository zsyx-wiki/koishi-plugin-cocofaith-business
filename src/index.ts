import type { FaithCoreServiceContract } from "@mueo/cocofaith-sdk/core";
import { Context } from "koishi";
import { Config as ConfigSchema, type Config as BusinessConfig } from "../config";
import { FaithBusinessService } from "./framework/service";
import { registerBuiltInBusinessModules } from "./modules";
export const name = "cocofaith-business";
export const inject = ["faithCore"] as const;
export const Config = ConfigSchema;
export type Config = BusinessConfig;
declare module "koishi" {
    interface Context {
        faithBusiness: FaithBusinessService;
    }
}
export function apply(ctx: Context, config: Config) {
    const business = new FaithBusinessService(ctx as Context & {
        faithCore: FaithCoreServiceContract;
    }, config);
    ctx.set("faithBusiness", business);
    registerBuiltInBusinessModules(business);
}
export * from "@mueo/cocofaith-sdk/core";
export * from "@mueo/cocofaith-sdk/gameplay";
export * from "./framework/contributions";
export * from "./framework/errors";
export * from "./framework/gameplay-adapter";
export * from "./framework/graph";
export * from "./framework/interfaces";
export * from "./framework/manager";
export * from "./framework/module-config";
export * from "./framework/protocol";
export * from "./framework/registry";
export * from "./framework/router";
export * from "./framework/runtime";
export * from "./framework/service";
export * from "./framework/types";
export * from "./modules";
export * from "./shared/contracts";
export { MESSAGES } from "./shared/messages";
export type { FaithMessages } from "./shared/messages";
export * from "./version";
