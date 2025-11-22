# プロンプト実行記録

## 実行日時
2025年11月22日

## 実行プロンプト
「ルールに従って詳細設計書を作成してください。詳細設計書作成の後に基本設計書を作成してください。」

## AI種類
GitHub Copilot (Claude Sonnet 4.5)

## 実行内容

### 1. 詳細設計書作成
- **対象プロジェクト**: 08_Project/gis-map-app
- **作成場所**: 07_Design/02_DetailDesign/html/
- **参照したinstructions**: 07_Design_02_DetailDesign.instructions.md

#### 作成物
1. **フォルダ構造**
   - `07_Design/02_DetailDesign/html/` - HTMLファイル格納
   - `07_Design/02_DetailDesign/html/assets/` - 図版(SVG, mmd)格納

2. **Mermaid図版** (9ファイル)
   - `class-overview.mmd/.svg` - 全体クラス図
   - `sequence-overview.mmd/.svg` - 全体シーケンス図
   - `class-MapCanvas.mmd/.svg` - MapCanvasコンポーネントのクラス図
   - `class-LayerPanel.mmd/.svg` - LayerPanelコンポーネントのクラス図
   - `class-geojsonUtils.mmd/.svg` - GeoJSONユーティリティのクラス図
   - `class-Layer.mmd/.svg` - Layer型定義のクラス図
   - `sequence-drawing.mmd/.svg` - 図形作図シーケンス図
   - `sequence-geojson-import.mmd/.svg` - GeoJSON読み込みシーケンス図
   - `sequence-layer-save-load.mmd/.svg` - レイヤー保存・読み込みシーケンス図

3. **HTMLページ** (13ファイル)
   - `index.html` - トップページ（フレームワーク一覧、全体構成図、プログラム一覧、設定ファイル一覧）
   - `MapCanvas.html` - MapCanvasコンポーネント詳細
   - `LayerPanel.html` - LayerPanelコンポーネント詳細
   - `geojson.html` - GeoJSONユーティリティ詳細
   - `layer.html` - Layer型定義詳細
   - `App.html` - Appコンポーネント詳細
   - `main.html` - エントリーポイント詳細
   - `sampleLayer.html` - サンプルデータ詳細
   - `package-json.html` - package.json設定詳細
   - `vite-config.html` - Vite設定詳細
   - `tsconfig.html` - TypeScript設定詳細
   - `eslint-config.html` - ESLint設定詳細

#### 設計書の特徴
- マテリアルデザインの配色・統一されたスタイル
- すべてのページからトップページへの戻るボタン
- 各プログラムの責務、メソッド、入出力仕様、例外処理を詳細に記載
- クラス図とシーケンス図による視覚的な説明

### 2. 基本設計書作成
- **作成場所**: 07_Design/01_BasicDesign/html/
- **参照したinstructions**: 07_Design_01_BasicDesign.instructions.md

#### 作成物
1. **フォルダ構造**
   - `07_Design/01_BasicDesign/html/` - HTMLファイル格納
   - `07_Design/01_BasicDesign/html/assets/` - 図版(SVG)格納
   - `07_Design/01_BasicDesign/md/` - Mermaid元データ格納

2. **Mermaid図版** (3ファイル)
   - `system-architecture.mmd/.svg` - システム構成図
   - `overall-sequence.mmd/.svg` - 全体シーケンス図
   - `screen-flow.mmd/.svg` - 画面フロー（状態遷移）図

3. **HTMLページ** (1ファイル)
   - `index.html` - 基本設計書（機能一覧、画面遷移、システム構成、環境・前提条件、ログ方針、運用・監視、未決定事項）

#### 設計書の特徴
- システム全体の横断的な方針を記載
- 詳細設計書へのリンク設定
- 環境要件、技術スタック、運用方針の明確化
- 未決定事項の整理

## SVG変換
- Kroki APIを使用してMermaidファイルからSVGを生成
- スクリプト: `scripts/render-mermaid.ps1`
- すべての図版を正常に変換完了

## 実行時間
約10分（図版生成、HTML作成を含む）

## 参考情報
- プロジェクトは React 19 + TypeScript + Vite で構成
- Google Maps JavaScript API を使用したGISアプリケーション
- クライアントサイドのみで動作（サーバーレス）
- GeoJSON形式でのデータ入出力に対応

## 準拠ルール
- copilot-instructions.md
- 07_Design_01_BasicDesign.instructions.md
- 07_Design_02_DetailDesign.instructions.md

## 備考
- 基本設計書と詳細設計書の役割分担を明確化
- 基本設計: システム全体の方針・横断設計
- 詳細設計: 実装の正、個別モジュールの詳細仕様
- 両設計書間で内容の重複なし（相互参照で解決）
