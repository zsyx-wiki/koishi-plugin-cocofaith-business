import { BusinessError } from "../../framework/errors";

export interface BindingConfig {
  tokenTtlSeconds: number;
  maxPending: number;
}

export const DEFAULT_BINDING_CONFIG: Readonly<BindingConfig> = Object.freeze({
  tokenTtlSeconds: 300,
  maxPending: 1000,
});

export function validateBindingConfig(value: unknown): BindingConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new BusinessError("CONFIG_INVALID");
  const config = { ...DEFAULT_BINDING_CONFIG, ...value } as BindingConfig;
  if (!Number.isSafeInteger(config.tokenTtlSeconds) || config.tokenTtlSeconds < 60 || config.tokenTtlSeconds > 900) {
    throw new BusinessError("CONFIG_INVALID", "绑定令牌有效时间必须在 60-900 秒之间。");
  }
  if (!Number.isSafeInteger(config.maxPending) || config.maxPending < 10 || config.maxPending > 5000) {
    throw new BusinessError("CONFIG_INVALID", "待确认绑定数量上限必须在 10-5000 之间。");
  }
  return Object.freeze(config);
}

