import type { Frame, Wall } from '@/types'

export const SNAP_THRESHOLD = 5
export const MAX_FRAMES = 50
export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 4
export const UNDO_LIMIT = 50

export const DEFAULT_FRAME: Omit<Frame, 'id' | 'x' | 'y'> = {
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

export const DEFAULT_WALL: Wall = {
  width: 300,
  height: 250,
  color: '#F5F0EB',
}
