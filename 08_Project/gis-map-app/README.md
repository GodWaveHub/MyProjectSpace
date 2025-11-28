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

## Firebase構築メモ
### GoogleCloudのプロジェクトにFirebaseプロジェクトを紐づけ
 - 名前：My Project
 - ID：skilful-voltage-171914
  
### Firebase CLIのインストール
` npm install -g firebase-tools `

` firebase login `

```
? Enable Gemini in Firebase features? (Y/n)n
? Allow Firebase to collect CLI and Emulator Suite usage and error reporting information? (Y/n)n
Woohoo!
Firebase CLI Login Successful
You are logged in to the Firebase Command-Line interface. You can immediately close this window and continue using the CLI.

### Firebase 初期化
` cd C:\kanba\ai\projects\MyProjectSpaceCopy\08_Project\gis-map-app `

` firebase init `

PS C:\kanba\ai\projects\MyProjectSpaceCopy\08_Project\gis-map-app> firebase init 

     ######## #### ########  ######## ########     ###     ######  ########
     ##        ##  ##     ## ##       ##     ##  ##   ##  ##       ##
     ######    ##  ########  ######   ########  #########  ######  ######
     ##        ##  ##    ##  ##       ##     ## ##     ##       ## ##
     ##       #### ##     ## ######## ########  ##     ##  ######  ########

You're about to initialize a Firebase project in this directory:

  C:\kanba\ai\projects\MyProjectSpaceCopy\08_Project\gis-map-app

Before we get started, keep in mind:

  * You are currently outside your home directory

✔ Are you ready to proceed? Yes
✔ Which Firebase features do you want to set up for this directory? Press Space to select features, then Enter to      
confirm your choices. Hosting: Set up deployments for static web apps

=== Project Setup

First, let's associate this project directory with a Firebase project. 
You can create multiple project aliases by running firebase use --add, 

✔ Please select an option: Use an existing project
✔ Select a default Firebase project for this directory: skilful-voltage-171914 (My Project)

=== Hosting Setup

Your public directory is the folder (relative to your project directory) that
will contain Hosting assets to be uploaded with firebase deploy. If you      
have a build process for your assets, use your build's output directory.

✔ What do you want to use as your public directory? dist
✔ Configure as a single-page app (rewrite all urls to /index.html)? Yes
✔ Set up automatic builds and deploys with GitHub? No
✔ File dist/index.html already exists. Overwrite? No
i  Skipping write of dist/index.html

+  Wrote configuration info to firebase.json
+  Wrote project information to .firebaserc

+  Firebase initialization complete!
```
### Firebase hostingにデプロイ
` firebase deploy `

```
=== Deploying to 'skilful-voltage-171914'...

i  deploying hosting
i  hosting[skilful-voltage-171914]: beginning deploy...
i  hosting[skilful-voltage-171914]: found 4 files in dist
+  hosting[skilful-voltage-171914]: file upload complete
i  hosting[skilful-voltage-171914]: finalizing version...
+  hosting[skilful-voltage-171914]: version finalized
i  hosting[skilful-voltage-171914]: releasing new version...
+  hosting[skilful-voltage-171914]: release complete

+  Deploy complete!

Project Console: https://console.firebase.google.com/project/skilful-voltage-171914/overview
Hosting URL: https://skilful-voltage-171914.web.app

```

### 非公開とするとき①
` firebase hosting:disable `

` firebase deploy --only hosting `

### 非公開とするとき②
` firebase deploy --only hosting --public maintenance `

` firebase deploy --only hosting `

### Firebase Authenticationを導入
#### Firebase コンソールで認証をONとしてgoogle 認証を有効化
 - Firebaseコンソール > Authentication > サインイン方法 > Google を有効化
#### Firebase コンソールでWebアプリを登録
 - Firebaseコンソール > プロジェクトの概要 > アプリを追加 > Webアプリを選択
 - 登録後に表示されるFirebase SDKの設定情報を.env.localに追記
#### Firebase SDKのインストール
` npm install firebase `
実装をcopilotに依頼して実装を進める

