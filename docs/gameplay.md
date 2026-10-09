# 玩法开发

普通指令玩法使用 `defineGameplay()`。需要独立表、多玩家事务、房间或跨模块扩展时使用 `defineAdvancedGameplay()`。

## 简单玩法

```ts
import {
  defineGameplay,
  defineGameplayConfig,
  fail,
  gameplayInteger,
} from "@mueo/cocofaith-sdk/gameplay"

const config = defineGameplayConfig({
  rewardGold: gameplayInteger(50, { min: 0, max: 1_000_000 }),
})

export const dailyFish = defineGameplay({
  name: "daily_fish",
  config,
  commands: [{
    id: "play",
    triggers: ["摸鱼", "每日摸鱼"],
    atomic: "user",
    async run({ state, economy, config }) {
      if (state.data.date === state.gameDay) {
        fail("LIMIT_REACHED", "今天已经摸过鱼了。")
      }
      const reward = await economy.reward({ gold: config.rewardGold })
      state.data.date = state.gameDay
      return `获得 ${reward.applied.gold ?? 0} 金币。`
    },
  }],
})
```

将定义加入 `src/modules/index.ts` 的内置模块数组即可注册。外部插件可以直接调用 `faithBusiness.register(definition)`。

## 命令类型

普通命令只接受已注册用户，`uid` 为 `number`。公开命令显式设置：

```ts
guest: true
```

需要修改用户资产或玩法状态时设置：

```ts
atomic: "user"
```

原子命令在同一事务中提供：

| 字段 | 用途 |
| --- | --- |
| `state.data` | 模块私有状态 |
| `state.publicData` | 其他模块可读取的状态 |
| `state.gameDay` | Core 计算的游戏日 |
| `economy` | 支付、固定入账和带加成奖励 |
| `items` | 背包操作 |
| `user` | 用户公共数据操作 |
| `tx` | 完整事务作用域 |

框架根据模块名和命令 ID 写入审计来源，并在存在 `eventId` 时生成幂等键。命令抛错时，状态和资产一并回滚。

## 配置和服务

`defineGameplayConfig()` 同时生成默认值、类型、Koishi Schema 和运行时校验。基础字段使用 `gameplayInteger()`、`gameplayNumber()`、`gameplayBoolean()`、`gameplayString()`。

需要复用逻辑时在 `setup()` 返回服务对象：

```ts
export const example = defineGameplay({
  name: "example",
  setup({ core, config }) {
    return new ExampleService(core, config)
  },
  commands: [{
    id: "run",
    triggers: ["示例"],
    run({ service }) {
      return service.run()
    },
  }],
})
```

初始化和配置重载都会调用 `setup()`。

## 返回值

文本可以直接返回字符串。结构化响应使用 `text()`、`image()`、`mixed()`、`silent()`。玩法不应生成 CQ Code、QQ Markdown，也不应直接调用平台发送接口。

## 高级模块

以下情况使用 `defineAdvancedGameplay()`：

- 注册独立业务表；
- 多 UID 原子事务；
- 房间和定时任务；
- 自定义生命周期；
- 跨模块接口或贡献点。

该接口提供统一的 `triggers`、`run`、`guest` 命令语法，并提供 `init`、`ready`、`reload`、`dispose` 和完整的 `FaithBusinessCoreScope`。简单玩法与高级模块可以同时注册，并通过 `provide()`、`use()`、`contribute()`、`collect()` 协作。

## 类型化状态和参数

```ts
import {
  defineGameplay, defineGameplayState, defineGameplayParameters,
  gameplayArgument, gameplayInteger,
} from "@mueo/cocofaith-sdk/gameplay"

const state = defineGameplayState({
  version: 1,
  defaults: { count: 0 },
  parse(value: unknown) {
    const count = (value as { count?: unknown })?.count
    if (!Number.isSafeInteger(count) || Number(count) < 0) throw new TypeError("count 无效")
    return { count: Number(count) }
  },
})
const parameters = defineGameplayParameters({
  count: gameplayArgument(gameplayInteger(1, { min: 1, max: 10 })),
})
export const counter = defineGameplay({
  name: "counter", state,
  commands: [{ id: "add", triggers: ["计数"], atomic: "user", parameters,
    run({ params, state }) {
      state.data.count += params.count
      return `当前计数：${state.data.count}`
    },
  }],
})
```

参数按声明顺序解析；缺失、过多或非法参数返回 `INVALID_INPUT`。可选参数使用
`gameplayArgument(field, { optional: true })`，剩余文本使用 `{ rest: true }` 并放在末尾。
状态在载入和保存时校验，版本保存在私有状态的保留字段 `__cocofaith_state_version`。
升级时增加 `version` 并提供 `migrate(data, fromVersion)`；公开状态可使用
`publicDefaults`、`parsePublic`、`migratePublic`。回退到旧代码遇到更高状态版本会拒绝执行。

## 配置组合

基础字段之外还有 `gameplayEnum()`、`gameplayArray()`、`gameplayObject()`、
`gameplayOptional()`。`refineGameplayConfig()` 给同一份配置补充跨字段约束，Schema
和运行时解析共用校验。默认配置在定义时检查，解析结果深度冻结。
内置模块配置由 `src/config-catalog.ts` 映射到模块，不再单独手写根 Schema。

## 生命周期和扩展

简单玩法的 `setup()` 可通过 `track(resource)`、`defer(callback)` 管理资源。
返回的 service 自动推导到 `run({ service })`。需要主动清理 service 时提供
`dispose(service)`；注册的接口、贡献点和 Core 生命周期资源随该代 service 清理。
重载先暂停新执行、等待已有执行结束，再清理并创建新 service。初始化失败会清理资源；
重载失败尝试恢复旧配置，清理失败或恢复失败时模块进入 `failed`，阻止继续执行。

跨模块协议放在共同契约文件中：

```ts
import { defineGameplayInterface, provideGameplayInterface, useGameplayInterface }
  from "@mueo/cocofaith-sdk/gameplay"
export const SCORE_API = defineGameplayInterface<{ score(uid: number): Promise<number> }>("scores")
// 提供者 setup(ctx): provideGameplayInterface(ctx, SCORE_API, service)
// 消费者 setup(ctx): const scores = useGameplayInterface(ctx, SCORE_API)
```

消费者在 `dependencies` 中声明提供者。贡献点使用 `defineGameplayContribution<I, O>()`、
`contributeGameplay()`、`collectGameplay()`；返回值包含 `results` 与 `failures`，由调用方
决定失败贡献是否阻断业务。内置共享 token 在 `src/shared/contracts.ts`。
旧 `commands/execute/allowUnregistered` 和字符串接口仍兼容，新代码使用统一语法和 token。

## 目录与边界

```text
src/modules/<gameplay>/
  index.ts       # 公开导出，小玩法也可以直接在这里定义
  module.ts      # 命令和生命周期装配
  config.ts      # 配置定义与推导类型
  service.ts     # 业务规则
  messages.ts    # 当前玩法文案
  types.ts       # 仅保留其他文件复用的领域类型
```

按玩法规模添加文件，不要求每个模块补齐所有文件。Core 的 `users/`、`identity/`、
`transaction/`、`business/` 各自维护领域职责；Business 的 `framework/` 管理运行时、
路由和注册，`shared/` 放共用契约与少量共用工具。根 `messages.ts` 和 Core 的
`services/index.ts` 保留兼容导出。

SDK 的 `/testing` 用于单用户玩法测试；独立表、加成、多用户、房间和重载在真实
Core/Business 中集成测试。`npm test` 同时检查源码、作者类型用例、构建和行为回归。
错误包含模块、命令、事件定位信息；未知错误向玩家展示通用信息并在 Business 日志保留原因。
