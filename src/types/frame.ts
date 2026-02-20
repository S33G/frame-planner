export interface Frame {
  id: string
  x: number
  y: number
  width: number
  height: number
  shape: 'rect' | 'ellipse'
  frameColor: string
  frameWidth: number
  matEnabled: boolean
  matWidth: number
  matColor: string
  imageId: string | null
  label: string
  hangingOffset: number
}
