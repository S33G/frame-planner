import type { Frame } from '@/types'

export interface SnapGuide {
  orientation: 'V' | 'H'
  position: number
  type: 'edge' | 'center'
  snapOffset: number
}

export interface SpacingGuide {
  orientation: 'V' | 'H'
  gap: number
  segments: { start: number; end: number; cross: number }[]
  snapOffset: number
}

export interface SnapTarget {
  position: number
  type: 'edge' | 'center'
}

export interface SnapTargets {
  vertical: SnapTarget[]
  horizontal: SnapTarget[]
}

export interface ObjectEdges {
  vertical: number[]
  horizontal: number[]
}

export function getSnapTargets(
  frames: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
  wallWidth: number,
  wallHeight: number,
  skipId?: string,
): SnapTargets {
  const vertical: SnapTarget[] = [
    { position: 0, type: 'edge' },
    { position: wallWidth, type: 'edge' },
    { position: wallWidth / 2, type: 'center' },
  ]

  const horizontal: SnapTarget[] = [
    { position: 0, type: 'edge' },
    { position: wallHeight, type: 'edge' },
    { position: wallHeight / 2, type: 'center' },
  ]

  for (const frame of frames) {
    if (frame.id === skipId) continue

    const left = frame.x
    const right = frame.x + frame.width
    const centerX = frame.x + frame.width / 2
    const top = frame.y
    const bottom = frame.y + frame.height
    const centerY = frame.y + frame.height / 2

    vertical.push(
      { position: left, type: 'edge' },
      { position: right, type: 'edge' },
      { position: centerX, type: 'center' },
    )

    horizontal.push(
      { position: top, type: 'edge' },
      { position: bottom, type: 'edge' },
      { position: centerY, type: 'center' },
    )
  }

  return { vertical, horizontal }
}

export function getObjectEdges(
  frame: Pick<Frame, 'x' | 'y' | 'width' | 'height'>,
): ObjectEdges {
  return {
    vertical: [frame.x, frame.x + frame.width / 2, frame.x + frame.width],
    horizontal: [frame.y, frame.y + frame.height / 2, frame.y + frame.height],
  }
}

export function findSnapGuides(
  targets: SnapTargets,
  edges: ObjectEdges,
  threshold: number,
): SnapGuide[] {
  let bestV: SnapGuide | null = null
  let bestVDist = Infinity

  for (const edge of edges.vertical) {
    for (const target of targets.vertical) {
      const dist = Math.abs(edge - target.position)
      if (dist < threshold && dist < bestVDist) {
        bestVDist = dist
        bestV = {
          orientation: 'V',
          position: target.position,
          type: target.type,
          snapOffset: target.position - edge,
        }
      }
    }
  }

  let bestH: SnapGuide | null = null
  let bestHDist = Infinity

  for (const edge of edges.horizontal) {
    for (const target of targets.horizontal) {
      const dist = Math.abs(edge - target.position)
      if (dist < threshold && dist < bestHDist) {
        bestHDist = dist
        bestH = {
          orientation: 'H',
          position: target.position,
          type: target.type,
          snapOffset: target.position - edge,
        }
      }
    }
  }

  const guides: SnapGuide[] = []
  if (bestV) guides.push(bestV)
  if (bestH) guides.push(bestH)
  return guides
}

interface FrameRect {
  left: number
  right: number
  top: number
  bottom: number
  centerY: number
  centerX: number
}

function toRect(f: Pick<Frame, 'x' | 'y' | 'width' | 'height'>): FrameRect {
  return {
    left: f.x,
    right: f.x + f.width,
    top: f.y,
    bottom: f.y + f.height,
    centerY: f.y + f.height / 2,
    centerX: f.x + f.width / 2,
  }
}

export function findSpacingGuides(
  otherFrames: ReadonlyArray<Pick<Frame, 'id' | 'x' | 'y' | 'width' | 'height'>>,
  movingFrame: Pick<Frame, 'x' | 'y' | 'width' | 'height'>,
  threshold: number,
): SpacingGuide[] {
  if (otherFrames.length < 1) return []

  const moving = toRect(movingFrame)
  const others = otherFrames.map(toRect)
  const guides: SpacingGuide[] = []

  const sortedX = [...others].sort((a, b) => a.left - b.left)
  const hGaps: { gap: number; rightOf: FrameRect; leftOf: FrameRect }[] = []
  for (let i = 0; i < sortedX.length - 1; i++) {
    const gap = sortedX[i + 1].left - sortedX[i].right
    if (gap > 0) {
      hGaps.push({ gap, rightOf: sortedX[i], leftOf: sortedX[i + 1] })
    }
  }

  for (const { gap, rightOf, leftOf } of hGaps) {
    const gapLeftOfMoving = moving.left - rightOf.right
    const diffLeft = Math.abs(gapLeftOfMoving - gap)
    if (diffLeft < threshold && gapLeftOfMoving > 0) {
      const snapTo = rightOf.right + gap
      const offset = snapTo - moving.left
      guides.push({
        orientation: 'H',
        gap,
        segments: [
          { start: rightOf.right, end: leftOf.left, cross: (rightOf.centerY + leftOf.centerY) / 2 },
          { start: rightOf.right, end: snapTo, cross: (moving.centerY + rightOf.centerY) / 2 },
        ],
        snapOffset: offset,
      })
    }

    const gapRightOfMoving = leftOf.left - moving.right
    const diffRight = Math.abs(gapRightOfMoving - gap)
    if (diffRight < threshold && gapRightOfMoving > 0) {
      const snapTo = leftOf.left - gap - movingFrame.width
      const offset = snapTo - movingFrame.x
      guides.push({
        orientation: 'H',
        gap,
        segments: [
          { start: rightOf.right, end: leftOf.left, cross: (rightOf.centerY + leftOf.centerY) / 2 },
          { start: snapTo + movingFrame.width, end: leftOf.left, cross: (moving.centerY + leftOf.centerY) / 2 },
        ],
        snapOffset: offset,
      })
    }
  }

  const sortedY = [...others].sort((a, b) => a.top - b.top)
  const vGaps: { gap: number; below: FrameRect; above: FrameRect }[] = []
  for (let i = 0; i < sortedY.length - 1; i++) {
    const gap = sortedY[i + 1].top - sortedY[i].bottom
    if (gap > 0) {
      vGaps.push({ gap, below: sortedY[i], above: sortedY[i + 1] })
    }
  }

  for (const { gap, below, above } of vGaps) {
    const gapAboveMoving = moving.top - below.bottom
    const diffAbove = Math.abs(gapAboveMoving - gap)
    if (diffAbove < threshold && gapAboveMoving > 0) {
      const snapTo = below.bottom + gap
      const offset = snapTo - moving.top
      guides.push({
        orientation: 'V',
        gap,
        segments: [
          { start: below.bottom, end: above.top, cross: (below.centerX + above.centerX) / 2 },
          { start: below.bottom, end: snapTo, cross: (moving.centerX + below.centerX) / 2 },
        ],
        snapOffset: offset,
      })
    }

    const gapBelowMoving = above.top - moving.bottom
    const diffBelow = Math.abs(gapBelowMoving - gap)
    if (diffBelow < threshold && gapBelowMoving > 0) {
      const snapTo = above.top - gap - movingFrame.height
      const offset = snapTo - movingFrame.y
      guides.push({
        orientation: 'V',
        gap,
        segments: [
          { start: below.bottom, end: above.top, cross: (below.centerX + above.centerX) / 2 },
          { start: snapTo + movingFrame.height, end: above.top, cross: (moving.centerX + above.centerX) / 2 },
        ],
        snapOffset: offset,
      })
    }
  }

  return guides
}
