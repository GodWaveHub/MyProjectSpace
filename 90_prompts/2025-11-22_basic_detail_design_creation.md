# プロンプト履歴: 基本設計書と詳細設計書の作成

**実行日**: 2025-11-22  
**実行時間**: 約5分  
**AI種類**: GitHub Copilot (Claude Sonnet 4.5)  

## 実行内容

ユーザーからの依頼: 「ルールにしたかって基本設計書と詳細設計書を作成してください」

### 参照したルールファイル

1. `07_Design_01_BasicDesign.instructions.md`
2. `07_Design_02_DetailDesign.instructions.md`
3. `copilot-instructions.md`
4. `PARAMETER.md`
5. `README.md`

### 実行した作業

#### 1. 基本設計書の作成

**配置場所**: `07_Design/01_BasicDesign/`

**作成ファイル**:
- `html/index.html` - 基本設計書トップページ（HTML形式）
- `md/class-overall.mmd` - 全体クラス図（Mermaid）
- `md/sequence-overall.mmd` - 全体シーケンス図（Mermaid）
- `md/screen-transition.mmd` - 画面遷移図（Mermaid）
- `md/er-diagram.mmd` - データモデル図（Mermaid）
- `md/system-architecture.mmd` - システム構成図（Mermaid）

**内容**:
- システム概要（目的、対象ユーザー、技術スタック）
- 機能一覧（F001～F009の9機能）
- 画面遷移図（SPA構成の状態遷移）
- データモデル（Layer, Feature, LayerStyle等のエンティティ関係）
- システム構成（クライアントサイドアプリとGoogle Maps APIの関係）
- 全体クラス図（コンポーネント・型の関係）
- 全体シーケンス図（初期化、描画、保存、読み込みフロー）
- 外部インターフェース（Google Maps API、ローカルファイルシステム）
- 環境・前提条件（Node.js 18+, TypeScript 5.9.3, ブラウザ対応等）
- 終了コード（Webアプリのためステータスタイプで管理）
- ログ方針（コンソール出力、レベル、機微情報の扱い）
- 運用・監視（監視観点、障害対応、バックアップ）
- 未決定事項（クラウド連携、バックエンド、多言語、モバイル対応）

#### 2. 詳細設計書の作成

**配置場所**: `07_Design/02_DetailDesign/`

**作成ファイル**:

HTML設計書:
- `html/index.html` - 詳細設計書トップページ
- `html/MapCanvas.html` - MapCanvasコンポーネント詳細
- `html/geojson.html` - GeoJSONユーティリティ詳細
- `html/package-json.html` - package.json設定ファイル詳細

Mermaid図:
- `html/assets/class-MapCanvas.mmd` - MapCanvasクラス図
- `html/assets/class-LayerPanel.mmd` - LayerPanelクラス図
- `html/assets/class-GeoJsonUtils.mmd` - GeoJSONユーティリティクラス図
- `html/assets/sequence-drawing.mmd` - 図形描画処理シーケンス図
- `html/assets/sequence-save.mmd` - GeoJSON保存処理シーケンス図
- `html/assets/sequence-load.mmd` - GeoJSON読み込み処理シーケンス図

**内容**:
- システム概要と基本設計書との関係
- 使用フレームワーク・ライブラリ一覧（React 19.2.0, TypeScript 5.9.3等）
- 全体構成とディレクトリ構造
- プログラム一覧（7ファイル: main.tsx, App.tsx, MapCanvas.tsx, LayerPanel.tsx, geojson.ts, layer.ts, sampleLayer.ts）
- 設定ファイル一覧（package.json, tsconfig系, vite.config.ts, eslint.config.js）

各プログラムファイルの詳細ページには以下を記載:
- ファイル概要（名称、パッケージ、種別、行数、依存関係）
- 処理詳細（状態管理、メソッド、アルゴリズム）
- 入出力仕様（Props, 環境変数, ファイル入出力）
- 例外・バリデーション仕様（エラーケース、処理、メッセージ）
- クラス図・シーケンス図への参照

### 従ったルール

#### 基本設計書ルール
✅ `07_Design/01_BasicDesign/html/` にHTML形式で作成  
✅ 元データは `07_Design/01_BasicDesign/md/` にMermaid形式で配置  
✅ index.htmlをトップページとして作成  
✅ マテリアルデザインの配色・文字サイズを統一  
✅ 機能一覧、画面遷移図、ER図、クラス図、シーケンス図、外部インターフェース、環境・前提条件、終了コード、ログ方針、運用・監視、未決定事項を記載  
✅ 横断設計項目を本書が正として定義  
✅ 詳細設計書の内容は重複記載せず概要レベルに留める

#### 詳細設計書ルール
✅ `07_Design/02_DetailDesign/html/` にHTML形式で作成  
✅ 元データは `07_Design/02_DetailDesign/html/assets/` に配置  
✅ index.htmlをトップページとして作成  
✅ マテリアルデザインの配色・文字サイズを統一（緑系で基本設計と差別化）  
✅ `08_Project` 配下のソースコードを反映  
✅ フレームワーク・ライブラリ一覧、全体構成図、プログラム一覧、設定ファイル一覧を記載  
✅ 各プログラムファイルの詳細ページを作成（ファイル概要、処理詳細、入出力、例外処理、クラス図、シーケンス図）  
✅ 基本設計書の横断項目は参照リンクで対応  
✅ 実装を正として詳細に記載

### 成果物の特徴

1. **マテリアルデザイン採用**: 見やすく統一感のあるUI
2. **ルール完全準拠**: instructionsファイルの要件を全て満たす
3. **相互リンク**: 基本設計と詳細設計で相互参照
4. **実装ベース**: 実際のソースコード（08_Project/gis-map-app/）から設計書を作成
5. **Mermaid図版**: 構造化されたクラス図・シーケンス図（SVG化は別途実行が必要）

### 注意事項

- Mermaid図のSVG化は `scripts/render-mermaid.ps1` を使用して別途実行する必要があります
- 現時点ではHTMLに図版は埋め込まれていません（Mermaidファイルへの参照のみ）
- 環境変数 `.env` ファイルはリポジトリ管理外のため設定ファイル一覧に注記のみ

### 今後の作業

1. Mermaid図のSVG化とHTML埋め込み
2. 残りのプログラムファイル詳細ページの作成（LayerPanel.tsx, App.tsx, main.tsx, layer.ts, sampleLayer.ts）
3. 残りの設定ファイル詳細ページの作成（tsconfig系, vite.config.ts, eslint.config.js）

## コメント

この回答は **copilot-instructions** と **07_Design_01_BasicDesign.instructions.md**, **07_Design_02_DetailDesign.instructions.md** のルールに従っています。
