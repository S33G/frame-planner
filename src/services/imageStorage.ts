import { get, set, del, entries, clear } from 'idb-keyval'

export async function saveImage(id: string, blob: Blob): Promise<void> {
  await set(`img:${id}`, blob)
}

export async function getImage(id: string): Promise<Blob | null> {
  try {
    const blob = await get<Blob>(`img:${id}`)
    return blob ?? null
  } catch {
    return null
  }
}

export async function deleteImage(id: string): Promise<void> {
  await del(`img:${id}`)
}

export async function getImageUrl(id: string): Promise<string | null> {
  const blob = await getImage(id)
  if (!blob) return null
  return URL.createObjectURL(blob)
}

export async function exportAllImages(): Promise<Record<string, string>> {
  const allEntries = await entries<string, Blob>()
  const result: Record<string, string> = {}

  for (const [key, blob] of allEntries) {
    if (typeof key === 'string' && key.startsWith('img:')) {
      const id = key.slice(4)
      const buffer = await blob.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      result[id] = btoa(binary)
    }
  }

  return result
}

export async function importImages(
  map: Record<string, string>,
): Promise<void> {
  for (const [id, base64] of Object.entries(map)) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    const blob = new Blob([bytes])
    await saveImage(id, blob)
  }
}

export async function clearAllImages(): Promise<void> {
  await clear()
}
