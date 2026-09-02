import type { FaithBusinessCoreScope, FaithDisposable, IdentityInput } from "@mueo/koishi-plugin-faith-core";
import type { BusinessContributionHandler, BusinessContributionOptions, BusinessContributionResult } from "./contributions";

export type BusinessModuleState = "registered" | "disabled" | "initializing" | "initialized" | "readying" | "ready" | "reloading" | "disposing" | "failed" | "disposed";
export type BusinessScene = "group" | "private";
export interface BusinessEvent { uid: number | null; identity?: Readonly<IdentityInput>; scene: BusinessScene; content: string; channelId?: string; }
export interface MessageTextNode { type: "text"; content: string; }
export interface MessageImageNode { type: "image"; url: string; fallback?: string; }
export type MessageNode = MessageTextNode | MessageImageNode;
export interface BusinessDeliveryOptions {
  /** 默认 passive；proactive-required 表示业务结果过期后仍有主动发送价值。最终是否发送由 Adapter 决定。 */
  delivery?: "passive" | "proactive-required";
}
export type BusinessResult = (MessageTextNode | MessageImageNode | { type: "mixed"; content: MessageNode[] }) & BusinessDeliveryOptions;
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
  /** 第一个值是推荐显示名，其余为别名。 */
  readonly commands: readonly string[];
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
  /** 兼容非命令型内部调用；普通玩法优先使用 commands。 */
  execute?(context: BusinessExecutionContext<C>, input: I): Promise<LegacyModuleResult<O>>;
}
export interface BusinessModuleConfig { enabled?: boolean; config?: Record<string, unknown>; }
export interface Config {
  modules: Record<string, BusinessModuleConfig>;
  /** 内置信仰业务的便捷配置；同名值优先于 modules.faith。 */
  faith?: BusinessModuleConfig;
  /** 内置虚空祈求的便捷配置；同名值优先于 modules.void_prayer。 */
  voidPrayer?: BusinessModuleConfig;
  /** 内置每日祈祷的便捷配置。 */
  dailyPrayer?: BusinessModuleConfig;
  /** 内置捡垃圾业务的便捷配置。 */
  junk?: BusinessModuleConfig;
}
export interface BusinessModuleStatus { name: string; state: BusinessModuleState; enabled: boolean; dependencies: readonly string[]; error?: string; }
export function defineBusinessModule<I = never, O = never, C = Record<string, unknown>>(module: FaithBusinessModule<I, O, C>) { return module; }
