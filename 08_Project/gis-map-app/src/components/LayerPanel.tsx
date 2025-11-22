import { useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Layer, LayerStyle } from '../types/layer'

export type LayerPanelProps = {
  layers: Layer[]
  activeLayerId: string | null
  onSelectLayer: (layerId: string) => void
  onAddLayer: (name: string) => void
  onDeleteLayer: (layerId: string) => void
  onToggleLayer: (layerId: string) => void
  onUpdateLayer: (layerId: string, updates: { name?: string; style?: Partial<LayerStyle> }) => void
  onSaveLayerList: () => void
  onLoadLayerList: (file: File) => void
}

const LayerPanel = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onDeleteLayer,
  onToggleLayer,
  onUpdateLayer,
  onSaveLayerList,
  onLoadLayerList,
}: LayerPanelProps) => {
  const [newLayerName, setNewLayerName] = useState('')
  const layerFileInputRef = useRef<HTMLInputElement | null>(null)

  const totalFeatures = useMemo(
    () => layers.reduce((sum, layer) => sum + layer.features.length, 0),
    [layers],
  )

  const handleAddLayer = () => {
    const trimmed = newLayerName.trim()
    onAddLayer(trimmed)
    setNewLayerName('')
  }

  const handleLayerFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onLoadLayerList(file)
    }
    event.target.value = ''
  }

  const triggerLayerImport = () => {
    layerFileInputRef.current?.click()
  }

  return (
    <aside className="layer-panel" aria-label="レイヤーツリー">
      <header className="layer-panel__header">
        <div>
          <p className="layer-panel__eyebrow">Layer Control</p>
          <h2>レイヤーツリー</h2>
        </div>
        <p className="layer-panel__meta">{layers.length} 件・フィーチャ {totalFeatures} 個</p>
      </header>

      <div className="layer-panel__adder">
        <input
          type="text"
          placeholder="レイヤー名を入力"
          value={newLayerName}
          onChange={(event) => setNewLayerName(event.target.value)}
          aria-label="新規レイヤー名"
        />
        <button type="button" onClick={handleAddLayer}>
          追加
        </button>
      </div>

      <ul className="layer-tree" role="tree">
        {layers.map((layer) => (
          <li key={layer.id} className={`layer-tree__item ${layer.id === activeLayerId ? 'is-active' : ''}`} role="treeitem">
            <div className="layer-tree__header">
              <label className="layer-tree__selector">
                <input
                  type="radio"
                  name="active-layer"
                  checked={layer.id === activeLayerId}
                  onChange={() => onSelectLayer(layer.id)}
                  aria-label={`${layer.name} をアクティブにする`}
                />
                <span>{layer.name}</span>
              </label>
              <div className="layer-tree__actions">
                <button type="button" onClick={() => onToggleLayer(layer.id)}>
                  {layer.visible ? '表示中' : '非表示'}
                </button>
                <button type="button" onClick={() => onDeleteLayer(layer.id)}>
                  削除
                </button>
              </div>
            </div>

            <div className="layer-tree__details">
              <label>
                名前
                <input
                  type="text"
                  value={layer.name}
                  onChange={(event) => onUpdateLayer(layer.id, { name: event.target.value })}
                />
              </label>
              <div className="layer-tree__style">
                <label>
                  線色
                  <input
                    type="color"
                    value={layer.style.strokeColor}
                    onChange={(event) =>
                      onUpdateLayer(layer.id, { style: { strokeColor: event.target.value } })
                    }
                  />
                </label>
                <label>
                  塗り色
                  <input
                    type="color"
                    value={layer.style.fillColor}
                    onChange={(event) =>
                      onUpdateLayer(layer.id, { style: { fillColor: event.target.value } })
                    }
                  />
                </label>
                <label>
                  不透明度
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={layer.style.fillOpacity}
                    onChange={(event) =>
                      onUpdateLayer(layer.id, { style: { fillOpacity: Number(event.target.value) } })
                    }
                  />
                  <span>{layer.style.fillOpacity.toFixed(2)}</span>
                </label>
              </div>
              <p className="layer-tree__summary">フィーチャ: {layer.features.length} 件</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="layer-panel__footer">
        <button type="button" onClick={onSaveLayerList}>
          レイヤー一覧を保存
        </button>
        <button type="button" onClick={triggerLayerImport}>
          レイヤー一覧を読み込み
        </button>
        <input
          type="file"
          accept="application/json"
          ref={layerFileInputRef}
          className="file-input"
          onChange={handleLayerFileChange}
        />
      </div>
    </aside>
  )
}

export default LayerPanel
