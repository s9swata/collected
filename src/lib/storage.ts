import { get, set, del, clear } from 'idb-keyval'
import type { Canvas } from '@/types'

// Storage keys
export const STORAGE_KEYS = {
  CANVASES: 'canvases',
  CURRENT_CANVAS: 'current-canvas',
} as const

// Get all canvases
export async function getCanvases(): Promise<Canvas[]> {
  try {
    const canvases = await get<Canvas[]>(STORAGE_KEYS.CANVASES)
    return canvases || []
  } catch (error) {
    console.error('Error loading canvases:', error)
    return []
  }
}

// Get single canvas by ID
export async function getCanvas(id: string): Promise<Canvas | null> {
  try {
    const canvases = await getCanvases()
    return canvases.find(c => c.id === id) || null
  } catch (error) {
    console.error('Error loading canvas:', error)
    return null
  }
}

// Save canvas (create or update)
export async function saveCanvas(canvas: Canvas): Promise<void> {
  try {
    const canvases = await getCanvases()
    const index = canvases.findIndex(c => c.id === canvas.id)

    canvas.updatedAt = new Date().toISOString()

    if (index >= 0) {
      canvases[index] = canvas
    } else {
      canvases.push(canvas)
    }

    await set(STORAGE_KEYS.CANVASES, canvases)
  } catch (error) {
    console.error('Error saving canvas:', error)
    throw error
  }
}

// Delete canvas
export async function deleteCanvas(id: string): Promise<void> {
  try {
    const canvases = await getCanvases()
    const filtered = canvases.filter(c => c.id !== id)
    await set(STORAGE_KEYS.CANVASES, filtered)
  } catch (error) {
    console.error('Error deleting canvas:', error)
    throw error
  }
}

// Get current canvas ID
export async function getCurrentCanvasId(): Promise<string | null> {
  try {
    const id = await get<string>(STORAGE_KEYS.CURRENT_CANVAS)
    return id || null
  } catch (error) {
    console.error('Error loading current canvas ID:', error)
    return null
  }
}

// Set current canvas ID
export async function setCurrentCanvasId(id: string): Promise<void> {
  try {
    await set(STORAGE_KEYS.CURRENT_CANVAS, id)
  } catch (error) {
    console.error('Error saving current canvas ID:', error)
    throw error
  }
}

// Export all data
export async function exportData(): Promise<string> {
  const canvases = await getCanvases()
  const currentCanvasId = await getCurrentCanvasId()

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    currentCanvasId,
    canvases,
  }

  return JSON.stringify(exportData, null, 2)
}

// Import data
export async function importData(jsonString: string): Promise<void> {
  try {
    const data = JSON.parse(jsonString)

    if (data.canvases && Array.isArray(data.canvases)) {
      await set(STORAGE_KEYS.CANVASES, data.canvases)
    }

    if (data.currentCanvasId) {
      await setCurrentCanvasId(data.currentCanvasId)
    }
  } catch (error) {
    console.error('Error importing data:', error)
    throw new Error('Invalid import file format')
  }
}

// Clear all data
export async function clearAllData(): Promise<void> {
  try {
    await clear()
  } catch (error) {
    console.error('Error clearing data:', error)
    throw error
  }
}
