import type { Layer, LayerTreeItem } from '../types/layer'

// ツリー内の全レイヤーを取得
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

// ツリー内の全ノードを取得
export const getAllNodes = (tree: LayerTreeItem[]): LayerTreeItem[] => {
  const nodes: LayerTreeItem[] = []
  
  const traverse = (items: LayerTreeItem[]) => {
    for (const item of items) {
      if (item.type === 'node') {
        nodes.push(item)
        traverse(item.children)
      }
    }
  }
  
  traverse(tree)
  return nodes
}

// IDでアイテムを検索（パスも返す）
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

// パスを使ってアイテムを取得
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

// アイテムを削除
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

// アイテムを移動
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

// ノードの子として挿入
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

// ノードを更新
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

// レイヤーを更新
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

// レイヤーの表示/非表示を切り替え
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

// ノードの表示/非表示を子に伝播
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

// アイテム(ノードまたはレイヤー)の表示/非表示を切り替え
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

// アイテムを追加
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

// ツリーを平坦化（表示順）
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
