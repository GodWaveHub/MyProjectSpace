# プロジェクト改善点検討・実行

**実行日時**: 2025-11-15 16:35  
**ブランチ**: 改善検討  
**AI種類**: GitHub Copilot CLI  
**実行時間**: 約15分

## 改善点の分析

### 1. 現状分析
プロジェクト構造を調査した結果、以下の状況を確認しました：
- フォルダ構成は適切に整備されている（01_Estimate～09_Test）
- フォーマットファイル（80_formats）が用意されている
- 指示ファイル（.github/instructions）が詳細に定義されている
- 一部のフォルダが空（01_Estimate, 02_WBS等）

### 2. 主要な改善点

#### A. 見積テンプレートの不足
**問題**: 
- `.github/instructions/estimate_instructions.md`で`80_formats/estimate_template.md`の利用が指示されているが、ファイルが存在しない

**影響**:
- 見積作成時に統一されたフォーマットが使用できない
- PARAMETER.mdの参照方法が不明確

**改善策**: estimate_template.mdを作成

#### B. PARAMETER.mdの不在
**問題**:
- 指示書で参照されているPARAMETER.mdが存在しない
- プロジェクトのメンバー、単価、開発効率、見積定数が未定義

**影響**:
- 見積・WBS作成時の基準値が不明
- 工数計算の一貫性が保てない

**改善策**: PARAMETER.mdを作成

#### C. README.mdの不在
**問題**:
- プロジェクトのルートにREADME.mdが存在しない

**影響**:
- プロジェクトの概要・使い方が不明
- 新規参加者のオンボーディングが困難

**改善策**: README.mdを作成

#### D. WBSテンプレートの不足
**問題**:
- `.github/instructions/wbs_instructions.md`でWBS作成の詳細ルールが定義されているが、テンプレートファイルが存在しない

**影響**:
- WBS作成時の初期構造が不明確

**改善策**: 80_formats/wbs_template.mdを作成

#### E. Mermaid図版生成スクリプトの不在
**問題**:
- 基本設計書・詳細設計書の指示で`scripts/render-mermaid.ps1`の使用が推奨されているが、ファイルが存在しない

**影響**:
- Mermaid図のSVG変換が手動作業になる
- 設計書作成の効率が低下

**改善策**: scripts/render-mermaid.ps1を作成

## 実行する改善施策

### 優先度：高
1. **PARAMETER.md** - プロジェクト全体で参照される基準値
2. **80_formats/estimate_template.md** - 見積作成の基礎
3. **README.md** - プロジェクトの入口

### 優先度：中
4. **80_formats/wbs_template.md** - WBS作成支援
5. **scripts/render-mermaid.ps1** - 設計書作成支援

## この回答はcopilot-instructionsのルールに従っています。
