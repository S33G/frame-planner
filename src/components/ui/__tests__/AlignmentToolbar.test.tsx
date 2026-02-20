import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../../../utils/throttle', () => ({
  throttle: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}))

import { useAppStore } from '../../../store/useAppStore'
import { AlignmentToolbar } from '../AlignmentToolbar'

function resetStore() {
  const { setState, getInitialState } = useAppStore
  setState(getInitialState(), true)
  useAppStore.temporal.getState().clear()
  localStorage.clear()
}

function addTestFrames() {
  const { addFrame, updateFrame } = useAppStore.getState()
  addFrame('rect')
  addFrame('rect')
  addFrame('rect')
  const frames = useAppStore.getState().frames
  updateFrame(frames[0].id, { x: 10, y: 10 })
  updateFrame(frames[1].id, { x: 50, y: 30 })
  updateFrame(frames[2].id, { x: 90, y: 50 })
  return useAppStore.getState().frames
}

describe('AlignmentToolbar', () => {
  beforeEach(() => {
    resetStore()
  })

  it('renders 10 alignment buttons', () => {
    render(<AlignmentToolbar />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(10)
  })

  it('all buttons disabled when fewer than 2 frames selected', () => {
    render(<AlignmentToolbar />)
    const buttons = screen.getAllByRole('button')
    for (const btn of buttons) {
      expect(btn).toBeDisabled()
    }
  })

  it('alignment buttons enabled when 2 frames selected', () => {
    const frames = addTestFrames()
    useAppStore.getState().selectFrame(frames[0].id, false)
    useAppStore.getState().selectFrame(frames[1].id, true)

    render(<AlignmentToolbar />)

    const alignTopBtn = screen.getByLabelText('Align Top')
    expect(alignTopBtn).not.toBeDisabled()
  })

  it('distribute buttons disabled when only 2 frames selected', () => {
    const frames = addTestFrames()
    useAppStore.getState().selectFrame(frames[0].id, false)
    useAppStore.getState().selectFrame(frames[1].id, true)

    render(<AlignmentToolbar />)

    const distH = screen.getByLabelText('Distribute Horizontal')
    const distV = screen.getByLabelText('Distribute Vertical')
    expect(distH).toBeDisabled()
    expect(distV).toBeDisabled()
  })

  it('distribute buttons enabled when 3 frames selected', () => {
    const frames = addTestFrames()
    useAppStore.getState().selectFrame(frames[0].id, false)
    useAppStore.getState().selectFrame(frames[1].id, true)
    useAppStore.getState().selectFrame(frames[2].id, true)

    render(<AlignmentToolbar />)

    const distH = screen.getByLabelText('Distribute Horizontal')
    expect(distH).not.toBeDisabled()
  })

  it('clicking Align Top aligns selected frames', () => {
    const frames = addTestFrames()
    useAppStore.getState().selectFrame(frames[0].id, false)
    useAppStore.getState().selectFrame(frames[1].id, true)
    useAppStore.getState().selectFrame(frames[2].id, true)

    render(<AlignmentToolbar />)
    fireEvent.click(screen.getByLabelText('Align Top'))

    const updated = useAppStore.getState().frames
    const minY = Math.min(10, 30, 50)
    for (const f of updated) {
      expect(f.y).toBe(minY)
    }
  })

  it('clicking Align Left aligns selected frames', () => {
    const frames = addTestFrames()
    useAppStore.getState().selectFrame(frames[0].id, false)
    useAppStore.getState().selectFrame(frames[1].id, true)
    useAppStore.getState().selectFrame(frames[2].id, true)

    render(<AlignmentToolbar />)
    fireEvent.click(screen.getByLabelText('Align Left'))

    const updated = useAppStore.getState().frames
    const minX = Math.min(10, 50, 90)
    for (const f of updated) {
      expect(f.x).toBe(minX)
    }
  })

  it('wall center distribute buttons enabled with 1 frame selected', () => {
    const frames = addTestFrames()
    useAppStore.getState().selectFrame(frames[0].id, false)

    render(<AlignmentToolbar />)

    const distHWall = screen.getByLabelText('Distribute to Wall Center H')
    const distVWall = screen.getByLabelText('Distribute to Wall Center V')
    expect(distHWall).not.toBeDisabled()
    expect(distVWall).not.toBeDisabled()
  })

  it('clicking Distribute to Wall Center H centers frames on wall', () => {
    const frames = addTestFrames()
    useAppStore.getState().selectFrame(frames[0].id, false)
    useAppStore.getState().selectFrame(frames[1].id, true)
    useAppStore.getState().selectFrame(frames[2].id, true)

    render(<AlignmentToolbar />)
    fireEvent.click(screen.getByLabelText('Distribute to Wall Center H'))

    const updated = useAppStore.getState().frames
    const totalWidth = updated.reduce((sum, f) => sum + f.width, 0)
    const wallWidth = useAppStore.getState().wall.width
    const gap = (wallWidth - totalWidth) / (updated.length + 1)
    expect(gap).toBeGreaterThan(0)

    const sorted = [...updated].sort((a, b) => a.x - b.x)
    expect(sorted[0].x).toBeCloseTo(gap, 1)
  })

  it('has correct aria-label on toolbar', () => {
    render(<AlignmentToolbar />)
    expect(screen.getByRole('toolbar')).toHaveAttribute('aria-label', 'Alignment')
  })
})
