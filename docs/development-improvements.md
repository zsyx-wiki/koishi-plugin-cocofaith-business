# 开发体验与 SDK 优化验收清单

本次范围为 CoCoFaith v3 的 Core、Business、OneBot/QQ Adapter 与 cocofaith-sdk。
下面列出已落地的开发体验和 SDK 改动，玩法迁移与 cocorpg 产品重构不属于本次范围。

## 结构与日常开发

- [x] Core 按 users、identity、transaction、business 领域组织，保留 services 兼容导出。
- [x] 多文件玩法统一 index/module/config/service/messages 的职责，小玩法允许单文件。
- [x] 普通玩法使用 defineGameplay，高级玩法使用 defineAdvancedGameplay。
- [x] 两个入口统一 triggers/run/guest 命令写法，旧写法保留兼容。
- [x] about、junk 作为真实内置玩法使用 SDK；junk 的状态和资产在同一事务保存。
- [x] 将玩法文案移入对应模块，根 messages 保留兼容汇总。
- [x] 内置配置集中映射，同一声明生成默认值、类型、Schema 和运行时校验。
- [x] 去除与配置定义重复的配置接口，保留兼容类型导出。
- [x] 内置跨模块接口和贡献点使用共享类型化 token。
- [x] 统一源码排版并提供各仓库 format 命令。

## SDK 协议与类型

- [x] 分离 gameplay/core/runtime/protocol/testing 公共子入口。
- [x] Core 契约按领域拆分，补齐 effects、表字段、upsert 等类型。
- [x] 检查 Core 根服务和业务作用域的运行时协议与缺失方法。
- [x] 配置支持 enum/array/object/optional 和跨字段校验。
- [x] 配置在定义时校验默认值，冻结默认值和解析结果。
- [x] 参数按声明生成类型并解析数字、布尔、可选参数和剩余文本。
- [x] 私有/公开状态支持默认值、类型、校验、版本和迁移。
- [x] 普通、访客、原子命令类型区分，支持子命令与动态根匹配。
- [x] 定义阶段检查命令 ID、触发词、场景、非法组合和嵌套深度。
- [x] 原子上下文限制 Core 写入入口，提供 afterCommit/afterRollback。
- [x] SDK、Business、Adapter 共用事件和响应协议及响应校验。
- [x] 在提交前校验响应和状态，非法结果导致事务回滚。
- [x] 错误保留 cause 并提供模块、命令、事件定位；未知错误不直接展示给玩家。
- [x] SDK 运行时配置只加载 Schema 库，避免引入 Koishi Loader。

## 生命周期与验证

- [x] 每次 setup 管理自己的 service、接口、贡献点和生命周期资源。
- [x] 初始化失败清理资源；卸载逆序清理并汇总失败，避免中途漏清理。
- [x] 重载等待执行结束；失败恢复旧配置，无法安全恢复时进入 failed。
- [x] Core 和 Business 管理器清除已释放的资源记录。
- [x] 内存测试宿主覆盖单用户资产、背包、状态、回滚、幂等及资源清理。
- [x] 作者类型测试覆盖配置/service/state/params 推导、访客 UID 和原子边界。
- [x] 真实 SQLite 集成测试覆盖 SDK 玩法、重复事件和重载/清理失败。
- [x] 独立进程验证全部 SDK CJS/ESM 入口。
- [x] 五个仓库 test 命令先类型检查，再构建并执行行为测试。

## 本次验证

| 仓库 | 通过的行为测试 |
| --- | ---: |
| cocofaith-sdk | 14 |
| koishi-plugin-cocofaith-core | 24 |
| koishi-plugin-cocofaith-business | 56 |
| koishi-plugin-cocofaith-adapter-onebot | 8 |
| koishi-plugin-cocofaith-adapter-qq | 15 |

总计 117 项，另有源码和作者类型检查。测试宿主的功能边界与示例见 SDK README；
玩法目录、状态/参数、生命周期与迁移写法见 [玩法开发](./gameplay.md)。
