# GeoMation MCP サーバー スキーマハンドラー修正

## 実行日時
2025年8月16日 15:28

## プロンプト
GeoMationApiSample MCP サーバーのスキーマエラー修正依頼

## エラー内容
```
TypeError: Cannot read properties of undefined (reading 'method')
    at Server.setRequestHandler (file:///app/node_modules/@modelcontextprotocol/sdk/dist/shared/protocol.js:249:44)
```

## 修正内容

### 1. スキーマのインポート追加
```javascript
import { 
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListToolsRequestSchema,
  CallToolRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
```

### 2. ハンドラー設定の修正
- `'resources/list'` → `ListResourcesRequestSchema`
- `'resources/read'` → `ReadResourceRequestSchema` 
- `'tools/list'` → `ListToolsRequestSchema`
- `'tools/call'` → `CallToolRequestSchema`

## 原因
MCP SDK 0.5.0 では、`setRequestHandler` の第一引数に文字列ではなく、適切なスキーマオブジェクトを渡す必要がある。

## 結果
GeoMationApiSample MCP サーバーがMCP SDK 0.5.0 に対応し、正常動作するように修正。

## AI情報
- 使用AI: GitHub Copilot
- 実行時間: 約3分
- 参照ファイル: server.js, package.json
