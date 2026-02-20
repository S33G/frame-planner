import type { Frame } from '@/types/frame'
import type { Wall } from '@/types/wall'
import { useAppStore } from '@/store/useAppStore'
import { exportAllImages, importImages } from '@/services/imageStorage'

export interface ProjectExport {
  version: 1
  exportedAt: string
  wall: Wall
  frames: Frame[]
  images: Record<string, string>
}

export function validateExport(data: unknown): data is ProjectExport {
  if (typeof data !== 'object' || data === null) return false

  const obj = data as Record<string, unknown>

  if (typeof obj.version !== 'number') return false
  if (typeof obj.exportedAt !== 'string') return false

  if (typeof obj.wall !== 'object' || obj.wall === null) return false
  const wall = obj.wall as Record<string, unknown>
  if (typeof wall.width !== 'number') return false
  if (typeof wall.height !== 'number') return false
  if (typeof wall.color !== 'string') return false

  if (!Array.isArray(obj.frames)) return false

  return true
}

export async function exportProject(): Promise<string> {
  const { wall, frames } = useAppStore.getState()
  const images = await exportAllImages()

  const data: ProjectExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    wall,
    frames,
    images,
  }

  return JSON.stringify(data, null, 2)
}

export async function importProject(json: string): Promise<void> {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('Failed to parse JSON: invalid format')
  }

  if (!validateExport(parsed)) {
    const obj = parsed as Record<string, unknown> | null
    if (typeof obj === 'object' && obj !== null) {
      if (typeof obj.version !== 'number') {
        throw new Error('Invalid export data: missing or invalid version field')
      }
      if (typeof obj.wall !== 'object' || obj.wall === null) {
        throw new Error('Invalid export data: missing or invalid wall field')
      }
      if (!Array.isArray(obj.frames)) {
        throw new Error('Invalid export data: missing or invalid frames field')
      }
    }
    throw new Error('Invalid export data: validation failed')
  }

  await importImages(parsed.images || {})
  useAppStore.setState({ wall: parsed.wall, frames: parsed.frames })
}
