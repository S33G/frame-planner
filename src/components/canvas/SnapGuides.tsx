import { Line } from 'react-konva'
import type { SnapGuide } from '@/utils/snapping'

export interface SnapGuidesProps {
  guides: SnapGuide[]
  wallOffsetX: number
  wallOffsetY: number
  wallWidthPx: number
  wallHeightPx: number
  scale: number
}

export function SnapGuides({
  guides,
  wallOffsetX,
  wallOffsetY,
  wallWidthPx,
  wallHeightPx,
  scale,
}: SnapGuidesProps) {
  return (
    <>
      {guides.map((guide, i) => {
        const pos = guide.position * scale
        if (guide.orientation === 'V') {
          const x = wallOffsetX + pos
          return (
            <Line
              key={`snap-${i}`}
              points={[x, wallOffsetY, x, wallOffsetY + wallHeightPx]}
              stroke="rgb(0, 161, 255)"
              strokeWidth={1}
              dash={[4, 4]}
              listening={false}
            />
          )
        }
        const y = wallOffsetY + pos
        return (
          <Line
            key={`snap-${i}`}
            points={[wallOffsetX, y, wallOffsetX + wallWidthPx, y]}
            stroke="rgb(0, 161, 255)"
            strokeWidth={1}
            dash={[4, 4]}
            listening={false}
          />
        )
      })}
    </>
  )
}
