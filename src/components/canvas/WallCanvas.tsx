import { useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import type Konva from 'konva'
import { useAppStore } from '@/store/useAppStore'
import { useCanvasScale } from '@/hooks/useCanvasScale'
import { useZoom } from '@/hooks/useZoom'
import { FrameShape } from './FrameShape'
import { SnapGuides } from './SnapGuides'
import { GridOverlay } from './GridOverlay'
import { SpacingGuides } from './SpacingGuides'
import { DrillHoleOverlay } from './DrillHoleOverlay'
import { getSnapTargets, getObjectEdges, findSnapGuides, findSpacingGuides } from '@/utils/snapping'
import type { SnapGuide, SpacingGuide } from '@/utils/snapping'
import { SNAP_THRESHOLD } from '@/utils/constants'

export function WallCanvas() {
  const wall = useAppStore((s) => s.wall)
  const frames = useAppStore((s) => s.frames)
  const selectedFrameIds = useAppStore((s) => s.selectedFrameIds)
  const deselectAll = useAppStore((s) => s.deselectAll)
  const updateFrame = useAppStore((s) => s.updateFrame)
  const snapEnabled = useAppStore((s) => s.snapEnabled)
  const gridEnabled = useAppStore((s) => s.gridEnabled)
  const gridSpacing = useAppStore((s) => s.gridSpacing)
  const drillHolesVisible = useAppStore((s) => s.drillHolesVisible)
  const unit = useAppStore((s) => s.unit)

  const [activeGuides, setActiveGuides] = useState<SnapGuide[]>([])
  const [activeSpacingGuides, setActiveSpacingGuides] = useState<SpacingGuide[]>([])

  const transformerRef = useRef<Konva.Transformer>(null)
  const layerRef = useRef<Konva.Layer>(null)

  const {
    containerRef,
    scale,
    stageWidth,
    stageHeight,
    wallOffsetX,
    wallOffsetY,
  } = useCanvasScale(wall.width, wall.height)

  const { stageScale, stagePosition, onWheel, onTouchMove, onTouchEnd } =
    useZoom()

  useEffect(() => {
    const tr = transformerRef.current
    const layer = layerRef.current
    if (!tr || !layer) return

    const nodes = selectedFrameIds
      .map((id) => layer.findOne(`.${id}`))
      .filter((node): node is Konva.Node => node != null)

    tr.nodes(nodes)
    tr.getLayer()?.batchDraw()
  }, [selectedFrameIds, frames])

  const handleTransformEnd = useCallback(() => {
    const tr = transformerRef.current
    if (!tr) return

    for (const node of tr.nodes()) {
      const scaleX = node.scaleX()
      const scaleY = node.scaleY()

      const newWidth = (node.width() * scaleX) / scale
      const newHeight = (node.height() * scaleY) / scale

      node.scaleX(1)
      node.scaleY(1)

      const frameId = node.name()
      if (frameId) {
        updateFrame(frameId, { width: newWidth, height: newHeight })
      }
    }
  }, [scale, updateFrame])

  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        deselectAll()
      }
    },
    [deselectAll],
  )

  const handleStageTap = useCallback(
    (e: Konva.KonvaEventObject<Event>) => {
      if (e.target === e.target.getStage()) {
        deselectAll()
      }
    },
    [deselectAll],
  )

  const handleSnapDragMove = useCallback(
    (frameId: string, cmX: number, cmY: number): { x: number; y: number } => {
      if (!snapEnabled) {
        setActiveGuides([])
        setActiveSpacingGuides([])
        return { x: cmX, y: cmY }
      }

      const currentFrames = useAppStore.getState().frames
      const frame = currentFrames.find((f) => f.id === frameId)
      if (!frame) return { x: cmX, y: cmY }

      const movingFrame = { ...frame, x: cmX, y: cmY }
      const targets = getSnapTargets(currentFrames, wall.width, wall.height, frameId)
      const edges = getObjectEdges(movingFrame)
      const threshold = SNAP_THRESHOLD / stageScale
      const guides = findSnapGuides(targets, edges, threshold)

      const otherFrames = currentFrames.filter((f) => f.id !== frameId)
      const spacingGuides = findSpacingGuides(otherFrames, movingFrame, threshold)

      setActiveGuides(guides)
      setActiveSpacingGuides(spacingGuides)

      let snappedX = cmX
      let snappedY = cmY

      for (const guide of guides) {
        if (guide.orientation === 'V') {
          snappedX = cmX + guide.snapOffset
        } else {
          snappedY = cmY + guide.snapOffset
        }
      }

      if (!guides.some((g) => g.orientation === 'V')) {
        const hSpacing = spacingGuides.find((g) => g.orientation === 'H')
        if (hSpacing) snappedX = cmX + hSpacing.snapOffset
      }
      if (!guides.some((g) => g.orientation === 'H')) {
        const vSpacing = spacingGuides.find((g) => g.orientation === 'V')
        if (vSpacing) snappedY = cmY + vSpacing.snapOffset
      }

      return { x: snappedX, y: snappedY }
    },
    [snapEnabled, wall.width, wall.height, stageScale],
  )

  const handleSnapDragEnd = useCallback(() => {
    setActiveGuides([])
    setActiveSpacingGuides([])
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full" tabIndex={-1}>
      {stageWidth > 0 && stageHeight > 0 ? (
        <Stage
          width={stageWidth}
          height={stageHeight}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePosition.x}
          y={stagePosition.y}
          onClick={handleStageClick}
          onTap={handleStageTap}
          onWheel={onWheel}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          draggable
        >
          <Layer ref={layerRef}>
            <Rect
              x={wallOffsetX}
              y={wallOffsetY}
              width={wall.width * scale}
              height={wall.height * scale}
              fill={wall.color}
              cornerRadius={4}
            />
            {gridEnabled && (
              <GridOverlay
                wallWidthCm={wall.width}
                wallHeightCm={wall.height}
                wallOffsetX={wallOffsetX}
                wallOffsetY={wallOffsetY}
                scale={scale}
                spacingCm={gridSpacing}
              />
            )}
            {frames.map((frame) => (
              <FrameShape
                key={frame.id}
                frame={frame}
                scale={scale}
                wallOffsetX={wallOffsetX}
                wallOffsetY={wallOffsetY}
                wallWidth={wall.width}
                wallHeight={wall.height}
                isSelected={selectedFrameIds.includes(frame.id)}
                onDragMoveSnap={handleSnapDragMove}
                onDragEndSnap={handleSnapDragEnd}
              />
            ))}
            <SnapGuides
              guides={activeGuides}
              wallOffsetX={wallOffsetX}
              wallOffsetY={wallOffsetY}
              wallWidthPx={wall.width * scale}
              wallHeightPx={wall.height * scale}
              scale={scale}
            />
            <SpacingGuides
              guides={activeSpacingGuides}
              wallOffsetX={wallOffsetX}
              wallOffsetY={wallOffsetY}
              scale={scale}
            />
            {drillHolesVisible && (
              <DrillHoleOverlay
                frames={frames}
                wallOffsetX={wallOffsetX}
                wallOffsetY={wallOffsetY}
                scale={scale}
                unit={unit}
              />
            )}
            <Transformer
              ref={transformerRef}
              rotateEnabled={false}
              borderStroke="#3B82F6"
              borderStrokeWidth={1.5}
              anchorStroke="#3B82F6"
              anchorFill="#FFFFFF"
              anchorSize={8}
              anchorCornerRadius={2}
              onTransformEnd={handleTransformEnd}
            />
          </Layer>
        </Stage>
      ) : null}
    </div>
  )
}

export default WallCanvas
