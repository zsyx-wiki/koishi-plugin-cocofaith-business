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
export interface MessageTextNode { type: "text"; content: string; }
export interface MessageImageNode { type: "image"; url: string; fallback?: string; }
export interface MessageSilentNode { type: "silent"; }
export type MessageNode = MessageTextNode | MessageImageNode;
export interface BusinessDeliveryOptions {
  /** 默认 passive；proactive-required 表示业务结果过期后仍有主动发送价值。最终是否发送由 Adapter 决定。 */
  delivery?: "passive" | "proactive-required";
  /** 可选全服公告；正文必须包含本群需要的信息，不支持广播的平台可忽略此字段。 */
  broadcast?: { id: string; content: string };
}
export type BusinessResult = (MessageTextNode | MessageImageNode | MessageSilentNode | { type: "mixed"; content: MessageNode[] }) & BusinessDeliveryOptions;
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
export interface Config {
  modules: Record<string, BusinessModuleConfig>;
  faith?: BusinessModuleConfig;
  voidPrayer?: BusinessModuleConfig;
  dailyPrayer?: BusinessModuleConfig;
  junk?: BusinessModuleConfig;
  roulette?: BusinessModuleConfig;
  binding?: BusinessModuleConfig;
  club?: BusinessModuleConfig;
  container?: BusinessModuleConfig;
}
export interface BusinessModuleStatus { name: string; state: BusinessModuleState; enabled: boolean; dependencies: readonly string[]; error?: string; }
export function defineBusinessModule<I = never, O = never, C = Record<string, unknown>>(module: FaithBusinessModule<I, O, C>) { return module; }

export const defineAdvancedGameplay = defineBusinessModule;
