import { describe, it, expect } from 'vitest'
import { calculateScale, cmToPx, pxToCm } from '../useCanvasScale'

describe('calculateScale', () => {
  it('fits a 300cm wall into 600px container with no padding', () => {
    const scale = calculateScale(300, 250, 600, 500, 0)
    expect(scale).toBe(2)
  })

  it('fits a 300cm wall into 600px container with 40px padding', () => {
    const scale = calculateScale(300, 250, 600, 500, 40)
    expect(scale).toBeCloseTo((500 - 80) / 250)
  })

  it('uses height-limited scale when wall is tall', () => {
    const scale = calculateScale(100, 400, 600, 500, 0)
    expect(scale).toBe(1.25)
  })

  it('returns 1 when container has zero width', () => {
    const scale = calculateScale(300, 250, 0, 500, 0)
    expect(scale).toBe(1)
  })

  it('returns 1 when padding exceeds container', () => {
    const scale = calculateScale(300, 250, 60, 60, 40)
    expect(scale).toBe(1)
  })
})

describe('cmToPx', () => {
  it('converts cm to px using scale factor', () => {
    expect(cmToPx(10, 2)).toBe(20)
  })

  it('handles zero', () => {
    expect(cmToPx(0, 2)).toBe(0)
  })
})

describe('pxToCm', () => {
  it('converts px to cm using scale factor', () => {
    expect(pxToCm(20, 2)).toBe(10)
  })

  it('handles zero', () => {
    expect(pxToCm(0, 2)).toBe(0)
  })
})
