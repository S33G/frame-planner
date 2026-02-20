import { describe, it, expect } from 'vitest'
import { clampZoom, calculateZoomToPoint } from '../useZoom'
import { ZOOM_MIN, ZOOM_MAX } from '@/utils/constants'

describe('clampZoom', () => {
  it('returns value when within range', () => {
    expect(clampZoom(1)).toBe(1)
    expect(clampZoom(2)).toBe(2)
  })

  it('clamps to ZOOM_MIN when below range', () => {
    expect(clampZoom(0.1)).toBe(ZOOM_MIN)
    expect(clampZoom(0)).toBe(ZOOM_MIN)
    expect(clampZoom(-1)).toBe(ZOOM_MIN)
  })

  it('clamps to ZOOM_MAX when above range', () => {
    expect(clampZoom(5)).toBe(ZOOM_MAX)
    expect(clampZoom(100)).toBe(ZOOM_MAX)
  })

  it('returns exact boundary values', () => {
    expect(clampZoom(ZOOM_MIN)).toBe(ZOOM_MIN)
    expect(clampZoom(ZOOM_MAX)).toBe(ZOOM_MAX)
  })
})

describe('calculateZoomToPoint', () => {
  it('zooms toward pointer position', () => {
    // Pointer at (100, 100), stage at (0, 0), scale 1 -> 2
    const result = calculateZoomToPoint(1, 2, 100, 100, 0, 0)
    // New position should move stage so the point under the pointer stays fixed
    // pointerX - (pointerX - stageX) * (newScale / oldScale)
    // 100 - (100 - 0) * (2/1) = 100 - 200 = -100
    expect(result.x).toBe(-100)
    expect(result.y).toBe(-100)
  })

  it('zooms out from pointer position', () => {
    // Pointer at (200, 200), stage at (-100, -100), scale 2 -> 1
    const result = calculateZoomToPoint(2, 1, 200, 200, -100, -100)
    // 200 - (200 - (-100)) * (1/2) = 200 - 150 = 50
    expect(result.x).toBe(50)
    expect(result.y).toBe(50)
  })

  it('no change when scale is the same', () => {
    const result = calculateZoomToPoint(1, 1, 100, 100, 50, 50)
    expect(result.x).toBe(50)
    expect(result.y).toBe(50)
  })

  it('handles non-origin stage position', () => {
    // Stage already offset, zoom in at pointer
    const result = calculateZoomToPoint(1, 1.5, 300, 200, -50, -30)
    // 300 - (300 - (-50)) * (1.5/1) = 300 - 525 = -225
    // 200 - (200 - (-30)) * (1.5/1) = 200 - 345 = -145
    expect(result.x).toBe(-225)
    expect(result.y).toBe(-145)
  })
})
