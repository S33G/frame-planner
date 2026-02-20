import { useMemo } from 'react'
import { Line } from 'react-konva'

export interface GridOverlayProps {
  wallWidthCm: number
  wallHeightCm: number
  wallOffsetX: number
  wallOffsetY: number
  scale: number
  spacingCm: number
}

export function GridOverlay({
  wallWidthCm,
  wallHeightCm,
  wallOffsetX,
  wallOffsetY,
  scale,
  spacingCm,
}: GridOverlayProps) {
  const lines = useMemo(() => {
    const result: { points: number[]; key: string }[] = []
    const wPx = wallWidthCm * scale
    const hPx = wallHeightCm * scale
    const stepPx = spacingCm * scale

    if (stepPx < 4) return result

    for (let cm = spacingCm; cm < wallWidthCm; cm += spacingCm) {
      const x = wallOffsetX + cm * scale
      result.push({
        key: `gv-${cm}`,
        points: [x, wallOffsetY, x, wallOffsetY + hPx],
      })
    }

    for (let cm = spacingCm; cm < wallHeightCm; cm += spacingCm) {
      const y = wallOffsetY + cm * scale
      result.push({
        key: `gh-${cm}`,
        points: [wallOffsetX, y, wallOffsetX + wPx, y],
      })
    }

    return result
  }, [wallWidthCm, wallHeightCm, wallOffsetX, wallOffsetY, scale, spacingCm])

  return (
    <>
      {lines.map((line) => (
        <Line
          key={line.key}
          points={line.points}
          stroke="rgba(0,0,0,0.08)"
          strokeWidth={0.5}
          listening={false}
        />
      ))}
    </>
  )
}
