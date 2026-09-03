# 游戏房间

## 边界

`rooms` 是 Business 的共享房间业务，不是 Core 的通用游戏引擎。玩法声明依赖后调用：

```ts
const rooms = ctx.use<GameRoomsApi>("rooms")
const registration = rooms.register(game)
// 模块 dispose 时 await registration.dispose()
```

`GameRoomsApi` 提供 `register`、`create`、`command`、`progress`。每个群只能有一个等待中或进行中的房间，不同游戏共用这项限制。OneBot 的群作用域不包含机器人 ID；QQ 的群标识随 AppID 不同，因此包含机器人作用域。

游戏实现 `RoomGame<State>`：

| 方法 | 职责 |
| --- | --- |
| start | 初始化玩法状态、确定成员门票；房间服务统一扣费 |
| action | 处理玩家动作，修改本次事务内的状态副本 |
| timeout | 时间到后的动作；不得依赖消息是否发送成功 |
| finish | 结算或中止退款，在同一事务内完成 |
| render | 将当前状态转为 BusinessResult；不得修改状态 |
| afterCommit | 提交后的附加通知、跨业务奖励；不能重做资产结算 |
| announcement | 可选全服公告；仅在房间首次结束后读取，查询对局不会重新广播 |

动作可修改 state、deadline、status、log；start 可以填写 members 的 ticket。不要在事务内发消息、创建计时器、访问其他业务表或启动嵌套经济事务。使用传入的 `tx.player(uid).economy`、`user` 操作参赛者资产，通过 `progress/saveProgress` 维护该游戏的战绩。

门票在 start 成功后统一支付，任意失败整笔回滚。游戏自行决定中止时的退费规则；轮盘按照各成员 ticket 和 penalty 记录全额返还。房间服务不会额外重复退款。

## 消息

Adapter 在 BusinessEvent 中提供：

- roomKey：平台作用域内稳定的群标识，不从用户命令提取。
- eventId：用于动作去重的真实事件或消息 ID。
- reply：绑定原群的后续回复通道，不暴露 Session 或 QQ 凭证。

业务只交给 reply 一个普通 BusinessResult。OneBot 正常发送；QQ 共用原始消息的五次回复计数，超过五分钟或次数耗尽直接丢弃。轮盘从不设置 proactive-required。其他业务确实要求主动消息时，可设置该标记，但 Adapter 的开关仍有最终决定权。

计时任务和玩家命令共用房间队列、数据库版本检查和事务。失效定时任务不会操作新回合。发送失败不重试玩法，也不停止计时。回复通道不持久化；重启后游戏继续计时，收到参赛者的新命令后重新获得回复通道。

普通升级和满级奖励写在结算正文中，使用触发结束的命令回复通道；超时结束使用房间最后保存的参赛者回复通道。满级额外产生 `broadcast: { id, content }`，OneBot 向已登记、未设置禁止广播的 OneBot 群发送公告，跳过已有结算正文的当前群。QQ 忽略广播字段，只发本群正文，凭证失效仍直接丢弃。公告是提交后的尽力通知，不持久化补发，也不因发送失败重新结算。

`faith_business_rooms` 保存每群房间快照（含版本、截止时间、门票、罚款、动作去重标识和玩法状态），也保存各玩法的 UID 战绩。行动与资产变动在同一事务提交。每群只保留最近一局快照，新开局会覆盖已结束的快照；这不是完整对局历史。回复回调、Session 和 QQ 凭证均不入库。

数据库故障、缺失玩法扩展等内部错误不能强行跳过：记录错误并重试。禁用玩法会卸载其计时器但保留房间，重新启用后恢复；不是把已收门票的房间静默删除。

## 轮盘规则扩展

依赖 `roulette` 后从其 default 接口使用 `registerPath`、`registerField`、`registerHook`、`stats`。

```ts
roulette.registerField({
  id: "example_field",
  name: "测试场地",
  description: "仅用于说明接口。",
  modes: ["gambler", "crazy"],
  hooks: {
    beforeShot(context) {
      context.messages.push("测试场地生效。")
    },
  },
})
```

场地按 modes 自动加入候选池。只有 crazy 的场地加入疯狂专属候选池，包含 gambler 的场地加入普通场地候选池。命途按 name 匹配 Core 信仰的 path。

规则阶段：start、reload、beforeShot、bullet、empty、afterShot、death。场地先执行，命途随后执行，最后执行按 priority 排序的扩展 Hook。承伤阶段作用于实际目标，开枪前和行动后作用于行动者。死亡、重新装填等可能在一次动作中发生多次，不应假设每阶段只调用一次。

护盾、免死使用规则的 `protections` 注册，不要在 `bullet` Hook 内自行清零伤害。承伤 Hook 完成后统一结算保护：普通护盾 → 免死来源 → 场地兜底护盾。每个来源 ID 每次承伤只判一次概率，失败不消耗；成功后护盾按抵消伤害消耗层数，普通免死只消耗命中的一个来源并停止后续判定。场地设置 `savesAsShields: true` 时，各免死来源分别转为护盾。内置疯狂场地启用此选项，场地自带护盾排在这些来源之后。

保护来源需要提供 `id`、`kind`（shield/save）、`available`（层数）、`probability`（0～1）、`consume`（命中后消耗层数）。所有回调必须同步。场地兜底来源使用 `fallback: true`；相同 ID 视为同一来源，不能借重复注册增加判定次数。封锁和强制淘汰规则仍有效，不会因为引入保护接口被绕过。

疯狂模式全员死亡时不评定冠军、亚军，不发胜负奖金或胜负经验，仍记录参赛场次及已发生的罚款。

规则函数必须同步，只做内存计算；数据库和消息留在外层。抛出异常会回滚该次动作。注册时不允许覆盖现有规则，避免进行中的对局突然换规则；规则定义属于插件生命周期，扩展模块必须保持加载。自定义主动能力通过“恶魔轮盘 能力 能力名”调用。

轮盘满级保留货币、觐见分和恶魔赌徒称号奖励。容器业务尚未迁移，未直接调用旧服务。`business/roulette/settled` Hook 包含 roomId、participants、maxLevelUids，供其他业务按需接入，接入方应按 roomId 做幂等。称号发放失败可在用户查询“恶魔轮盘 状态”时补发。信仰战争已移除，不再接入。
