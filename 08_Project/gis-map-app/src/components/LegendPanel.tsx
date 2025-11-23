/**
 * 凡例パネルコンポーネント
 * レイヤーのスタイル情報を視覚的に表示
 */
import type { Layer } from '../types/layer'

/**
 * LegendPanelコンポーネントのプロパティ
 */
interface LegendPanelProps {
  /** 表示するレイヤーの配列 */
  layers: Layer[]
  /** パネルを閉じる処理 */
  onClose: () => void
}

/**
 * LegendPanelコンポーネント
 * @param props - 凡例パネルのプロパティ
 * @returns 凡例パネルUI要素
 */
const LegendPanel = ({ layers, onClose }: LegendPanelProps) => {
  /**
   * 図形サンプルをSVGで描画
   * @param layer - レイヤー情報
   * @returns SVG要素
   */
  const renderShapeSample = (layer: Layer) => {
    const { strokeColor, strokeWidth, fillColor, fillOpacity, pointSize, pointShape } = layer.style

    // 点（Point）の場合
    if (pointShape === 'circle') {
      return (
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={pointSize}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    } else if (pointShape === 'square') {
      const size = pointSize * 2
      const offset = 20 - pointSize
      return (
        <svg width="40" height="40" viewBox="0 0 40 40">
          <rect
            x={offset}
            y={offset}
            width={size}
            height={size}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    } else if (pointShape === 'triangle') {
      const size = pointSize * 2
      const top = 20 - size / 2
      const bottom = 20 + size / 2
      return (
        <svg width="40" height="40" viewBox="0 0 40 40">
          <polygon
            points={`20,${top} ${20 - size},${bottom} ${20 + size},${bottom}`}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </svg>
      )
    }

    // 線と面のサンプル（デフォルト）
    return (
      <svg width="40" height="40" viewBox="0 0 40 40">
        {/* 面のサンプル */}
        <rect
          x="5"
          y="10"
          width="30"
          height="20"
          fill={fillColor}
          fillOpacity={fillOpacity}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeWidth === 1 ? '3,3' : undefined}
        />
      </svg>
    )
  }

  // 表示可能なレイヤーのみフィルタ
  const visibleLayers = layers.filter((layer) => layer.visible && layer.features.length > 0)

  return (
    <div className="legend-panel">
      <div className="legend-header">
        <h3>凡例</h3>
        <button
          type="button"
          className="legend-close"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
      </div>

      <div className="legend-content">
        {visibleLayers.length === 0 ? (
          <div className="legend-empty">
            <p>表示中のレイヤーがありません</p>
          </div>
        ) : (
          <ul className="legend-list">
            {visibleLayers.map((layer) => (
              <li key={layer.id} className="legend-item">
                <div className="legend-symbol">
                  {renderShapeSample(layer)}
                </div>
                <div className="legend-info">
                  <div className="legend-name">{layer.name}</div>
                  <div className="legend-details">
                    {layer.features.length} フィーチャ
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default LegendPanel
