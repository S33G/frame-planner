import { useCallback, useEffect, useRef, useState } from 'react'

export function calculateScale(
  wallWidthCm: number,
  wallHeightCm: number,
  containerWidthPx: number,
  containerHeightPx: number,
  padding: number = 40,
): number {
  const availW = containerWidthPx - padding * 2
  const availH = containerHeightPx - padding * 2
  if (availW <= 0 || availH <= 0) return 1
  return Math.min(availW / wallWidthCm, availH / wallHeightCm)
}

export function cmToPx(cm: number, scale: number): number {
  return cm * scale
}

export function pxToCm(px: number, scale: number): number {
  return px / scale
}

export function useCanvasScale(wallWidth: number, wallHeight: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDimensions({ width: rect.width, height: rect.height })
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    updateDimensions()

    const observer = new ResizeObserver(() => {
      updateDimensions()
    })
    observer.observe(el)

    return () => {
      observer.disconnect()
    }
  }, [updateDimensions])

  const scale = calculateScale(
    wallWidth,
    wallHeight,
    dimensions.width,
    dimensions.height,
  )

  const stageWidth = dimensions.width
  const stageHeight = dimensions.height
  const wallOffsetX = (stageWidth - wallWidth * scale) / 2
  const wallOffsetY = (stageHeight - wallHeight * scale) / 2

  return {
    containerRef,
    scale,
    stageWidth,
    stageHeight,
    wallOffsetX,
    wallOffsetY,
  }
}
