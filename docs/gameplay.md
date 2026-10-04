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

该接口与 `defineBusinessModule()` 相同，提供 `init`、`ready`、`reload`、`dispose` 和完整的 `FaithBusinessCoreScope`。简单玩法与高级模块可以同时注册，并通过 `provide()`、`use()`、`contribute()`、`collect()` 协作。
