import { useMemo, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { formatDimension } from '@/utils/units'

interface DrillPosition {
  label: string
  x: number
  y: number
  frameWidth: number
  frameHeight: number
}

export interface InstallationGuideProps {
  onClose: () => void
}

export function InstallationGuide({ onClose }: InstallationGuideProps) {
  const frames = useAppStore((s) => s.frames)
  const wall = useAppStore((s) => s.wall)
  const unit = useAppStore((s) => s.unit)

  const positions = useMemo<DrillPosition[]>(() => {
    return frames.map((f) => ({
      label: f.label || `Frame ${f.id.slice(0, 6)}`,
      x: f.x + f.width / 2,
      y: f.y + f.hangingOffset,
      frameWidth: f.width,
      frameHeight: f.height,
    }))
  }, [frames])

  const textContent = useMemo(() => {
    const lines: string[] = []
    lines.push('INSTALLATION GUIDE')
    lines.push('==================')
    lines.push('')
    lines.push(`Wall: ${formatDimension(wall.width, unit)} x ${formatDimension(wall.height, unit)}`)
    lines.push(`Measurements from top-left corner of wall`)
    lines.push('')

    if (positions.length === 0) {
      lines.push('No frames placed.')
      return lines.join('\n')
    }

    for (let i = 0; i < positions.length; i++) {
      const p = positions[i]
      lines.push(`${i + 1}. ${p.label}`)
      lines.push(`   Frame size: ${formatDimension(p.frameWidth, unit)} x ${formatDimension(p.frameHeight, unit)}`)
      lines.push(`   Drill at: X = ${formatDimension(p.x, unit)}, Y = ${formatDimension(p.y, unit)}`)
      lines.push('')
    }

    return lines.join('\n')
  }, [positions, wall, unit])

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(textContent)
  }, [textContent])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl border border-border w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" style={{ boxShadow: 'var(--shadow-warm-md)' }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-base font-semibold text-text">Installation Guide</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg transition-colors"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <pre className="text-sm text-text font-mono whitespace-pre-wrap leading-relaxed">{textContent}</pre>
        </div>

        <div className="flex gap-2 px-5 py-3 border-t border-border">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Copy to Clipboard
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm text-text-muted hover:bg-bg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
