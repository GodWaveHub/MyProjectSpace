/**
 * レイヤーパネルコンポーネント
 * レイヤーとノードのツリー構造を表示・編集
 * ドラッグ&ドロップによる並べ替え、表示/非表示の切り替え、スタイル編集が可能
 */
import { useMemo, useState, useRef } from 'react'
import type { DragEvent, TouchEvent } from 'react'
import type { LayerStyle, LayerTreeItem } from '../types/layer'
import { flattenTree, getAllLayers } from '../utils/layerTree'

/**
 * LayerPanelコンポーネントのプロパティ
 */
export type LayerPanelProps = {
  tree: LayerTreeItem[]
  activeLayerId: string | null
  onSelectLayer: (layerId: string) => void
  onAddLayer: (name: string, parentId: string | null) => void
  onAddNode: (name: string, parentId: string | null) => void
  onDeleteItem: (itemId: string) => void
  onToggleItem: (itemId: string) => void
  onUpdateLayer: (layerId: string, updates: { name?: string; style?: Partial<LayerStyle> }) => void
  onUpdateNode: (nodeId: string, updates: { name?: string }) => void
  onMoveItem: (sourceId: string, targetParentId: string | null, targetIndex?: number) => void
  onClose?: () => void
}

/**
 * LayerPanelコンポーネント
 * @param props - レイヤーパネルのプロパティ
 * @returns レイヤーパネルUI要素
 */
const LayerPanel = ({
  tree,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onAddNode,
  onDeleteItem,
  onToggleItem,
  onUpdateLayer,
  onUpdateNode: _onUpdateNode,
  onMoveItem,
  onClose,
}: LayerPanelProps) => {
  const [newItemName, setNewItemName] = useState('')
  const [newItemType, setNewItemType] = useState<'layer' | 'node'>('layer')
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [draggedItem, setDraggedItem] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<{ id: string | null; position: 'before' | 'after' | 'inside' } | null>(null)
  
  // タッチドラッグ用の状態
  const touchStartY = useRef<number>(0)
  const touchCurrentY = useRef<number>(0)
  const longPressTimer = useRef<number | null>(null)
  const isDraggingTouch = useRef<boolean>(false)

  const allLayers = useMemo(() => getAllLayers(tree), [tree])
  const totalFeatures = useMemo(
    () => allLayers.reduce((sum, layer) => sum + layer.features.length, 0),
    [allLayers],
  )

  const flatItems = useMemo(() => {
    const items = flattenTree(tree)
    return items.filter((item) => {
      // 親が折りたたまれている場合は表示しない
      if (item.level === 0) return true
      const parentPath: string[] = []
      let currentLevel = item.level
      for (let i = items.indexOf(item) - 1; i >= 0 && currentLevel > 0; i--) {
        if (items[i].level < currentLevel) {
          if (items[i].type === 'node' && !expandedNodes.has(items[i].id)) {
            return false
          }
          parentPath.push(items[i].id)
          currentLevel = items[i].level
        }
      }
      return true
    })
  }, [tree, expandedNodes])

  const handleAddItem = () => {
    const trimmed = newItemName.trim()
    if (!trimmed) return
    
    if (newItemType === 'layer') {
      onAddLayer(trimmed, null)
    } else {
      onAddNode(trimmed, null)
    }
    setNewItemName('')
  }

  const handleOpenStyleDialog = (layerId: string) => {
    setEditingLayerId(layerId)
  }

  const handleCloseStyleDialog = () => {
    setEditingLayerId(null)
  }

  /**
   * ノードの展開/折りたたみを切り替え
   */
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      // 既に展開されている場合は折りたたむ
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        // 折りたたまれている場合は展開
        next.add(nodeId)
      }
      return next
    })
  }

  /**
   * ドラッグ開始時の処理
   */
  const handleDragStart = (e: DragEvent, itemId: string) => {
    e.stopPropagation()
    // ドラッグされているアイテムを記録
    setDraggedItem(itemId)
    // 移動操作を許可
    e.dataTransfer.effectAllowed = 'move'
  }

  /**
   * ドラッグ中に要素の上を移動したときの処理
   * ドロップ位置を計算して視覚的フィードバックを表示
   */
  const handleDragOver = (e: DragEvent, targetId: string | null, targetType: 'layer' | 'node') => {
    e.preventDefault()
    e.stopPropagation()
    
    // ドラッグ中でないか、自分自身の上をドラッグしている場合は処理しない
    if (!draggedItem || draggedItem === targetId) {
      return
    }

    // ドロップ位置を計算（マウス位置から判定）
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = e.clientY - rect.top // 要素内の相対値
    const height = rect.height

    if (targetType === 'node') {
      // ノードの場合: 上25%、中50%、下25%に分割
      if (y < height * 0.25) {
        // 上部: ノードの前に挿入
        setDropTarget({ id: targetId, position: 'before' })
      } else if (y > height * 0.75) {
        // 下部: ノードの後に挿入
        setDropTarget({ id: targetId, position: 'after' })
      } else {
        // 中央: ノードの子要素として挿入
        setDropTarget({ id: targetId, position: 'inside' })
      }
    } else {
      // レイヤーの場合: 上50%、下50%に分割
      if (y < height * 0.5) {
        // 上部: レイヤーの前に挿入
        setDropTarget({ id: targetId, position: 'before' })
      } else {
        // 下部: レイヤーの後に挿入
        setDropTarget({ id: targetId, position: 'after' })
      }
    }
  }

  /**
   * ドロップ時の処理
   * アイテムを指定された位置に移動
   */
  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // ドラッグ中のアイテムまたはドロップ先がない場合は何もしない
    if (!draggedItem || !dropTarget) {
      return
    }

    // ドロップ位置に応じて移動処理を実行
    if (dropTarget.position === 'inside' && dropTarget.id) {
      // ノードの子要素として移動
      onMoveItem(draggedItem, dropTarget.id)
    } else {
      // before/after の場合は同じ親内での移動
      onMoveItem(draggedItem, null)
    }

    // ドラッグ状態をリセット
    setDraggedItem(null)
    setDropTarget(null)
  }

  /**
   * ドラッグ終了時の処理
   * ドラッグ状態をクリア
   */
  const handleDragEnd = () => {
    setDraggedItem(null)
    setDropTarget(null)
  }

  /**
   * タッチ開始時の処理（長押し判定）
   */
  const handleTouchStart = (e: TouchEvent, itemId: string) => {
    const touch = e.touches[0]
    touchStartY.current = touch.clientY
    touchCurrentY.current = touch.clientY
    
    // 長押し判定（500ms）
    longPressTimer.current = setTimeout(() => {
      isDraggingTouch.current = true
      setDraggedItem(itemId)
      // 振動フィードバック（対応デバイスのみ）
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }
    }, 500)
  }

  /**
   * タッチ移動時の処理
   */
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDraggingTouch.current || !draggedItem) {
      // ドラッグ開始前に大きく移動した場合は長押しキャンセル
      const touch = e.touches[0]
      const deltaY = Math.abs(touch.clientY - touchStartY.current)
      if (deltaY > 10 && longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
      return
    }

    e.preventDefault()
    const touch = e.touches[0]
    touchCurrentY.current = touch.clientY

    // タッチ位置の下にある要素を取得
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!element) return

    // 最も近いツリーアイテム要素を探す
    const treeItem = element.closest('.layer-tree__item') as HTMLElement
    if (!treeItem) {
      setDropTarget(null)
      return
    }

    // data-item-id から対象アイテムのIDを取得
    const targetId = treeItem.dataset.itemId
    const targetType = treeItem.dataset.itemType as 'layer' | 'node' | undefined
    
    if (!targetId || !targetType || targetId === draggedItem) {
      return
    }

    // ドロップ位置を計算
    const rect = treeItem.getBoundingClientRect()
    const y = touch.clientY - rect.top
    const height = rect.height

    if (targetType === 'node') {
      if (y < height * 0.25) {
        setDropTarget({ id: targetId, position: 'before' })
      } else if (y > height * 0.75) {
        setDropTarget({ id: targetId, position: 'after' })
      } else {
        setDropTarget({ id: targetId, position: 'inside' })
      }
    } else {
      if (y < height * 0.5) {
        setDropTarget({ id: targetId, position: 'before' })
      } else {
        setDropTarget({ id: targetId, position: 'after' })
      }
    }
  }

  /**
   * タッチ終了時の処理
   */
  const handleTouchEnd = () => {
    // 長押しタイマーをクリア
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }

    // ドラッグ中だった場合はドロップ処理
    if (isDraggingTouch.current && draggedItem && dropTarget) {
      if (dropTarget.position === 'inside' && dropTarget.id) {
        onMoveItem(draggedItem, dropTarget.id)
      } else {
        onMoveItem(draggedItem, null)
      }
    }

    // 状態をリセット
    isDraggingTouch.current = false
    setDraggedItem(null)
    setDropTarget(null)
  }

  const editingLayer = editingLayerId ? allLayers.find((layer) => layer.id === editingLayerId) : null

  return (
    <aside className="layer-panel" aria-label="レイヤーツリー">
      <header className="layer-panel__header">
        <div>
          <p className="layer-panel__eyebrow">Layer Control</p>
          <h2>レイヤーツリー</h2>
        </div>
        {onClose && (
          <button 
            type="button" 
            className="layer-panel__close-btn"
            onClick={onClose}
            aria-label="閉じる"
          >
            ×
          </button>
        )}
      </header>
      <p className="layer-panel__meta">
        {allLayers.length} 件・フィーチャ {totalFeatures} 個
        <span className="layer-panel__hint">（長押しでドラッグ）</span>
      </p>

      <div className="layer-panel__adder">
        <select 
          value={newItemType} 
          onChange={(e) => setNewItemType(e.target.value as 'layer' | 'node')}
          className="item-type-select"
        >
          <option value="layer">レイヤー</option>
          <option value="node">ノード</option>
        </select>
        <input
          type="text"
          placeholder={newItemType === 'layer' ? 'レイヤー名' : 'ノード名'}
          value={newItemName}
          onChange={(event) => setNewItemName(event.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
          aria-label="新規アイテム名"
        />
        <button type="button" onClick={handleAddItem}>
          追加
        </button>
      </div>

      <div 
        className="layer-tree" 
        role="tree"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {flatItems.map((item) => (
          <div
            key={item.id}
            className={`layer-tree__item ${item.type === 'node' && expandedNodes.has(item.id) ? 'layer-tree__item--expanded' : ''} ${item.type === 'layer' && item.id === activeLayerId ? 'is-active' : ''} ${
              draggedItem === item.id ? 'is-dragging' : ''
            } ${dropTarget?.id === item.id ? `drop-${dropTarget.position}` : ''}`}
            style={{ paddingLeft: `${item.level * 1}rem` }}
            data-item-id={item.id}
            data-item-type={item.type}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={(e) => handleDragOver(e, item.id, item.type)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => handleTouchStart(e, item.id)}
            role="treeitem"
          >
            <div 
              className="layer-tree__row"
              onClick={() => {
                if (item.type === 'layer') {
                  onSelectLayer(item.id)
                }
              }}
            >
              {item.type === 'node' && (
                <button
                  type="button"
                  className="layer-tree__expand-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleNode(item.id)
                  }}
                  aria-label={expandedNodes.has(item.id) ? '折りたたむ' : '展開'}
                >
                </button>
              )}
              
              <label 
                className="layer-tree__visibility" 
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={() => onToggleItem(item.id)}
                  aria-label={`${item.name} の表示切替`}
                />
              </label>

              {item.type === 'node' ? (
                <span className="layer-tree__icon is-node">📁</span>
              ) : (
                <svg 
                  className="layer-tree__icon is-layer"
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16"
                  aria-label="レイヤースタイル"
                >
                  <line
                    x1="2"
                    y1="8"
                    x2="14"
                    y2="8"
                    stroke={item.style.strokeColor}
                    strokeWidth={item.style.strokeWidth}
                    strokeDasharray={
                      item.style.strokeStyle === 'dashed'
                        ? '3,2'
                        : item.style.strokeStyle === 'dotted'
                        ? '1,2'
                        : '0'
                    }
                  />
                  {item.style.fillColor && item.style.fillColor !== 'transparent' && (
                    <circle
                      cx="8"
                      cy="8"
                      r="3"
                      fill={item.style.fillColor}
                      fillOpacity={item.style.fillOpacity}
                      stroke={item.style.strokeColor}
                      strokeWidth="1"
                    />
                  )}
                </svg>
              )}
              
              <span className="layer-tree__name">{item.name}</span>
              
              {item.type === 'layer' && (
                <span className="layer-tree__count">({item.features.length})</span>
              )}

              <div className="layer-tree__actions">
                {item.type === 'layer' && (
                  <button 
                    type="button" 
                    className="layer-tree__edit-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenStyleDialog(item.id)
                    }}
                    aria-label={`${item.name} のスタイルを編集`}
                  >
                    ⚙️
                  </button>
                )}
                
                <button
                  type="button"
                  className="layer-tree__delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm(`「${item.name}」を削除しますか?`)) {
                      onDeleteItem(item.id)
                      if (item.type === 'layer' && item.id === editingLayerId) {
                        handleCloseStyleDialog()
                      }
                    }
                  }}
                  aria-label={`${item.name} を削除`}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* スタイル設定ダイアログ */}
      {editingLayer && (
        <div className="style-dialog-overlay" onClick={handleCloseStyleDialog}>
          <div className="style-dialog" onClick={(e) => e.stopPropagation()}>
            <header className="style-dialog__header">
              <h3>スタイル設定: {editingLayer.name}</h3>
              <button type="button" onClick={handleCloseStyleDialog} className="style-dialog__close">
                ×
              </button>
            </header>
            
            <div className="style-dialog__body">
              <section className="style-section">
                <h4>レイヤー情報</h4>
                <label>
                  レイヤー名
                  <input
                    type="text"
                    value={editingLayer.name}
                    onChange={(event) => onUpdateLayer(editingLayer.id, { name: event.target.value })}
                  />
                </label>
                <div className="style-info">
                  <span>フィーチャ数: {editingLayer.features.length} 件</span>
                </div>
              </section>

              <section className="style-section">
                <h4>線のスタイル</h4>
                <label>
                  線の色
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={editingLayer.style.strokeColor}
                      onChange={(event) =>
                        onUpdateLayer(editingLayer.id, { style: { strokeColor: event.target.value } })
                      }
                    />
                    <input
                      type="text"
                      value={editingLayer.style.strokeColor}
                      onChange={(event) =>
                        onUpdateLayer(editingLayer.id, { style: { strokeColor: event.target.value } })
                      }
                      className="color-text-input"
                    />
                  </div>
                </label>
                
                <label>
                  線の幅
                  <div className="range-input-group">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={editingLayer.style.strokeWidth}
                      onChange={(event) =>
                        onUpdateLayer(editingLayer.id, { style: { strokeWidth: Number(event.target.value) } })
                      }
                    />
                    <span className="range-value">{editingLayer.style.strokeWidth}px</span>
                  </div>
                </label>

                <label>
                  線のスタイル
                  <select
                    value={editingLayer.style.strokeStyle}
                    onChange={(event) =>
                      onUpdateLayer(editingLayer.id, { 
                        style: { strokeStyle: event.target.value as 'solid' | 'dashed' | 'dotted' } 
                      })
                    }
                  >
                    <option value="solid">実線</option>
                    <option value="dashed">破線</option>
                    <option value="dotted">点線</option>
                  </select>
                </label>
              </section>

              <section className="style-section">
                <h4>塗りのスタイル</h4>
                <label>
                  塗りの色
                  <div className="color-input-group">
                    <input
                      type="color"
                      value={editingLayer.style.fillColor}
                      onChange={(event) =>
                        onUpdateLayer(editingLayer.id, { style: { fillColor: event.target.value } })
                      }
                    />
                    <input
                      type="text"
                      value={editingLayer.style.fillColor}
                      onChange={(event) =>
                        onUpdateLayer(editingLayer.id, { style: { fillColor: event.target.value } })
                      }
                      className="color-text-input"
                    />
                  </div>
                </label>

                <label>
                  不透明度
                  <div className="range-input-group">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={editingLayer.style.fillOpacity}
                      onChange={(event) =>
                        onUpdateLayer(editingLayer.id, { style: { fillOpacity: Number(event.target.value) } })
                      }
                    />
                    <span className="range-value">{(editingLayer.style.fillOpacity * 100).toFixed(0)}%</span>
                  </div>
                </label>
              </section>

              <section className="style-section">
                <h4>ポイントのスタイル</h4>
                <label>
                  ポイントサイズ
                  <div className="range-input-group">
                    <input
                      type="range"
                      min="2"
                      max="30"
                      step="1"
                      value={editingLayer.style.pointSize}
                      onChange={(event) =>
                        onUpdateLayer(editingLayer.id, { style: { pointSize: Number(event.target.value) } })
                      }
                    />
                    <span className="range-value">{editingLayer.style.pointSize}px</span>
                  </div>
                </label>

                <label>
                  ポイント形状
                  <select
                    value={editingLayer.style.pointShape}
                    onChange={(event) =>
                      onUpdateLayer(editingLayer.id, { 
                        style: { pointShape: event.target.value as 'circle' | 'square' | 'triangle' } 
                      })
                    }
                  >
                    <option value="circle">円</option>
                    <option value="square">四角</option>
                    <option value="triangle">三角</option>
                  </select>
                </label>
              </section>
            </div>

            <footer className="style-dialog__footer">
              <button type="button" onClick={handleCloseStyleDialog}>
                閉じる
              </button>
            </footer>
          </div>
        </div>
      )}
    </aside>
  )
}

export default LayerPanel
