import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Frame, Wall } from '@/types'

vi.mock('@/store/useAppStore', () => {
  let state: Record<string, unknown> = {}
  return {
    useAppStore: {
      getState: () => state,
      setState: (partial: Record<string, unknown>) => {
        state = { ...state, ...partial }
      },
      __setMockState: (s: Record<string, unknown>) => {
        state = s
      },
    },
  }
})

vi.mock('@/services/imageStorage', () => ({
  exportAllImages: vi.fn().mockResolvedValue({}),
  importImages: vi.fn().mockResolvedValue(undefined),
  clearAllImages: vi.fn().mockResolvedValue(undefined),
}))

import { exportProject, importProject, validateExport } from '../exportImport'
import { useAppStore } from '@/store/useAppStore'
import { exportAllImages, importImages } from '@/services/imageStorage'

const mockStore = useAppStore as unknown as {
  getState: () => Record<string, unknown>
  setState: (partial: Record<string, unknown>) => void
  __setMockState: (s: Record<string, unknown>) => void
}

const sampleWall: Wall = { width: 300, height: 250, color: '#F5F0EB' }

const sampleFrame: Frame = {
  id: 'frame-1',
  x: 130,
  y: 110,
  width: 40,
  height: 30,
  shape: 'rect',
  frameColor: '#2C2C2C',
  frameWidth: 2,
  matEnabled: false,
  matWidth: 5,
  matColor: '#FFFEF2',
  imageId: null,
  label: '',
  hangingOffset: 3,
}

describe('exportImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.__setMockState({ wall: sampleWall, frames: [sampleFrame] })
    vi.mocked(exportAllImages).mockResolvedValue({})
    vi.mocked(importImages).mockResolvedValue(undefined)
  })

  describe('exportProject', () => {
    it('returns valid JSON with version, wall, frames, images', async () => {
      const json = await exportProject()
      const parsed = JSON.parse(json)

      expect(parsed.version).toBe(1)
      expect(parsed.exportedAt).toBeTruthy()
      expect(parsed.wall).toEqual(sampleWall)
      expect(parsed.frames).toEqual([sampleFrame])
      expect(parsed.images).toEqual({})
    })

    it('includes images from imageStorage', async () => {
      vi.mocked(exportAllImages).mockResolvedValue({ 'img-1': 'base64data' })

      const json = await exportProject()
      const parsed = JSON.parse(json)

      expect(parsed.images).toEqual({ 'img-1': 'base64data' })
    })

    it('exports valid JSON with empty frames array when no frames exist', async () => {
      mockStore.__setMockState({ wall: sampleWall, frames: [] })

      const json = await exportProject()
      const parsed = JSON.parse(json)

      expect(parsed.frames).toEqual([])
      expect(parsed.images).toEqual({})
    })
  })

  describe('importProject', () => {
    it('restores wall, frames, and calls importImages', async () => {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        wall: { width: 400, height: 300, color: '#000000' },
        frames: [{ ...sampleFrame, id: 'imported-1' }],
        images: { 'img-1': 'base64data' },
      }

      await importProject(JSON.stringify(data))

      expect(mockStore.getState().wall).toEqual(data.wall)
      expect(mockStore.getState().frames).toEqual(data.frames)
      expect(importImages).toHaveBeenCalledWith({ 'img-1': 'base64data' })
    })

    it('handles missing images field (backward compat)', async () => {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        wall: sampleWall,
        frames: [sampleFrame],
      }

      await importProject(JSON.stringify(data))

      expect(importImages).toHaveBeenCalledWith({})
      expect(mockStore.getState().wall).toEqual(sampleWall)
    })

    it('throws on malformed JSON', async () => {
      await expect(importProject('not json')).rejects.toThrow(/parse|invalid/i)
    })

    it('throws on missing version field', async () => {
      const data = {
        exportedAt: new Date().toISOString(),
        wall: sampleWall,
        frames: [],
      }
      await expect(importProject(JSON.stringify(data))).rejects.toThrow(
        /version/i,
      )
    })

    it('throws on missing wall field', async () => {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        frames: [],
      }
      await expect(importProject(JSON.stringify(data))).rejects.toThrow(
        /wall/i,
      )
    })
  })

  describe('validateExport', () => {
    it('returns true for valid export data', () => {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        wall: sampleWall,
        frames: [sampleFrame],
        images: {},
      }
      expect(validateExport(data)).toBe(true)
    })

    it('returns false for null', () => {
      expect(validateExport(null)).toBe(false)
    })

    it('returns false for missing frames', () => {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        wall: sampleWall,
      }
      expect(validateExport(data)).toBe(false)
    })
  })

  describe('roundtrip', () => {
    it('export then import produces identical state', async () => {
      const frames = [
        sampleFrame,
        { ...sampleFrame, id: 'frame-2', x: 50, y: 50, imageId: 'img-1' },
      ]
      mockStore.__setMockState({ wall: sampleWall, frames })
      vi.mocked(exportAllImages).mockResolvedValue({ 'img-1': 'aGVsbG8=' })

      const exported = await exportProject()

      mockStore.__setMockState({ wall: { width: 0, height: 0, color: '' }, frames: [] })

      await importProject(exported)

      expect(mockStore.getState().wall).toEqual(sampleWall)
      expect(mockStore.getState().frames).toEqual(frames)
      expect(importImages).toHaveBeenCalledWith({ 'img-1': 'aGVsbG8=' })
    })
  })
})
