import { useCallback, useEffect, useRef, useState } from 'react'
import type { Frame, Unit } from '@/types'
import { useAppStore } from '@/store/useAppStore'

import { saveImage, deleteImage, getImageUrl } from '@/services/imageStorage'

const FRAME_COLOR_PRESETS = [
  { label: 'Black', value: '#2C2C2C' },
  { label: 'Dark Brown', value: '#4A3728' },
  { label: 'Gold', value: '#C5A55A' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Natural Wood', value: '#B8956A' },
]

const MAT_COLOR_PRESETS = [
  { label: 'Off-White', value: '#FFFEF2' },
  { label: 'Ivory', value: '#FFFFF0' },
  { label: 'Black', value: '#1A1A1A' },
  { label: 'Light Gray', value: '#D9D9D9' },
]

function displayValue(cmValue: number, unit: Unit): string {
  if (unit === 'cm') {
    return cmValue % 1 === 0 ? cmValue.toString() : cmValue.toFixed(1)
  }
  const inches = cmValue / 2.54
  return inches.toFixed(2)
}

interface FrameEditorProps {
  frame: Frame
}

export function FrameEditor({ frame }: FrameEditorProps) {
  const updateFrame = useAppStore((s) => s.updateFrame)
  const removeFrame = useAppStore((s) => s.removeFrame)
  const unit = useAppStore((s) => s.unit)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    if (!frame.imageId) {
      setImagePreview(null)
      return
    }

    getImageUrl(frame.imageId).then((url) => {
      if (!url || cancelled) return
      objectUrl = url
      setImagePreview(url)
    })

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [frame.imageId])

  const handleDimensionChange = useCallback(
    (field: 'width' | 'height', raw: string) => {
      const parsed = parseFloat(raw)
      if (isNaN(parsed) || parsed <= 0) return
      const cm = unit === 'cm' ? parsed : parsed * 2.54
      updateFrame(frame.id, { [field]: cm })
    },
    [frame.id, unit, updateFrame],
  )

  const handleFrameWidthChange = useCallback(
    (raw: string) => {
      const parsed = parseFloat(raw)
      if (isNaN(parsed) || parsed < 0.5) return
      updateFrame(frame.id, { frameWidth: parsed })
    },
    [frame.id, updateFrame],
  )

  const handleMatWidthChange = useCallback(
    (raw: string) => {
      const parsed = parseFloat(raw)
      if (isNaN(parsed) || parsed < 1) return
      updateFrame(frame.id, { matWidth: parsed })
    },
    [frame.id, updateFrame],
  )

  const handleHangingOffsetChange = useCallback(
    (raw: string) => {
      const parsed = parseFloat(raw)
      if (isNaN(parsed) || parsed < 0) return
      const cm = unit === 'cm' ? parsed : parsed * 2.54
      updateFrame(frame.id, { hangingOffset: cm })
    },
    [frame.id, unit, updateFrame],
  )

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const imageId = crypto.randomUUID()
      await saveImage(imageId, file)
      updateFrame(frame.id, { imageId })
      e.target.value = ''
    },
    [frame.id, updateFrame],
  )

  const handleRemoveImage = useCallback(async () => {
    if (frame.imageId) {
      await deleteImage(frame.imageId)
      updateFrame(frame.id, { imageId: null })
    }
  }, [frame.id, frame.imageId, updateFrame])

  const unitLabel = unit === 'cm' ? 'cm' : 'in'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Label</label>
        <input
          type="text"
          value={frame.label}
          onChange={(e) => updateFrame(frame.id, { label: e.target.value })}
          placeholder="Frame name..."
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Dimensions ({unitLabel})</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              value={displayValue(frame.width, unit)}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              min={1}
              step={unit === 'cm' ? 1 : 0.5}
              aria-label="Frame width"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
            />
            <span className="text-xs text-text-muted mt-0.5 block">Width</span>
          </div>
          <span className="flex items-center text-text-muted pt-0 pb-4">×</span>
          <div className="flex-1">
            <input
              type="number"
              value={displayValue(frame.height, unit)}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              min={1}
              step={unit === 'cm' ? 1 : 0.5}
              aria-label="Frame height"
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
            />
            <span className="text-xs text-text-muted mt-0.5 block">Height</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Frame Color</label>
        <div className="flex items-center gap-1.5 mb-2">
          {FRAME_COLOR_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => updateFrame(frame.id, { frameColor: preset.value })}
              className={`w-7 h-7 rounded-lg border-2 transition-all duration-200 ${
                frame.frameColor === preset.value ? 'border-primary scale-110' : 'border-border'
              }`}
              style={{ backgroundColor: preset.value }}
              title={preset.label}
              aria-label={preset.label}
            />
          ))}
          <input
            type="color"
            value={frame.frameColor}
            onChange={(e) => updateFrame(frame.id, { frameColor: e.target.value })}
            className="w-7 h-7 rounded-lg border border-border cursor-pointer"
            title="Custom color"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">
          Frame Width: {frame.frameWidth.toFixed(1)} cm
        </label>
        <input
          type="range"
          min={0.5}
          max={8}
          step={0.5}
          value={frame.frameWidth}
          onChange={(e) => handleFrameWidthChange(e.target.value)}
          className="w-full accent-primary"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-text-muted">Mat / Passepartout</label>
          <button
            type="button"
            role="switch"
            aria-checked={frame.matEnabled}
            onClick={() => updateFrame(frame.id, { matEnabled: !frame.matEnabled })}
            className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${
              frame.matEnabled ? 'bg-primary' : 'bg-border'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                frame.matEnabled ? 'translate-x-4.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
        {frame.matEnabled && (
          <div className="space-y-2 pl-1">
            <div>
              <label className="block text-xs text-text-muted mb-1">
                Mat Width: {frame.matWidth.toFixed(1)} cm
              </label>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={frame.matWidth}
                onChange={(e) => handleMatWidthChange(e.target.value)}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1">Mat Color</label>
              <div className="flex items-center gap-1.5">
                {MAT_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => updateFrame(frame.id, { matColor: preset.value })}
                    className={`w-6 h-6 rounded-md border-2 transition-all duration-200 ${
                      frame.matColor === preset.value ? 'border-primary scale-110' : 'border-border'
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.label}
                    aria-label={preset.label}
                  />
                ))}
                <input
                  type="color"
                  value={frame.matColor}
                  onChange={(e) => updateFrame(frame.id, { matColor: e.target.value })}
                  className="w-6 h-6 rounded-md border border-border cursor-pointer"
                  title="Custom mat color"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">Artwork</label>
        {imagePreview ? (
          <div className="flex items-center gap-3">
            <img
              src={imagePreview}
              alt="Artwork preview"
              className="w-16 h-16 rounded-lg object-cover border border-border"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-xs text-danger hover:text-danger-hover transition-colors"
            >
              Remove image
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-2 rounded-lg border border-dashed border-border text-sm text-text-muted hover:border-primary hover:text-primary transition-all duration-200"
          >
            Upload artwork image
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1">
          Hanging Offset ({unitLabel})
        </label>
        <input
          type="number"
          value={displayValue(frame.hangingOffset, unit)}
          onChange={(e) => handleHangingOffsetChange(e.target.value)}
          min={0}
          step={unit === 'cm' ? 0.5 : 0.25}
          aria-label="Hanging offset"
          className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200"
        />
        <span className="text-xs text-text-muted mt-0.5 block">Distance from top of frame to nail</span>
      </div>

      <button
        type="button"
        onClick={() => removeFrame(frame.id)}
        className="w-full px-4 py-2.5 rounded-xl bg-danger/10 text-danger hover:bg-danger/20 font-medium text-sm transition-all duration-200 mt-2"
      >
        Remove Frame
      </button>
    </div>
  )
}
