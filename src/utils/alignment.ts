import type { Frame } from '@/types'

export type AlignmentType =
  | 'top'
  | 'bottom'
  | 'centerV'
  | 'left'
  | 'right'
  | 'centerH'
  | 'distributeH'
  | 'distributeV'
  | 'distributeHWallCenter'
  | 'distributeVWallCenter'

export interface PositionUpdate {
  id: string
  x: number
  y: number
}

export interface WallDimensions {
  width: number
  height: number
}

export function alignFrames(
  frames: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
  selectedIds: string[],
  alignment: AlignmentType,
  wall?: WallDimensions,
): PositionUpdate[] {
  const selected = frames.filter((f) => selectedIds.includes(f.id))

  const isWallCenter =
    alignment === 'distributeHWallCenter' || alignment === 'distributeVWallCenter'

  if (isWallCenter) {
    if (selected.length < 1 || !wall) return []
  } else {
    if (selected.length < 2) return []
    const isDistribute = alignment === 'distributeH' || alignment === 'distributeV'
    if (isDistribute && selected.length < 3) return []
  }

  switch (alignment) {
    case 'top':
      return alignTop(selected)
    case 'bottom':
      return alignBottom(selected)
    case 'centerV':
      return alignCenterV(selected)
    case 'left':
      return alignLeft(selected)
    case 'right':
      return alignRight(selected)
    case 'centerH':
      return alignCenterH(selected)
    case 'distributeH':
      return distributeH(selected)
    case 'distributeV':
      return distributeV(selected)
    case 'distributeHWallCenter':
      return distributeHWallCenter(selected, wall!)
    case 'distributeVWallCenter':
      return distributeVWallCenter(selected, wall!)
  }
}

function alignTop(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
): PositionUpdate[] {
  const minY = Math.min(...selected.map((f) => f.y))
  return selected
    .filter((f) => f.y !== minY)
    .map((f) => ({ id: f.id, x: f.x, y: minY }))
}

function alignBottom(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
): PositionUpdate[] {
  const maxBottom = Math.max(...selected.map((f) => f.y + f.height))
  return selected
    .filter((f) => f.y + f.height !== maxBottom)
    .map((f) => ({ id: f.id, x: f.x, y: maxBottom - f.height }))
}

function alignCenterV(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
): PositionUpdate[] {
  const avgCenterY =
    selected.reduce((sum, f) => sum + f.y + f.height / 2, 0) / selected.length
  return selected
    .filter((f) => f.y + f.height / 2 !== avgCenterY)
    .map((f) => ({ id: f.id, x: f.x, y: avgCenterY - f.height / 2 }))
}

function alignLeft(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
): PositionUpdate[] {
  const minX = Math.min(...selected.map((f) => f.x))
  return selected
    .filter((f) => f.x !== minX)
    .map((f) => ({ id: f.id, x: minX, y: f.y }))
}

function alignRight(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
): PositionUpdate[] {
  const maxRight = Math.max(...selected.map((f) => f.x + f.width))
  return selected
    .filter((f) => f.x + f.width !== maxRight)
    .map((f) => ({ id: f.id, x: maxRight - f.width, y: f.y }))
}

function alignCenterH(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
): PositionUpdate[] {
  const avgCenterX =
    selected.reduce((sum, f) => sum + f.x + f.width / 2, 0) / selected.length
  return selected
    .filter((f) => f.x + f.width / 2 !== avgCenterX)
    .map((f) => ({ id: f.id, x: avgCenterX - f.width / 2, y: f.y }))
}

function distributeH(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
): PositionUpdate[] {
  const sorted = [...selected].sort((a, b) => a.x - b.x)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const totalSpace = last.x + last.width - first.x
  const totalWidth = sorted.reduce((sum, f) => sum + f.width, 0)
  const gap = (totalSpace - totalWidth) / (sorted.length - 1)

  const updates: PositionUpdate[] = []
  let currentX = first.x

  for (const frame of sorted) {
    if (frame.x !== currentX) {
      updates.push({ id: frame.id, x: currentX, y: frame.y })
    }
    currentX += frame.width + gap
  }

  return updates
}

function distributeV(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
): PositionUpdate[] {
  const sorted = [...selected].sort((a, b) => a.y - b.y)
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const totalSpace = last.y + last.height - first.y
  const totalHeight = sorted.reduce((sum, f) => sum + f.height, 0)
  const gap = (totalSpace - totalHeight) / (sorted.length - 1)

  const updates: PositionUpdate[] = []
  let currentY = first.y

  for (const frame of sorted) {
    if (frame.y !== currentY) {
      updates.push({ id: frame.id, x: frame.x, y: currentY })
    }
    currentY += frame.height + gap
  }

  return updates
}

function distributeHWallCenter(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
  wall: WallDimensions,
): PositionUpdate[] {
  const sorted = [...selected].sort((a, b) => a.x - b.x)
  const totalWidth = sorted.reduce((sum, f) => sum + f.width, 0)
  const gap = (wall.width - totalWidth) / (sorted.length + 1)

  const updates: PositionUpdate[] = []
  let currentX = gap

  for (const frame of sorted) {
    if (frame.x !== currentX) {
      updates.push({ id: frame.id, x: currentX, y: frame.y })
    }
    currentX += frame.width + gap
  }

  return updates
}

function distributeVWallCenter(
  selected: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
  wall: WallDimensions,
): PositionUpdate[] {
  const sorted = [...selected].sort((a, b) => a.y - b.y)
  const totalHeight = sorted.reduce((sum, f) => sum + f.height, 0)
  const gap = (wall.height - totalHeight) / (sorted.length + 1)

  const updates: PositionUpdate[] = []
  let currentY = gap

  for (const frame of sorted) {
    if (frame.y !== currentY) {
      updates.push({ id: frame.id, x: frame.x, y: currentY })
    }
    currentY += frame.height + gap
  }

  return updates
}
