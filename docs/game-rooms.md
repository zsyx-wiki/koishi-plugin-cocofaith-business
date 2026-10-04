# 游戏房间

`rooms` 为群聊玩法提供房间占用、持久化、计时和多玩家事务。它属于 Business，不是 Core 的通用能力。

## 注册玩法

模块声明 `rooms` 依赖后注册 `RoomGame`：

```ts
const rooms = context.use<GameRoomsApi>("rooms")
context.core.lifecycle.track(rooms.register(game))
```

| 方法 | 职责 |
| --- | --- |
| `start` | 初始化状态和成员门票 |
| `action` | 处理玩家动作 |
| `timeout` | 处理回合超时 |
| `finish` | 结算或退款 |
| `render` | 将状态转换为 `BusinessResult` |
| `afterCommit` | 发送附加通知或调用跨业务奖励 |
| `announcement` | 生成可选的全服公告 |

每个 `roomKey` 同时只能存在一个等待中或进行中的房间。不同玩法共用这项限制。

## 事务边界

`start`、`action`、`timeout`、`finish` 在房间事务中运行。多玩家资产通过传入的事务作用域修改：

```ts
const player = tx.player(uid)
await player.economy.pay({ gold: 100 })
await player.user.change({ audience_score: 10 })
```

事务内部不得发送消息、创建计时器、访问其他业务表或启动嵌套经济事务。`render` 只能读取状态。跨业务调用放在 `afterCommit`，并自行处理幂等。

门票在开局事务中统一扣除；任一成员扣款失败会回滚整局开场。中止退款规则由玩法实现，房间服务不会再次补退款。

## 消息通道

Adapter 在 `BusinessEvent` 中提供：

| 字段 | 用途 |
| --- | --- |
| `roomKey` | 平台作用域内稳定的群标识 |
| `eventId` | 动作幂等标识 |
| `reply` | 绑定原群的后续回复函数 |

房间只向 `reply` 传递 `BusinessResult`，不持有平台 Session。回复函数不写入数据库；重启后，房间在收到新的玩家消息时恢复回复通道。

发送失败不影响事务，也不停止计时。QQ Adapter 仍受被动回复时间和次数限制；OneBot 按普通群消息发送。

## 持久化

`faith_business_rooms` 保存当前房间快照和玩法战绩。快照包含版本、截止时间、成员、门票、罚款、幂等标识和玩法状态。

每群只保留最近一局，新房间会覆盖已结束快照。回复函数、Session 和平台凭证不持久化。玩法禁用时保留房间数据，重新启用后恢复计时。

## 轮盘扩展

依赖 `roulette` 后，可以注册命途、场地和规则 Hook：

```ts
const roulette = context.use<RouletteGameplayApi>("roulette")

context.core.lifecycle.track(roulette.registerField({
  id: "example_field",
  name: "测试场地",
  modes: ["gambler", "crazy"],
  hooks: {
    beforeShot(context) {
      context.messages.push("测试场地生效。")
    },
  },
}))
```

规则回调只做同步内存计算。数据库操作和消息发送留在外层。保护效果通过 `protections` 注册，统一按普通护盾、免死来源、场地兜底护盾的顺序结算；不要在伤害 Hook 中重复实现保护逻辑。
