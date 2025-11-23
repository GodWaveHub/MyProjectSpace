/**
 * 緯度経度検索ダイアログコンポーネント
 * 度分秒、度分、十進度数の3形式に対応した座標入力と地図移動機能を提供
 */
import { useState } from 'react'
import type { FormEvent } from 'react'

/**
 * CoordinateSearchDialogコンポーネントのプロパティ
 */
interface CoordinateSearchDialogProps {
  /** ダイアログを閉じる処理 */
  onClose: () => void
  /** 検索実行時の処理（緯度、経度を渡す） */
  onSearch: (lat: number, lng: number) => void
}

/**
 * CoordinateSearchDialogコンポーネント
 * @param props - ダイアログのプロパティ
 * @returns 緯度経度検索ダイアログUI要素
 */
const CoordinateSearchDialog = ({ onClose, onSearch }: CoordinateSearchDialogProps) => {
  // 入力値の状態
  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  // エラーメッセージの状態
  const [error, setError] = useState('')

  /**
   * 度分秒形式を十進度数に変換
   * 形式: "35° 41' 22'' N" または "139° 45' 0'' E"
   */
  const parseDMS = (input: string): number | null => {
    // 度分秒のパターンにマッチ
    const dmsPattern = /^(\d+)[°º]\s*(\d+)[''′]\s*(\d+(?:\.\d+)?)[""″]?\s*([NSEW])?$/i
    const match = input.trim().match(dmsPattern)
    
    if (match) {
      const degrees = parseFloat(match[1])
      const minutes = parseFloat(match[2])
      const seconds = parseFloat(match[3])
      const direction = match[4]?.toUpperCase()
      
      // 十進度数に変換
      let decimal = degrees + minutes / 60 + seconds / 3600
      
      // 南緯または西経の場合は負の値にする
      if (direction === 'S' || direction === 'W') {
        decimal = -decimal
      }
      
      return decimal
    }
    
    return null
  }

  /**
   * 度分形式を十進度数に変換
   * 形式: "35° 41.37' N" または "139° 45.0' E"
   */
  const parseDM = (input: string): number | null => {
    // 度分のパターンにマッチ
    const dmPattern = /^(\d+)[°º]\s*(\d+(?:\.\d+)?)[''′]\s*([NSEW])?$/i
    const match = input.trim().match(dmPattern)
    
    if (match) {
      const degrees = parseFloat(match[1])
      const minutes = parseFloat(match[2])
      const direction = match[3]?.toUpperCase()
      
      // 十進度数に変換
      let decimal = degrees + minutes / 60
      
      // 南緯または西経の場合は負の値にする
      if (direction === 'S' || direction === 'W') {
        decimal = -decimal
      }
      
      return decimal
    }
    
    return null
  }

  /**
   * 十進度数形式をパース
   * 形式: "35.689166" または "-139.75"
   */
  const parseDecimal = (input: string): number | null => {
    const trimmed = input.trim()
    const decimal = parseFloat(trimmed)
    
    // 数値として有効かチェック
    if (!isNaN(decimal) && isFinite(decimal)) {
      return decimal
    }
    
    return null
  }

  /**
   * 座標文字列を解析して十進度数に変換
   * 3つの形式を順番に試す
   */
  const parseCoordinate = (input: string): number | null => {
    // 度分秒形式を試す
    const dms = parseDMS(input)
    if (dms !== null) return dms
    
    // 度分形式を試す
    const dm = parseDM(input)
    if (dm !== null) return dm
    
    // 十進度数形式を試す
    const decimal = parseDecimal(input)
    if (decimal !== null) return decimal
    
    return null
  }

  /**
   * 緯度の範囲バリデーション (-90 ~ 90)
   */
  const validateLatitude = (lat: number): boolean => {
    return lat >= -90 && lat <= 90
  }

  /**
   * 経度の範囲バリデーション (-180 ~ 180)
   */
  const validateLongitude = (lng: number): boolean => {
    return lng >= -180 && lng <= 180
  }

  /**
   * フォーム送信時の処理
   */
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // 入力チェック
    if (!latInput.trim() || !lngInput.trim()) {
      setError('緯度と経度の両方を入力してください。')
      return
    }

    // 座標を解析
    const lat = parseCoordinate(latInput)
    const lng = parseCoordinate(lngInput)

    // 解析失敗チェック
    if (lat === null) {
      setError('緯度の形式が正しくありません。')
      return
    }
    if (lng === null) {
      setError('経度の形式が正しくありません。')
      return
    }

    // 範囲チェック
    if (!validateLatitude(lat)) {
      setError('緯度は -90 ~ 90 の範囲で入力してください。')
      return
    }
    if (!validateLongitude(lng)) {
      setError('経度は -180 ~ 180 の範囲で入力してください。')
      return
    }

    // 検索実行
    onSearch(lat, lng)
    onClose()
  }

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="dialog-container">
        <div className="dialog-header">
          <h3>緯度経度検索</h3>
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
            <label htmlFor="latitude">緯度</label>
            <input
              type="text"
              id="latitude"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="例: 35.689166 または 35° 41' 22&quot; N"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="longitude">経度</label>
            <input
              type="text"
              id="longitude"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="例: 139.75 または 139° 45' 0&quot; E"
            />
          </div>

          <div className="form-help">
            <p>対応形式:</p>
            <ul>
              <li>十進度数: 35.689166, 139.75</li>
              <li>度分: 35° 41.37' N, 139° 45.0' E</li>
              <li>度分秒: 35° 41' 22&quot; N, 139° 45' 0&quot; E</li>
            </ul>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="dialog-actions">
            <button type="button" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit">
              検索
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default CoordinateSearchDialog
