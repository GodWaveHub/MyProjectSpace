# MyProjectSpace

GitHub Copilotを活用したシステム開発プロジェクト管理ワークスペース

---

## 📋 プロジェクト概要

このリポジトリは、GitHub Copilotを活用してシステム開発プロジェクトを効率的に管理するためのワークスペースです。見積からWBS作成、スケジュール管理、課題管理、進捗管理、会議管理、設計、実装、テストまで、プロジェクト全体のライフサイクルを一元管理します。

---

## 🎯 主な特徴

- **AI駆動型プロジェクト管理**: GitHub CopilotとMCPを活用した効率的なドキュメント作成
- **体系的なフォルダ構成**: IPAの開発工程に準拠した明確な構造
- **統一されたフォーマット**: テンプレートによる一貫性のある成果物管理
- **パラメータ駆動**: PARAMETER.mdによる一元的な見積・工数管理
- **トレーサビリティ**: 見積→WBS→スケジュール→進捗の一貫した追跡

---

## 📂 フォルダ構成

```
MyProjectSpace/
├── 01_Estimate/          # 見積管理
├── 02_WBS/               # 作業分解構造
├── 03_Schedule/          # スケジュール管理
├── 04_Issues/            # 課題管理
├── 05_Progress/          # 進捗管理
├── 06_Meetings/          # 会議・議事録
├── 07_Design/            # 設計書
│   ├── 01_BasicDesign/   # 基本設計
│   ├── 02_DetailDesign/  # 詳細設計
│   └── 03_DatabaseDesign/# データベース設計
├── 08_Project/           # 実装（ソースコード）
├── 09_Test/              # テスト
│   ├── 01_UnitTest/      # 単体テスト
│   ├── 02_IntegrationTest/ # 結合テスト
│   └── 03_SystemTest/    # システムテスト
├── 80_formats/           # テンプレート
├── 90_prompts/           # プロンプト履歴
├── scripts/              # ユーティリティスクリプト
├── PARAMETER.md          # プロジェクトパラメータ定義
├── AGENTS.md             # エージェント利用ルール
└── README.md             # このファイル
```

---

## 🚀 はじめに

### 前提条件

- GitHub Copilot CLI がインストールされていること
- Git がインストールされていること
- プロジェクトに応じた開発環境（Node.js, Python, Java等）

### セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd MyProjectSpace
   ```

2. **PARAMETER.mdの確認・調整**
   - プロジェクトの特性に合わせてパラメータを調整してください
   - 人月単価、生産性、補正係数等を確認

3. **GitHub Copilotの設定確認**
   - `.github/copilot-instructions.md` が自動的に適用されます
   - カスタム指示に従って作業が行われます

---

## 📖 使い方

### 1. 見積作成（01_Estimate）

```bash
# GitHub Copilotに指示
"80_formats/estimate_template.mdを使って見積書を作成してください"
```

- テンプレート: `80_formats/estimate_template.md`
- 参照: `PARAMETER.md`（単価・生産性・係数）
- 出力先: `01_Estimate/`

### 2. WBS作成（02_WBS）

```bash
# GitHub Copilotに指示
"見積結果からWBSを作成してください"
```

- テンプレート: `80_formats/wbs_template.md`
- 参照: `.github/instructions/wbs_instructions.md`
- 出力先: `02_WBS/`

### 3. スケジュール作成（03_Schedule）

```bash
# GitHub Copilotに指示
"WBSからスケジュールを作成してください"
```

- 参照: `02_WBS/`のタスク定義
- 出力先: `03_Schedule/`

### 4. 設計書作成（07_Design）

#### 基本設計書

```bash
# GitHub Copilotに指示
"基本設計書を作成してください"
```

- 参照: `.github/instructions/basic_design_instructions.md`
- 出力先: `07_Design/01_BasicDesign/html/`
- 図版: Mermaid → SVG変換（`scripts/render-mermaid.ps1`）

#### 詳細設計書

```bash
# GitHub Copilotに指示
"詳細設計書を作成してください"
```

- 参照: `.github/instructions/detail_design_instructions.md`
- 出力先: `07_Design/02_DetailDesign/html/`

#### データベース設計書

```bash
# GitHub Copilotに指示
"テーブル定義書を作成してください"
```

- テンプレート: `80_formats/table_definition_format.md`, `80_formats/index_definition_format.md`
- 参照: `.github/instructions/table_definition_instructions.md`
- 出力先: `07_Design/03_DatabaseDesign/`

### 5. テスト成果物作成（09_Test）

```bash
# GitHub Copilotに指示
"単体テスト仕様書を作成してください"
```

- 出力先: `09_Test/01_UnitTest/`, `09_Test/02_IntegrationTest/`, `09_Test/03_SystemTest/`

---

## ⚙️ PARAMETER.mdの活用

`PARAMETER.md`は、プロジェクト全体で共通利用するパラメータを定義した中心的なファイルです。

### 主要パラメータ

| カテゴリ | 内容 |
|---------|------|
| **人月単価** | PM, PL, SE, PG, QAの単価設定 |
| **生産性** | 言語別の設計・実装・テスト生産性 |
| **FP係数** | ファンクションポイント法の係数 |
| **工程配分** | ウォーターフォール/アジャイルの工程配分比率 |
| **バッファ率** | スケジュール・工数バッファの標準値 |
| **品質目標** | 欠陥密度、テストカバレッジの目標値 |

### 参照方法

見積書やWBSでパラメータを使用する際は、必ず以下のように参照元を明記してください：

```markdown
**参照パラメータ**:
- 人日単価: `PARAMETER.md` 2.2節より引用（SE=35,000円/人日）
- 生産性: `PARAMETER.md` 3.1節より引用（Java: 50行/人日）
```

---

## 🛠️ ユーティリティスクリプト

### scripts/render-mermaid.ps1

Mermaid記法（.mmd）をSVG画像に変換するスクリプトです。

```powershell
# 使い方
.\scripts\render-mermaid.ps1 -InputPath "07_Design/01_BasicDesign/md/class-Main.mmd" -OutputPath "07_Design/01_BasicDesign/html/assets/class-Main.svg"
```

- Kroki APIを使用（Docker不要）
- 設計書の図版生成に利用

---

## 📝 GitHub Copilot活用のルール

### 基本ルール

1. **プロンプト保存**: 実行したプロンプトは`90_prompts/`に日付・概要入りのファイル名で保存
2. **フォーマット利用**: `80_formats/`のテンプレートを必ず使用
3. **PARAMETER.md参照**: 見積・工数計算時は必ず`PARAMETER.md`を参照
4. **MCP優先利用**: `GeoMationApiSample` MCPを優先的に活用

### 指示ファイルの参照

- `.github/copilot-instructions.md`: 全体共通ルール
- `.github/instructions/*.md`: 工程別の詳細ルール

---

## 📊 進捗管理

### 定期レビュー

- **週次**: 進捗報告書を`05_Progress/`に作成
- **月次**: 月次レポートと実績分析
- **課題**: `04_Issues/`で課題を管理

### WBSとの連携

- WBSのタスクIDと進捗を紐付け
- 見積との差異分析を実施

---

## 🔒 セキュリティとプライバシー

- **機密情報の管理**: コミット前に機密情報を削除
- **著作権**: 著作権侵害となるコード・コンテンツの出力は禁止
- **AIの利用**: 不適切・差別的な内容の生成は禁止

---

## 🤝 貢献

プロジェクトメンバーは以下のルールに従ってください：

1. **ブランチ戦略**: 機能ごとにブランチを作成
2. **コミットメッセージ**: 変更内容を明確に記載
3. **レビュー**: 重要な変更はレビューを実施

---

## 📚 参考資料

- [GitHub Copilot CLI ドキュメント](https://docs.github.com/en/copilot)
- [IPA 共通フレーム2013（SLCP-JCF2013）](https://www.ipa.go.jp/)
- [ファンクションポイント法（IFPUG）](https://www.ifpug.org/)

---

## 📞 問い合わせ

- **プロジェクト管理**: プロジェクトマネージャー
- **技術的問題**: テクニカルリード
- **ツール・環境**: システム管理者

---

## 📄 ライセンス

このプロジェクトのライセンスは、組織のポリシーに従います。

---

## 📝 変更履歴

| バージョン | 日付 | 変更者 | 変更内容 |
|-----------|------|--------|---------|
| v1.0 | 2025-11-15 | AI | 初版作成 |

---

**この回答はcopilot-instructionsのルールに従っています。**
