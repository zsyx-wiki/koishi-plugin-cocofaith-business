import type { FaithBusinessCoreScope, FaithDisposable, IdentityInput } from "@mueo/cocofaith-sdk/core";
import type { BusinessContributionHandler, BusinessContributionOptions, BusinessContributionResult } from "./contributions";

export type BusinessModuleState = "registered" | "disabled" | "initializing" | "initialized" | "readying" | "ready" | "reloading" | "disposing" | "failed" | "disposed";
export type BusinessScene = "group" | "private";
export interface BusinessAdapterInfo {
  readonly name: string;
  readonly version: string;
  readonly allowRegistration?: boolean;
}
export interface BusinessEvent {
  uid: number | null; identity?: Readonly<IdentityInput>; scene: BusinessScene; content: string; channelId?: string;
  adapter?: Readonly<BusinessAdapterInfo>;
  roomKey?: string;
  eventId?: string;
  displayName?: string;
  reply?: (result: BusinessResult) => Promise<unknown>;
}
export type {
  GameplayTextNode as MessageTextNode,
  GameplayImageNode as MessageImageNode,
  GameplaySilentResult as MessageSilentNode,
  GameplayDeliveryOptions as BusinessDeliveryOptions,
} from "@mueo/cocofaith-sdk/gameplay";
export type MessageNode = import("@mueo/cocofaith-sdk/gameplay").GameplayTextNode | import("@mueo/cocofaith-sdk/gameplay").GameplayImageNode;
export type BusinessResult = import("@mueo/cocofaith-sdk/gameplay").GameplayResult;
export type BusinessDispatchResult =
  | { matched: true; business: string; command: string; result: BusinessResult }
  | { matched: false; reason: "empty" | "not-found" }
  | { matched: true; business: string; command: string; error: { code: string; message: string; details?: Record<string, unknown> } };

export interface BusinessInterfaceOptions { version?: string; }
export interface BusinessModuleContext<C = Record<string, unknown>> {
  readonly name: string;
  readonly core: FaithBusinessCoreScope;
  readonly config: Readonly<C>;
  provide<T>(name: string, value: T, options?: BusinessInterfaceOptions): FaithDisposable;
  use<T>(business: string, name?: string): T;
  contribute<I, O>(slot: string, handler: BusinessContributionHandler<I, O>, options: BusinessContributionOptions): FaithDisposable;
  collect<I, O>(slot: string, input: Readonly<I>): Promise<BusinessContributionResult<O>>;
}
export interface BusinessExecutionContext<C = Record<string, unknown>> extends BusinessModuleContext<C> { readonly uid: number; }
export interface BusinessCommandContext<C = Record<string, unknown>> extends BusinessModuleContext<C> {
  readonly uid: number | null;
  readonly event: Readonly<BusinessEvent>;
  readonly args: readonly string[];
  readonly path: readonly string[];
}
export interface BusinessCommand<C = Record<string, unknown>> {
  readonly id: string;
  readonly commands: readonly string[];
  /** 用于祷词等动态内容；仅在没有普通根命令命中时执行，必须是无副作用的同步判断。 */
  readonly match?: (content: string) => boolean;
  readonly description?: string;
  readonly scenes?: readonly BusinessScene[];
  readonly allowUnregistered?: boolean;
  readonly children?: readonly BusinessCommand<C>[];
  execute?(context: BusinessCommandContext<C>): Promise<BusinessResult> | BusinessResult;
}
export type LegacyModuleResult<T> =
  | { ok: true; code: string; data: T }
  | { ok: false; code: string; message: string; details?: Record<string, unknown> };

export interface FaithBusinessModule<I = unknown, O = unknown, C = Record<string, unknown>> {
  readonly name: string;
  readonly dependencies?: readonly string[];
  readonly defaultConfig?: C;
  readonly commands?: readonly BusinessCommand<C>[];
  validateConfig?(config: unknown): C;
  init?(context: BusinessModuleContext<C>): void | Promise<void>;
  ready?(context: BusinessModuleContext<C>): void | Promise<void>;
  reload?(context: BusinessModuleContext<C>, previousConfig: Readonly<C>): void | Promise<void>;
  dispose?(context: BusinessModuleContext<C>): void | Promise<void>;
  execute?(context: BusinessExecutionContext<C>, input: I): Promise<LegacyModuleResult<O>>;
}
export interface BusinessModuleConfig { enabled?: boolean; config?: Record<string, unknown>; }
export type Config = { modules: Record<string, BusinessModuleConfig> } & {
  [K in keyof typeof import("../config-catalog").BUILT_IN_CONFIGS]?: BusinessModuleConfig;
};
export interface BusinessModuleStatus { name: string; state: BusinessModuleState; enabled: boolean; dependencies: readonly string[]; error?: string; }
export function defineBusinessModule<I = never, O = never, C = Record<string, unknown>>(module: FaithBusinessModule<I, O, C>) { return module; }

export const defineAdvancedGameplay = defineBusinessModule;
