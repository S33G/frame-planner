import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock throttle as passthrough — the throttle closure leaks state across tests
vi.mock('../../utils/throttle', () => ({
  throttle: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}))

import { useAppStore } from '../useAppStore'
import type { AppStore } from '../useAppStore'
import { MAX_FRAMES } from '../../utils/constants'

function resetStore() {
  const { setState, getInitialState } = useAppStore
  setState(getInitialState(), true)
  useAppStore.temporal.getState().clear()
  localStorage.clear()
}

describe('useAppStore', () => {
  beforeEach(() => {
    resetStore()
  })

  // ─── Initial State ───────────────────────────────────────

  it('has correct initial state', () => {
    const state = useAppStore.getState()
    expect(state.wall).toEqual({ width: 300, height: 250, color: '#F5F0EB' })
    expect(state.frames).toEqual([])
    expect(state.selectedFrameIds).toEqual([])
    expect(state.unit).toBe('cm')
    expect(state.snapEnabled).toBe(true)
    expect(state.viewMode).toBe('2d')
  })

  // ─── addFrame ────────────────────────────────────────────

  it('addFrame adds a rect frame with generated ID and defaults', () => {
    useAppStore.getState().addFrame('rect')
    const { frames } = useAppStore.getState()

    expect(frames).toHaveLength(1)
    expect(frames[0].id).toBeTruthy()
    expect(frames[0].shape).toBe('rect')
    expect(frames[0].width).toBe(40)
    expect(frames[0].height).toBe(30)
    expect(frames[0].frameColor).toBe('#2C2C2C')
    // Centered on default wall: (300 - 40) / 2 = 130, (250 - 30) / 2 = 110
    expect(frames[0].x).toBe(130)
    expect(frames[0].y).toBe(110)
  })

  it('addFrame adds an ellipse frame', () => {
    useAppStore.getState().addFrame('ellipse')
    const { frames } = useAppStore.getState()

    expect(frames).toHaveLength(1)
    expect(frames[0].shape).toBe('ellipse')
  })

  it('addFrame does nothing when at MAX_FRAMES', () => {
    const state = useAppStore.getState()
    // Bulk-add frames up to limit
    for (let i = 0; i < MAX_FRAMES; i++) {
      state.addFrame('rect')
    }
    expect(useAppStore.getState().frames).toHaveLength(MAX_FRAMES)

    // One more should be rejected
    useAppStore.getState().addFrame('rect')
    expect(useAppStore.getState().frames).toHaveLength(MAX_FRAMES)
  })

  // ─── removeFrame ─────────────────────────────────────────

  it('removeFrame removes a frame by id', () => {
    useAppStore.getState().addFrame('rect')
    const id = useAppStore.getState().frames[0].id
    useAppStore.getState().removeFrame(id)

    expect(useAppStore.getState().frames).toHaveLength(0)
  })

  it('removeFrame also deselects the removed frame', () => {
    useAppStore.getState().addFrame('rect')
    const id = useAppStore.getState().frames[0].id
    useAppStore.getState().selectFrame(id)
    expect(useAppStore.getState().selectedFrameIds).toContain(id)

    useAppStore.getState().removeFrame(id)
    expect(useAppStore.getState().selectedFrameIds).not.toContain(id)
  })

  // ─── updateFrame ─────────────────────────────────────────

  it('updateFrame merges partial update into existing frame', () => {
    useAppStore.getState().addFrame('rect')
    const id = useAppStore.getState().frames[0].id

    useAppStore.getState().updateFrame(id, { x: 50, y: 60, frameColor: '#FF0000' })

    const frame = useAppStore.getState().frames[0]
    expect(frame.x).toBe(50)
    expect(frame.y).toBe(60)
    expect(frame.frameColor).toBe('#FF0000')
    // Other fields unchanged
    expect(frame.width).toBe(40)
  })

  it('updateFrame does nothing for nonexistent id', () => {
    useAppStore.getState().addFrame('rect')
    const before = useAppStore.getState().frames[0]

    useAppStore.getState().updateFrame('nonexistent', { x: 999 })

    const after = useAppStore.getState().frames[0]
    expect(after.x).toBe(before.x)
  })

  // ─── duplicateFrame ──────────────────────────────────────

  it('duplicateFrame creates a copy with new ID and offset position', () => {
    useAppStore.getState().addFrame('rect')
    const original = useAppStore.getState().frames[0]

    useAppStore.getState().duplicateFrame(original.id)

    const { frames } = useAppStore.getState()
    expect(frames).toHaveLength(2)

    const duplicate = frames[1]
    expect(duplicate.id).not.toBe(original.id)
    expect(duplicate.x).toBe(original.x + 2)
    expect(duplicate.y).toBe(original.y + 2)
    expect(duplicate.width).toBe(original.width)
    expect(duplicate.frameColor).toBe(original.frameColor)
  })

  it('duplicateFrame does nothing when at MAX_FRAMES', () => {
    for (let i = 0; i < MAX_FRAMES; i++) {
      useAppStore.getState().addFrame('rect')
    }
    const id = useAppStore.getState().frames[0].id

    useAppStore.getState().duplicateFrame(id)
    expect(useAppStore.getState().frames).toHaveLength(MAX_FRAMES)
  })

  // ─── selectFrame ─────────────────────────────────────────

  it('selectFrame single-select replaces selection', () => {
    useAppStore.getState().addFrame('rect')
    useAppStore.getState().addFrame('ellipse')
    const [f1, f2] = useAppStore.getState().frames

    useAppStore.getState().selectFrame(f1.id)
    expect(useAppStore.getState().selectedFrameIds).toEqual([f1.id])

    useAppStore.getState().selectFrame(f2.id)
    expect(useAppStore.getState().selectedFrameIds).toEqual([f2.id])
  })

  it('selectFrame multi-select appends', () => {
    useAppStore.getState().addFrame('rect')
    useAppStore.getState().addFrame('ellipse')
    const [f1, f2] = useAppStore.getState().frames

    useAppStore.getState().selectFrame(f1.id)
    useAppStore.getState().selectFrame(f2.id, true)
    expect(useAppStore.getState().selectedFrameIds).toEqual([f1.id, f2.id])
  })

  it('selectFrame multi does not add duplicate', () => {
    useAppStore.getState().addFrame('rect')
    const id = useAppStore.getState().frames[0].id

    useAppStore.getState().selectFrame(id)
    useAppStore.getState().selectFrame(id, true)
    expect(useAppStore.getState().selectedFrameIds).toEqual([id])
  })

  // ─── deselectAll ─────────────────────────────────────────

  it('deselectAll clears selection', () => {
    useAppStore.getState().addFrame('rect')
    useAppStore.getState().selectFrame(useAppStore.getState().frames[0].id)
    expect(useAppStore.getState().selectedFrameIds).toHaveLength(1)

    useAppStore.getState().deselectAll()
    expect(useAppStore.getState().selectedFrameIds).toEqual([])
  })

  // ─── setWall ─────────────────────────────────────────────

  it('setWall updates wall dimensions and color', () => {
    useAppStore.getState().setWall({ width: 400, color: '#000000' })

    const { wall } = useAppStore.getState()
    expect(wall.width).toBe(400)
    expect(wall.color).toBe('#000000')
    // height unchanged
    expect(wall.height).toBe(250)
  })

  // ─── setUnit ─────────────────────────────────────────────

  it('setUnit changes display unit without modifying stored values', () => {
    useAppStore.getState().addFrame('rect')
    const frameBefore = useAppStore.getState().frames[0]

    useAppStore.getState().setUnit('in')
    expect(useAppStore.getState().unit).toBe('in')

    // Frame values still in cm
    const frameAfter = useAppStore.getState().frames[0]
    expect(frameAfter.width).toBe(frameBefore.width)
    expect(frameAfter.x).toBe(frameBefore.x)
  })

  // ─── toggleSnap ──────────────────────────────────────────

  it('toggleSnap flips snapEnabled', () => {
    expect(useAppStore.getState().snapEnabled).toBe(true)
    useAppStore.getState().toggleSnap()
    expect(useAppStore.getState().snapEnabled).toBe(false)
    useAppStore.getState().toggleSnap()
    expect(useAppStore.getState().snapEnabled).toBe(true)
  })

  // ─── setViewMode ─────────────────────────────────────────

  it('setViewMode switches between 2d and 3d', () => {
    expect(useAppStore.getState().viewMode).toBe('2d')
    useAppStore.getState().setViewMode('3d')
    expect(useAppStore.getState().viewMode).toBe('3d')
    useAppStore.getState().setViewMode('2d')
    expect(useAppStore.getState().viewMode).toBe('2d')
  })

  // ─── Undo / Redo ─────────────────────────────────────────

  it('undo after addFrame removes the frame', () => {
    useAppStore.getState().addFrame('rect')
    expect(useAppStore.getState().frames).toHaveLength(1)

    useAppStore.temporal.getState().undo()
    expect(useAppStore.getState().frames).toHaveLength(0)
  })

  it('undo then redo restores frame', () => {
    useAppStore.getState().addFrame('rect')

    useAppStore.temporal.getState().undo()
    expect(useAppStore.getState().frames).toHaveLength(0)

    useAppStore.temporal.getState().redo()
    expect(useAppStore.getState().frames).toHaveLength(1)
  })

  it('undo after updateFrame restores previous values', () => {
    useAppStore.getState().addFrame('rect')

    const id = useAppStore.getState().frames[0].id
    useAppStore.getState().updateFrame(id, { x: 99, y: 88 })

    useAppStore.temporal.getState().undo()
    const frame = useAppStore.getState().frames[0]
    expect(frame.x).toBe(130)
    expect(frame.y).toBe(110)
  })

  // ─── Persist ─────────────────────────────────────────────

  it('persist partializes: only wall, frames, unit, snapEnabled stored', () => {
    useAppStore.getState().addFrame('rect')
    useAppStore.getState().selectFrame(useAppStore.getState().frames[0].id)
    useAppStore.getState().setViewMode('3d')
    useAppStore.getState().setUnit('in')

    const stored = localStorage.getItem('frame-planner-storage')
    expect(stored).toBeTruthy()

    const parsed = JSON.parse(stored!) as { state: Record<string, unknown> }
    expect(parsed.state.wall).toBeDefined()
    expect(parsed.state.frames).toBeDefined()
    expect(parsed.state.unit).toBe('in')
    expect(parsed.state.snapEnabled).toBe(true)
    expect(parsed.state.selectedFrameIds).toBeUndefined()
    expect(parsed.state.viewMode).toBeUndefined()
  })

  it('persist: state survives simulated reload', async () => {
    useAppStore.getState().addFrame('rect')
    useAppStore.getState().addFrame('ellipse')
    useAppStore.getState().setWall({ color: '#123456' })
    useAppStore.getState().setUnit('in')
    useAppStore.getState().selectFrame(useAppStore.getState().frames[0].id)

    const stored = localStorage.getItem('frame-planner-storage')
    expect(stored).toBeTruthy()

    useAppStore.setState(useAppStore.getInitialState(), true)
    useAppStore.temporal.getState().clear()

    // setState triggers persist's setItem, overwriting localStorage — restore it
    localStorage.setItem('frame-planner-storage', stored!)

    await new Promise<void>((resolve) => {
      const unsub = useAppStore.persist.onFinishHydration(() => {
        unsub()
        resolve()
      })
      useAppStore.persist.rehydrate()
    })

    const state = useAppStore.getState()
    expect(state.frames).toHaveLength(2)
    expect(state.wall.color).toBe('#123456')
    expect(state.unit).toBe('in')
    expect(state.selectedFrameIds).toEqual([])
    expect(state.viewMode).toBe('2d')
  })

  // ─── Temporal partialize ─────────────────────────────────

  it('temporal partialize excludes selectedFrameIds from undo', () => {
    useAppStore.getState().addFrame('rect')

    const id = useAppStore.getState().frames[0].id
    useAppStore.getState().selectFrame(id)

    const pastStates = useAppStore.temporal.getState().pastStates as Partial<AppStore>[]
    for (const past of pastStates) {
      expect(past).not.toHaveProperty('selectedFrameIds')
      expect(past).not.toHaveProperty('viewMode')
    }
  })
})
