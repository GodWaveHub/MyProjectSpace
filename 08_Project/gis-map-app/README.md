# PRJ Google Maps GIS Web App

React + TypeScript + Vite で構築した Google Maps ベースの GIS Web アプリです。Drawing Library で作成した図形を Data Layer へ自動追加し、GeoJSON 形式でローカル保存 / 読み込みできます。

## 主な機能

- Google Maps JavaScript API（Drawing/Data Layer）によるカスタムレイヤー描画
- マーカー / ポリライン / ポリゴン / 長方形 / 円を GeoJSON へ変換し Data Layer に登録
- GeoJSON ファイルのダウンロード（`map.data.toGeoJson`）とローカルファイル読み込み
- サンプルレイヤー（`src/data/sampleLayer.ts`）の再読み込みボタン
- ステータス表示と InfoWindow によるフィーチャの属性表示

## 事前準備

1. Google Maps JavaScript API key を取得済みであること
2. ルートで `npm` が利用可能な Node.js 環境（18 以上）

### 環境変数

`.env.example` を `.env` にコピーし、API キーを設定してください。

```bash
cp .env.example .env
```

`.env`:

```
VITE_GOOGLE_MAPS_API_KEY="<YOUR API KEY>"
```

## セットアップ

```bash
cd 08_Project/gis-map-app
npm install
```

開発サーバー起動:

```bash
npm run dev
```

静的ビルド:

```bash
npm run build
```

プレビュー:

```bash
npm run preview
```

## 操作ガイド

1. 「GeoJSON を読み込み」ボタンで既存データを追加（`.geojson` / `.json`）
2. Drawing コントロール（地図上部）で任意の図形を配置
3. 図形は Data Layer へ自動取り込み → InfoWindow で属性を確認
4. 「GeoJSON を保存」で現在のレイヤーをローカルにダウンロード
5. 「レイヤーをクリア」「サンプルを再読み込み」で状態をリセット

## ディレクトリ構成（抜粋）

- `src/components/MapCanvas.tsx` … Google Maps の描画とツールバー
- `src/utils/geojson.ts` … Drawing で作成した図形を GeoJSON へ変換
- `src/data/sampleLayer.ts` … 初期表示用のサンプル FeatureCollection

## ライセンス

社内利用を想定したテンプレートです。外部公開時は Google Maps Platform の利用規約を遵守してください。
