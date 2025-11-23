/**
 * サンプルレイヤーデータ
 * アプリケーションの初期表示用サンプルデータ
 */
import type { Feature } from 'geojson'
import type { Layer } from '../types/layer'

/** サンプルフィーチャの配列 */
const sampleFeatures: Feature[] = [
  {
    type: 'Feature',
    properties: {
      name: 'HQ (Sample)',
      description: 'プロジェクト拠点のサンプル位置です。',
    },
    geometry: {
      type: 'Point',
      coordinates: [139.767125, 35.681236],
    },
  },
  {
    type: 'Feature',
    properties: {
      name: '重点調査エリア',
      description: 'Googleマップ上で強調表示するポリゴンの例。',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [139.7605, 35.686],
          [139.7725, 35.686],
          [139.7725, 35.676],
          [139.7605, 35.676],
          [139.7605, 35.686],
        ],
      ],
    },
  },
]

/**
 * デフォルトレイヤー
 * アプリケーション起動時に読み込まれる初期レイヤー
 */
export const defaultLayers: Array<Layer & { type: 'layer' }> = [
  {
    id: 'layer-sample',
    name: 'サンプルレイヤー',
    visible: true,
    type: 'layer',
    style: {
      strokeColor: '#1976d2',
      strokeWidth: 2,
      strokeStyle: 'solid',
      fillColor: '#90caf9',
      fillOpacity: 0.45,
      pointSize: 8,
      pointShape: 'circle',
    },
    features: sampleFeatures,
  },
]

export default defaultLayers
