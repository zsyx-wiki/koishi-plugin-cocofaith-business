# Faith Business

Faith v3 的玩法层，强依赖 `faithCore`

## 内置玩法

- 信仰注册、信息、弃誓与职业
- 每日祈祷
- 虚空祈求与彩蛋
- 按物品或等级出售背包物品
- 创造者数值管理

```text
信仰 信息
信仰 注册 [信仰名]
信仰 弃誓 [目标信仰]
信仰 职业 [职业名]
信仰 变更职业 [职业名]
信仰 卖出 [物品名] [数量/全部]
信仰 卖出等级 [等级]
信仰 强制卖出等级 [等级]
虚空祈求 [次数]
虚空祈求 次数
```

每日祈祷使用各信仰自己的祷词，不占 QQ 指令面板位置。

## 配置

Koishi 配置定义集中在根目录 [`config.ts`](./config.ts)。`faith`、`voidPrayer` 和 `dailyPrayer` 可单独启停；其他模块使用 `modules.<name>` 配置。

## TODO

- 🏗️ 迁移v2玩法

...

版本变化见 [CHANGELOG.md](./CHANGELOG.md)。
