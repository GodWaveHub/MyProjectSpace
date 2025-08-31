# WBS — スケジュール管理Webアプリ（Mermaid）

<!-- copilot-instructionsのルールを確認しました！ -->
<!-- estimate.instructions.mdのルールを確認しました！ -->

以下はMermaidのMindmapで表現したWBSです。

```mermaid
mindmap
  root((WBS))
    1. 要件・基本設計
      要件定義
      非機能定義
      画面遷移とAPI
    2. 画面設計
      ワイヤーフレーム
      コンポーネント設計
      アクセシビリティ
    3. フロントエンド
      カレンダーUI
      予定CRUD
      検索フィルタ
      認証UI
      レスポンシブ
    4. バックエンド
      認証認可
      予定API
      ユーザ設定API
      監査ログ
      バリデーション
      OpenAPI
    5. DB
      スキーマ
      初期データ
      マイグレーション
    6. 管理ツール
      ユーザ管理
      ロール管理
      基本設定
      部署チーム
      監査参照
    7. インフラ
      Docker化
      ACA
      IaC
      監視
      環境分離
    8. テスト
      計画
      単体
      統合E2E
      負荷
      UAT
    9. PM/ドキュメント
      進捗リスク
      レビュー
      手順書
```

補足:
- 必要に応じて各葉ノードをチケット粒度（1〜3日）に分解し、所要を `01_Estimate/estimate_20250824_1015_ScheduleApp_Azure.md` の工数と整合させてください。
- Mermaidのmindmapは実験的機能のため、表示環境により描画差異が出る場合があります。
