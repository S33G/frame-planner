import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStore = new Map<string, unknown>()

vi.mock('idb-keyval', () => ({
  get: vi.fn((key: string) => Promise.resolve(mockStore.get(key))),
  set: vi.fn((key: string, value: unknown) => {
    mockStore.set(key, value)
    return Promise.resolve()
  }),
  del: vi.fn((key: string) => {
    mockStore.delete(key)
    return Promise.resolve()
  }),
  entries: vi.fn(() => Promise.resolve([...mockStore.entries()])),
  clear: vi.fn(() => {
    mockStore.clear()
    return Promise.resolve()
  }),
}))

if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url')
}

import {
  saveImage,
  getImage,
  deleteImage,
  getImageUrl,
  exportAllImages,
  importImages,
  clearAllImages,
} from '../imageStorage'

describe('Image Storage Service', () => {
  beforeEach(() => {
    mockStore.clear()
    vi.clearAllMocks()
  })

  it('saves and retrieves an image', async () => {
    const blob = new Blob(['test-image-data'], { type: 'image/png' })
    await saveImage('img1', blob)

    const retrieved = await getImage('img1')
    expect(retrieved).toBeInstanceOf(Blob)
  })

  it('returns null for non-existent image', async () => {
    const result = await getImage('nonexistent')
    expect(result).toBeNull()
  })

  it('deletes an image', async () => {
    const blob = new Blob(['data'])
    await saveImage('img2', blob)
    await deleteImage('img2')

    const result = await getImage('img2')
    expect(result).toBeNull()
  })

  it('deleteImage does not throw for nonexistent id', async () => {
    await expect(deleteImage('nonexistent')).resolves.toBeUndefined()
  })

  it('getImageUrl returns a string for existing image', async () => {
    const blob = new Blob(['data'], { type: 'image/png' })
    await saveImage('img3', blob)

    const url = await getImageUrl('img3')
    expect(typeof url).toBe('string')
    expect(url).toBeTruthy()
  })

  it('getImageUrl returns null for nonexistent image', async () => {
    const url = await getImageUrl('nonexistent')
    expect(url).toBeNull()
  })

  it('exports all images as base64', async () => {
    const blob1 = new Blob(['data1'])
    const blob2 = new Blob(['data2'])
    await saveImage('a', blob1)
    await saveImage('b', blob2)

    const exported = await exportAllImages()
    expect(Object.keys(exported)).toHaveLength(2)
    expect(exported['a']).toBeDefined()
    expect(exported['b']).toBeDefined()
    expect(typeof exported['a']).toBe('string')
  })

  it('imports images from base64 map', async () => {
    const blob = new Blob(['import-test'])
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    await importImages({ 'imported1': base64 })

    const result = await getImage('imported1')
    expect(result).toBeInstanceOf(Blob)
  })

  it('round-trips: save → export → clear → import → get', async () => {
    const original = new Blob(['round-trip-data'], { type: 'image/png' })
    await saveImage('rt1', original)

    const exported = await exportAllImages()
    expect(exported['rt1']).toBeDefined()

    await clearAllImages()
    expect(await getImage('rt1')).toBeNull()

    await importImages(exported)
    const restored = await getImage('rt1')
    expect(restored).toBeInstanceOf(Blob)
    expect(restored!.size).toBe(original.size)
  })
})
