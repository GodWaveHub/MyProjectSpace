# 2025-08-16 15:12 MCP SDK import修正ログ

- 実行者: GitHub Copilot (エージェント)
- 目的: myapisample-mcp のサーバ起動時エラー(TypeError: requestSchema.shape.method)の修正
- 対象: `mcp/myapisample-mcp/image/server.js`
- 変更概要:
  - MCP SDKのインポートを `@modelcontextprotocol/sdk/server/index.js` -> `@modelcontextprotocol/sdk/server`
  - `@modelcontextprotocol/sdk/server/stdio.js` -> `@modelcontextprotocol/sdk/server/stdio`
  - `@modelcontextprotocol/sdk/types.js` -> `@modelcontextprotocol/sdk/types`
- 原因推定: SDK v0.5 のexportsマップにより拡張子付きのサブパスは解決されず、Schemaがundefinedとなっていたため。
- 期待効果: `Server.setRequestHandler` に正しいSchemaが渡り、初期化時のTypeErrorが解消。
- AIの種類: GitHub Copilot (VS Code)
- 参考: Node.js v20 / SDK v0.5.0
- 実行にかかった時間: ~3分

