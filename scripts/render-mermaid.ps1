<#
.SYNOPSIS
    Mermaid記法（.mmd）をSVG画像に変換するスクリプト

.DESCRIPTION
    Kroki APIを使用してMermaid記法のファイルをSVG形式に変換します。
    基本設計書・詳細設計書での図版生成に利用します。
    Dockerは使用せず、HTTPレンダリングサービスを利用するため軽量です。

.PARAMETER InputPath
    入力ファイルのパス（.mmdファイル）

.PARAMETER OutputPath
    出力ファイルのパス（.svgファイル）
    省略時は入力ファイル名の拡張子を.svgに変更したパスを使用

.PARAMETER KrokiUrl
    Kroki APIのエンドポイント（デフォルト: https://kroki.io/mermaid/svg）

.EXAMPLE
    .\scripts\render-mermaid.ps1 -InputPath "design\class-Main.mmd"
    
    指定したMermaidファイルをSVGに変換（出力: design\class-Main.svg）

.EXAMPLE
    .\scripts\render-mermaid.ps1 -InputPath "design\sequence.mmd" -OutputPath "assets\sequence-diagram.svg"
    
    入力・出力パスを明示的に指定して変換

.EXAMPLE
    Get-ChildItem -Path "07_Design\01_BasicDesign\md" -Filter "*.mmd" | ForEach-Object {
        .\scripts\render-mermaid.ps1 -InputPath $_.FullName -OutputPath $_.FullName.Replace("\md\", "\html\assets\").Replace(".mmd", ".svg")
    }
    
    mdフォルダ内の全.mmdファイルをhtml\assetsフォルダにSVG変換

.NOTES
    作成日: 2025-11-15
    作成者: AI (GitHub Copilot)
    バージョン: v1.0
    
    前提条件:
    - インターネット接続が必要（Kroki APIにアクセス）
    - PowerShell 5.1以上
    
    制約:
    - Mermaid記法の構文エラーがある場合は変換失敗
    - Kroki APIのレート制限に注意（大量変換時）
    
    参照:
    - Kroki公式サイト: https://kroki.io/
    - Mermaid公式サイト: https://mermaid.js.org/
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true, ValueFromPipelineByPropertyName = $true)]
    [ValidateScript({
        if (-not (Test-Path $_)) {
            throw "入力ファイルが見つかりません: $_"
        }
        if ($_ -notmatch '\.mmd$') {
            throw "入力ファイルは.mmd拡張子である必要があります: $_"
        }
        return $true
    })]
    [string]$InputPath,

    [Parameter(Mandatory = $false, Position = 1)]
    [string]$OutputPath,

    [Parameter(Mandatory = $false)]
    [string]$KrokiUrl = "https://kroki.io/mermaid/svg"
)

begin {
    Write-Host "=== Mermaid to SVG Converter ===" -ForegroundColor Cyan
    Write-Host "Kroki API: $KrokiUrl" -ForegroundColor Gray
    Write-Host ""
}

process {
    try {
        # 入力ファイルの絶対パスを取得
        $inputFile = Get-Item -Path $InputPath -ErrorAction Stop
        Write-Host "入力ファイル: $($inputFile.FullName)" -ForegroundColor Green

        # 出力パスが指定されていない場合は自動生成
        if ([string]::IsNullOrWhiteSpace($OutputPath)) {
            $OutputPath = $inputFile.FullName -replace '\.mmd$', '.svg'
        }

        # 出力ディレクトリが存在しない場合は作成
        $outputDir = Split-Path -Path $OutputPath -Parent
        if (-not (Test-Path $outputDir)) {
            Write-Host "出力ディレクトリを作成: $outputDir" -ForegroundColor Yellow
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }

        Write-Host "出力ファイル: $OutputPath" -ForegroundColor Green

        # Mermaidファイルの内容を読み込み（UTF-8）
        Write-Host "Mermaidファイルを読み込み中..." -ForegroundColor Gray
        $mermaidContent = Get-Content -Path $inputFile.FullName -Encoding UTF8 -Raw

        if ([string]::IsNullOrWhiteSpace($mermaidContent)) {
            throw "入力ファイルが空です"
        }

        # Mermaid構文の簡易チェック
        if ($mermaidContent -notmatch '(graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|flowchart)') {
            Write-Warning "Mermaid構文が検出されませんでした。構文エラーの可能性があります。"
        }

        # Kroki APIにPOSTリクエストを送信
        Write-Host "Kroki APIに送信中..." -ForegroundColor Gray
        
        $headers = @{
            "Content-Type" = "text/plain; charset=utf-8"
        }

        $response = Invoke-WebRequest -Uri $KrokiUrl -Method Post -Body ([System.Text.Encoding]::UTF8.GetBytes($mermaidContent)) -Headers $headers -ErrorAction Stop

        # レスポンスの確認
        if ($response.StatusCode -ne 200) {
            throw "Kroki APIからエラー応答: StatusCode=$($response.StatusCode)"
        }

        # SVGを保存
        Write-Host "SVGファイルを保存中..." -ForegroundColor Gray
        [System.IO.File]::WriteAllText($OutputPath, $response.Content, [System.Text.Encoding]::UTF8)

        Write-Host "✓ 変換成功: $OutputPath" -ForegroundColor Green
        Write-Host ""

        # 結果をオブジェクトとして返す
        [PSCustomObject]@{
            InputFile  = $inputFile.FullName
            OutputFile = $OutputPath
            Success    = $true
            FileSize   = (Get-Item $OutputPath).Length
        }

    } catch {
        Write-Host "✗ 変換失敗: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "詳細: $($_.Exception)" -ForegroundColor DarkRed
        Write-Host ""

        # エラーオブジェクトを返す
        [PSCustomObject]@{
            InputFile  = $InputPath
            OutputFile = $OutputPath
            Success    = $false
            Error      = $_.Exception.Message
        }
    }
}

end {
    Write-Host "=== 処理完了 ===" -ForegroundColor Cyan
}
