import { useCallback, useMemo, useState } from 'react'
import { Group, Circle, Line, Text, Label, Tag } from 'react-konva'
import type { Frame } from '@/types'
import type { Unit } from '@/types'
import { formatDimension } from '@/utils/units'

export interface DrillHoleOverlayProps {
  frames: Frame[]
  wallOffsetX: number
  wallOffsetY: number
  scale: number
  unit: Unit
}

interface DrillHole {
  frameId: string
  label: string
  x: number
  y: number
}

export function DrillHoleOverlay({
  frames,
  wallOffsetX,
  wallOffsetY,
  scale,
  unit,
}: DrillHoleOverlayProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const holes = useMemo<DrillHole[]>(() => {
    return frames.map((f) => ({
      frameId: f.id,
      label: f.label || f.id.slice(0, 6),
      x: f.x + f.width / 2,
      y: f.y + f.hangingOffset,
    }))
  }, [frames])

  const crossSize = Math.max(4, 6 * scale)

  const handleMouseEnter = useCallback((frameId: string) => {
    setHoveredId(frameId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null)
  }, [])

  return (
    <>
      {holes.map((hole) => {
        const px = wallOffsetX + hole.x * scale
        const py = wallOffsetY + hole.y * scale
        const isHovered = hoveredId === hole.frameId

        const tooltipText = `Left: ${formatDimension(hole.x, unit)}  Top: ${formatDimension(hole.y, unit)}`

        return (
          <Group
            key={`drill-${hole.frameId}`}
            onMouseEnter={() => handleMouseEnter(hole.frameId)}
            onMouseLeave={handleMouseLeave}
          >
            <Circle
              x={px}
              y={py}
              radius={crossSize * 2}
              fill="transparent"
            />
            <Circle
              x={px}
              y={py}
              radius={crossSize * 0.3}
              fill="#DC2626"
            />
            <Line
              points={[px - crossSize, py, px + crossSize, py]}
              stroke="#DC2626"
              strokeWidth={1.5}
            />
            <Line
              points={[px, py - crossSize, px, py + crossSize]}
              stroke="#DC2626"
              strokeWidth={1.5}
            />
            <Text
              x={px + crossSize + 3}
              y={py - 5}
              text={hole.label}
              fontSize={10}
              fill="#DC2626"
            />
            {isHovered && (
              <Label x={px + crossSize + 3} y={py + 10}>
                <Tag
                  fill="#1C1917"
                  cornerRadius={3}
                  pointerDirection="up"
                  pointerWidth={6}
                  pointerHeight={4}
                />
                <Text
                  text={tooltipText}
                  fontSize={11}
                  fontStyle="bold"
                  fill="#FFFFFF"
                  padding={4}
                />
              </Label>
            )}
          </Group>
        )
      })}
    </>
  )
}
