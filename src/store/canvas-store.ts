import { create } from 'zustand'
import type { Canvas, Link, Connection, Group } from '@/types'
import { saveCanvas, getCanvas } from '@/lib/storage'
import { debounce } from '@/lib/utils'

interface CanvasState {
  // Current canvas data
  canvas: Canvas | null

  // UI state
  selectedNodeId: string | null
  isDragging: boolean
  isConnecting: boolean
  connectionSource: string | null

  // Actions
  loadCanvas: (id: string) => Promise<void>
  createCanvas: (canvas: Canvas) => Promise<void>
  updateCanvas: (updates: Partial<Canvas>) => void

  // Link actions
  addLink: (link: Link) => void
  updateLink: (id: string, updates: Partial<Link>) => void
  deleteLink: (id: string) => void

  // Connection actions
  addConnection: (connection: Connection) => void
  deleteConnection: (id: string) => void

  // Group actions
  addGroup: (group: Group) => void
  updateGroup: (id: string, updates: Partial<Group>) => void
  deleteGroup: (id: string) => void

  // Viewport actions
  setViewport: (x: number, y: number, zoom: number) => void

  // UI actions
  setSelectedNode: (id: string | null) => void
  setIsDragging: (isDragging: boolean) => void
  setIsConnecting: (isConnecting: boolean, sourceId?: string) => void

  // Persistence
  saveToStorage: () => Promise<void>
}

// Debounced save function
const debouncedSave = debounce(async (canvas: Canvas) => {
  if (canvas) {
    await saveCanvas(canvas)
  }
}, 500)

export const useCanvasStore = create<CanvasState>((set, get) => ({
  canvas: null,
  selectedNodeId: null,
  isDragging: false,
  isConnecting: false,
  connectionSource: null,

  loadCanvas: async (id: string) => {
    const canvas = await getCanvas(id)
    if (canvas) {
      set({ canvas })
    }
  },

  createCanvas: async (canvas: Canvas) => {
    await saveCanvas(canvas)
    set({ canvas })
  },

  updateCanvas: (updates: Partial<Canvas>) => {
    const { canvas } = get()
    if (!canvas) return

    const updatedCanvas = { ...canvas, ...updates }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  addLink: (link: Link) => {
    console.log('🔗 New link node added:', link)
    
    const { canvas } = get()
    if (!canvas) {
      console.log('❌ No canvas found - link not added')
      return
    }

    const updatedCanvas = {
      ...canvas,
      links: [...canvas.links, link],
    }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  updateLink: (id: string, updates: Partial<Link>) => {
    const { canvas } = get()
    if (!canvas) return

    const updatedCanvas = {
      ...canvas,
      links: canvas.links.map(link =>
        link.id === id ? { ...link, ...updates } : link
      ),
    }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  deleteLink: (id: string) => {
    const { canvas } = get()
    if (!canvas) return

    const updatedCanvas = {
      ...canvas,
      links: canvas.links.filter(link => link.id !== id),
      connections: canvas.connections.filter(
        conn => conn.sourceId !== id && conn.targetId !== id
      ),
    }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  addConnection: (connection: Connection) => {
    const { canvas } = get()
    if (!canvas) return

    const updatedCanvas = {
      ...canvas,
      connections: [...canvas.connections, connection],
    }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  deleteConnection: (id: string) => {
    const { canvas } = get()
    if (!canvas) return

    const updatedCanvas = {
      ...canvas,
      connections: canvas.connections.filter(conn => conn.id !== id),
    }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  addGroup: (group: Group) => {
    const { canvas } = get()
    if (!canvas) return

    const updatedCanvas = {
      ...canvas,
      groups: [...(canvas.groups || []), group],
    }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  updateGroup: (id: string, updates: Partial<Group>) => {
    const { canvas } = get()
    if (!canvas) return

    const updatedCanvas = {
      ...canvas,
      groups: (canvas.groups || []).map(group =>
        group.id === id ? { ...group, ...updates } : group
      ),
    }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  deleteGroup: (id: string) => {
    const { canvas } = get()
    if (!canvas) return

    const updatedCanvas = {
      ...canvas,
      groups: (canvas.groups || []).filter(group => group.id !== id),
    }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  setViewport: (x: number, y: number, zoom: number) => {
    const { canvas } = get()
    if (!canvas) return

    const updatedCanvas = {
      ...canvas,
      viewport: { x, y, zoom },
    }
    set({ canvas: updatedCanvas })
    debouncedSave(updatedCanvas)
  },

  setSelectedNode: (id: string | null) => {
    set({ selectedNodeId: id })
  },

  setIsDragging: (isDragging: boolean) => {
    set({ isDragging })
  },

  setIsConnecting: (isConnecting: boolean, sourceId?: string) => {
    set({
      isConnecting,
      connectionSource: sourceId || null,
    })
  },

  saveToStorage: async () => {
    const { canvas } = get()
    if (canvas) {
      await saveCanvas(canvas)
    }
  },
}))
