/**
 * 住所検索ダイアログコンポーネント
 * Google Maps Geocoding APIを使用した住所から座標への変換と地図移動機能を提供
 */
import { useState } from 'react'
import type { FormEvent } from 'react'

/**
 * AddressSearchDialogコンポーネントのプロパティ
 */
interface AddressSearchDialogProps {
  /** ダイアログを閉じる処理 */
  onClose: () => void
  /** 検索実行時の処理（緯度、経度、住所を渡す） */
  onSearch: (lat: number, lng: number, address: string) => void
}

/**
 * AddressSearchDialogコンポーネント
 * @param props - ダイアログのプロパティ
 * @returns 住所検索ダイアログUI要素
 */
const AddressSearchDialog = ({ onClose, onSearch }: AddressSearchDialogProps) => {
  // 入力値の状態
  const [addressInput, setAddressInput] = useState('')
  // エラーメッセージの状態
  const [error, setError] = useState('')
  // ローディング状態
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Google Maps Geocoding APIで住所を座標に変換
   * @param address - 検索する住所
   * @returns 座標情報 (緯度、経度) または null
   */
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      // Geocoderインスタンスを作成
      const geocoder = new google.maps.Geocoder()
      
      // ジオコーディングを実行
      const result = await geocoder.geocode({ address })
      
      // 結果が存在するかチェック
      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location
        return {
          lat: location.lat(),
          lng: location.lng(),
        }
      }
      
      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  /**
   * フォーム送信時の処理
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // 入力チェック
    if (!addressInput.trim()) {
      setError('住所を入力してください。')
      return
    }

    setIsLoading(true)

    try {
      // 住所を座標に変換
      const result = await geocodeAddress(addressInput.trim())

      if (result) {
        // 検索成功
        onSearch(result.lat, result.lng, addressInput.trim())
        onClose()
      } else {
        // 検索失敗
        setError('住所が見つかりませんでした。別の住所で試してください。')
      }
    } catch (err) {
      setError('検索中にエラーが発生しました。')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="dialog-container">
        <div className="dialog-header">
          <h3>住所検索</h3>
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
            <label htmlFor="address">住所</label>
            <input
              type="text"
              id="address"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="例: 東京都千代田区丸の内1-1"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="form-help">
            <p>検索のヒント:</p>
            <ul>
              <li>都道府県から入力すると精度が上がります</li>
              <li>建物名やランドマークでも検索できます</li>
              <li>郵便番号での検索も可能です（例: 100-0005）</li>
            </ul>
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="dialog-actions">
            <button type="button" onClick={onClose} disabled={isLoading}>
              キャンセル
            </button>
            <button type="submit" disabled={isLoading}>
              {isLoading ? '検索中...' : '検索'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default AddressSearchDialog
