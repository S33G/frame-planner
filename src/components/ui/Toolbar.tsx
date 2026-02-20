import { useCallback, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { AlignmentToolbar } from './AlignmentToolbar'

function dispatchZoomEvent(type: 'zoom-in' | 'zoom-out' | 'zoom-reset') {
  window.dispatchEvent(new Event(type))
}

export function Toolbar() {
  const snapEnabled = useAppStore((s) => s.snapEnabled)
  const gridEnabled = useAppStore((s) => s.gridEnabled)
  const drillHolesVisible = useAppStore((s) => s.drillHolesVisible)
  const zoomLevel = useAppStore((s) => s.zoomLevel)
  const addFrame = useAppStore((s) => s.addFrame)
  const toggleSnap = useAppStore((s) => s.toggleSnap)
  const toggleGrid = useAppStore((s) => s.toggleGrid)
  const toggleDrillHoles = useAppStore((s) => s.toggleDrillHoles)

  const [addMenuOpen, setAddMenuOpen] = useState(false)

  const handleAddRect = useCallback(() => {
    addFrame('rect')
    setAddMenuOpen(false)
  }, [addFrame])

  const handleAddEllipse = useCallback(() => {
    addFrame('ellipse')
    setAddMenuOpen(false)
  }, [addFrame])

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 bg-surface/95 backdrop-blur-sm rounded-2xl border border-border" style={{ boxShadow: 'var(--shadow-warm-md)' }}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setAddMenuOpen(!addMenuOpen)}
          className="px-3 py-1.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors"
        >
          + Add
        </button>
        {addMenuOpen && (
          <div className="absolute top-full left-0 mt-1 bg-surface rounded-xl border border-border py-1 z-10 min-w-36" style={{ boxShadow: 'var(--shadow-warm-md)' }}>
            <button
              type="button"
              onClick={handleAddRect}
              className="w-full px-3 py-1.5 text-sm text-left text-text hover:bg-bg transition-colors"
            >
              Rectangular Frame
            </button>
            <button
              type="button"
              onClick={handleAddEllipse}
              className="w-full px-3 py-1.5 text-sm text-left text-text hover:bg-bg transition-colors"
            >
              Circular Frame
            </button>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-border mx-1" />

      <AlignmentToolbar />

      <div className="w-px h-6 bg-border mx-1" />

      <button
        type="button"
        onClick={() => useAppStore.temporal.getState().undo()}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg transition-colors"
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        ↩
      </button>
      <button
        type="button"
        onClick={() => useAppStore.temporal.getState().redo()}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg transition-colors"
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        ↪
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        type="button"
        onClick={toggleSnap}
        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
          snapEnabled
            ? 'bg-secondary/15 text-secondary'
            : 'bg-bg text-text-muted'
        }`}
        title={snapEnabled ? 'Snapping on' : 'Snapping off'}
      >
        {snapEnabled ? '⊞ Snap' : '⊟ Snap'}
      </button>

      <button
        type="button"
        onClick={toggleGrid}
        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
          gridEnabled
            ? 'bg-secondary/15 text-secondary'
            : 'bg-bg text-text-muted'
        }`}
        title={gridEnabled ? 'Grid on' : 'Grid off'}
      >
        {gridEnabled ? '# Grid' : '# Grid'}
      </button>

      <button
        type="button"
        onClick={toggleDrillHoles}
        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
          drillHolesVisible
            ? 'bg-red-100 text-red-600'
            : 'bg-bg text-text-muted'
        }`}
        title={drillHolesVisible ? 'Drill holes shown' : 'Drill holes hidden'}
      >
        {drillHolesVisible ? '+ Drill' : '+ Drill'}
      </button>

      <div className="w-px h-6 bg-border mx-1" />

      <button
        type="button"
        onClick={() => dispatchZoomEvent('zoom-out')}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg transition-colors text-sm font-medium"
        title="Zoom out"
        aria-label="Zoom out"
      >
        −
      </button>
      <button
        type="button"
        onClick={() => dispatchZoomEvent('zoom-reset')}
        className="px-1.5 py-0.5 rounded-lg text-xs font-medium text-text-muted hover:bg-bg transition-colors min-w-[3.5rem] text-center"
        title="Reset zoom"
      >
        {Math.round(zoomLevel * 100)}%
      </button>
      <button
        type="button"
        onClick={() => dispatchZoomEvent('zoom-in')}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:bg-bg transition-colors text-sm font-medium"
        title="Zoom in"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  )
}
