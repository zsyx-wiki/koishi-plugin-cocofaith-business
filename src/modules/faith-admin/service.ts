import type { FaithBusinessCoreScope, UserValueDelta } from "@mueo/koishi-plugin-cocofaith-core";
import { BusinessError } from "../../framework/errors";
import { FaithAdminFieldRegistry } from "./fields";
import { FaithAdminCommandRegistry } from "./commands";
import { Logger } from "koishi";
import { MESSAGES } from "../../../messages";

const CORE_FIELDS: Readonly<Record<string, keyof UserValueDelta>> = Object.freeze({
  金币: "gold", 登神分数: "ascension_score", 觐见分数: "audience_score", 觐神分数: "audience_score", 弃誓次数: "abandon_count",
});

export class FaithAdminService {
  readonly fields = new FaithAdminFieldRegistry();
  readonly commands = new FaithAdminCommandRegistry();
  constructor(private core: FaithBusinessCoreScope) {}
  async isCreator(uid: number) { return this.core.permissions.check(uid, "faith.creator"); }
  async changeAll(actorUid: number, fieldName: string, deltaValue: string, operationId: string, authorized = false) {
    if (!authorized && !(await this.isCreator(actorUid))) throw new BusinessError("NOT_ALLOWED", "此操作仅限创造者使用。");
    const field = CORE_FIELDS[fieldName], delta = Number(deltaValue);
    if (!field) throw new BusinessError("INVALID_INPUT", `全体操作仅支持：${Object.keys(CORE_FIELDS).join("、")}。`);
    if (!Number.isFinite(delta) || delta <= 0) throw new BusinessError("INVALID_INPUT", "全体数值增加必须是正数，不支持批量扣除。");
    if (["gold", "ascension_score", "abandon_count"].includes(field) && !Number.isSafeInteger(delta)) throw new BusinessError("INVALID_INPUT", "货币及弃誓次数增量必须是正安全整数。");
    const result = await this.core.bulk.incrementValuesForAll({ [field]: delta }, { operationId, status: "active" });
    const logger = new Logger("cocofaith-business-admin");
    logger.info(`全体数值调整 actor=${actorUid} field=${field} delta=${delta} operation=${result.operationId} total=${result.total} succeeded=${result.succeeded} skipped=${result.skipped} failed=${result.failed.length}`);
    for (const failure of result.failed) logger.warn(`全体数值调整失败 operation=${result.operationId} uid=${failure.uid} code=${failure.code} message=${failure.message}`);
    return { type: "text" as const, content: MESSAGES.admin.changedAll(fieldName, delta, result.succeeded, result.skipped, result.failed.length) };
  }
  async change(actorUid: number, fieldName: string, targetType: string, target: string, deltaValue: string, authorized = false) {
    if (!authorized && !(await this.isCreator(actorUid))) throw new BusinessError("NOT_ALLOWED", "此操作仅限创造者使用。");
    const targetUid = await this.resolveTarget(targetType, target), delta = Number(deltaValue);
    if (!Number.isFinite(delta) || delta === 0) throw new BusinessError("INVALID_INPUT", "数值变化必须是非零有限数字。");
    const coreField = CORE_FIELDS[fieldName], custom = this.fields.get(fieldName);
    if (!coreField && !custom) throw new BusinessError("INVALID_INPUT", `未知数值名。可选：${[...new Set([...Object.keys(CORE_FIELDS), ...this.fields.list().map((item) => item.name)])].join("、")}`);
    if (coreField) {
      if (coreField === "abandon_count" && !Number.isSafeInteger(delta)) throw new BusinessError("INVALID_INPUT", "弃誓次数只能按整数调整。");
      await this.core.transaction.run(targetUid, async (tx) => {
        if (coreField === "gold" || coreField === "ascension_score") {
          if (!Number.isSafeInteger(delta)) throw new BusinessError("INVALID_INPUT", "货币只能按安全整数调整。");
          if (delta > 0) await tx.economy.creditFixed({ [coreField]: delta });
          else await tx.economy.pay({ [coreField]: -delta });
          return;
        }
        await tx.users.change({ [coreField]: delta });
      }, {
        source: "faith_admin.change_value", operatorUid: actorUid,
      });
      return { targetUid, delta };
    }
    const message = await custom!.change({ actorUid, targetUid, delta });
    return { targetUid, delta, message };
  }
  private async resolveTarget(type: string, value: string) {
    if (type === "uid") {
      const uid = Number(value); if (!Number.isSafeInteger(uid)) throw new BusinessError("INVALID_INPUT", "UID 格式无效。");
      await this.core.users.require(uid); return uid;
    }
    if (type === "qq") {
      const uid = await this.core.identities.resolve({ adapter: "onebot", type: "qq_account", value, scope: "global" });
      if (uid === null) throw new BusinessError("NOT_FOUND", `QQ ${value} 尚未绑定 UID。`);
      return uid;
    }
    throw new BusinessError("INVALID_INPUT", "目标类型只能是 qq 或 uid。");
  }
}
