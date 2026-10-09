<div align="center">
  <h1>CoCoFaith Business</h1>

  <p><strong>CoCoFaith v3 的业务与玩法服务</strong></p>

  <p>
    <img alt="Koishi" src="https://img.shields.io/badge/Koishi-4.16%2B-60a5fa?style=flat-square">
    <img alt="Version" src="https://img.shields.io/badge/version-3.0.0--alpha.4-a78bfa?style=flat-square">
    <img alt="License" src="https://img.shields.io/badge/License-GPL--3.0-52b788?style=flat-square">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white">
  </p>
</div>

---

CoCoFaith v3 的玩法插件，包含信仰、祈祷、背包、称号、图鉴、俱乐部、恶魔轮盘和神性容器。

## 安装

在 Koishi 项目目录执行：

```sh
npm install @mueo/koishi-plugin-cocofaith-core@alpha @mueo/koishi-plugin-cocofaith-business@alpha
```

启用数据库后添加 `@mueo/cocofaith-core` 和 `@mueo/cocofaith-business`，
再添加对应平台的 CoCoFaith Adapter。Business 依赖 `faithCore` 服务，也支持兼容
Core API 3.0 的自定义实现。

## 常用命令

| 玩法 | 命令示例 |
| --- | --- |
| 信仰 | `信仰 信息`、`信仰 注册 [信仰名]`、`信仰 弃誓 [信仰名]` |
| 职业 | `信仰 职业 [职业名]`、`信仰 变更职业 [职业名]` |
| 背包 | `信仰 打开 [物品名]`、`信仰 卖出 [物品名] [数量/全部]`、`信仰 卖出等级 [等级]` |
| 祈求 | `虚空祈求 [次数]`、`虚空祈求 次数`、`捡垃圾`；每日祈祷使用所属信仰的祷词 |
| 称号 | `称号 列表`、`称号 详情 [称号名]`、`称号 使用 [称号名]` |
| 图鉴 | `图鉴 查看`、`图鉴 详情 [页码]`、`图鉴 限定详情 [页码]` |
| 俱乐部 | `俱乐部 加入`、`俱乐部 救济`、`俱乐部 贡献 [金币/登神分] [数值]`、`俱乐部 信息` |
| 轮盘 | `恶魔轮盘 发起`、`恶魔轮盘 发起赌徒`、`恶魔轮盘 发起疯狂`、`恶魔轮盘 加入`、`恶魔轮盘 开始` |
| 容器 | `容器 查看`、`容器 投入 [轮盘赌荣誉/神性碎片] [数量]`、`容器 觐献 [次数]` |
| 晋升 | `容器 从神 [神名]`、`容器 真神 [神名] [命途] [SP 道具名]` |
| 身份 | `椰子水 用户信息`，跨平台绑定步骤见 OneBot Adapter README |
| 版本 | `关于椰子水` |

管理命令位于 `信仰管理` 下，仅创造者可用。创造者身份在 Adapter 中配置。

## 配置

Koishi 配置界面提供各玩法的启停、数值和取值范围。
常用配置包括 `faith`、`voidPrayer`、`dailyPrayer`、`junk`、`binding`、`club` 和 `roulette`；
额外模块通过 `modules` 配置。

## 开发

普通玩法使用 SDK 的 `defineGameplay()`，需要独立业务表、多玩家事务或房间时使用
`defineAdvancedGameplay()`。玩法通过公开接口和贡献点协作。

- [玩法开发](./docs/gameplay.md)
- [Core API](./docs/core-api.md)
- [游戏房间](./docs/game-rooms.md)
- [图鉴](./docs/collection.md)

版本记录见 [CHANGELOG.md](./CHANGELOG.md)。许可证：GPL-3.0-or-later。
