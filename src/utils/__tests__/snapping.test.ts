import { describe, it, expect } from 'vitest'
import { getSnapTargets, getObjectEdges, findSnapGuides } from '../snapping'

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

describe('Snapping Logic', () => {
  describe('getSnapTargets', () => {
    it('includes wall edges and center with no frames', () => {
      const targets = getSnapTargets([], 300, 250)

      expect(targets.vertical).toEqual(
        expect.arrayContaining([
          { position: 0, type: 'edge' },
          { position: 300, type: 'edge' },
          { position: 150, type: 'center' },
        ]),
      )
      expect(targets.horizontal).toEqual(
        expect.arrayContaining([
          { position: 0, type: 'edge' },
          { position: 250, type: 'edge' },
          { position: 125, type: 'center' },
        ]),
      )
    })

    it('includes frame edges and centers', () => {
      const frames = [makeFrame('f1', 10, 20, 40, 30)]
      const targets = getSnapTargets(frames, 300, 250)

      // f1: left=10, right=50, centerX=30
      expect(targets.vertical).toEqual(
        expect.arrayContaining([
          { position: 10, type: 'edge' },
          { position: 50, type: 'edge' },
          { position: 30, type: 'center' },
        ]),
      )
      // f1: top=20, bottom=50, centerY=35
      expect(targets.horizontal).toEqual(
        expect.arrayContaining([
          { position: 20, type: 'edge' },
          { position: 50, type: 'edge' },
          { position: 35, type: 'center' },
        ]),
      )
    })

    it('excludes the frame with skipId', () => {
      const frames = [
        makeFrame('f1', 10, 20, 40, 30),
        makeFrame('f2', 100, 100, 50, 40),
      ]
      const targets = getSnapTargets(frames, 300, 250, 'f1')

      // Should NOT contain f1 edges (10, 50, 30 vertical)
      const vPositions = targets.vertical.map((t) => t.position)
      expect(vPositions).not.toContain(10)
      // But should contain f2 edges
      expect(vPositions).toContain(100)
      expect(vPositions).toContain(150)
      expect(vPositions).toContain(125)
    })
  })

  describe('getObjectEdges', () => {
    it('returns correct vertical and horizontal edges', () => {
      const edges = getObjectEdges({ x: 10, y: 20, width: 40, height: 30 })

      expect(edges.vertical).toEqual([10, 30, 50])
      expect(edges.horizontal).toEqual([20, 35, 50])
    })
  })

  describe('findSnapGuides', () => {
    it('finds snap when frame edge is near wall center', () => {
      const targets = getSnapTargets([], 300, 250)
      // Frame at x=148, center-x = 148 + 2 = 150 (wall center)
      const edges = getObjectEdges({ x: 148, y: 100, width: 4, height: 4 })
      const guides = findSnapGuides(targets, edges, 5)

      const vGuide = guides.find((g) => g.orientation === 'V')
      expect(vGuide).toBeDefined()
      expect(vGuide!.position).toBe(150)
      expect(vGuide!.type).toBe('center')
    })

    it('finds snap when frame is near another frame edge', () => {
      const frames = [makeFrame('f1', 100, 50, 40, 30)]
      const targets = getSnapTargets(frames, 300, 250, 'f2')
      // f1 right edge = 140. Dragging f2 with left edge at x=142
      const edges = getObjectEdges({ x: 142, y: 50, width: 30, height: 20 })
      const guides = findSnapGuides(targets, edges, 5)

      const vGuide = guides.find((g) => g.orientation === 'V')
      expect(vGuide).toBeDefined()
      expect(vGuide!.position).toBe(140)
      expect(vGuide!.snapOffset).toBe(-2) // need to move left by 2
    })

    it('returns no snaps when nothing within threshold', () => {
      const targets = getSnapTargets([], 300, 250)
      // Frame at x=77 — far from wall edges (0, 300) and center (150)
      const edges = getObjectEdges({ x: 77, y: 77, width: 10, height: 10 })
      const guides = findSnapGuides(targets, edges, 5)

      expect(guides).toHaveLength(0)
    })

    it('returns closest snap when multiple targets within threshold', () => {
      // Frame f1 right edge at 100, wall has no special edge there
      const frames = [makeFrame('f1', 60, 50, 40, 30)]
      const targets = getSnapTargets(frames, 300, 250, 'f2')
      // f1 right=100, f1 centerX=80
      // Dragging f2 with left edge at x=99 — close to f1 right (100), distance=1
      const edges = getObjectEdges({ x: 99, y: 50, width: 30, height: 20 })
      const guides = findSnapGuides(targets, edges, 5)

      const vGuide = guides.find((g) => g.orientation === 'V')
      expect(vGuide).toBeDefined()
      expect(vGuide!.position).toBe(100)
      expect(vGuide!.snapOffset).toBe(1)
    })

    it('can snap both V and H independently', () => {
      // Wall center: V=150, H=125
      const targets = getSnapTargets([], 300, 250)
      // Frame with center near both wall centers
      const edges = getObjectEdges({ x: 148, y: 123, width: 4, height: 4 })
      const guides = findSnapGuides(targets, edges, 5)

      expect(guides).toHaveLength(2)
      expect(guides.find((g) => g.orientation === 'V')).toBeDefined()
      expect(guides.find((g) => g.orientation === 'H')).toBeDefined()
    })
  })
})
