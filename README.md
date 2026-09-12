<div align="center">
  <h1>CoCoFaith Business</h1>

  <p><strong>CoCoFaith v3 的业务与玩法服务</strong></p>

  <p>
    <img alt="Koishi" src="https://img.shields.io/badge/Koishi-4.16%2B-60a5fa?style=flat-square">
    <img alt="Version" src="https://img.shields.io/badge/version-3.0.0--alpha.2-a78bfa?style=flat-square">
    <img alt="License" src="https://img.shields.io/badge/license-GPL--3.0-52b788?style=flat-square">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white">
  </p>
</div>

---

CoCoFaith Business 是 CoCoFaith v3 的玩法插件，负责命令路由、业务规则和结构化响应。它通过 `faithCore` 使用公共数据与事务能力，不直接处理 OneBot、QQ 官方机器人等平台事件。

插件强依赖 CoCoFaith Core。平台消息需要通过对应 Adapter 接入。

## 内置玩法

- 信仰注册、信息、弃誓和职业管理
- 每日祈祷、虚空祈求、捡垃圾与物品开启
- 背包物品出售
- 称号、称号加成与收藏图鉴
- 椰汁俱乐部、会员等级、贡献池、救济与分成
- 普通、赌徒和疯狂模式恶魔轮盘
- 创造者数值、称号和图鉴管理

图鉴记录玩家曾经获得的物品。物品出售或消耗后不会从图鉴中移除，常规收藏与限定收藏分别统计。

## 安装

```bash
npm install @mueo/koishi-plugin-cocofaith-core
npm install @mueo/koishi-plugin-cocofaith-business
```

插件加载顺序：

```text
CoCoFaith Core
→ CoCoFaith Business
→ CoCoFaith Adapter
```

Business 启动时会检查 `faithCore` 服务。未加载 Core 时不会注册玩法。

## 常用命令

```text
信仰 信息
信仰 注册 [信仰名]
信仰 弃誓 [目标信仰]
信仰 职业 [职业名]
信仰 变更职业 [职业名]

信仰 打开 [物品名]
信仰 卖出 [物品名] [数量/全部]
信仰 卖出等级 [等级]
信仰 强制卖出等级 [等级]

虚空祈求 [次数]
虚空祈求 次数
捡垃圾

称号
称号 列表
称号 详情 [称号名]
称号 使用 [称号名]

图鉴 查看
图鉴 详情 [页码]
图鉴 限定详情 [页码]

俱乐部 加入
俱乐部 退出
俱乐部 救济
俱乐部 贡献 [金币|登神分] [数值]
俱乐部 信息

椰子水 申请绑定
椰子水 申请绑定 [TokenA]
椰子水 确认绑定 [TokenB]
椰子水 用户信息

关于椰子水
```

每日祈祷使用各信仰对应的祷词，不设置统一的“每日祈祷”命令。

### 平台身份绑定

UID 由 QQ 官方机器人注册产生，OneBot 不创建 UID。绑定流程只会把 OneBot QQ 添加到已有 UID，不迁移旧数据，也不会合并两个已有 UID。

1. OneBot 私聊发送 `椰子水 申请绑定`，取得 Token A。
2. 已注册用户在 QQ 官方机器人群聊发送 `椰子水 申请绑定 [TokenA]`。
3. Token B 会发往第一步的 OneBot 私聊。
4. 创建 Token A 的同一 OneBot QQ 私聊发送 `椰子水 确认绑定 [TokenB]`。

令牌默认有效 300 秒。领取 Token A 的 QQ 官方群身份必须已有 UID，最终确认必须来自创建 Token A 的同一 OneBot QQ。

### 恶魔轮盘

```text
恶魔轮盘 发起
恶魔轮盘 发起赌徒
恶魔轮盘 发起疯狂
恶魔轮盘 加入 / 退出
恶魔轮盘 开始 / 结束
恶魔轮盘 开枪 / 恐惧 / 无畏 / 退缩
恶魔轮盘 对局 / 状态
恶魔轮盘 强制结束
```

同一群聊同时只能存在一个游戏房间。房主负责开始和解散等待中的房间，进行中的房间只能由创造者强制结束。

房间、门票、资产和战绩通过 Core 原子事务提交。平台发送失败不会暂停或回滚已经完成的游戏行动。

## 创造者命令

`信仰管理` 下的命令默认仅创造者可用。非创造者调用时不会回复。

```text
信仰管理 数值 [数值名] [qq|uid] [目标] [变化值]
信仰管理 数值 全体 [数值名] [变化值]

信仰管理 称号 [uid] 给予 [称号名]
信仰管理 称号 [uid] 收回 [称号名]

信仰管理 图鉴 刷新 [uid]
信仰管理 图鉴 全量刷新

信仰管理 俱乐部 分成
信仰管理 俱乐部 总贡献 [+/-数值]
信仰管理 俱乐部 总贡献 [金币|登神分] [+/-数值]
```

`俱乐部缴费次数`、`俱乐部金币贡献`、`俱乐部登神贡献` 已注册到 `信仰管理 数值`。这些管理项只修正会员累计数据，不会同步改动贡献池。

不指定货币时，`信仰管理 俱乐部 总贡献 [+/-数值]` 会同时调整贡献池中的金币和登神分；需要单独调整时应带上货币名称。

同一游戏日最多收取一次会费。殿堂椰汁永久保留身份、收益加成和分成资格；退出只停止每日会费，重新加入后恢复缴费。

创造者身份由平台 Adapter 配置，不在 Business 中填写平台账号。

## 配置

配置定义位于根目录 [`config.ts`](./config.ts)。

| 配置 | 默认值 | 说明 |
| --- | ---: | --- |
| `faith.enabled` | `true` | 启用信仰基础业务 |
| `voidPrayer.enabled` | `true` | 启用虚空祈求 |
| `dailyPrayer.enabled` | `true` | 启用每日祈祷 |
| `junk.enabled` | `true` | 启用捡垃圾 |
| `roulette.enabled` | `true` | 启用恶魔轮盘 |
| `binding.enabled` | `true` | 启用 OneBot QQ 身份绑定 |
| `club.enabled` | `true` | 启用椰汁俱乐部 |
| `club.config.firstGoldFee` | `2000` | 首次入会金币会费 |
| `club.config.firstAscensionFee` | `200` | 首次入会登神分会费 |
| `club.config.dailyGoldFee` | `200` | 每日金币会费 |
| `club.config.dailyAscensionFee` | `20` | 每日登神分会费 |
| `binding.config.tokenTtlSeconds` | `300` | 绑定令牌有效时间 |
| `binding.config.maxPending` | `1000` | 内存中待确认申请数量上限 |
| `roulette.config.turnSeconds` | `45` | 每名玩家的操作时限 |
| `roulette.config.entryFee` | `100` | 疯狂模式基础门票 |
| `modules` | `{}` | 额外业务模块的启停和配置 |

各玩法的数值范围和默认值会显示在 Koishi 配置界面中。

## 开发

源码按框架和玩法分开：

```text
src/
├── framework/    # 生命周期、依赖、命令路由和通用协议
├── modules/      # 内置玩法
├── shared/       # 无状态的公共工具
└── index.ts      # 插件入口与公共导出
```

新增普通玩法时，只需在 `src/modules` 中注册业务模块。玩法返回统一的 `BusinessResult`，不应生成 CQ Code、QQ Markdown 或调用平台发送接口。

跨业务访问通过公开接口和贡献点完成。业务不能直接查询其他业务的数据表。

需要同时修改数值、背包或业务数据时，应使用 Business Scope 提供的原子事务：

```ts
await core.transaction.run(uid, async (tx) => {
  await tx.economy.pay({ gold: 100 })
  await tx.items.give('reward_item', 1)

  const data = await tx.data.get()
  await tx.data.set({
    private: {
      ...data.private,
      purchaseCount: Number(data.private.purchaseCount ?? 0) + 1,
    },
  })
}, {
  source: 'shop.purchase',
  idempotencyKey: `shop:${eventId}`,
})
```

游戏房间扩展见 [游戏房间开发说明](./docs/game-rooms.md)，图鉴规则见 [图鉴说明](./docs/collection.md)。

```bash
npm run build
npm test
```

数据结构和公共接口仍可能在正式版前调整，生产环境升级前请先备份数据库。

版本记录见 [CHANGELOG.md](./CHANGELOG.md)。项目采用 GPL-3.0-or-later 许可证。
