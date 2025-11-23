/**
 * GeoJSONユーティリティ
 * Google Maps図形とGeoJSON形式の相互変換を提供
 */
import type { Feature, FeatureCollection, Geometry, Position } from 'geojson'

/** 円形ポリゴン近似に使用する地球半径（メートル） */
const EARTH_RADIUS_IN_METERS = 6_378_137

/**
 * フィーチャIDを生成
 * @returns ユニークなフィーチャID
 */
const createFeatureId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `feature-${Date.now()}`

/**
 * Google MapsのパスをGeoJSON LinearRingに変換
 * @param path Google MapsのLatLng配列
 * @returns GeoJSON Position配列（閉じたリング）
 */
const pathToLinearRing = (path: google.maps.MVCArray<google.maps.LatLng>): Position[] => {
  const coordinates: Position[] = []
  path.forEach((latLng) => {
    coordinates.push([latLng.lng(), latLng.lat()])
  })

  if (coordinates.length) {
    const [firstLng, firstLat] = coordinates[0]
    const [lastLng, lastLat] = coordinates[coordinates.length - 1]
    if (firstLng !== lastLng || firstLat !== lastLat) {
      coordinates.push([firstLng, firstLat])
    }
  }

  return coordinates
}

/**
 * Google Maps円をGeoJSONポリゴンに変換
 * @param circle Google Maps円オブジェクト
 * @param segments ポリゴンの辺数（デフォルト48）
 * @returns GeoJSON Polygon座標配列
 */
const circleToPolygon = (
  circle: google.maps.Circle,
  segments = 48,
): Position[][] => {
  const center = circle.getCenter()
  if (!center) {
    return []
  }

  const radius = circle.getRadius()
  const lat = (center.lat() * Math.PI) / 180
  const lng = (center.lng() * Math.PI) / 180
  const coordinates: Position[] = []

  for (let i = 0; i <= segments; i += 1) {
    const angle = (2 * Math.PI * i) / segments
    const latOffset = (radius / EARTH_RADIUS_IN_METERS) * Math.cos(angle)
    const lngOffset =
      (radius / EARTH_RADIUS_IN_METERS) * Math.sin(angle) / Math.cos(lat)

    const pointLat = lat + latOffset
    const pointLng = lng + lngOffset

    coordinates.push([
      (pointLng * 180) / Math.PI,
      (pointLat * 180) / Math.PI,
    ])
  }

  return [coordinates]
}

/**
 * Google Maps矩形をGeoJSONポリゴンに変換
 * @param rectangle Google Maps矩形オブジェクト
 * @returns GeoJSON Polygon座標配列
 */
const rectangleToPolygon = (rectangle: google.maps.Rectangle): Position[][] => {
  const bounds = rectangle.getBounds()
  if (!bounds) {
    return []
  }

  const northEast = bounds.getNorthEast()
  const southWest = bounds.getSouthWest()
  if (!northEast || !southWest) {
    return []
  }

  const northWest: Position = [southWest.lng(), northEast.lat()]
  const southEast: Position = [northEast.lng(), southWest.lat()]

  const ring: Position[] = [
    [southWest.lng(), southWest.lat()],
    southEast,
    [northEast.lng(), northEast.lat()],
    northWest,
    [southWest.lng(), southWest.lat()],
  ]

  return [ring]
}

/**
 * Google Mapsポリラインを座標配列に変換
 * @param polyline Google Mapsポリラインオブジェクト
 * @returns GeoJSON Position配列
 */
const polylineToCoordinates = (
  polyline: google.maps.Polyline,
): Position[] => {
  const path = polyline.getPath()
  const positions: Position[] = []
  path.forEach((latLng) => {
    positions.push([latLng.lng(), latLng.lat()])
  })
  return positions
}

/**
 * Google Mapsポリゴンを座標配列に変換
 * @param polygon Google Mapsポリゴンオブジェクト
 * @returns GeoJSON Polygon座標配列
 */
const polygonToCoordinates = (
  polygon: google.maps.Polygon,
): Position[][] => {
  const rings: Position[][] = []
  const paths = polygon.getPaths()

  paths.forEach((path) => {
    const ring = pathToLinearRing(path)
    if (ring.length >= 4) {
      rings.push(ring)
    }
  })

  return rings
}

/**
 * Google Maps描画イベントをGeoJSONフィーチャに変換
 * @param event Google Maps描画完了イベント
 * @returns GeoJSON Feature、変換できない場合はnull
 */
export const convertOverlayToFeature = (
  event: google.maps.drawing.OverlayCompleteEvent,
): Feature | null => {
  const overlay = event.overlay
  if (!overlay) {
    return null
  }

  const geometry: Geometry | null = (() => {
    switch (event.type) {
      case google.maps.drawing.OverlayType.MARKER:
      case 'marker': {
        if (!(overlay instanceof google.maps.Marker)) {
          return null
        }
        const position = overlay.getPosition()
        if (!position) {
          return null
        }
        return {
          type: 'Point',
          coordinates: [position.lng(), position.lat()],
        }
      }
      case google.maps.drawing.OverlayType.POLYLINE:
      case 'polyline': {
        if (!(overlay instanceof google.maps.Polyline)) {
          return null
        }
        const coordinates = polylineToCoordinates(overlay)
        if (coordinates.length < 2) {
          return null
        }
        return {
          type: 'LineString',
          coordinates,
        }
      }
      case google.maps.drawing.OverlayType.POLYGON:
      case 'polygon': {
        if (!(overlay instanceof google.maps.Polygon)) {
          return null
        }
        const coordinates = polygonToCoordinates(overlay)
        if (!coordinates.length) {
          return null
        }
        return {
          type: 'Polygon',
          coordinates,
        }
      }
      case google.maps.drawing.OverlayType.RECTANGLE:
      case 'rectangle': {
        if (!(overlay instanceof google.maps.Rectangle)) {
          return null
        }
        const coordinates = rectangleToPolygon(overlay)
        if (!coordinates.length) {
          return null
        }
        return {
          type: 'Polygon',
          coordinates,
        }
      }
      case google.maps.drawing.OverlayType.CIRCLE:
      case 'circle': {
        if (!(overlay instanceof google.maps.Circle)) {
          return null
        }
        const coordinates = circleToPolygon(overlay)
        if (!coordinates.length) {
          return null
        }
        return {
          type: 'Polygon',
          coordinates,
        }
      }
      default:
        return null
    }
  })()

  if (!geometry) {
    return null
  }

  return {
    type: 'Feature',
    id: createFeatureId(),
    geometry,
    properties: {
      source: 'drawing',
      drawingType: event.type,
      createdAt: new Date().toISOString(),
    },
  }
}

/**
 * GeoJSONデータを正規化
 * FeatureCollectionまたはFeatureを統一された形式に変換
 * @param raw 生のGeoJSONデータ
 * @returns 正規化されたFeatureまたは配列、無効な場合はnull
 */
export const normalizeGeoJson = (raw: unknown): Feature | Feature[] | null => {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  if ('type' in raw && raw.type === 'FeatureCollection' && 'features' in raw) {
    const collection = raw as FeatureCollection
    return collection.features
  }

  if ('type' in raw && raw.type === 'Feature') {
    return raw as Feature
  }

  if (Array.isArray(raw)) {
    return raw as Feature[]
  }

  return null
}
