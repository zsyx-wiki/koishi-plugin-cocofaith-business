import type { FaithCoreService, IdentityInput } from "@mueo/koishi-plugin-faith-core";
import { BusinessError } from "./errors";
import type { BusinessEvent, BusinessResult, MessageNode } from "./types";

export const BUSINESS_PROTOCOL_LIMITS = Object.freeze({
  inputLength: 8_192,
  textLength: 32_768,
  fallbackLength: 4_096,
  urlLength: 2_048,
  mixedNodes: 100,
});

export function normalizeBusinessEvent(core: FaithCoreService, event: BusinessEvent): Readonly<BusinessEvent> {
  if (!event || typeof event !== "object") throw new BusinessError("INVALID_INPUT", "BusinessEvent 必须是对象。");
  if (event.uid !== null && (!Number.isSafeInteger(event.uid) || event.uid <= 0)) {
    throw new BusinessError("INVALID_INPUT", "BusinessEvent.uid 必须是正安全整数或 null。");
  }
  if (event.scene !== "group" && event.scene !== "private") throw new BusinessError("INVALID_INPUT", "BusinessEvent.scene 无效。");
  if (typeof event.content !== "string") throw new BusinessError("INVALID_INPUT", "BusinessEvent.content 必须是字符串。");
  if (event.content.length > BUSINESS_PROTOCOL_LIMITS.inputLength) throw new BusinessError("INVALID_INPUT", "消息内容过长。");
  if (event.channelId !== undefined && (typeof event.channelId !== "string" || event.channelId.length > 255)) {
    throw new BusinessError("INVALID_INPUT", "BusinessEvent.channelId 无效。");
  }
  let identity: Readonly<IdentityInput> | undefined;
  if (event.identity !== undefined) identity = Object.freeze(core.adapter.normalize(event.identity));
  if (event.uid === null && !identity) throw new BusinessError("INVALID_INPUT", "未注册事件必须包含标准身份。");
  return Object.freeze({ uid: event.uid, identity, scene: event.scene, content: event.content, channelId: event.channelId });
}

export function assertBusinessResult(result: unknown): asserts result is BusinessResult {
  if (!result || typeof result !== "object") throw invalidResult();
  const value = result as Record<string, unknown>;
  if (value.delivery !== undefined && value.delivery !== "passive" && value.delivery !== "proactive-required") throw invalidResult("消息发送策略无效。");
  if (value.type === "text") { assertText(value.content, BUSINESS_PROTOCOL_LIMITS.textLength); return; }
  if (value.type === "image") { assertImage(value); return; }
  if (value.type === "mixed" && Array.isArray(value.content) && value.content.length <= BUSINESS_PROTOCOL_LIMITS.mixedNodes) {
    for (const node of value.content) assertNode(node);
    return;
  }
  throw invalidResult();
}

function assertNode(node: unknown): asserts node is MessageNode {
  if (!node || typeof node !== "object") throw invalidResult("mixed 消息节点无效。");
  const value = node as Record<string, unknown>;
  if (value.type === "text") { assertText(value.content, BUSINESS_PROTOCOL_LIMITS.textLength); return; }
  if (value.type === "image") { assertImage(value); return; }
  throw invalidResult("mixed 消息节点无效。");
}

function assertImage(value: Record<string, unknown>) {
  if (typeof value.url !== "string" || !value.url || value.url.length > BUSINESS_PROTOCOL_LIMITS.urlLength) throw invalidResult("图片 URL 无效。");
  let url: URL;
  try { url = new URL(value.url); } catch { throw invalidResult("图片 URL 无效。"); }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw invalidResult("图片仅支持 HTTP(S) URL。");
  if (value.fallback !== undefined) assertText(value.fallback, BUSINESS_PROTOCOL_LIMITS.fallbackLength);
}

function assertText(value: unknown, maximum: number) {
  if (typeof value !== "string" || value.length > maximum) throw invalidResult("消息文本无效或超过长度限制。");
}

function invalidResult(message = "业务返回了不受支持的消息结果。") {
  return new BusinessError("INTERNAL_ERROR", message);
}
