import { useCallback, useRef, useState } from 'react'
import type { Unit } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { exportProject, importProject } from '@/services/exportImport'
import { FrameEditor } from './FrameEditor'
import { InstallationGuide } from './InstallationGuide'

const WALL_COLOR_PRESETS = [
  { label: 'White', value: '#FFFFFF' },
  { label: 'Cream', value: '#F5F0EB' },
  { label: 'Light Gray', value: '#E8E8E8' },
  { label: 'Sage', value: '#D4E4D4' },
  { label: 'Terracotta', value: '#E8C4B0' },
]

function displayVal(cm: number, unit: Unit): string {
  if (unit === 'cm') return cm % 1 === 0 ? cm.toString() : cm.toFixed(1)
  return (cm / 2.54).toFixed(2)
}

export function Sidebar() {
  const wall = useAppStore((s) => s.wall)
  const frames = useAppStore((s) => s.frames)
  const selectedFrameIds = useAppStore((s) => s.selectedFrameIds)
  const unit = useAppStore((s) => s.unit)
  const snapEnabled = useAppStore((s) => s.snapEnabled)
  const viewMode = useAppStore((s) => s.viewMode)
  const setWall = useAppStore((s) => s.setWall)
  const addFrame = useAppStore((s) => s.addFrame)
  const selectFrame = useAppStore((s) => s.selectFrame)
  const setUnit = useAppStore((s) => s.setUnit)
  const toggleSnap = useAppStore((s) => s.toggleSnap)
  const setViewMode = useAppStore((s) => s.setViewMode)
  const gridEnabled = useAppStore((s) => s.gridEnabled)
  const gridSpacing = useAppStore((s) => s.gridSpacing)
  const drillHolesVisible = useAppStore((s) => s.drillHolesVisible)
  const toggleGrid = useAppStore((s) => s.toggleGrid)
  const setGridSpacing = useAppStore((s) => s.setGridSpacing)
  const toggleDrillHoles = useAppStore((s) => s.toggleDrillHoles)

  const [showInstallGuide, setShowInstallGuide] = useState(false)

  const importInputRef = useRef<HTMLInputElement>(null)

  const selectedFrame = frames.find((f) => selectedFrameIds.includes(f.id))

  const handleWallDimension = useCallback(
    (field: 'width' | 'height', raw: string) => {
      const parsed = parseFloat(raw)
      if (isNaN(parsed) || parsed <= 0) return
      const cm = unit === 'cm' ? parsed : parsed * 2.54
      setWall({ [field]: cm })
    },
    [unit, setWall],
  )

  const handleExport = useCallback(async () => {
    const json = await exportProject()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'frame-planner.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    await importProject(text)
    e.target.value = ''
  }, [])

  const unitLabel = unit === 'cm' ? 'cm' : 'in'

  return (
    <aside className="w-80 h-full bg-surface border-r border-border flex flex-col overflow-hidden" style={{ boxShadow: 'var(--shadow-warm)' }}>
      <div className="px-4 py-3 border-b border-border">
        <h1 className="text-lg font-semibold text-text">Frame Planner</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        <section>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Wall</h2>
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-0.5">Width ({unitLabel})</label>
              <input
                type="number"
                value={displayVal(wall.width, unit)}
                onChange={(e) => handleWallDimension('width', e.target.value)}
                min={10}
                aria-label="Wall width"
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-0.5">Height ({unitLabel})</label>
              <input
                type="number"
                value={displayVal(wall.height, unit)}
                onChange={(e) => handleWallDimension('height', e.target.value)}
                min={10}
                aria-label="Wall height"
                className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {WALL_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setWall({ color: preset.value })}
                className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 ${
                  wall.color === preset.value ? 'border-primary scale-110' : 'border-border'
                }`}
                style={{ backgroundColor: preset.value }}
                title={preset.label}
                aria-label={`Wall color: ${preset.label}`}
              />
            ))}
            <input
              type="color"
              value={wall.color}
              onChange={(e) => setWall({ color: e.target.value })}
              className="w-7 h-7 rounded-lg border border-border cursor-pointer"
              title="Custom wall color"
            />
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Frames</h2>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => addFrame('rect')}
              className="flex-1 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors duration-200"
            >
              + Rectangular
            </button>
            <button
              type="button"
              onClick={() => addFrame('ellipse')}
              className="flex-1 px-3 py-2 rounded-xl bg-secondary text-white text-sm font-medium hover:opacity-90 transition-opacity duration-200"
            >
              + Circular
            </button>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {frames.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => selectFrame(f.id)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm text-left transition-colors duration-150 ${
                  selectedFrameIds.includes(f.id)
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-bg text-text'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-sm border border-border shrink-0"
                  style={{ backgroundColor: f.frameColor }}
                />
                <span className="truncate flex-1">
                  {f.label || `${f.shape === 'rect' ? 'Rect' : 'Ellipse'} ${displayVal(f.width, unit)}×${displayVal(f.height, unit)}`}
                </span>
              </button>
            ))}
            {frames.length === 0 && (
              <p className="text-xs text-text-muted py-2 text-center">No frames yet</p>
            )}
          </div>
        </section>

        {selectedFrame && (
          <section>
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Edit Frame</h2>
            <FrameEditor frame={selectedFrame} />
          </section>
        )}

        <section>
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Settings</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Units</span>
              <div className="flex rounded-xl overflow-hidden border border-border">
                <button
                  type="button"
                  onClick={() => setUnit('cm')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    unit === 'cm' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-bg'
                  }`}
                >
                  cm
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('in')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    unit === 'in' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-bg'
                  }`}
                >
                  in
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Snapping</span>
              <button
                type="button"
                role="switch"
                aria-checked={snapEnabled}
                onClick={toggleSnap}
                className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                  snapEnabled ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    snapEnabled ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Grid</span>
              <button
                type="button"
                role="switch"
                aria-checked={gridEnabled}
                onClick={toggleGrid}
                className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                  gridEnabled ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    gridEnabled ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {gridEnabled && (
              <div className="flex items-center justify-between pl-2">
                <span className="text-xs text-text-muted">Grid spacing ({unitLabel})</span>
                <input
                  type="number"
                  value={unit === 'cm' ? gridSpacing : (gridSpacing / 2.54).toFixed(2)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    if (isNaN(val) || val <= 0) return
                    setGridSpacing(unit === 'cm' ? val : val * 2.54)
                  }}
                  min={1}
                  step={unit === 'cm' ? 5 : 1}
                  className="w-20 px-2 py-1 rounded-lg border border-border bg-surface text-text text-xs text-right focus:outline-none focus:ring-2 focus:ring-primary/40"
                  aria-label="Grid spacing"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-text">Drill holes</span>
              <button
                type="button"
                role="switch"
                aria-checked={drillHolesVisible}
                onClick={toggleDrillHoles}
                className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
                  drillHolesVisible ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                    drillHolesVisible ? 'translate-x-4.5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text">View</span>
              <div className="flex rounded-xl overflow-hidden border border-border">
                <button
                  type="button"
                  onClick={() => setViewMode('2d')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    viewMode === '2d' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-bg'
                  }`}
                >
                  2D
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('3d')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    viewMode === '3d' ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-bg'
                  }`}
                >
                  3D
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => useAppStore.temporal.getState().undo()}
                className="flex-1 px-3 py-1.5 rounded-xl border border-border text-sm text-text-muted hover:bg-bg transition-colors"
              >
                ↩ Undo
              </button>
              <button
                type="button"
                onClick={() => useAppStore.temporal.getState().redo()}
                className="flex-1 px-3 py-1.5 rounded-xl border border-border text-sm text-text-muted hover:bg-bg transition-colors"
              >
                ↪ Redo
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 px-3 py-1.5 rounded-xl border border-border text-sm text-text-muted hover:bg-bg transition-colors"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="flex-1 px-3 py-1.5 rounded-xl border border-border text-sm text-text-muted hover:bg-bg transition-colors"
              >
                Import
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuide(true)}
              className="w-full px-3 py-1.5 rounded-xl border border-border text-sm text-text-muted hover:bg-bg transition-colors"
            >
              Installation Guide
            </button>
          </div>
        </section>
      </div>

      {showInstallGuide && (
        <InstallationGuide onClose={() => setShowInstallGuide(false)} />
      )}
    </aside>
  )
}
