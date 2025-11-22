import { importLibrary, setOptions } from '@googlemaps/js-api-loader'
import type { Feature, FeatureCollection } from 'geojson'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import LayerPanel from './LayerPanel'
import { convertOverlayToFeature, normalizeGeoJson } from '../utils/geojson'
import { defaultLayers } from '../data/sampleLayer'
import type { Layer, LayerCollectionFile, LayerStyle } from '../types/layer'

const DEFAULT_CENTER = { lat: 35.681236, lng: 139.767125 }
const MAP_ID = 'PRJ-GIS-WEBAPP'
const DEFAULT_LAYER_STYLE: LayerStyle = {
  strokeColor: '#0f60ff',
  fillColor: '#38bdf8',
  fillOpacity: 0.35,
}

const cloneFeature = <T extends Feature>(feature: T): T =>
  JSON.parse(JSON.stringify(feature)) as T

const createInitialLayers = (): Layer[] =>
  defaultLayers.map((layer) => ({
    ...layer,
    features: layer.features.map((feature) => cloneFeature(feature)),
  }))

const generateLayerId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `layer-${Date.now()}-${Math.random().toString(16).slice(2)}`

type Status = {
  type: 'info' | 'success' | 'error'
  message: string
}

const DEFAULT_STATUS: Status = {
  type: 'info',
  message: 'Google Maps API の初期化を待機しています…',
}

const MapCanvas = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const geoJsonFileInputRef = useRef<HTMLInputElement | null>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const dataLayerListenersRef = useRef<google.maps.MapsEventListener[]>([])
  const layersRef = useRef<Layer[]>(createInitialLayers())
  const [layers, setLayers] = useState<Layer[]>(layersRef.current)
  const [activeLayerId, setActiveLayerId] = useState<string | null>(
    layersRef.current[0]?.id ?? null,
  )
  const [status, setStatus] = useState<Status>(DEFAULT_STATUS)

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  useEffect(() => {
    layersRef.current = layers
  }, [layers])

  useEffect(() => {
    if (!layers.length) {
      setActiveLayerId(null)
      return
    }
    if (!activeLayerId || !layers.some((layer) => layer.id === activeLayerId)) {
      setActiveLayerId(layers[0].id)
    }
  }, [layers, activeLayerId])

  const activeLayer = useMemo(
    () => layers.find((layer) => layer.id === activeLayerId) ?? null,
    [layers, activeLayerId],
  )

  const detachDataLayerListeners = useCallback(() => {
    dataLayerListenersRef.current.forEach((listener) => listener.remove())
    dataLayerListenersRef.current = []
  }, [])

  const clearDataLayer = useCallback(() => {
    const map = mapRef.current
    if (!map) {
      return
    }
    map.data.forEach((feature: google.maps.Data.Feature) => {
      map.data.remove(feature)
    })
  }, [])

  const rebuildMapLayers = useCallback(
    (targetLayers: Layer[]) => {
      const map = mapRef.current
      if (!map) {
        return
      }
      clearDataLayer()
      targetLayers.forEach((layer) => {
        if (!layer.visible || !layer.features.length) {
          return
        }
        const collection: FeatureCollection = {
          type: 'FeatureCollection',
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

  const loadSampleLayers = useCallback(() => {
    const sample = createInitialLayers()
    setLayers(sample)
    setActiveLayerId(sample[0]?.id ?? null)
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
      const layer = layersRef.current.find((entry) => entry.id === layerId)
      const strokeColor =
        (feature.getProperty('strokeColor') as string) ?? layer?.style.strokeColor ?? DEFAULT_LAYER_STYLE.strokeColor
      const fillColor =
        (feature.getProperty('fillColor') as string) ?? layer?.style.fillColor ?? DEFAULT_LAYER_STYLE.fillColor
      const fillOpacity =
        (feature.getProperty('fillOpacity') as number) ?? layer?.style.fillOpacity ?? DEFAULT_LAYER_STYLE.fillOpacity

      return {
        fillColor,
        strokeColor,
        strokeWeight: 2,
        fillOpacity,
        icon: {
          url: 'https://maps.gstatic.com/mapfiles/api-3/images/spotlight-poi3.png',
        },
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
      const targetLayer = layersRef.current.find((layer) => layer.id === activeLayerId)
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

      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === targetLayer.id
            ? { ...layer, features: [...layer.features, featureWithMeta] }
            : layer,
        ),
      )
      event.overlay?.setMap(null)
      setStatus({ type: 'success', message: `${targetLayer.name} に図形を追加しました。` })
    },
    [activeLayerId],
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
        rebuildMapLayers(layersRef.current)
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
        setLayers((prev) =>
          prev.map((entry) =>
            entry.id === activeLayer.id
              ? { ...entry, features: [...entry.features, ...features] }
              : entry,
          ),
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

  const handleClearLayer = useCallback(() => {
    if (!activeLayer) {
      setStatus({ type: 'error', message: 'クリア対象のレイヤーが選択されていません。' })
      return
    }
    setLayers((prev) =>
      prev.map((entry) => (entry.id === activeLayer.id ? { ...entry, features: [] } : entry)),
    )
    setStatus({ type: 'info', message: `${activeLayer.name} をクリアしました。` })
  }, [activeLayer])

  const handleAddLayer = useCallback((name: string) => {
    const layerName = name || `レイヤー${layersRef.current.length + 1}`
    const newLayer: Layer = {
      id: generateLayerId(),
      name: layerName,
      visible: true,
      style: { ...DEFAULT_LAYER_STYLE },
      features: [],
    }
    setLayers((prev) => [...prev, newLayer])
    setActiveLayerId(newLayer.id)
    setStatus({ type: 'success', message: `${layerName} を追加しました。` })
  }, [])

  const handleDeleteLayer = useCallback((layerId: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== layerId))
    setStatus({ type: 'info', message: 'レイヤーを削除しました。' })
    setActiveLayerId((current) => (current === layerId ? null : current))
  }, [])

  const handleToggleLayer = useCallback((layerId: string) => {
    setLayers((prev) =>
      prev.map((layer) => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer)),
    )
  }, [])

  const handleUpdateLayer = useCallback(
    (layerId: string, updates: { name?: string; style?: Partial<LayerStyle> }) => {
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === layerId
            ? {
                ...layer,
                name: updates.name ?? layer.name,
                style: updates.style ? { ...layer.style, ...updates.style } : layer.style,
              }
            : layer,
        ),
      )
    },
    [],
  )

  const handleSaveLayerList = useCallback(() => {
    if (!layersRef.current.length) {
      setStatus({ type: 'info', message: '保存対象のレイヤーがありません。' })
      return
    }

    const payload: LayerCollectionFile = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      layers: layersRef.current.map((layer) => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        style: layer.style,
        features: layer.features,
      })),
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
        const parsed = JSON.parse(text) as Partial<LayerCollectionFile>
        if (!parsed.layers || !Array.isArray(parsed.layers)) {
          throw new Error('レイヤー一覧ファイルの形式が不正です。')
        }

        const restored: Layer[] = parsed.layers.map((layer, index) => ({
          id: layer.id ?? generateLayerId(),
          name: layer.name ?? `インポートレイヤー${index + 1}`,
          visible: typeof layer.visible === 'boolean' ? layer.visible : true,
          style: {
            strokeColor: layer.style?.strokeColor ?? DEFAULT_LAYER_STYLE.strokeColor,
            fillColor: layer.style?.fillColor ?? DEFAULT_LAYER_STYLE.fillColor,
            fillOpacity: layer.style?.fillOpacity ?? DEFAULT_LAYER_STYLE.fillOpacity,
          },
          features: Array.isArray(layer.features)
            ? layer.features.map((feature) => cloneFeature(feature))
            : [],
        }))

        setLayers(restored)
        setActiveLayerId(restored[0]?.id ?? null)
        setStatus({ type: 'success', message: `レイヤー一覧を ${restored.length} 件読み込みました。` })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'レイヤー一覧の読み込みに失敗しました。'
        setStatus({ type: 'error', message })
      }
    }

    reader.readAsText(file)
  }, [])

  const handleSelectLayer = useCallback((layerId: string) => {
    setActiveLayerId(layerId)
    const layer = layersRef.current.find((entry) => entry.id === layerId)
    if (layer) {
      setStatus({ type: 'info', message: `${layer.name} を編集中です。` })
    }
  }, [])

  const triggerGeoJsonDialog = useCallback(() => {
    geoJsonFileInputRef.current?.click()
  }, [])

  return (
    <div className="map-wrapper">
      <div className="map-canvas" ref={containerRef} aria-label="GIS マップ" role="application" />

      <LayerPanel
        layers={layers}
        activeLayerId={activeLayerId}
        onSelectLayer={handleSelectLayer}
        onAddLayer={handleAddLayer}
        onDeleteLayer={handleDeleteLayer}
        onToggleLayer={handleToggleLayer}
        onUpdateLayer={handleUpdateLayer}
        onSaveLayerList={handleSaveLayerList}
        onLoadLayerList={handleLoadLayerList}
      />

      <div className="map-toolbar">
        <button type="button" onClick={handleSaveGeoJson}>
          選択レイヤーを保存
        </button>
        <button type="button" onClick={triggerGeoJsonDialog}>
          GeoJSON を読み込み
        </button>
        <button type="button" onClick={handleClearLayer}>
          選択レイヤーをクリア
        </button>
        <button type="button" onClick={loadSampleLayers}>
          サンプル読込
        </button>
        <input
          type="file"
          accept=".json,.geojson,application/geo+json"
          ref={geoJsonFileInputRef}
          onChange={handleFileChange}
          className="file-input"
        />
      </div>

      <p className={`status-banner status-${status.type}`}>{status.message}</p>
    </div>
  )
}

export default MapCanvas
