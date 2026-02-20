import { describe, it, expect } from 'vitest'
import type { Frame } from '@/types'
import { frameToMesh } from '../WallScene'
import { getFrameInnerDimensions } from '../FrameMesh3D'

function makeFrame(overrides: Partial<Frame> = {}): Frame {
  return {
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
    ...overrides,
  }
}

describe('frameToMesh', () => {
  it('converts y-from-top coordinates into upward-positive 3D y', () => {
    const topFrame = makeFrame({ x: 130, y: 10 })
    const bottomFrame = makeFrame({ x: 130, y: 210 })

    const top = frameToMesh(topFrame, 300, 250)
    const bottom = frameToMesh(bottomFrame, 300, 250)

    expect(top.y).toBeGreaterThan(bottom.y)
  })

  it('centers a 40x30 frame at x=130,y=110 on a 300x250 wall', () => {
    const mesh = frameToMesh(makeFrame(), 300, 250)

    expect(mesh.x).toBe(0)
    expect(mesh.y).toBe(0)
    expect(mesh.z).toBeCloseTo(0.01)
    expect(mesh.width).toBe(0.4)
    expect(mesh.height).toBe(0.3)
  })

  it('maps top-left frame to negative x and positive y in 3D', () => {
    const mesh = frameToMesh(makeFrame({ x: 0, y: 0 }), 300, 250)

    expect(mesh.x).toBeCloseTo(-1.3)
    expect(mesh.y).toBeCloseTo(1.1)
  })

  it('derives full frame depth in meters from frameWidth', () => {
    const mesh = frameToMesh(makeFrame({ frameWidth: 2 }), 300, 250)

    expect(mesh.frameDepth).toBe(0.02)
  })
})

describe('getFrameInnerDimensions', () => {
  it('derives opening, mat, and artwork dimensions from frame settings', () => {
    const dims = getFrameInnerDimensions(
      makeFrame({
        width: 40,
        height: 30,
        frameWidth: 2,
        matEnabled: true,
        matWidth: 5,
      }),
    )

    expect(dims.openingWidth).toBe(36)
    expect(dims.openingHeight).toBe(26)
    expect(dims.matWidth).toBe(36)
    expect(dims.matHeight).toBe(26)
    expect(dims.artworkWidth).toBe(26)
    expect(dims.artworkHeight).toBe(16)
  })
})
