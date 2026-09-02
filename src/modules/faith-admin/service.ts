import type { FaithBusinessCoreScope, UserValueDelta } from "@mueo/koishi-plugin-faith-core";
import { BusinessError } from "../../errors";
import { FaithAdminFieldRegistry } from "./fields";

const CORE_FIELDS: Readonly<Record<string, keyof UserValueDelta>> = Object.freeze({
  金币: "gold", 登神分数: "ascension_score", 觐见分数: "audience_score", 觐神分数: "audience_score", 弃誓次数: "abandon_count",
});

export class FaithAdminService {
  readonly fields = new FaithAdminFieldRegistry();
  constructor(private core: FaithBusinessCoreScope) {}
  async change(actorUid: number, fieldName: string, targetType: string, target: string, deltaValue: string) {
    if (!(await this.core.permissions.check(actorUid, "faith.creator"))) throw new BusinessError("NOT_ALLOWED", "此操作仅限创造者使用。");
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
