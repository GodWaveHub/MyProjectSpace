import type { Feature } from 'geojson'

export type LayerStyle = {
  strokeColor: string
  fillColor: string
  fillOpacity: number
}

export type Layer = {
  id: string
  name: string
  visible: boolean
  style: LayerStyle
  features: Feature[]
}

export type LayerCollectionFile = {
  version: '1.0'
  exportedAt: string
  layers: Array<{
    id: string
    name: string
    visible: boolean
    style: LayerStyle
    features: Feature[]
  }>
}
