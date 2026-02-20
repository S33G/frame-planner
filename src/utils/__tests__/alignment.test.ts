import { describe, it, expect } from 'vitest'
import { alignFrames } from '../alignment'

const makeFrame = (
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
) => ({
  id,
  x,
  y,
  width,
  height,
  shape: 'rect' as const,
  frameColor: '#000',
  frameWidth: 2,
  matEnabled: false,
  matWidth: 5,
  matColor: '#fff',
  imageId: null,
  label: '',
  hangingOffset: 3,
})

describe('Alignment Logic', () => {
  const frames = [
    makeFrame('a', 10, 10, 40, 30),
    makeFrame('b', 60, 50, 30, 20),
    makeFrame('c', 120, 30, 50, 40),
  ]
  const selectedIds = ['a', 'b', 'c']

  describe('alignTop', () => {
    it('aligns all selected frames to the topmost y', () => {
      const updates = alignFrames(frames, selectedIds, 'top')
      // min y = 10 (frame a)
      // b and c should move to y=10
      expect(updates).toEqual(
        expect.arrayContaining([
          { id: 'b', x: 60, y: 10 },
          { id: 'c', x: 120, y: 10 },
        ]),
      )
      // frame a is already at y=10, should not be in updates
      expect(updates.find((u) => u.id === 'a')).toBeUndefined()
    })
  })

  describe('alignBottom', () => {
    it('aligns all selected frames to the bottommost edge', () => {
      // a: bottom=40, b: bottom=70, c: bottom=70 → max=70
      const updates = alignFrames(frames, selectedIds, 'bottom')
      // a should move: y = 70 - 30 = 40
      expect(updates).toEqual(
        expect.arrayContaining([{ id: 'a', x: 10, y: 40 }]),
      )
    })
  })

  describe('alignCenterV', () => {
    it('centers all selected frames vertically', () => {
      // centerY: a=25, b=60, c=50
      // avg = (25+60+50)/3 = 45
      const updates = alignFrames(frames, selectedIds, 'centerV')
      for (const update of updates) {
        const frame = frames.find((f) => f.id === update.id)!
        expect(update.y + frame.height / 2).toBeCloseTo(45, 5)
      }
    })
  })

  describe('alignLeft', () => {
    it('aligns all selected frames to the leftmost x', () => {
      const updates = alignFrames(frames, selectedIds, 'left')
      // min x = 10 (frame a)
      expect(updates).toEqual(
        expect.arrayContaining([
          { id: 'b', x: 10, y: 50 },
          { id: 'c', x: 10, y: 30 },
        ]),
      )
      expect(updates.find((u) => u.id === 'a')).toBeUndefined()
    })
  })

  describe('alignRight', () => {
    it('aligns all selected frames to the rightmost edge', () => {
      // a: right=50, b: right=90, c: right=170 → max=170
      const updates = alignFrames(frames, selectedIds, 'right')
      // a: x = 170-40 = 130, b: x = 170-30 = 140
      expect(updates).toEqual(
        expect.arrayContaining([
          { id: 'a', x: 130, y: 10 },
          { id: 'b', x: 140, y: 50 },
        ]),
      )
    })
  })

  describe('alignCenterH', () => {
    it('centers all selected frames horizontally', () => {
      // centerX: a=30, b=75, c=145
      // avg = (30+75+145)/3 = 83.33...
      const updates = alignFrames(frames, selectedIds, 'centerH')
      const avgCenterX = (30 + 75 + 145) / 3
      for (const update of updates) {
        const frame = frames.find((f) => f.id === update.id)!
        expect(update.x + frame.width / 2).toBeCloseTo(avgCenterX, 5)
      }
    })
  })

  describe('distributeH', () => {
    it('distributes 3 frames with equal horizontal gaps', () => {
      // sorted by x: a(x=10,w=40), b(x=60,w=30), c(x=120,w=50)
      // totalSpace = 120+50 - 10 = 160
      // totalWidth = 40+30+50 = 120
      // gap = (160-120)/(3-1) = 20
      // a: x=10 (stays), b: x=10+40+20=70, c: x=70+30+20=120 (stays)
      const updates = alignFrames(frames, selectedIds, 'distributeH')
      const bUpdate = updates.find((u) => u.id === 'b')
      expect(bUpdate).toBeDefined()
      expect(bUpdate!.x).toBeCloseTo(70, 5)
    })
  })

  describe('distributeV', () => {
    it('distributes 3 frames with equal vertical gaps', () => {
      // sorted by y: a(y=10,h=30), c(y=30,h=40), b(y=50,h=20)
      // totalSpace = 50+20 - 10 = 60
      // totalHeight = 30+40+20 = 90
      // gap = (60-90)/(3-1) = -15 (overlapping, but math still works)
      // a: y=10, c: y=10+30+(-15)=25, b: y=25+40+(-15)=50 (stays)
      const updates = alignFrames(frames, selectedIds, 'distributeV')
      const cUpdate = updates.find((u) => u.id === 'c')
      expect(cUpdate).toBeDefined()
      expect(cUpdate!.y).toBeCloseTo(25, 5)
    })
  })

  describe('distributeHWallCenter', () => {
    const wall = { width: 300, height: 250 }

    it('distributes frames evenly centered on the wall horizontally', () => {
      // 3 frames: a(w=40), b(w=30), c(w=50) → totalWidth=120
      // gap = (300 - 120) / (3 + 1) = 45
      // a: x=45, b: x=45+40+45=130, c: x=130+30+45=205
      const updates = alignFrames(frames, selectedIds, 'distributeHWallCenter', wall)

      const aUpdate = updates.find((u) => u.id === 'a')
      const bUpdate = updates.find((u) => u.id === 'b')
      const cUpdate = updates.find((u) => u.id === 'c')

      expect(aUpdate).toBeDefined()
      expect(aUpdate!.x).toBeCloseTo(45, 5)

      expect(bUpdate).toBeDefined()
      expect(bUpdate!.x).toBeCloseTo(130, 5)

      expect(cUpdate).toBeDefined()
      expect(cUpdate!.x).toBeCloseTo(205, 5)
    })

    it('centers a single frame on the wall horizontally', () => {
      // frame a: w=40, gap = (300-40)/2 = 130
      const updates = alignFrames(frames, ['a'], 'distributeHWallCenter', wall)
      const aUpdate = updates.find((u) => u.id === 'a')
      expect(aUpdate).toBeDefined()
      expect(aUpdate!.x).toBeCloseTo(130, 5)
    })

    it('returns empty when no wall dimensions provided', () => {
      const updates = alignFrames(frames, selectedIds, 'distributeHWallCenter')
      expect(updates).toEqual([])
    })
  })

  describe('distributeVWallCenter', () => {
    const wall = { width: 300, height: 250 }

    it('distributes frames evenly centered on the wall vertically', () => {
      // sorted by y: a(y=10,h=30), c(y=30,h=40), b(y=50,h=20) → totalHeight=90
      // gap = (250 - 90) / (3 + 1) = 40
      // a: y=40, c: y=40+30+40=110, b: y=110+40+40=190
      const updates = alignFrames(frames, selectedIds, 'distributeVWallCenter', wall)

      const aUpdate = updates.find((u) => u.id === 'a')
      const cUpdate = updates.find((u) => u.id === 'c')
      const bUpdate = updates.find((u) => u.id === 'b')

      expect(aUpdate).toBeDefined()
      expect(aUpdate!.y).toBeCloseTo(40, 5)

      expect(cUpdate).toBeDefined()
      expect(cUpdate!.y).toBeCloseTo(110, 5)

      expect(bUpdate).toBeDefined()
      expect(bUpdate!.y).toBeCloseTo(190, 5)
    })

    it('centers a single frame on the wall vertically', () => {
      // frame a: h=30, gap = (250-30)/2 = 110
      const updates = alignFrames(frames, ['a'], 'distributeVWallCenter', wall)
      const aUpdate = updates.find((u) => u.id === 'a')
      expect(aUpdate).toBeDefined()
      expect(aUpdate!.y).toBeCloseTo(110, 5)
    })
  })

  describe('edge cases', () => {
    it('returns empty array with 1 frame selected', () => {
      const updates = alignFrames(frames, ['a'], 'top')
      expect(updates).toEqual([])
    })

    it('returns empty array with 0 frames selected', () => {
      const updates = alignFrames(frames, [], 'left')
      expect(updates).toEqual([])
    })

    it('returns empty array for distribute with fewer than 3 frames', () => {
      const updates = alignFrames(frames, ['a', 'b'], 'distributeH')
      expect(updates).toEqual([])
    })

    it('works with ellipse frames using bounding box', () => {
      const ellipseFrames = [
        { ...makeFrame('e1', 10, 10, 40, 40), shape: 'ellipse' as const },
        { ...makeFrame('e2', 60, 50, 30, 30), shape: 'ellipse' as const },
      ]
      const updates = alignFrames(ellipseFrames, ['e1', 'e2'], 'top')
      expect(updates).toEqual([{ id: 'e2', x: 60, y: 10 }])
    })
  })
})
