# Link Canvas - Implementation Guide (V1)

## Project Overview

A lightweight infinite canvas whiteboard for organizing links visually - like Eraser.io but for bookmarks. Users can drag and drop link cards anywhere on an infinite canvas, create visual connections between related links, zoom/pan freely, and organize spatially. All data is stored locally in the browser.

**Core Features:**
- Infinite canvas with pan and zoom
- Drag & drop link cards anywhere on the canvas
- Visual connections between related links
- Automatic metadata extraction (Open Graph tags)
- Persistent canvas state in browser storage
- Groups/collections with visual boundaries
- Freeform spatial organization
- Export/Import canvas data as JSON

**V1 Scope:**
- No authentication required
- No backend database
- All data stored in browser (IndexedDB)
- Single API route for metadata fetching (CORS bypass)
- Export/Import for data portability

---

## Canvas Use Cases & Patterns

This infinite canvas approach enables unique organizational patterns that traditional bookmark managers can't support:

**1. Mind Map Style**
- Central theme/topic in center
- Related links branching out radially
- Connections show relationships between concepts

**2. Project Boards**
- Group links by project stages (Research → Design → Development)
- Visual workflow from left to right
- Easy to see project progress at a glance

**3. Learning Paths**
- Sequential arrangement of educational resources
- Connections show prerequisite relationships
- Track learning journey visually

**4. Research Collections**
- Cluster related research papers and articles
- Visual connections between related findings
- Spatial memory aids recall

**5. Client/Project Dashboards**
- Each project gets its own canvas
- All relevant links (docs, designs, resources) in one place
- Export canvas to share with others

**6. Personal Knowledge Base**
- Evergreen notes connected to source materials
- Build your second brain visually
- Discover unexpected connections

---

## Tech Stack

```yaml
Framework: Next.js 14+ (App Router)
Language: TypeScript
Canvas Library: React Flow (@xyflow/react)
State Management: Zustand + idb-keyval persistence
Styling: Tailwind CSS
Storage: idb-keyval (IndexedDB wrapper)
Metadata API: Next.js API route (server-side fetch)
Deployment: Vercel (serverless)
```

**Why These Choices:**
- **Next.js**: API routes for metadata fetching (CORS bypass)
- **idb-keyval**: ~500 bytes, fastest IndexedDB wrapper
- **React Flow**: Battle-tested infinite canvas library
- **Zustand**: Minimal, performant state management
- **No Database**: All data stored locally in browser

---

## Initial Setup

### 1. Create Next.js Project

```bash
npx create-next-app@latest collected
# Select: TypeScript, ESLint, Tailwind CSS, App Router, default alias
cd collected
```

### 2. Install Dependencies

```bash
# Core dependencies
npm install @xyflow/react
npm install zustand
npm install idb-keyval
npm install zod
npm install lucide-react
npm install cheerio
npm install clsx tailwind-merge

# Development dependencies
npm install -D @types/node
```

### 3. Project Structure

```
collected/
├── app/
│   ├── api/
│   │   └── metadata/
│   │       └── route.ts              # Metadata fetching (CORS bypass)
│   ├── canvas/
│   │   └── [canvasId]/
│   │       └── page.tsx              # Main canvas view
│   ├── layout.tsx
│   └── page.tsx                      # Canvas list / home
├── components/
│   ├── canvas/
│   │   ├── infinite-canvas.tsx       # Main canvas component
│   │   ├── link-node.tsx             # Draggable link card
│   │   ├── connection-edge.tsx       # Visual connection line
│   │   ├── canvas-toolbar.tsx        # Zoom, pan, add controls
│   │   └── mini-map.tsx              # Overview navigation
│   ├── modals/
│   │   ├── add-link-modal.tsx
│   │   ├── create-canvas-modal.tsx
│   │   └── export-import-modal.tsx
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       └── dialog.tsx
├── lib/
│   ├── storage.ts                    # idb-keyval utilities
│   ├── metadata-fetcher.ts           # Client-side API caller
│   ├── validations.ts                # Zod schemas
│   └── utils.ts                      # Helper functions
├── store/
│   └── canvas-store.ts               # Zustand store with persistence
├── types/
│   └── index.ts                      # TypeScript interfaces
└── next.config.js
```

---

## TypeScript Interfaces

**types/index.ts**
```typescript
export interface Canvas {
  id: string
  name: string
  description?: string
  links: Link[]
  connections: Connection[]
  groups?: Group[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  createdAt: string
  updatedAt: string
}

export interface Link {
  id: string
  url: string
  title: string
  description?: string
  imageUrl?: string
  favicon?: string
  domain: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export interface Connection {
  id: string
  sourceId: string
  targetId: string
  label?: string
  color?: string
  style?: string // 'default' | 'dashed' | 'animated'
}

export interface Group {
  id: string
  name: string
  color: string
  x: number
  y: number
  width: number
  height: number
}

export interface LinkMetadata {
  url: string
  title: string
  description?: string
  imageUrl?: string
  favicon?: string
  domain: string
}
```

---

## PHASE 1: Browser Storage Setup

### Step 1.1: Storage Utilities

**lib/storage.ts**
```typescript
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
    return await get<string>(STORAGE_KEYS.CURRENT_CANVAS)
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
```

### Step 1.2: Utility Functions

**lib/utils.ts**
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return ''
  }
}
```

### Step 1.3: Validation Schemas

**lib/validations.ts**
```typescript
import { z } from 'zod'

export const urlSchema = z.string().url('Please enter a valid URL')

export const createLinkSchema = z.object({
  url: urlSchema,
  x: z.number(),
  y: z.number(),
})

export const updateLinkPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
})

export const createCanvasSchema = z.object({
  name: z.string().min(1, 'Canvas name is required').max(100),
  description: z.string().max(500).optional(),
})

export const createConnectionSchema = z.object({
  sourceId: z.string(),
  targetId: z.string(),
  label: z.string().optional(),
  color: z.string().optional(),
  style: z.enum(['default', 'dashed', 'animated']).optional(),
})

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string().optional(),
})
```

---

## PHASE 2: Metadata Fetching

### Step 2.1: API Route for Metadata

**app/api/metadata/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface LinkMetadata {
  url: string
  title: string
  description?: string
  imageUrl?: string
  favicon?: string
  domain: string
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url')
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const domain = urlObj.hostname.replace('www.', '')

    // Fetch the page with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkCanvas/1.0; +https://linkcanvas.app)',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract metadata
    const title = 
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      domain

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content')

    let imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content')

    // Make image URL absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, url).href
    }

    let favicon = 
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href')

    // Make favicon URL absolute or use default
    if (favicon && !favicon.startsWith('http')) {
      favicon = new URL(favicon, url).href
    } else if (!favicon) {
      favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    }

    const metadata: LinkMetadata = {
      url,
      title: title.trim(),
      description: description?.trim(),
      imageUrl: imageUrl || undefined,
      favicon,
      domain,
    }

    return NextResponse.json(metadata)

  } catch (error) {
    console.error('Error fetching metadata:', error)

    // Return basic metadata on error
    const urlParam = request.nextUrl.searchParams.get('url') || ''
    let domain = ''
    try {
      const urlObj = new URL(urlParam)
      domain = urlObj.hostname.replace('www.', '')
    } catch {
      domain = 'unknown'
    }

    return NextResponse.json({
      url: urlParam,
      title: domain,
      description: undefined,
      imageUrl: undefined,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      domain,
    })
  }
}
```

### Step 2.2: Client-side Metadata Fetcher

**lib/metadata-fetcher.ts**
```typescript
import type { LinkMetadata } from '@/types'

export async function fetchMetadata(url: string): Promise<LinkMetadata> {
  try {
    const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch metadata')
    }
    
    const metadata: LinkMetadata = await response.json()
    return metadata
  } catch (error) {
    console.error('Error fetching metadata:', error)
    
    // Return basic fallback metadata
    let domain = ''
    try {
      const urlObj = new URL(url)
      domain = urlObj.hostname.replace('www.', '')
    } catch {
      domain = 'unknown'
    }
    
    return {
      url,
      title: domain,
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    }
  }
}
```

---

## PHASE 3: State Management with Zustand

### Step 3.1: Canvas Store

**store/canvas-store.ts**
```typescript
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
    const { canvas } = get()
    if (!canvas) return
    
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
```

---

## PHASE 4: Canvas Components

### Step 4.1: Link Node Component

**components/canvas/link-node.tsx**
```typescript
'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { ExternalLink, Trash2 } from 'lucide-react'
import type { Link } from '@/types'

interface LinkNodeData extends Link {
  onDelete?: (id: string) => void
}

function LinkNode({ data, selected }: NodeProps<LinkNodeData>) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.onDelete) {
      data.onDelete(data.id)
    }
  }

  return (
    <div
      className={`bg-white rounded-lg shadow-lg border-2 transition-all ${
        selected ? 'border-blue-500 shadow-xl' : 'border-gray-200'
      }`}
      style={{
        width: data.width || 320,
        height: data.height || 200,
      }}
    >
      {/* Connection Handles */}
      <Handle type="source" position={Position.Top} className="!bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!bg-blue-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-500" />
      <Handle type="source" position={Position.Left} className="!bg-blue-500" />

      <Handle type="target" position={Position.Top} className="!bg-green-500" />
      <Handle type="target" position={Position.Right} className="!bg-green-500" />
      <Handle type="target" position={Position.Bottom} className="!bg-green-500" />
      <Handle type="target" position={Position.Left} className="!bg-green-500" />

      {/* Card Content */}
      <div className="flex flex-col h-full">
        {/* Image */}
        {data.imageUrl && (
          <div className="w-full h-32 bg-gray-100 rounded-t-lg overflow-hidden">
            <img
              src={data.imageUrl}
              alt={data.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-3 flex flex-col">
          {/* Header with favicon and actions */}
          <div className="flex items-start gap-2 mb-2">
            {data.favicon && (
              <img
                src={data.favicon}
                alt=""
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.src = `https://www.google.com/s2/favicons?domain=${data.domain}&sz=32`
                }}
              />
            )}
            <h3 className="font-semibold text-sm line-clamp-2 flex-1">
              {data.title}
            </h3>
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Description */}
          {data.description && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {data.description}
            </p>
          )}

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
            <span className="truncate">{data.domain}</span>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 flex-shrink-0 ml-2"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(LinkNode)
```

### Step 4.2: Connection Edge Component

**components/canvas/connection-edge.tsx**
```typescript
'use client'

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
} from '@xyflow/react'
import { X } from 'lucide-react'

interface ConnectionEdgeData {
  onDelete?: (id: string) => void
}

function ConnectionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps<ConnectionEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const handleDelete = () => {
    if (data?.onDelete) {
      data.onDelete(id)
    }
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={handleDelete}
            className="bg-white border-2 border-gray-300 rounded-full p-1 hover:bg-red-50 hover:border-red-500 transition-colors"
          >
            <X size={12} className="text-gray-600" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(ConnectionEdge)
```

### Step 4.3: Infinite Canvas Component

**components/canvas/infinite-canvas.tsx**
```typescript
'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  NodeDragHandler,
  OnConnect,
  Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import LinkNode from './link-node'
import ConnectionEdge from './connection-edge'
import { useCanvasStore } from '@/store/canvas-store'
import { generateId } from '@/lib/utils'

const nodeTypes = {
  linkCard: LinkNode,
}

const edgeTypes = {
  default: ConnectionEdge,
}

interface InfiniteCanvasProps {
  canvasId: string
}

export default function InfiniteCanvas({ canvasId }: InfiniteCanvasProps) {
  const canvas = useCanvasStore(state => state.canvas)
  const updateLink = useCanvasStore(state => state.updateLink)
  const deleteLink = useCanvasStore(state => state.deleteLink)
  const addConnection = useCanvasStore(state => state.addConnection)
  const deleteConnection = useCanvasStore(state => state.deleteConnection)
  const setViewport = useCanvasStore(state => state.setViewport)
  const loadCanvas = useCanvasStore(state