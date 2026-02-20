import { useEffect, useState, useCallback } from 'react'
import { Group, Rect, Ellipse, Image as KonvaImage } from 'react-konva'
import type { Frame } from '@/types'
import type Konva from 'konva'
import { getImageUrl } from '@/services/imageStorage'
import { useAppStore } from '@/store/useAppStore'

export interface FrameShapeProps {
  frame: Frame
  scale: number
  wallOffsetX: number
  wallOffsetY: number
  wallWidth: number
  wallHeight: number
  isSelected: boolean
  onDragMoveSnap?: (frameId: string, x: number, y: number) => { x: number; y: number }
  onDragEndSnap?: () => void
}

export function FrameShape({
  frame,
  scale,
  wallOffsetX,
  wallOffsetY,
  wallWidth,
  wallHeight,
  isSelected,
  onDragMoveSnap,
  onDragEndSnap,
}: FrameShapeProps) {
  const updateFrame = useAppStore((s) => s.updateFrame)
  const selectFrame = useAppStore((s) => s.selectFrame)
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    if (!frame.imageId) {
      setImage(null)
      return
    }

    getImageUrl(frame.imageId).then((url) => {
      if (!url || cancelled) return
      objectUrl = url
      const img = new window.Image()
      img.onload = () => {
        if (!cancelled) {
          setImage(img)
        }
      }
      img.src = url
    })

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [frame.imageId])

  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true
      selectFrame(frame.id, e.evt.shiftKey)
    },
    [frame.id, selectFrame],
  )

  const handleTap = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      e.cancelBubble = true
      selectFrame(frame.id, false)
    },
    [frame.id, selectFrame],
  )

  const handleDragMoveEllipse = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!onDragMoveSnap) return
      const node = e.target
      const rx = frame.width * scale / 2
      const ry = frame.height * scale / 2
      const cmX = (node.x() - rx - wallOffsetX) / scale
      const cmY = (node.y() - ry - wallOffsetY) / scale
      const snapped = onDragMoveSnap(frame.id, cmX, cmY)
      const snappedPxX = snapped.x * scale + wallOffsetX + rx
      const snappedPxY = snapped.y * scale + wallOffsetY + ry
      if (Math.abs(node.x() - snappedPxX) > 0.01 || Math.abs(node.y() - snappedPxY) > 0.01) {
        node.x(snappedPxX)
        node.y(snappedPxY)
      }
    },
    [frame.id, frame.width, frame.height, scale, wallOffsetX, wallOffsetY, onDragMoveSnap],
  )

  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (!onDragMoveSnap) return
      const node = e.target
      const cmX = (node.x() - wallOffsetX) / scale
      const cmY = (node.y() - wallOffsetY) / scale
      const snapped = onDragMoveSnap(frame.id, cmX, cmY)
      const snappedPxX = snapped.x * scale + wallOffsetX
      const snappedPxY = snapped.y * scale + wallOffsetY
      if (Math.abs(node.x() - snappedPxX) > 0.01 || Math.abs(node.y() - snappedPxY) > 0.01) {
        node.x(snappedPxX)
        node.y(snappedPxY)
      }
    },
    [frame.id, scale, wallOffsetX, wallOffsetY, onDragMoveSnap],
  )

  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target
      const newX = (node.x() - wallOffsetX) / scale
      const newY = (node.y() - wallOffsetY) / scale
      updateFrame(frame.id, { x: newX, y: newY })
      onDragEndSnap?.()
    },
    [frame.id, scale, wallOffsetX, wallOffsetY, updateFrame, onDragEndSnap],
  )

  const dragBoundFunc = useCallback(
    (pos: { x: number; y: number }) => {
      const minX = wallOffsetX
      const minY = wallOffsetY
      const maxX = wallOffsetX + wallWidth * scale - frame.width * scale
      const maxY = wallOffsetY + wallHeight * scale - frame.height * scale

      return {
        x: Math.max(minX, Math.min(pos.x, maxX)),
        y: Math.max(minY, Math.min(pos.y, maxY)),
      }
    },
    [wallOffsetX, wallOffsetY, wallWidth, wallHeight, scale, frame.width, frame.height],
  )

  const x = frame.x * scale + wallOffsetX
  const y = frame.y * scale + wallOffsetY
  const w = frame.width * scale
  const h = frame.height * scale
  const fw = frame.frameWidth * scale
  const matInset = frame.matEnabled ? frame.matWidth * scale : 0

  if (frame.shape === 'ellipse') {
    const rx = w / 2
    const ry = h / 2
    const innerRx = Math.max(rx - fw, 0)
    const innerRy = Math.max(ry - fw, 0)
    const artRx = Math.max(innerRx - matInset, 0)
    const artRy = Math.max(innerRy - matInset, 0)

    return (
      <Group
        name={frame.id}
        x={x + rx}
        y={y + ry}
        draggable
        onClick={handleClick}
        onTap={handleTap}
        onDragMove={handleDragMoveEllipse}
        onDragEnd={handleDragEnd}
        dragBoundFunc={(pos) =>
          dragBoundFunc({ x: pos.x - rx, y: pos.y - ry })
        }
      >
        <Ellipse
          radiusX={rx}
          radiusY={ry}
          fill={frame.frameColor}
          stroke={isSelected ? '#3B82F6' : undefined}
          strokeWidth={isSelected ? 2 : 0}
        />
        {frame.matEnabled && innerRx > 0 && innerRy > 0 ? (
          <Ellipse
            radiusX={innerRx}
            radiusY={innerRy}
            fill={frame.matColor}
          />
        ) : null}
        {artRx > 0 && artRy > 0 ? (
          image ? (
            <KonvaImage
              image={image}
              x={-artRx}
              y={-artRy}
              width={artRx * 2}
              height={artRy * 2}
            />
          ) : (
            <Ellipse
              radiusX={artRx}
              radiusY={artRy}
              fill="#E8E8E8"
            />
          )
        ) : null}
      </Group>
    )
  }

  return (
    <Group
      name={frame.id}
      x={x}
      y={y}
      draggable
      onClick={handleClick}
      onTap={handleTap}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      dragBoundFunc={dragBoundFunc}
    >
      <Rect
        width={w}
        height={h}
        fill={frame.frameColor}
        stroke={isSelected ? '#3B82F6' : undefined}
        strokeWidth={isSelected ? 2 : 0}
      />
      {frame.matEnabled && w - fw * 2 > 0 && h - fw * 2 > 0 ? (
        <Rect
          x={fw}
          y={fw}
          width={w - fw * 2}
          height={h - fw * 2}
          fill={frame.matColor}
        />
      ) : null}
      {w - (fw + matInset) * 2 > 0 && h - (fw + matInset) * 2 > 0 ? (
        image ? (
          <KonvaImage
            image={image}
            x={fw + matInset}
            y={fw + matInset}
            width={w - (fw + matInset) * 2}
            height={h - (fw + matInset) * 2}
          />
        ) : (
          <Rect
            x={fw + matInset}
            y={fw + matInset}
            width={w - (fw + matInset) * 2}
            height={h - (fw + matInset) * 2}
            fill="#E8E8E8"
          />
        )
      ) : null}
    </Group>
  )
}
