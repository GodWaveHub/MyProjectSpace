/**
 * メニューバーコンポーネント
 * 左上のハンバーガーメニューボタンとメニューパネルを提供
 * レイヤー操作、検索、印刷、凡例表示などの機能へのアクセスポイント
 */
import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { User } from 'firebase/auth'

/**
 * MenuBarコンポーネントのプロパティ
 */
export type MenuBarProps = {
  onToggleLayerPanel: () => void
  onSaveLayerList: () => void
  onLoadLayerList: (file: File) => void
  onLoadGeoJson: () => void
  onSaveGeoJson: () => void
  onClearLayer: () => void
  onLoadSample: () => void
  onShowBookmark: () => void
  onShowCoordinateSearch: () => void
  onShowAddressSearch: () => void
  onPrint: () => void
  onShowLegend: () => void
  user: User | null
  onLogin: () => void
  onLogout: () => void
}

/**
 * MenuBarコンポーネント
 * @param props - メニューバーのプロパティ
 * @returns メニューバーUI要素
 */
const MenuBar = ({
  onToggleLayerPanel,
  onSaveLayerList,
  onLoadLayerList,
  onLoadGeoJson,
  onSaveGeoJson,
  onClearLayer,
  onLoadSample,
  onShowBookmark,
  onShowCoordinateSearch,
  onShowAddressSearch,
  onPrint,
  onShowLegend,
  user,
  onLogin,
  onLogout,
}: MenuBarProps) => {
  // メニューの開閉状態
  const [isOpen, setIsOpen] = useState(false)
  // レイヤーリストファイル入力の参照
  const layerListFileInputRef = useRef<HTMLInputElement | null>(null)

  /**
   * メニューアイテムがクリックされたときの処理
   * アクションを実行してメニューを閉じる
   */
  const handleMenuItemClick = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  /**
   * レイヤーリストファイルが選択されたときの処理
   */
  const handleLayerListFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // ファイルを読み込んでメニューを閉じる
      onLoadLayerList(file)
      setIsOpen(false)
    }
    // 入力をリセット（同じファイルを再度選択できるように）
    event.target.value = ''
  }

  /**
   * レイヤーリストインポートダイアログを開く
   */
  const triggerLayerListImport = () => {
    layerListFileInputRef.current?.click()
  }

  return (
    <>
      <button
        type="button"
        className="menu-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="メニューを開く"
        aria-expanded={isOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="menu-overlay" onClick={() => setIsOpen(false)} />
          <nav className="menu-panel">
            <div className="menu-header">
              <h3>メニュー</h3>
              <button
                type="button"
                className="menu-close"
                onClick={() => setIsOpen(false)}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div className="menu-content">
              <section className="menu-section auth-section">
                {user ? (
                  <>
                    <div className="user-info-compact">
                      <span className="user-email">👤 {user.email}</span>
                    </div>
                    <button type="button" onClick={() => handleMenuItemClick(onLogout)} className="logout-button">
                      🚪 ログアウト
                    </button>
                  </>
                ) : (
                  <>
                    <div className="auth-message">
                      ログインが必要です
                    </div>
                    <button type="button" onClick={() => handleMenuItemClick(onLogin)} className="login-button">
                      🔐 Googleでログイン
                    </button>
                  </>
                )}
              </section>
              <section className="menu-section">
                <h4>レイヤー</h4>
                <button type="button" onClick={() => handleMenuItemClick(onToggleLayerPanel)} disabled={!user}>
                  📁 レイヤーツリー表示
                </button>
                <button type="button" onClick={() => handleMenuItemClick(onSaveLayerList)} disabled={!user}>
                  💾 レイヤー情報保存
                </button>
                <button type="button" onClick={() => handleMenuItemClick(triggerLayerListImport)} disabled={!user}>
                  📂 レイヤー情報読み込み
                </button>
                <button type="button" onClick={() => handleMenuItemClick(onLoadGeoJson)} disabled={!user}>
                  📥 GeoJSON読込
                </button>
                <button type="button" onClick={() => handleMenuItemClick(onSaveGeoJson)} disabled={!user}>
                  📤 GeoJSON保存
                </button>
                <button type="button" onClick={() => handleMenuItemClick(onClearLayer)} disabled={!user}>
                  🗑️ レイヤークリア
                </button>
                <button type="button" onClick={() => handleMenuItemClick(onLoadSample)} disabled={!user}>
                  📋 サンプルデータ読込
                </button>
              </section>

              <section className="menu-section">
                <h4>検索</h4>
                <button type="button" onClick={() => handleMenuItemClick(onShowBookmark)} disabled={!user}>
                  🔖 ブックマーク
                </button>
                <button type="button" onClick={() => handleMenuItemClick(onShowCoordinateSearch)} disabled={!user}>
                  🌐 緯度経度検索
                </button>
                <button type="button" onClick={() => handleMenuItemClick(onShowAddressSearch)} disabled={!user}>
                  📍 住所検索
                </button>
              </section>

              <section className="menu-section">
                <h4>その他</h4>
                <button type="button" onClick={() => handleMenuItemClick(onPrint)} disabled={!user}>
                  🖨️ 印刷
                </button>
                <button type="button" onClick={() => handleMenuItemClick(onShowLegend)} disabled={!user}>
                  📊 凡例表示
                </button>
              </section>
            </div>
          </nav>
        </>
      )}

      <input
        type="file"
        accept="application/json"
        ref={layerListFileInputRef}
        className="file-input"
        onChange={handleLayerListFileChange}
      />
    </>
  )
}

export default MenuBar
