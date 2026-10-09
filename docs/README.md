# 开发文档

- [玩法开发](./gameplay.md)：简单玩法与高级模块的开发入口。
- [Core API](./core-api.md)：`faithCore` 服务协议和第三方实现要求。
- [游戏房间](./game-rooms.md)：多人房间、事务和规则扩展。
- [图鉴](./collection.md)：收录规则、奖励和一致性边界。

Core 契约从 `@mueo/cocofaith-sdk/core` 导入，简单玩法接口从 `@mueo/cocofaith-sdk/gameplay` 导入。Business 的 `framework/` 只维护模块运行时和高级玩法接口。
