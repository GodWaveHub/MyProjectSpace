# サンプルスケジュール（Mermaid Gantt）— スケジュール管理Webアプリ

<!-- copilot-instructionsのルールを確認しました！ -->
<!-- estimate.instructions.mdのルールを確認しました！ -->

```mermaid
gantt
    title Schedule App — Sample Schedule
    dateFormat  YYYY-MM-DD
    excludes    weekends

    section 要件/設計
    要件・基本設計まとめ :r1, 2025-09-01, 15d
    画面設計/UX          :ux, 2025-09-08, 10d

    section 実装/基盤
    インフラ/IaC/CI      :infra, 2025-09-08, 15d
    フロント実装         :fe, after r1, 40d
    バックエンド/API     :be, after r1, 40d
    DB設計/移行          :db, after r1, 12d

    section 管理者GUI
    管理者GUI開発        :admin, after be, 15d

    section テスト/リリース
    統合テスト           :int, after fe be, 15d
    E2E/UAT              :e2e, after int, 10d
    リリース準備         :relprep, after e2e, 5d
    本番リリース         :milestone, rel, after relprep, 0d
```

補足:
- 週末除外設定により、所要日数は営業日ベースで計算されます。
- 実カレンダーに合わせて祝日などを `excludes` に追加してください。
