import { useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { alignFrames } from '@/utils/alignment'
import type { AlignmentType } from '@/utils/alignment'

interface ButtonDef {
  type: AlignmentType
  label: string
  icon: string
  minSelected: number
}

const BUTTONS: ButtonDef[] = [
  { type: 'left', label: 'Align Left', icon: '⫷', minSelected: 2 },
  { type: 'centerH', label: 'Center Horizontal', icon: '⫿', minSelected: 2 },
  { type: 'right', label: 'Align Right', icon: '⫸', minSelected: 2 },
  { type: 'top', label: 'Align Top', icon: '⊤', minSelected: 2 },
  { type: 'centerV', label: 'Center Vertical', icon: '⫠', minSelected: 2 },
  { type: 'bottom', label: 'Align Bottom', icon: '⊥', minSelected: 2 },
  { type: 'distributeH', label: 'Distribute Horizontal', icon: '⫦', minSelected: 3 },
  { type: 'distributeV', label: 'Distribute Vertical', icon: '⫧', minSelected: 3 },
  { type: 'distributeHWallCenter', label: 'Distribute to Wall Center H', icon: '⟷', minSelected: 1 },
  { type: 'distributeVWallCenter', label: 'Distribute to Wall Center V', icon: '↕', minSelected: 1 },
]

export function AlignmentToolbar() {
  const frames = useAppStore((s) => s.frames)
  const selectedFrameIds = useAppStore((s) => s.selectedFrameIds)
  const wall = useAppStore((s) => s.wall)
  const updateFrame = useAppStore((s) => s.updateFrame)

  const handleAlign = useCallback(
    (type: AlignmentType) => {
      const updates = alignFrames(frames, selectedFrameIds, type, {
        width: wall.width,
        height: wall.height,
      })
      for (const u of updates) {
        updateFrame(u.id, { x: u.x, y: u.y })
      }
    },
    [frames, selectedFrameIds, wall.width, wall.height, updateFrame],
  )

  return (
    <div className="flex items-center gap-1" role="toolbar" aria-label="Alignment">
      {BUTTONS.map((btn) => {
        const btnDisabled = selectedFrameIds.length < btn.minSelected

        return (
          <button
            key={btn.type}
            type="button"
            disabled={btnDisabled}
            onClick={() => handleAlign(btn.type)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-200 active:bg-stone-300"
            title={btn.label}
            aria-label={btn.label}
          >
            {btn.icon}
          </button>
        )
      })}
    </div>
  )
}
