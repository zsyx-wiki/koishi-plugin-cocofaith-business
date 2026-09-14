# CoCoFaith 玩法开发

CoCoFaith 提供两层玩法 API：

- `defineGameplay()` 面向普通玩法，自动处理玩家校验、事务、模块状态、配置、幂等和响应转换。
- `defineAdvancedGameplay()` 面向房间、跨业务接口、自定义生命周期等复杂玩法；它与原来的 `defineBusinessModule()` 完全相同。

现有模块不需要迁移，三种写法可以同时注册。

## 最小玩法

一个简单玩法只需要一个文件和一处注册：

```ts
import {
  defineGameplay,
  defineGameplayConfig,
  fail,
  gameplayInteger,
} from "@mueo/koishi-plugin-cocofaith-business"

const config = defineGameplayConfig({
  rewardGold: gameplayInteger(50, {
    min: 0,
    max: 1_000_000,
    description: "每日摸鱼金币奖励。",
  }),
})

export const dailyFish = defineGameplay({
  name: "daily_fish",
  dependencies: ["faith"],
  config,

  commands: [{
    id: "play",
    triggers: ["摸鱼", "每日摸鱼"],
    scenes: ["group"],
    atomic: "user",

    async run({ state, economy, config }) {
      if (state.data.date === state.gameDay) {
        fail("LIMIT_REACHED", "今天已经摸过鱼了。")
      }

      const reward = await economy.reward({
        gold: config.rewardGold,
      })
      state.data.date = state.gameDay

      return `摸鱼成功，获得 ${reward.applied.gold ?? 0} 金币。`
    },
  }],
})
```

把模块加入 `src/modules/index.ts` 返回的数组即可。注册函数会遍历数组，不需要再维护第二份解构列表。

## 框架自动完成的工作

普通命令默认只接受已注册玩家，`run()` 中的 `uid` 恒为 `number`。只有公开命令需要显式设置：

```ts
guest: true
```

`atomic: "user"` 会自动：

1. 按 UID 串行执行；
2. 打开 Core 数据库事务；
3. 加载当前玩法的私有和公开状态；
4. 根据模块名和命令 ID 生成审计来源；
5. 根据平台事件 ID 生成幂等键；
6. 在成功返回后保存状态；
7. 在异常时回滚状态、物品和资产。

原子命令上下文中的常用字段：

```ts
uid                 // 已注册玩家 UID
args                // 命令参数
event               // 平台无关事件
config              // 已校验且只读的配置
state.data          // 当前玩法的私有状态
state.publicData    // 当前玩法的公开状态
state.gameDay       // Core 计算的游戏日
economy             // 付款、固定入账、带加成奖励
items               // 当前玩家背包事务接口
user                // 当前玩家公共数据事务接口
tx                   // 完整高级事务作用域
```

玩法可以直接返回字符串。图片、混合消息和静默响应使用 `image()`、`mixed()` 和 `silent()`。不要在玩法中生成 CQ Code、QQ Markdown 或调用平台发送接口。

## 配置

`defineGameplayConfig()` 是配置的单一声明源，同时产生：

- TypeScript 推导类型；
- 默认值；
- 运行时校验；
- 可供 Koishi 配置界面复用的 Schema。

支持的基础字段构造器：

```ts
gameplayInteger()
gameplayNumber()
gameplayBoolean()
gameplayString()
```

普通扩展模块可以直接通过 Business 的通用 `modules` 配置覆盖：

```yaml
modules:
  daily_fish:
    enabled: true
    config:
      rewardGold: 80
```

## setup 与 reload

需要一个服务对象时，只定义一次 `setup()`：

```ts
export const example = defineGameplay({
  name: "example",
  config,

  setup({ core, config }) {
    return new ExampleService(core, config)
  },

  commands: [{
    id: "run",
    triggers: ["示例"],
    async run({ service }) {
      return service.run()
    },
  }],
})
```

首次启动和配置 reload 都会重新执行 `setup()`，不需要重复编写 `init()` 和 `reload()`。

## 复杂玩法与兼容接口

下列情况使用高级 API：

- 自定义 `init / ready / reload / dispose`；
- 多 UID 原子事务；
- 注册独立业务表；
- 游戏房间和定时器；
- 向其他业务提供版本化接口；
- 贡献点或复杂 Hook 生命周期。

```ts
import { defineAdvancedGameplay } from "@mueo/koishi-plugin-cocofaith-business"

export const roomGame = defineAdvancedGameplay({
  name: "room_game",
  dependencies: ["rooms"],
  init(context) {
    // 与原 defineBusinessModule() 完全一致
  },
  commands: [],
})
```

`defineBusinessModule()`、`FaithBusinessModule`、`BusinessCommand`、`BusinessModuleContext` 和现有 `FaithBusinessCoreScope` 均继续保留。旧模块无需修改，新旧模块也可以互相通过 `provide()`、`use()`、`contribute()` 和 `collect()` 协作。

## 代码放置原则

- 一百行左右、单一状态、少量命令：一个 `index.ts` 即可。
- 规则逐渐复杂后，再拆出 `service.ts`、`types.ts` 和数据文件。
- 多人房间、跨模块协作或特殊生命周期：使用高级 API。
- 平台身份和消息格式永远放在 Adapter，不放在玩法模块。
