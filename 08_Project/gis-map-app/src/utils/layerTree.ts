/**
 * レイヤーツリーユーティリティ
 * レイヤーツリーの操作・検索・更新機能を提供
 */
import type { Layer, LayerTreeItem } from '../types/layer'

/**
 * ツリー内の全レイヤーを取得
 * ノードを再帰的に探索してすべてのレイヤーを抽出
 * @param tree レイヤーツリー
 * @returns レイヤーの配列
 */
export const getAllLayers = (tree: LayerTreeItem[]): Layer[] => {
  const layers: Layer[] = []
  
  const traverse = (items: LayerTreeItem[]) => {
    for (const item of items) {
      if (item.type === 'layer') {
        layers.push(item)
      } else {
        traverse(item.children)
      }
    }
  }
  
  traverse(tree)
  return layers
}

/**
 * IDでアイテムを検索（パスも返す）
 * ツリー内のアイテムをIDで検索し、アイテムとそのパスを返す
 * @param tree レイヤーツリー
 * @param targetId 検索対象のID
 * @param path パスの配列（内部使用）
 * @returns アイテムとパス、見つからない場合はnull
 */
export const findItemById = (
  tree: LayerTreeItem[],
  targetId: string,
  path: number[] = []
): { item: LayerTreeItem; path: number[] } | null => {
  for (let i = 0; i < tree.length; i++) {
    const item = tree[i]
    if (item.id === targetId) {
      return { item, path: [...path, i] }
    }
    if (item.type === 'node') {
      const result = findItemById(item.children, targetId, [...path, i])
      if (result) {
        return result
      }
    }
  }
  return null
}

/**
 * パスを使ってアイテムを取得
 * インデックスの配列からツリー内のアイテムを取得
 * @param tree レイヤーツリー
 * @param path インデックスの配列
 * @returns アイテム、見つからない場合はnull
 */
export const getItemByPath = (tree: LayerTreeItem[], path: number[]): LayerTreeItem | null => {
  let current: LayerTreeItem[] = tree
  
  for (const index of path) {
    if (index >= current.length) {
      return null
    }
    const item = current[index]
    if (path.indexOf(index) === path.length - 1) {
      return item
    }
    if (item.type === 'node') {
      current = item.children
    } else {
      return null
    }
  }
  
  return null
}

/**
 * アイテムを削除
 * ツリーから指定されたIDのアイテムを削除
 * @param tree レイヤーツリー
 * @param targetId 削除対象のID
 * @returns 更新されたツリー
 */
export const removeItem = (tree: LayerTreeItem[], targetId: string): LayerTreeItem[] => {
  return tree.filter((item) => {
    if (item.id === targetId) {
      return false
    }
    if (item.type === 'node') {
      item.children = removeItem(item.children, targetId)
    }
    return true
  })
}

/**
 * アイテムを移動
 * ツリー内のアイテムを別の位置に移動
 * @param tree レイヤーツリー
 * @param sourceId 移動元のID
 * @param targetParentId 移動先の親ID（nullの場合はルート）
 * @param targetIndex 移動先のインデックス（省略時は末尾）
 * @returns 更新されたツリー
 */
export const moveItem = (
  tree: LayerTreeItem[],
  sourceId: string,
  targetParentId: string | null,
  targetIndex?: number
): LayerTreeItem[] => {
  // ソースアイテムを見つけて削除
  const sourceResult = findItemById(tree, sourceId)
  if (!sourceResult) {
    return tree
  }
  
  const sourceItem = sourceResult.item
  let newTree = removeItem(tree, sourceId)
  
  // ターゲットの親に挿入
  if (targetParentId === null) {
    // ルートに挿入
    if (targetIndex !== undefined) {
      newTree.splice(targetIndex, 0, sourceItem)
    } else {
      newTree.push(sourceItem)
    }
  } else {
    // ノードの子として挿入
    newTree = insertIntoNode(newTree, targetParentId, sourceItem, targetIndex)
  }
  
  return newTree
}

/**
 * ノードの子として挿入
 * 指定されたノードの子要素としてアイテムを挿入
 * @param tree レイヤーツリー
 * @param nodeId 親ノードのID
 * @param item 挿入するアイテム
 * @param index 挿入位置（省略時は末尾）
 * @returns 更新されたツリー
 */
const insertIntoNode = (
  tree: LayerTreeItem[],
  nodeId: string,
  item: LayerTreeItem,
  index?: number
): LayerTreeItem[] => {
  return tree.map((current) => {
    if (current.id === nodeId && current.type === 'node') {
      const children = [...current.children]
      if (index !== undefined) {
        children.splice(index, 0, item)
      } else {
        children.push(item)
      }
      return { ...current, children }
    }
    if (current.type === 'node') {
      return { ...current, children: insertIntoNode(current.children, nodeId, item, index) }
    }
    return current
  })
}

/**
 * ノードを更新
 * 指定されたノードのプロパティを部分更新
 * @param tree レイヤーツリー
 * @param nodeId 更新対象のノードID
 * @param updates 更新するプロパティ
 * @returns 更新されたツリー
 */
export const updateNode = (
  tree: LayerTreeItem[],
  nodeId: string,
  updates: Partial<Omit<LayerTreeItem, 'type'>>
): LayerTreeItem[] => {
  return tree.map((item) => {
    if (item.id === nodeId && item.type === 'node') {
      return { ...item, ...updates }
    }
    if (item.type === 'node') {
      return { ...item, children: updateNode(item.children, nodeId, updates) }
    }
    return item
  })
}

/**
 * レイヤーを更新
 * 指定されたレイヤーのプロパティを部分更新
 * @param tree レイヤーツリー
 * @param layerId 更新対象のレイヤーID
 * @param updates 更新するプロパティ
 * @returns 更新されたツリー
 */
export const updateLayer = (
  tree: LayerTreeItem[],
  layerId: string,
  updates: Partial<Layer>
): LayerTreeItem[] => {
  return tree.map((item) => {
    if (item.id === layerId && item.type === 'layer') {
      return { ...item, ...updates }
    }
    if (item.type === 'node') {
      return { ...item, children: updateLayer(item.children, layerId, updates) }
    }
    return item
  })
}

/**
 * レイヤーの表示/非表示を切り替え
 * @param tree レイヤーツリー
 * @param layerId 切り替え対象のレイヤーID
 * @returns 更新されたツリー
 */
export const toggleLayerVisibility = (
  tree: LayerTreeItem[],
  layerId: string
): LayerTreeItem[] => {
  return tree.map((item) => {
    if (item.id === layerId && item.type === 'layer') {
      return { ...item, visible: !item.visible }
    }
    if (item.type === 'node') {
      return { ...item, children: toggleLayerVisibility(item.children, layerId) }
    }
    return item
  })
}

/**
 * ノードの表示/非表示を子に伝播
 * ノードとそのすべての子要素の表示状態を切り替え
 * @param tree レイヤーツリー
 * @param nodeId 切り替え対象のノードID
 * @returns 更新されたツリー
 */
export const toggleNodeVisibility = (
  tree: LayerTreeItem[],
  nodeId: string
): LayerTreeItem[] => {
  // 子要素すべての表示状態を変更
  const updateChildrenVisibility = (items: LayerTreeItem[], newVisible: boolean): LayerTreeItem[] => {
    return items.map((item) => {
      const updated = { ...item, visible: newVisible }
      if (item.type === 'node') {
        return { ...updated, children: updateChildrenVisibility(item.children, newVisible) }
      }
      return updated
    })
  }
  
  return tree.map((item) => {
    if (item.id === nodeId && item.type === 'node') {
      const newVisible = !item.visible
      return {
        ...item,
        visible: newVisible,
        children: updateChildrenVisibility(item.children, newVisible),
      }
    }
    if (item.type === 'node') {
      return { ...item, children: toggleNodeVisibility(item.children, nodeId) }
    }
    return item
  })
}

/**
 * アイテム(ノードまたはレイヤー)の表示/非表示を切り替え
 * アイテムの型に応じて適切な切り替え関数を呼び出す
 * @param tree レイヤーツリー
 * @param itemId 切り替え対象のアイテムID
 * @returns 更新されたツリー
 */
export const toggleItemVisibility = (
  tree: LayerTreeItem[],
  itemId: string
): LayerTreeItem[] => {
  // まずアイテムを見つける
  const found = findItemById(tree, itemId)
  if (!found) {
    return tree
  }
  
  if (found.item.type === 'node') {
    // ノードの場合は子要素にも伝播
    return toggleNodeVisibility(tree, itemId)
  } else {
    // レイヤーの場合は自分だけ切り替え
    return toggleLayerVisibility(tree, itemId)
  }
}

/**
 * アイテムを追加
 * ツリーまたはノードに新しいアイテムを追加
 * @param tree レイヤーツリー
 * @param parentId 親ノードのID（nullの場合はルート）
 * @param item 追加するアイテム
 * @returns 更新されたツリー
 */
export const addItem = (
  tree: LayerTreeItem[],
  parentId: string | null,
  item: LayerTreeItem
): LayerTreeItem[] => {
  if (parentId === null) {
    return [...tree, item]
  }
  
  return tree.map((current) => {
    if (current.id === parentId && current.type === 'node') {
      return { ...current, children: [...current.children, item] }
    }
    if (current.type === 'node') {
      return { ...current, children: addItem(current.children, parentId, item) }
    }
    return current
  })
}

/**
 * ツリーを平坦化（表示順）
 * 階層構造を保ちながら、ツリーを1次元配列に変換
 * @param tree レイヤーツリー
 * @param level 現在の階層レベル（内部使用）
 * @returns 平坦化されたアイテム配列（階層情報付き）
 */
export const flattenTree = (tree: LayerTreeItem[], level = 0): Array<LayerTreeItem & { level: number }> => {
  const result: Array<LayerTreeItem & { level: number }> = []
  
  for (const item of tree) {
    result.push({ ...item, level })
    if (item.type === 'node') {
      result.push(...flattenTree(item.children, level + 1))
    }
  }
  
  return result
}
