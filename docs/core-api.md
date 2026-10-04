# Core API

Business 通过 Koishi 的 `faithCore` 服务访问用户、物品、经济和事务能力。它不导入官方 Core 包，因此兼容实现可以使用不同的数据库和内部结构。

## 服务入口

实现类型为 `FaithCoreServiceContract`：

```ts
import type { Context } from "koishi"
import type { FaithCoreServiceContract } from "@mueo/cocofaith-sdk/core"

export function apply(ctx: Context) {
  const core: FaithCoreServiceContract = createCore()
  ctx.set("faithCore", core)
}
```

入口字段：

| 字段 | 用途 |
| --- | --- |
| `apiVersion` | 协议版本，当前为 `3.0` |
| `version` | 实现版本，可选 |
| `capabilities` | 查询可选能力 |
| `lifecycle` | 创建生命周期作用域 |
| `locks` | Business 命令与模块管理锁 |
| `adapter` | 外部身份标准化、解析和绑定 |
| `permissions` | 注册和检查公共权限策略 |
| `createBusinessScope()` | 为玩法创建隔离的 Core 作用域 |

Business 启动时调用 `assertFaithCoreContract()` 检查协议版本和入口方法。具体玩法使用到的接口由 TypeScript 在编译阶段检查。

## Business 作用域

`createBusinessScope(name)` 返回 `FaithBusinessCoreScope`。每个作用域包含以下能力：

| 接口 | 用途 |
| --- | --- |
| `users` | 用户读取 |
| `items` | 物品注册、目录和背包读取 |
| `economy` | 非事务经济操作 |
| `transaction` | 单 UID 和多 UID 原子事务 |
| `faiths`、`professions` | 信仰和职业注册表 |
| `identities`、`statusIdentities` | 外部身份与状态身份 |
| `permissions`、`bonuses`、`hooks` | 权限、加成和事件 |
| `data`、`table` | 业务私有数据和独立业务表 |
| `runtime` | Core API、实现版本和能力列表 |

作用域必须隔离所有权。模块只能卸载自己注册的资源，也不能通过表接口访问其他模块的数据。

## 内容查询

玩法应从服务查询内容，不应依赖官方 Core 的数据常量：

```ts
const paths = core.faiths.paths()
const faiths = core.faiths.byPath(paths[0])
const items = core.items.all()
```

这样可以保留自定义命途、信仰、职业和物品。实现版本显示使用 `core.runtime.version`，不要读取官方包的 `package.json`。

## Adapter

Adapter 只使用 `faithCore.adapter` 和 `faithBusiness.dispatch()` 等最小服务接口。Adapter 编译时依赖 SDK，不要求安装官方 Core 或 Business；运行时仍需由 Koishi 提供对应服务。
