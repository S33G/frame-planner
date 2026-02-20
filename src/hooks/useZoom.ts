import { useCallback, useEffect, useState } from 'react'
import { ZOOM_MIN, ZOOM_MAX } from '@/utils/constants'
import { useAppStore } from '@/store/useAppStore'
import type Konva from 'konva'

export function clampZoom(scale: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, scale))
}

export function calculateZoomToPoint(
  oldScale: number,
  newScale: number,
  pointerX: number,
  pointerY: number,
  stageX: number,
  stageY: number,
): { x: number; y: number } {
  return {
    x: pointerX - (pointerX - stageX) * (newScale / oldScale),
    y: pointerY - (pointerY - stageY) * (newScale / oldScale),
  }
}

const ZOOM_STEP = 1.05

export interface ZoomState {
  stageScale: number
  stagePosition: { x: number; y: number }
}

export function useZoom() {
  const [stageScale, setStageScale] = useState(1)
  const [stagePosition, setStagePosition] = useState({ x: 0, y: 0 })
  const setZoomLevel = useAppStore((s) => s.setZoomLevel)

  useEffect(() => {
    setZoomLevel(stageScale)
  }, [stageScale, setZoomLevel])

  useEffect(() => {
    const handleZoomIn = () => {
      setStageScale((prev) => clampZoom(prev * ZOOM_STEP))
    }
    const handleZoomOut = () => {
      setStageScale((prev) => clampZoom(prev / ZOOM_STEP))
    }
    const handleZoomReset = () => {
      setStageScale(1)
      setStagePosition({ x: 0, y: 0 })
    }

    window.addEventListener('zoom-in', handleZoomIn)
    window.addEventListener('zoom-out', handleZoomOut)
    window.addEventListener('zoom-reset', handleZoomReset)
    return () => {
      window.removeEventListener('zoom-in', handleZoomIn)
      window.removeEventListener('zoom-out', handleZoomOut)
      window.removeEventListener('zoom-reset', handleZoomReset)
    }
  }, [])

  const onWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault()

      const stage = e.target.getStage()
      if (!stage) return

      const pointer = stage.getPointerPosition()
      if (!pointer) return

      const direction = e.evt.deltaY > 0 ? -1 : 1
      const newScale = clampZoom(
        direction > 0 ? stageScale * ZOOM_STEP : stageScale / ZOOM_STEP,
      )

      const newPos = calculateZoomToPoint(
        stageScale,
        newScale,
        pointer.x,
        pointer.y,
        stagePosition.x,
        stagePosition.y,
      )

      setStageScale(newScale)
      setStagePosition(newPos)
    },
    [stageScale, stagePosition],
  )

  const onTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const touches = e.evt.touches
      if (touches.length !== 2) return

      e.evt.preventDefault()

      const stage = e.target.getStage()
      if (!stage) return

      const touch1 = touches[0]
      const touch2 = touches[1]
      const dist = Math.sqrt(
        (touch2.clientX - touch1.clientX) ** 2 +
          (touch2.clientY - touch1.clientY) ** 2,
      )

      const lastDist = (stage as Konva.Stage & { _lastDist?: number })._lastDist
      if (!lastDist) {
        ;(stage as Konva.Stage & { _lastDist?: number })._lastDist = dist
        return
      }

      const midX = (touch1.clientX + touch2.clientX) / 2
      const midY = (touch1.clientY + touch2.clientY) / 2

      const scaleFactor = dist / lastDist
      const newScale = clampZoom(stageScale * scaleFactor)

      const newPos = calculateZoomToPoint(
        stageScale,
        newScale,
        midX,
        midY,
        stagePosition.x,
        stagePosition.y,
      )

      setStageScale(newScale)
      setStagePosition(newPos)
      ;(stage as Konva.Stage & { _lastDist?: number })._lastDist = dist
    },
    [stageScale, stagePosition],
  )

  const onTouchEnd = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const stage = e.target.getStage()
      if (stage) {
        ;(stage as Konva.Stage & { _lastDist?: number })._lastDist = undefined
      }
    },
    [],
  )

  return {
    stageScale,
    stagePosition,
    onWheel,
    onTouchMove,
    onTouchEnd,
  }
}
