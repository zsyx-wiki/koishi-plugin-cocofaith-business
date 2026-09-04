import { Context } from "koishi";
import { Config as ConfigSchema, type Config as BusinessConfig } from "../config";
import type {} from "@mueo/koishi-plugin-faith-core";
import { FaithBusinessService } from "./framework/service";
import { registerBuiltInBusinessModules } from "./modules";

export const name = "faith-business";
export const inject = ["faithCore"] as const;
export const Config = ConfigSchema;
export type Config = BusinessConfig;

declare module "koishi" {
  interface Context { faithBusiness: FaithBusinessService; }
}

export function apply(ctx: Context, config: Config) {
  const business = new FaithBusinessService(ctx, config);
  ctx.set("faithBusiness", business);
  registerBuiltInBusinessModules(business);
}

export * from "./framework/types";
export * from "./framework/errors";
export * from "./framework/graph";
export * from "./framework/interfaces";
export * from "./framework/contributions";
export * from "./framework/module-config";
export * from "./framework/runtime";
export * from "./framework/registry";
export * from "./framework/manager";
export * from "./modules";
export * from "./framework/service";
export * from "./framework/router";
export * from "./framework/protocol";
