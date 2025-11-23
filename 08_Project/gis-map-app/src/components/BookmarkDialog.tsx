/**
 * ブックマークダイアログコンポーネント
 * 地図の位置とズームレベルをlocalStorageに保存・管理
 */
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'

/**
 * ブックマークの型定義
 */
interface Bookmark {
  /** ブックマークID */
  id: string
  /** ブックマーク名 */
  name: string
  /** 緯度 */
  lat: number
  /** 経度 */
  lng: number
  /** ズームレベル */
  zoom: number
  /** 作成日時 */
  createdAt: string
}

/**
 * BookmarkDialogコンポーネントのプロパティ
 */
interface BookmarkDialogProps {
  /** 現在の地図中心座標 */
  currentPosition: { lat: number; lng: number }
  /** 現在のズームレベル */
  currentZoom: number
  /** ダイアログを閉じる処理 */
  onClose: () => void
  /** ブックマークを選択したときの処理 */
  onSelectBookmark: (lat: number, lng: number, zoom: number) => void
}

/** localStorageのキー */
const STORAGE_KEY = 'gis-map-bookmarks'

/**
 * BookmarkDialogコンポーネント
 * @param props - ダイアログのプロパティ
 * @returns ブックマークダイアログUI要素
 */
const BookmarkDialog = ({
  currentPosition,
  currentZoom,
  onClose,
  onSelectBookmark,
}: BookmarkDialogProps) => {
  // ブックマークリストの状態
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  // 新規ブックマーク名の入力状態
  const [newBookmarkName, setNewBookmarkName] = useState('')
  // エラーメッセージの状態
  const [error, setError] = useState('')

  /**
   * localStorageからブックマークを読み込み
   */
  useEffect(() => {
    loadBookmarks()
  }, [])

  /**
   * localStorageからブックマークを取得
   */
  const loadBookmarks = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Bookmark[]
        setBookmarks(parsed)
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
      setError('ブックマークの読み込みに失敗しました。')
    }
  }

  /**
   * localStorageにブックマークを保存
   */
  const saveBookmarks = (updatedBookmarks: Bookmark[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBookmarks))
      setBookmarks(updatedBookmarks)
    } catch (err) {
      console.error('Failed to save bookmarks:', err)
      setError('ブックマークの保存に失敗しました。')
    }
  }

  /**
   * 新しいブックマークを追加
   */
  const handleAddBookmark = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // 入力チェック
    if (!newBookmarkName.trim()) {
      setError('ブックマーク名を入力してください。')
      return
    }

    // 新しいブックマークを作成
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      name: newBookmarkName.trim(),
      lat: currentPosition.lat,
      lng: currentPosition.lng,
      zoom: currentZoom,
      createdAt: new Date().toISOString(),
    }

    // ブックマークリストに追加
    const updatedBookmarks = [...bookmarks, newBookmark]
    saveBookmarks(updatedBookmarks)
    setNewBookmarkName('')
  }

  /**
   * ブックマークを削除
   */
  const handleDeleteBookmark = (id: string) => {
    const confirmed = window.confirm('このブックマークを削除しますか?')
    if (confirmed) {
      const updatedBookmarks = bookmarks.filter((b) => b.id !== id)
      saveBookmarks(updatedBookmarks)
    }
  }

  /**
   * ブックマークを選択
   */
  const handleSelectBookmark = (bookmark: Bookmark) => {
    onSelectBookmark(bookmark.lat, bookmark.lng, bookmark.zoom)
    onClose()
  }

  return (
    <>
      <div className="dialog-overlay" onClick={onClose} />
      <div className="dialog-container bookmark-dialog">
        <div className="dialog-header">
          <h3>ブックマーク</h3>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <div className="dialog-content">
          {/* 新規ブックマーク追加フォーム */}
          <form onSubmit={handleAddBookmark} className="bookmark-form">
            <h4>現在位置を保存</h4>
            <div className="bookmark-current">
              <p>
                緯度: {currentPosition.lat.toFixed(6)}, 経度: {currentPosition.lng.toFixed(6)},
                ズーム: {currentZoom}
              </p>
            </div>
            <div className="form-group">
              <input
                type="text"
                value={newBookmarkName}
                onChange={(e) => setNewBookmarkName(e.target.value)}
                placeholder="ブックマーク名を入力"
              />
            </div>
            <button type="submit" className="btn-add-bookmark">
              追加
            </button>
          </form>

          {error && <div className="form-error">{error}</div>}

          {/* ブックマークリスト */}
          <div className="bookmark-list-container">
            <h4>保存済みブックマーク</h4>
            {bookmarks.length === 0 ? (
              <p className="bookmark-empty">ブックマークがありません</p>
            ) : (
              <ul className="bookmark-list">
                {bookmarks.map((bookmark) => (
                  <li key={bookmark.id} className="bookmark-item">
                    <button
                      type="button"
                      className="bookmark-select"
                      onClick={() => handleSelectBookmark(bookmark)}
                    >
                      <div className="bookmark-name">{bookmark.name}</div>
                      <div className="bookmark-coords">
                        緯度: {bookmark.lat.toFixed(4)}, 経度: {bookmark.lng.toFixed(4)}, ズーム:{' '}
                        {bookmark.zoom}
                      </div>
                    </button>
                    <button
                      type="button"
                      className="bookmark-delete"
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                      aria-label="削除"
                    >
                      🗑️
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default BookmarkDialog
