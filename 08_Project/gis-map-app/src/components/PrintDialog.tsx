/**
 * 印刷ダイアログコンポーネント
 * 地図の印刷とPDFエクスポート機能を提供
 */
import { useState } from 'react'
import type { FormEvent } from 'react'

/**
 * PrintDialogコンポーネントのプロパティ
 */
interface PrintDialogProps {
  /** ダイアログを閉じる処理 */
  onClose: () => void
  /** 印刷実行時の処理 */
  onPrint: (title: string, includeDate: boolean, includeLegend: boolean) => void
}

/**
 * PrintDialogコンポーネント
 * @param props - ダイアログのプロパティ
 * @returns 印刷ダイアログUI要素
 */
const PrintDialog = ({ onClose, onPrint }: PrintDialogProps) => {
  // タイトルの入力状態
  const [title, setTitle] = useState('GISマップ')
  // 日付を含めるかの状態
  const [includeDate, setIncludeDate] = useState(true)
  // 凡例を含めるかの状態
  const [includeLegend, setIncludeLegend] = useState(true)

  /**
   * フォーム送信時の処理
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onPrint(title, includeDate, includeLegend)
    onClose()
  }

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="dialog-container">
        <div className="dialog-header">
          <h3>印刷</h3>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <form className="dialog-content" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="print-title">タイトル</label>
            <input
              type="text"
              id="print-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="印刷するタイトル"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeDate}
                onChange={(e) => setIncludeDate(e.target.checked)}
              />
              <span>印刷日時を含める</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeLegend}
                onChange={(e) => setIncludeLegend(e.target.checked)}
              />
              <span>凡例を含める</span>
            </label>
          </div>

          <div className="form-help">
            <p>印刷のヒント:</p>
            <ul>
              <li>ブラウザの印刷機能を使用します</li>
              <li>印刷プレビューで確認してから印刷してください</li>
              <li>PDFとして保存も可能です</li>
            </ul>
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit">
              印刷プレビュー
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default PrintDialog
