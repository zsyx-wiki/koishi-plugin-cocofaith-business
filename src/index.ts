import { Context } from "koishi";
import { Config as ConfigSchema, type Config as BusinessConfig } from "../config";
import type {} from "@mueo/koishi-plugin-faith-core";
import { FaithBusinessService } from "./service";
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

export * from "./types";
export * from "./errors";
export * from "./graph";
export * from "./interfaces";
export * from "./contributions";
export * from "./module-config";
export * from "./runtime";
export * from "./registry";
export * from "./manager";
export * from "./modules";
export * from "./service";
export * from "./router";
export * from "./protocol";
