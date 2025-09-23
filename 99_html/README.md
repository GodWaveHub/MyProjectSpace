# 99_html スタイル利用ガイド

このフォルダには、MarkdownをHTML化した成果物で使う最小限のスタイルを配置しています。

- assets/css/style.css … 画面表示用のベーススタイル（余計な余白・多色・アイコンを避け、穏やかな配色）
- print.css … 印刷時の最小限スタイル（任意で読み込み）

## 使い方（HTML内で参照）

HTMLの<head>内で以下のようにlinkしてください。

<link rel="stylesheet" href="./assets/css/style.css">
<link rel="stylesheet" href="./print.css" media="print">

必要に応じて、本文を<main>や<div class="markdown-body">などのラッパーで包むと整った幅になります。

```html
<main>
  <!-- ここにMarkdownから生成されたHTML本文 -->
</main>
```

## md → html 変換時のヒント

- 生成ツールでテンプレート（ヘッダー）を差し込める場合、上記linkタグをテンプレートに入れてください。
- スタイルは余計なpadding/marginを避けています。必要な場合のみコンテナに最小限のpaddingを付けています。
- 色は落ち着いたトーン（濃灰、薄い境界、穏やかな青緑）を使用しています。

## 注意

- アイコンフォントや外部CDNは使用していません。
- 必要に応じて変数（:root内のCSSカスタムプロパティ）を調整してください。

## 生成物インデックス（90_prompts）

- [2025-09-20_1745_テーブル定義論理名対応.html](./90_prompts/2025-09-20_1745_テーブル定義論理名対応.html)
- [2025-09-21_見直し_PostgreSQL対応.html](./90_prompts/2025-09-21_見直し_PostgreSQL対応.html)
- [2025-09-22_0056_md_to_html_style.html](./90_prompts/2025-09-22_0056_md_to_html_style.html)
- [2025-09-22_テーブル定義_html化.html](./90_prompts/2025-09-22_テーブル定義_html化.html)
- [2025-09-23_90_prompts_html化実行ログ.html](./90_prompts/2025-09-23_90_prompts_html化実行ログ.html)
- [2025-09-23_テーブル定義フォーマット更新.html](./90_prompts/2025-09-23_テーブル定義フォーマット更新.html)
