import { Group, Line, Text } from 'react-konva'
import type { SpacingGuide } from '@/utils/snapping'

export interface SpacingGuidesProps {
  guides: SpacingGuide[]
  wallOffsetX: number
  wallOffsetY: number
  scale: number
}

export function SpacingGuides({
  guides,
  wallOffsetX,
  wallOffsetY,
  scale,
}: SpacingGuidesProps) {
  return (
    <>
      {guides.map((guide, gi) =>
        guide.segments.map((seg, si) => {
          const color = 'rgb(255, 100, 50)'
          if (guide.orientation === 'H') {
            const x1 = wallOffsetX + seg.start * scale
            const x2 = wallOffsetX + seg.end * scale
            const y = wallOffsetY + seg.cross * scale
            const midX = (x1 + x2) / 2
            return (
              <Group key={`sp-${gi}-${si}`}>
                <Line
                  points={[x1, y, x2, y]}
                  stroke={color}
                  strokeWidth={1}
                  dash={[3, 3]}
                  listening={false}
                />
                <Line
                  points={[x1, y - 3, x1, y + 3]}
                  stroke={color}
                  strokeWidth={1}
                  listening={false}
                />
                <Line
                  points={[x2, y - 3, x2, y + 3]}
                  stroke={color}
                  strokeWidth={1}
                  listening={false}
                />
                {si === 0 && (
                  <Text
                    x={midX - 12}
                    y={y - 14}
                    text={`${guide.gap.toFixed(1)}`}
                    fontSize={10}
                    fill={color}
                    listening={false}
                  />
                )}
              </Group>
            )
          }
          const y1 = wallOffsetY + seg.start * scale
          const y2 = wallOffsetY + seg.end * scale
          const x = wallOffsetX + seg.cross * scale
          const midY = (y1 + y2) / 2
          return (
            <Group key={`sp-${gi}-${si}`}>
              <Line
                points={[x, y1, x, y2]}
                stroke={color}
                strokeWidth={1}
                dash={[3, 3]}
                listening={false}
              />
              <Line
                points={[x - 3, y1, x + 3, y1]}
                stroke={color}
                strokeWidth={1}
                listening={false}
              />
              <Line
                points={[x - 3, y2, x + 3, y2]}
                stroke={color}
                strokeWidth={1}
                listening={false}
              />
              {si === 0 && (
                <Text
                  x={x + 4}
                  y={midY - 5}
                  text={`${guide.gap.toFixed(1)}`}
                  fontSize={10}
                  fill={color}
                  listening={false}
                />
              )}
            </Group>
          )
        }),
      )}
    </>
  )
}
