/**
 * レイヤー型定義
 * GISマップアプリケーションで使用するレイヤーとノードの型を定義
 */
import type { Feature } from 'geojson'

/**
 * レイヤースタイル
 * 地図上に表示される図形のビジュアルスタイルを定義
 */
export type LayerStyle = {
  /** 線の色（HEX形式） */
  strokeColor: string
  /** 線の太さ（ピクセル） */
  strokeWidth: number
  /** 線のスタイル */
  strokeStyle: 'solid' | 'dashed' | 'dotted'
  /** 塗りつぶしの色（HEX形式） */
  fillColor: string
  /** 塗りつぶしの不透明度（0-1） */
  fillOpacity: number
  /** ポイントのサイズ（ピクセル） */
  pointSize: number
  /** ポイントの形状 */
  pointShape: 'circle' | 'square' | 'triangle'
}

/**
 * レイヤー
 * GeoJSON形式のフィーチャを含むレイヤー
 */
export type Layer = {
  /** レイヤーの一意識別子 */
  id: string
  /** レイヤー名 */
  name: string
  /** 表示/非表示フラグ */
  visible: boolean
  /** レイヤーのビジュアルスタイル */
  style: LayerStyle
  /** GeoJSONフィーチャの配列 */
  features: Feature[]
}

/**
 * レイヤーノード
 * 子要素を持つフォルダ的な存在
 */
export type LayerNode = {
  /** ノードの一意識別子 */
  id: string
  /** ノード名 */
  name: string
  /** 表示/非表示フラグ（子要素に伝播） */
  visible: boolean
  /** ノード型を示す識別子 */
  type: 'node'
  /** 子要素（レイヤーまたはノード） */
  children: LayerTreeItem[]
}

/**
 * レイヤーツリーアイテム
 * ツリー構造を構成するノードまたはレイヤー
 */
export type LayerTreeItem = LayerNode | (Layer & { type: 'layer' })

/**
 * レイヤーコレクションファイル
 * レイヤーツリー全体を保存/読み込みする際の形式
 */
export type LayerCollectionFile = {
  /** ファイルフォーマットのバージョン */
  version: '2.0'
  /** エクスポート日時（ISO8601形式） */
  exportedAt: string
  /** レイヤーツリーの構造 */
  tree: LayerTreeItem[]
}
