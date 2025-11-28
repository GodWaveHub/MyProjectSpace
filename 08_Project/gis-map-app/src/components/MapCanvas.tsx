/**
 * MapCanvasコンポーネント
 * Google Maps APIを使用したGISマップアプリケーションのメインコンポーネント
 * 地図表示、図形描画、レイヤー管理、GeoJSONインポート/エクスポート機能を提供
 */
import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import type { Feature, FeatureCollection } from 'geojson'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { User } from 'firebase/auth'
import LayerPanel from './LayerPanel'
import MenuBar from './MenuBar'
import CoordinateSearchDialog from './CoordinateSearchDialog'
import AddressSearchDialog from './AddressSearchDialog'
import LegendPanel from './LegendPanel'
import BookmarkDialog from './BookmarkDialog'
import PrintDialog from './PrintDialog'
import { convertOverlayToFeature, normalizeGeoJson } from '../utils/geojson'
import { defaultLayers } from '../data/sampleLayer'
import type { Layer, LayerCollectionFile, LayerStyle, LayerTreeItem } from '../types/layer'
import { 
  getAllLayers, 
  addItem, 
  removeItem, 
  updateLayer as updateLayerInTree, 
  updateNode,
  toggleItemVisibility,
  moveItem 
} from '../utils/layerTree'
import { onAuthChange, loginWithGoogle, logoutUser } from '../lib/auth'

/** デフォルトの地図中心座標（東京） */
const DEFAULT_CENTER = { lat: 35.681236, lng: 139.767125 }
/** Google Maps マップID */
const MAP_ID = 'PRJ-GIS-WEBAPP'
/** デフォルトのレイヤースタイル */
const DEFAULT_LAYER_STYLE: LayerStyle = {
  strokeColor: '#0f60ff',
  strokeWidth: 2,
  strokeStyle: 'solid',
  fillColor: '#38bdf8',
  fillOpacity: 0.35,
  pointSize: 8,
  pointShape: 'circle',
}

/**
 * フィーチャを深くコピー
 * @param feature - コピー元のフィーチャ
 * @returns コピーされたフィーチャ
 */
const cloneFeature = <T extends Feature>(feature: T): T =>
  JSON.parse(JSON.stringify(feature)) as T

/**
 * 初期レイヤーツリーを作成
 * @returns 初期化されたレイヤーツリー
 */
const createInitialTree = (): LayerTreeItem[] =>
  defaultLayers.map((layer) => ({
    ...layer,
    type: 'layer' as const,
    features: layer.features.map((feature) => cloneFeature(feature)),
  }))

/**
 * ユニークなIDを生成
 * @returns ユニークなID文字列
 */
const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `item-${Date.now()}-${Math.random().toString(16).slice(2)}`

/** ステータスメッセージの型 */
type Status = {
  type: 'info' | 'success' | 'error'
  message: string
}

/** デフォルトステータス */
const DEFAULT_STATUS: Status = {
  type: 'info',
  message: 'Google Maps API の初期化を待機しています…',
}

/**
 * MapCanvasコンポーネント
 * @returns メインマップキャンバスUI
 */
const MapCanvas = () => {
  // 地図コンテナの参照
  const containerRef = useRef<HTMLDivElement | null>(null)
  // GeoJSONファイル入力の参照
  const geoJsonFileInputRef = useRef<HTMLInputElement | null>(null)
  // Google Mapsインスタンスの参照
  const mapRef = useRef<google.maps.Map | null>(null)
  // 描画マネージャーの参照
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  // 情報ウィンドウの参照
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  // データレイヤーイベントリスナーの配列
  const dataLayerListenersRef = useRef<google.maps.MapsEventListener[]>([])
  // レイヤーツリーの参照（最新状態を保持）
  const treeRef = useRef<LayerTreeItem[]>(createInitialTree())
  // レイヤーツリーの状態
  const [tree, setTree] = useState<LayerTreeItem[]>(treeRef.current)
  // 現在選択されているレイヤーID
  const [activeLayerId, setActiveLayerId] = useState<string | null>(() => {
    const firstLayer = getAllLayers(treeRef.current)[0]
    return firstLayer?.id ?? null
  })
  // ステータスメッセージの状態
  const [status, setStatus] = useState<Status>(DEFAULT_STATUS)
  // レイヤーパネルの表示/非表示状態
  const [isLayerPanelVisible, setIsLayerPanelVisible] = useState(false)
  // 緒度経度検索ダイアログの表示状態
  const [isCoordinateSearchVisible, setIsCoordinateSearchVisible] = useState(false)
  // 住所検索ダイアログの表示状態
  const [isAddressSearchVisible, setIsAddressSearchVisible] = useState(false)
  // 凡例パネルの表示状態
  const [isLegendVisible, setIsLegendVisible] = useState(false)
  // ブックマークダイアログの表示状態
  const [isBookmarkVisible, setIsBookmarkVisible] = useState(false)
  // 印刷ダイアログの表示状態
  const [isPrintVisible, setIsPrintVisible] = useState(false)
  // 検索結果の一時マーカー
  const searchMarkerRef = useRef<google.maps.Marker | null>(null)
  // 認証ユーザー状態
  const [user, setUser] = useState<User | null>(null)
  // 認証初期化完了フラグ
  const [authInitialized, setAuthInitialized] = useState(false)

  // 環境変数からGoogle Maps APIキーを取得
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  // ツリーから全レイヤーを抽出（メモ化）
  const layers = useMemo(() => getAllLayers(tree), [tree])

  // ツリーが変更されたらtreeRefを更新
  useEffect(() => {
    treeRef.current = tree
  }, [tree])

  // 認証状態の監視
  useEffect(() => {
    let hasTriedAutoLogin = false
    
    // 認証状態の変更を監視
    const unsubscribe = onAuthChange((currentUser) => {
      const wasLoggedIn = user !== null
      setUser(currentUser)
      
      if (currentUser) {
        setStatus({
          type: 'success',
          message: `ログイン成功: ${currentUser.email}`,
        })
        setAuthInitialized(true)
      } else if (authInitialized && wasLoggedIn) {
        // ログアウト時の処理
        setStatus({
          type: 'info',
          message: 'ログアウトしました',
        })
        
        // レイヤー情報をクリア
        const newTree = createInitialTree()
        setTree(newTree)
        treeRef.current = newTree
        
        // 地図上のデータをクリア
        const map = mapRef.current
        if (map) {
          map.data.forEach((feature: google.maps.Data.Feature) => {
            map.data.remove(feature)
          })
        }
        
        // すべてのダイアログを閉じる
        setIsLayerPanelVisible(false)
        setIsCoordinateSearchVisible(false)
        setIsAddressSearchVisible(false)
        setIsLegendVisible(false)
        setIsBookmarkVisible(false)
        setIsPrintVisible(false)
        
        // 検索マーカーを削除
        if (searchMarkerRef.current) {
          searchMarkerRef.current.setMap(null)
          searchMarkerRef.current = null
        }
      } else if (!authInitialized && !currentUser && !hasTriedAutoLogin) {
        // 初回マウント時に自動ログインを試行（一度だけ）
        hasTriedAutoLogin = true
        setTimeout(() => {
          loginWithGoogle()
            .then(() => {
              // ログイン成功は onAuthChange で処理
            })
            .catch((error) => {
              // ポップアップブロックやキャンセルのエラーは静かに処理
              const errorCode = error.code || ''
              if (errorCode === 'auth/popup-blocked' || errorCode === 'auth/cancelled-popup-request') {
                setStatus({
                  type: 'info',
                  message: 'メニューからログインしてください',
                })
              } else if (error.message.includes('ポップアップ')) {
                setStatus({
                  type: 'info',
                  message: 'メニューからログインしてください',
                })
              } else {
                console.error('Auto login error:', error)
                setStatus({
                  type: 'info',
                  message: 'メニューからログインしてください',
                })
              }
              setAuthInitialized(true)
            })
        }, 500) // ポップアップブロック回避のため少し遅延
      }
    })

    return () => unsubscribe()
  }, [authInitialized, user])

  // レイヤーが変更されたらアクティブレイヤーを調整
  useEffect(() => {
    // レイヤーがない場合はアクティブレイヤーをクリア
    if (!layers.length) {
      setActiveLayerId(null)
      return
    }
    // アクティブレイヤーが無いか、存在しない場合は最初のレイヤーを選択
    if (!activeLayerId || !layers.some((layer) => layer.id === activeLayerId)) {
      setActiveLayerId(layers[0].id)
    }
  }, [layers, activeLayerId])

  // 現在アクティブなレイヤーを取得（メモ化）
  const activeLayer = useMemo(
    () => layers.find((layer) => layer.id === activeLayerId) ?? null,
    [layers, activeLayerId],
  )

  /**
   * データレイヤーのイベントリスナーを全て解除
   */
  const detachDataLayerListeners = useCallback(() => {
    // 登録されている全リスナーを削除
    dataLayerListenersRef.current.forEach((listener) => listener.remove())
    // リスナー配列を空にする
    dataLayerListenersRef.current = []
  }, [])

  /**
   * 地図上の全データレイヤーフィーチャを削除
   */
  const clearDataLayer = useCallback(() => {
    const map = mapRef.current
    if (!map) {
      return
    }
    // 地図のデータレイヤーから全フィーチャを削除
    map.data.forEach((feature: google.maps.Data.Feature) => {
      map.data.remove(feature)
    })
  }, [])

  /**
   * 地図上のレイヤーを再構築
   * 全フィーチャをクリアして、表示すべきレイヤーのみを再描画
   */
  const rebuildMapLayers = useCallback(
    (targetLayers: Layer[]) => {
      const map = mapRef.current
      if (!map) {
        return
      }
      // 既存のデータレイヤーをクリア
      clearDataLayer()
      // 各レイヤーを処理
      targetLayers.forEach((layer) => {
        // 非表示またはフィーチャがない場合はスキップ
        if (!layer.visible || !layer.features.length) {
          return
        }
        // GeoJSON FeatureCollectionを作成
        const collection: FeatureCollection = {
          type: 'FeatureCollection',
          // 各フィーチャにレイヤー情報を追加
          features: layer.features.map((feature) => ({
            ...feature,
            properties: {
              ...(feature.properties ?? {}),
              layerId: layer.id,
              name: feature.properties?.name ?? layer.name,
              strokeColor: layer.style.strokeColor,
              fillColor: layer.style.fillColor,
              fillOpacity: layer.style.fillOpacity,
            },
          })),
        }
        map.data.addGeoJson(collection)
      })
    },
    [clearDataLayer],
  )

  useEffect(() => {
    rebuildMapLayers(layers)
  }, [layers, rebuildMapLayers])

  /**
   * サンプルレイヤー読み込み
   * 初期状態のサンプルデータを読み込む
   */
  const loadSampleLayers = useCallback(() => {
    const sample = createInitialTree()
    setTree(sample)
    const allLayers = getAllLayers(sample)
    setActiveLayerId(allLayers[0]?.id ?? null)
    setStatus({ type: 'success', message: 'サンプルレイヤーを読み込みました。' })
  }, [])

  const attachDataLayerInteractions = useCallback(() => {
    const map = mapRef.current
    if (!map) {
      return
    }

    detachDataLayerListeners()

    map.data.setStyle((feature: google.maps.Data.Feature) => {
      const layerId = feature.getProperty('layerId') as string | undefined
      const allLayers = getAllLayers(treeRef.current)
      const layer = allLayers.find((entry) => entry.id === layerId)
      const strokeColor =
        (feature.getProperty('strokeColor') as string) ?? layer?.style.strokeColor ?? DEFAULT_LAYER_STYLE.strokeColor
      const strokeWidth =
        (feature.getProperty('strokeWidth') as number) ?? layer?.style.strokeWidth ?? DEFAULT_LAYER_STYLE.strokeWidth
      const fillColor =
        (feature.getProperty('fillColor') as string) ?? layer?.style.fillColor ?? DEFAULT_LAYER_STYLE.fillColor
      const fillOpacity =
        (feature.getProperty('fillOpacity') as number) ?? layer?.style.fillOpacity ?? DEFAULT_LAYER_STYLE.fillOpacity
      const pointSize =
        (feature.getProperty('pointSize') as number) ?? layer?.style.pointSize ?? DEFAULT_LAYER_STYLE.pointSize

      // アイコンの作成（ポイントの場合）
      const geometryType = feature.getGeometry()?.getType()
      let icon: google.maps.Icon | google.maps.Symbol | undefined

      if (geometryType === 'Point') {
        const pointShape = layer?.style.pointShape ?? DEFAULT_LAYER_STYLE.pointShape
        
        switch (pointShape) {
          case 'circle':
            icon = {
              path: google.maps.SymbolPath.CIRCLE,
              scale: pointSize / 2,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
              strokeColor: strokeColor,
              strokeWeight: strokeWidth,
            }
            break
          case 'square':
            // 正方形のSVGパス
            const size = pointSize
            icon = {
              path: `M -${size/2} -${size/2} L ${size/2} -${size/2} L ${size/2} ${size/2} L -${size/2} ${size/2} Z`,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
              strokeColor: strokeColor,
              strokeWeight: strokeWidth,
            }
            break
          case 'triangle':
            // 三角形のSVGパス
            const s = pointSize
            icon = {
              path: `M 0 -${s/1.5} L ${s/1.5} ${s/2} L -${s/1.5} ${s/2} Z`,
              fillColor: fillColor,
              fillOpacity: fillOpacity,
              strokeColor: strokeColor,
              strokeWeight: strokeWidth,
            }
            break
        }
      }

      return {
        fillColor,
        strokeColor,
        strokeWeight: strokeWidth,
        fillOpacity,
        icon,
      }
    })

    const listeners: google.maps.MapsEventListener[] = []
    const infoWindow = infoWindowRef.current ?? new google.maps.InfoWindow()
    infoWindowRef.current = infoWindow

    listeners.push(
      map.data.addListener('click', (event: google.maps.Data.MouseEvent) => {
        event.feature.toGeoJson((rawFeature) => {
          const featureGeoJson = rawFeature as Feature
          const props = (featureGeoJson.properties ?? {}) as Record<string, unknown>
          const name = props.name ?? '未設定'
          const description = props.description ?? '説明は未設定です。'
          const html = `
            <div class="info-window">
              <h4>${name}</h4>
              <p>${description}</p>
            </div>
          `
          infoWindow.setContent(html)
          infoWindow.setPosition(event.latLng)
          infoWindow.open(map)
        })
      }),
      map.data.addListener('mouseover', (event: google.maps.Data.MouseEvent) => {
        map.data.overrideStyle(event.feature, { strokeWeight: 4 })
      }),
      map.data.addListener('mouseout', () => {
        map.data.revertStyle()
      }),
    )

    dataLayerListenersRef.current = listeners
  }, [detachDataLayerListeners])

  const handleOverlayComplete = useCallback(
    (event: google.maps.drawing.OverlayCompleteEvent) => {
      const targetLayer = layers.find((layer) => layer.id === activeLayerId)
      if (!targetLayer) {
        setStatus({ type: 'error', message: '図形を追加するレイヤーが選択されていません。' })
        event.overlay?.setMap(null)
        return
      }

      const feature = convertOverlayToFeature(event)
      if (!feature) {
        setStatus({ type: 'error', message: 'GeoJSON へ変換できない図形です。' })
        event.overlay?.setMap(null)
        return
      }

      const featureWithMeta: Feature = {
        ...feature,
        properties: {
          ...feature.properties,
          name: feature.properties?.name ?? `${targetLayer.name} 図形`,
        },
      }

      setTree((prev) =>
        updateLayerInTree(prev, targetLayer.id, {
          features: [...targetLayer.features, featureWithMeta],
        }),
      )
      event.overlay?.setMap(null)
      setStatus({ type: 'success', message: `${targetLayer.name} に図形を追加しました。` })
    },
    [activeLayerId, layers],
  )

  const initializeDrawingManager = useCallback(() => {
    const map = mapRef.current
    if (!map) {
      return
    }

    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingControl: true,
      map,
      drawingMode: null,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.MARKER,
          google.maps.drawing.OverlayType.POLYGON,
          google.maps.drawing.OverlayType.POLYLINE,
          google.maps.drawing.OverlayType.RECTANGLE,
          google.maps.drawing.OverlayType.CIRCLE,
        ],
      },
      polygonOptions: {
        editable: false,
        fillColor: '#ffa726',
        fillOpacity: 0.5,
        strokeColor: '#fb8c00',
        strokeWeight: 2,
      },
      rectangleOptions: {
        fillColor: '#29b6f6',
        fillOpacity: 0.35,
        strokeColor: '#0288d1',
        strokeWeight: 2,
      },
      circleOptions: {
        fillColor: '#ab47bc',
        fillOpacity: 0.2,
        strokeColor: '#8e24aa',
        strokeWeight: 2,
        editable: false,
      },
    })

    drawingManager.addListener('overlaycomplete', handleOverlayComplete)
    drawingManagerRef.current = drawingManager
  }, [handleOverlayComplete])

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    if (!apiKey) {
      setStatus({ type: 'error', message: 'VITE_GOOGLE_MAPS_API_KEY が設定されていません。' })
      return
    }

    let isMounted = true
    setOptions({
      key: apiKey,
      v: 'weekly',
      libraries: ['drawing'],
    })

    setStatus({ type: 'info', message: 'Google Maps API を読み込んでいます…' })

    Promise.all([
      importLibrary('maps'),
      importLibrary('drawing'),
    ])
      .then(() => {
        if (!isMounted || !containerRef.current) {
          return
        }

        const map = new google.maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 15,
          mapId: MAP_ID,
          streetViewControl: false,
          fullscreenControl: false,
        })

        mapRef.current = map
        infoWindowRef.current = new google.maps.InfoWindow()

        attachDataLayerInteractions()
        initializeDrawingManager()
        rebuildMapLayers(layers)
        setStatus({ type: 'success', message: '地図の準備が整いました。自由に作図してください。' })
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        setStatus({ type: 'error', message: `Google Maps API の読み込みに失敗しました: ${message}` })
      })

    return () => {
      isMounted = false
      detachDataLayerListeners()
      drawingManagerRef.current?.setMap(null)
      infoWindowRef.current?.close()
    }
  }, [apiKey, attachDataLayerInteractions, detachDataLayerListeners, initializeDrawingManager, rebuildMapLayers])

  /**
   * GeoJSON保存
   * 選択中のレイヤーをGeoJSON形式でエクスポート
   */
  const handleSaveGeoJson = useCallback(() => {
    if (!activeLayer) {
      setStatus({ type: 'error', message: '保存対象のレイヤーが選択されていません。' })
      return
    }
    if (!activeLayer.features.length) {
      setStatus({ type: 'info', message: `${activeLayer.name} にはまだ図形がありません。` })
      return
    }

    const featureCollection: FeatureCollection = {
      type: 'FeatureCollection',
      features: activeLayer.features,
    }
    const serialized = JSON.stringify(featureCollection, null, 2)
    const blob = new Blob([serialized], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)
    const safeName = activeLayer.name.replace(/[^a-zA-Z0-9_-]+/g, '_') || 'layer'
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeName}-${timestamp}.geojson`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus({ type: 'success', message: `${activeLayer.name} を GeoJSON として保存しました。` })
  }, [activeLayer])

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result
        if (typeof text !== 'string') {
          throw new Error('ファイル内容を読み取れませんでした。')
        }

        const parsed = JSON.parse(text)
        const normalized = normalizeGeoJson(parsed)
        if (!normalized) {
          throw new Error('GeoJSON 形式ではありません。')
        }

        if (!activeLayer) {
          throw new Error('読み込み先のレイヤーが選択されていません。')
        }

        const features = Array.isArray(normalized) ? normalized : [normalized]
        setTree((prev) =>
          updateLayerInTree(prev, activeLayer.id, {
            features: [...activeLayer.features, ...features],
          }),
        )
        setStatus({ type: 'success', message: `${activeLayer.name} に ${features.length} 件のフィーチャを追加しました。` })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'GeoJSON の読み込みに失敗しました。'
        setStatus({ type: 'error', message })
      } finally {
        if (event.target) {
          event.target.value = ''
        }
      }
    }

    reader.readAsText(file)
  }, [activeLayer])

  /**
   * レイヤークリア
   * 選択中のレイヤーの全フィーチャを削除（確認ダイアログ付き）
   */
  const handleClearLayer = useCallback(() => {
    if (!activeLayer) {
      setStatus({ type: 'error', message: 'クリア対象のレイヤーが選択されていません。' })
      return
    }
    
    // 確認ダイアログを表示
    const confirmed = window.confirm(`「${activeLayer.name}」の全てのフィーチャを削除しますか?この操作は取り消せません。`)
    if (!confirmed) {
      return
    }
    
    setTree((prev) =>
      updateLayerInTree(prev, activeLayer.id, { features: [] }),
    )
    setStatus({ type: 'info', message: `${activeLayer.name} をクリアしました。` })
  }, [activeLayer])

  const handleAddLayer = useCallback((name: string, parentId: string | null) => {
    const allLayers = getAllLayers(treeRef.current)
    const layerName = name || `レイヤー${allLayers.length + 1}`
    const newLayer: LayerTreeItem = {
      id: generateId(),
      name: layerName,
      visible: true,
      type: 'layer',
      style: { ...DEFAULT_LAYER_STYLE },
      features: [],
    }
    setTree((prev) => addItem(prev, parentId, newLayer))
    setActiveLayerId(newLayer.id)
    setStatus({ type: 'success', message: `${layerName} を追加しました。` })
  }, [])

  const handleAddNode = useCallback((name: string, parentId: string | null) => {
    const nodeName = name || `ノード${tree.length + 1}`
    const newNode: LayerTreeItem = {
      id: generateId(),
      name: nodeName,
      visible: true,
      type: 'node',
      children: [],
    }
    setTree((prev) => addItem(prev, parentId, newNode))
    setStatus({ type: 'success', message: `${nodeName} を追加しました。` })
  }, [tree.length])

  const handleDeleteItem = useCallback((itemId: string) => {
    setTree((prev) => removeItem(prev, itemId))
    setStatus({ type: 'info', message: 'アイテムを削除しました。' })
    setActiveLayerId((current) => (current === itemId ? null : current))
  }, [])

  const handleToggleItem = useCallback((itemId: string) => {
    setTree((prev) => toggleItemVisibility(prev, itemId))
  }, [])

  const handleUpdateLayerData = useCallback(
    (layerId: string, updates: { name?: string; style?: Partial<LayerStyle> }) => {
      setTree((prev) => {
        const layer = getAllLayers(prev).find((l) => l.id === layerId)
        if (!layer) return prev
        
        return updateLayerInTree(prev, layerId, {
          name: updates.name ?? layer.name,
          style: updates.style ? { ...layer.style, ...updates.style } : layer.style,
        })
      })
    },
    [],
  )

  const handleUpdateNodeData = useCallback((nodeId: string, updates: { name?: string }) => {
    setTree((prev) => updateNode(prev, nodeId, updates))
  }, [])

  const handleMoveItem = useCallback(
    (sourceId: string, targetParentId: string | null, targetIndex?: number) => {
      setTree((prev) => moveItem(prev, sourceId, targetParentId, targetIndex))
      setStatus({ type: 'success', message: 'アイテムを移動しました。' })
    },
    [],
  )

  const handleSaveLayerList = useCallback(() => {
    // 最新のtreeステートを使用してノード情報も含めて保存
    const currentTree = treeRef.current
    if (!currentTree.length) {
      setStatus({ type: 'info', message: '保存対象のツリーがありません。' })
      return
    }

    const payload: LayerCollectionFile = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tree: currentTree,
    }

    const serialized = JSON.stringify(payload, null, 2)
    const blob = new Blob([serialized], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `prj-layer-list-${timestamp}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus({ type: 'success', message: 'レイヤー一覧を保存しました。' })
  }, [])

  const handleLoadLayerList = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result
        if (typeof text !== 'string') {
          throw new Error('ファイルを読み取れませんでした。')
        }
        const parsed = JSON.parse(text) as any
        
        // バージョン2.0の形式をチェック
        if (parsed.version === '2.0' && parsed.tree && Array.isArray(parsed.tree)) {
          setTree(parsed.tree as LayerTreeItem[])
          const allLayers = getAllLayers(parsed.tree)
          setActiveLayerId(allLayers[0]?.id ?? null)
          setStatus({ type: 'success', message: `ツリーを読み込みました。` })
        } else if (parsed.layers && Array.isArray(parsed.layers)) {
          // 旧バージョン(1.0)の互換性
          const restoredTree: LayerTreeItem[] = parsed.layers.map((layer: any, index: number) => ({
            id: layer.id ?? generateId(),
            name: layer.name ?? `インポートレイヤー${index + 1}`,
            visible: typeof layer.visible === 'boolean' ? layer.visible : true,
            type: 'layer' as const,
            style: {
              strokeColor: layer.style?.strokeColor ?? DEFAULT_LAYER_STYLE.strokeColor,
              strokeWidth: layer.style?.strokeWidth ?? DEFAULT_LAYER_STYLE.strokeWidth,
              strokeStyle: layer.style?.strokeStyle ?? DEFAULT_LAYER_STYLE.strokeStyle,
              fillColor: layer.style?.fillColor ?? DEFAULT_LAYER_STYLE.fillColor,
              fillOpacity: layer.style?.fillOpacity ?? DEFAULT_LAYER_STYLE.fillOpacity,
              pointSize: layer.style?.pointSize ?? DEFAULT_LAYER_STYLE.pointSize,
              pointShape: layer.style?.pointShape ?? DEFAULT_LAYER_STYLE.pointShape,
            },
            features: Array.isArray(layer.features)
              ? layer.features.map((feature: Feature) => cloneFeature(feature))
              : [],
          }))
          setTree(restoredTree)
          const allLayers = getAllLayers(restoredTree)
          setActiveLayerId(allLayers[0]?.id ?? null)
          setStatus({ type: 'success', message: `レイヤーを ${allLayers.length} 件読み込みました。` })
        } else {
          throw new Error('ファイルの形式が不正です。')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'レイヤー一覧の読み込みに失敗しました。'
        setStatus({ type: 'error', message })
      }
    }

    reader.readAsText(file)
  }, [])

  const handleSelectLayer = useCallback((layerId: string) => {
    setActiveLayerId(layerId)
    const layer = layers.find((entry) => entry.id === layerId)
    if (layer) {
      setStatus({ type: 'info', message: `${layer.name} を編集中です。` })
    }
  }, [layers])

  /**
   * GeoJSONインポート
   * ファイル選択ダイアログを開く
   */
  const triggerGeoJsonDialog = useCallback(() => {
    geoJsonFileInputRef.current?.click()
  }, [])

  const handleToggleLayerPanel = useCallback(() => {
    setIsLayerPanelVisible((prev) => !prev)
  }, [])

  /**
   * ブックマークダイアログを表示
   */
  const handleShowBookmark = useCallback(() => {
    setIsBookmarkVisible(true)
  }, [])

  /**
   * ブックマークを選択して地図を移動
   */
  const handleSelectBookmark = useCallback((lat: number, lng: number, zoom: number) => {
    const map = mapRef.current
    if (!map) {
      return
    }

    // 地図を指定座標に移動
    map.setCenter({ lat, lng })
    map.setZoom(zoom)

    setStatus({ 
      type: 'success', 
      message: 'ブックマークの位置に移動しました。' 
    })
  }, [])

  /**
   * 緯度経度検索ダイアログを表示
   */
  const handleShowCoordinateSearch = useCallback(() => {
    setIsCoordinateSearchVisible(true)
  }, [])

  /**
   * 緯度経度検索実行
   * @param lat - 緯度
   * @param lng - 経度
   */
  const handleCoordinateSearch = useCallback((lat: number, lng: number) => {
    const map = mapRef.current
    if (!map) {
      return
    }

    // 地図を指定座標に移動
    const position = { lat, lng }
    map.setCenter(position)
    map.setZoom(15)

    // 既存のマーカーを削除
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null)
    }

    // 新しいマーカーを表示
    searchMarkerRef.current = new google.maps.Marker({
      position,
      map,
      title: `緯度: ${lat.toFixed(6)}, 経度: ${lng.toFixed(6)}`,
      animation: google.maps.Animation.DROP,
    })

    setStatus({ 
      type: 'success', 
      message: `緯度: ${lat.toFixed(6)}, 経度: ${lng.toFixed(6)} に移動しました。` 
    })
  }, [])

  /**
   * 住所検索ダイアログを表示
   */
  const handleShowAddressSearch = useCallback(() => {
    setIsAddressSearchVisible(true)
  }, [])

  /**
   * 住所検索実行
   * @param lat - 緒度
   * @param lng - 経度
   * @param address - 検索した住所
   */
  const handleAddressSearch = useCallback((lat: number, lng: number, address: string) => {
    const map = mapRef.current
    if (!map) {
      return
    }

    // 地図を指定座標に移動
    const position = { lat, lng }
    map.setCenter(position)
    map.setZoom(16)

    // 既存のマーカーを削除
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null)
    }

    // 新しいマーカーを表示
    searchMarkerRef.current = new google.maps.Marker({
      position,
      map,
      title: address,
      animation: google.maps.Animation.DROP,
    })

    // 情報ウィンドウを表示
    if (infoWindowRef.current) {
      infoWindowRef.current.close()
    }
    infoWindowRef.current = new google.maps.InfoWindow({
      content: `<div style="padding: 8px;"><strong>${address}</strong><br>緒度: ${lat.toFixed(6)}<br>経度: ${lng.toFixed(6)}</div>`,
    })
    infoWindowRef.current.open(map, searchMarkerRef.current)

    setStatus({ 
      type: 'success', 
      message: `「${address}」を見つけました。` 
    })
  }, [])

  /**
   * 凡例パネルを表示/非表示
   */
  const handleShowLegend = useCallback(() => {
    setIsLegendVisible((prev) => !prev)
  }, [])

  /**
   * 印刷ダイアログを表示
   */
  const handleShowPrint = useCallback(() => {
    setIsPrintVisible(true)
  }, [])

  /**
   * 印刷実行
   */
  const handlePrint = useCallback((_title: string, _includeDate: boolean, _includeLegend: boolean) => {
    // 印刷情報をステータスに設定
    setStatus({ 
      type: 'info', 
      message: `印刷プレビューを開きます。ブラウザの印刷ダイアログからPDFとして保存できます。` 
    })
    
    // 印刷ダイアログを表示
    setTimeout(() => {
      window.print()
    }, 100)
  }, [])

  /**
   * ログイン処理
   */
  const handleLogin = useCallback(async () => {
    try {
      await loginWithGoogle()
      // 成功時は onAuthChange で処理
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `ログインエラー: ${error.message}`,
      })
    }
  }, [])

  /**
   * ログアウト処理
   */
  const handleLogout = useCallback(async () => {
    try {
      await logoutUser()
      // 成功時は onAuthChange で処理
    } catch (error: any) {
      setStatus({
        type: 'error',
        message: `ログアウトエラー: ${error.message}`,
      })
    }
  }, [])

  return (
    <div className="map-wrapper">
      <div className="map-canvas" ref={containerRef} aria-label="GIS マップ" role="application" />

      <MenuBar
        onToggleLayerPanel={handleToggleLayerPanel}
        onSaveLayerList={handleSaveLayerList}
        onLoadLayerList={handleLoadLayerList}
        onLoadGeoJson={triggerGeoJsonDialog}
        onSaveGeoJson={handleSaveGeoJson}
        onClearLayer={handleClearLayer}
        onLoadSample={loadSampleLayers}
        onShowBookmark={handleShowBookmark}
        onShowCoordinateSearch={handleShowCoordinateSearch}
        onShowAddressSearch={handleShowAddressSearch}
        onPrint={handleShowPrint}
        onShowLegend={handleShowLegend}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {isLayerPanelVisible && (
        <LayerPanel
          tree={tree}
          activeLayerId={activeLayerId}
          onSelectLayer={handleSelectLayer}
          onAddLayer={handleAddLayer}
          onAddNode={handleAddNode}
          onDeleteItem={handleDeleteItem}
          onToggleItem={handleToggleItem}
          onUpdateLayer={handleUpdateLayerData}
          onUpdateNode={handleUpdateNodeData}
          onMoveItem={handleMoveItem}
          onClose={handleToggleLayerPanel}
        />
      )}

      {isCoordinateSearchVisible && (
        <CoordinateSearchDialog
          onClose={() => setIsCoordinateSearchVisible(false)}
          onSearch={handleCoordinateSearch}
        />
      )}

      {isAddressSearchVisible && (
        <AddressSearchDialog
          onClose={() => setIsAddressSearchVisible(false)}
          onSearch={handleAddressSearch}
        />
      )}

      {isLegendVisible && (
        <LegendPanel
          layers={layers}
          onClose={() => setIsLegendVisible(false)}
        />
      )}

      {isBookmarkVisible && (
        <BookmarkDialog
          currentPosition={mapRef.current ? { 
            lat: mapRef.current.getCenter()?.lat() ?? DEFAULT_CENTER.lat, 
            lng: mapRef.current.getCenter()?.lng() ?? DEFAULT_CENTER.lng 
          } : DEFAULT_CENTER}
          currentZoom={mapRef.current?.getZoom() ?? 12}
          onClose={() => setIsBookmarkVisible(false)}
          onSelectBookmark={handleSelectBookmark}
        />
      )}

      {isPrintVisible && (
        <PrintDialog
          onClose={() => setIsPrintVisible(false)}
          onPrint={handlePrint}
        />
      )}

      <input
        type="file"
        accept=".json,.geojson,application/geo+json"
        ref={geoJsonFileInputRef}
        onChange={handleFileChange}
        className="file-input"
      />

      <p className={`status-banner status-${status.type}`}>{status.message}</p>
    </div>
  )
}

export default MapCanvas
