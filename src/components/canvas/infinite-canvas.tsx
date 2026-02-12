'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import following bundle-dynamic-imports rule
const ReactFlow = dynamic(() => import('@xyflow/react').then(mod => ({ default: mod.ReactFlow })), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen w-full bg-background text-muted-foreground font-mono">
      LOADING CANVAS ENGINE...
    </div>
  )
})

const Background = dynamic(() => import('@xyflow/react').then(mod => ({ default: mod.Background })), { ssr: false })
const Controls = dynamic(() => import('@xyflow/react').then(mod => ({ default: mod.Controls })), { ssr: false })
const MiniMap = dynamic(() => import('@xyflow/react').then(mod => ({ default: mod.MiniMap })), { ssr: false })

// Hooks must be imported separately as they can't be dynamic
import {
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  Edge,
  OnConnect,
  Viewport,
  BackgroundVariant,
  Panel,
  ReactFlowInstance,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import LinkNode from './link-node'
import ConnectionEdge from './connection-edge'
import GroupNode from './group-node'
import CreateGroupDialog from './create-group-dialog'
import GroupPropertiesDialog from './group-properties-dialog'
import CanvasToolbar from './canvas-toolbar'
import AddLinkDialog from './add-link-dialog'
import { useCanvasStore } from '@/store/canvas-store'
import { generateId } from '@/lib/utils'
import type { Group } from '@/types'
import { exportData, importData } from '@/lib/storage'


const nodeTypes = {
  linkCard: LinkNode,
  group: GroupNode,
}

const edgeTypes = {
  default: ConnectionEdge,
}

interface InfiniteCanvasProps {
  canvasId: string
}

export default function InfiniteCanvas({ canvasId }: InfiniteCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node, Edge> | null>(null)

  const canvas = useCanvasStore(state => state.canvas)
  const updateLink = useCanvasStore(state => state.updateLink)
  const deleteLink = useCanvasStore(state => state.deleteLink)
  const addConnection = useCanvasStore(state => state.addConnection)
  const deleteConnection = useCanvasStore(state => state.deleteConnection)
  const addGroup = useCanvasStore(state => state.addGroup)
  const updateGroup = useCanvasStore(state => state.updateGroup)
  const deleteGroup = useCanvasStore(state => state.deleteGroup)
  const setViewport = useCanvasStore(state => state.setViewport)
  const loadCanvas = useCanvasStore(state => state.loadCanvas)

  // Group creation state
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Group properties state
  const [isGroupPropertiesOpen, setIsGroupPropertiesOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | undefined>(undefined)
  
  // Add link state
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false)
  const [linkPosition, setLinkPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Toolbar handlers
  const handleExport = useCallback(async () => {
    try {
      const data = await exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `canvas-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }, [])

  const handleImport = useCallback(async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          const text = await file.text()
          await importData(text)
          // Reload canvas to show imported data
          loadCanvas(canvasId)
        }
      }
      input.click()
    } catch (error) {
      console.error('Import failed:', error)
    }
  }, [canvasId, loadCanvas])

  // Initialize canvas
  useEffect(() => {
    loadCanvas(canvasId)
  }, [canvasId, loadCanvas])

  // Sync store -> local state
  useEffect(() => {
    if (canvas) {
      // Map links to nodes
      const linkNodes: Node[] = canvas.links.map(link => ({
        id: link.id,
        type: 'linkCard',
        position: { x: link.x, y: link.y },
        data: {
          ...link,
          onDelete: (id: string) => deleteLink(id)
        },
      }))

      // Map groups to nodes (render behind links)
      const groupNodes: Node[] = (canvas.groups || []).map(group => ({
        id: group.id,
        type: 'group',
        position: { x: group.x, y: group.y },
        data: {
          ...group,
          onDelete: (id: string) => deleteGroup(id),
          onUpdate: (id: string, updates: any) => updateGroup(id, updates),
          onEdit: (group: Group) => {
            setEditingGroup(group)
            setIsGroupPropertiesOpen(true)
          }
        },
      }))

      // Groups should render behind links, so we put them first
      const initialNodes: Node[] = [...groupNodes, ...linkNodes]
      setNodes(initialNodes)

      // Map connections to edges
      const initialEdges: Edge[] = canvas.connections.map(conn => ({
        id: conn.id,
        source: conn.sourceId,
        target: conn.targetId,
        type: 'default',
        animated: conn.style === 'animated',
        style: conn.style === 'dashed' ? { strokeDasharray: '5,5' } : undefined,
        data: {
          onDelete: (id: string) => deleteConnection(id)
        }
      }))
      setEdges(initialEdges)
    }
  }, [canvas, setNodes, setEdges, deleteLink, deleteConnection, deleteGroup, updateGroup])

  // Node drag handler
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Handle different node types
      if (node.type === 'linkCard') {
        updateLink(node.id, {
          x: node.position.x,
          y: node.position.y,
        })
      } else if (node.type === 'group') {
        updateGroup(node.id, {
          x: node.position.x,
          y: node.position.y,
        })
      }
    },
    [updateLink, updateGroup]
  )

  // Connection handler
  const onConnect: OnConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        const newConnection = {
          id: generateId(),
          sourceId: params.source,
          targetId: params.target,
          style: 'default' as const,
        }
        addConnection(newConnection)
      }
    },
    [addConnection]
  )

  // Viewport change handler
  const onMoveEnd = useCallback(
    (event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
      setViewport(viewport.x, viewport.y, viewport.zoom)
    },
    [setViewport]
  )

  // Drag over handler for dropping links
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  // Drop handler
  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault()

      const url = event.dataTransfer.getData('text/plain')
      if (!url) return

      // Check if it's a valid URL
      try {
        new URL(url)
      } catch {
        return // Not a valid URL
      }

      // Calculate position (need to project from screen to canvas coordinates)
      const position = rfInstance
        ? rfInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          })
        : {
            x: event.clientX - 200,
            y: event.clientY - 100,
          }

      // Add placeholder link
      const newLink = {
        id: generateId(),
        url,
        title: 'Loading...',
        domain: new URL(url).hostname,
        x: position.x,
        y: position.y,
        width: 320,
        height: 200,
        zIndex: 1,
      }

      // We need to add it to the store, which will trigger the sync
      useCanvasStore.getState().addLink(newLink)

      // Fetch metadata
      try {
        const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`)
        const metadata = await response.json()

        useCanvasStore.getState().updateLink(newLink.id, {
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
          favicon: metadata.favicon,
        })
      } catch (error) {
        console.error('Failed to fetch metadata', error)
        useCanvasStore.getState().updateLink(newLink.id, {
          title: url,
        })
      }
    },
    [rfInstance]
  )

  // Context menu handler
  const onContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      
      // Only show context menu on canvas background, not on nodes
      const targetElement = event.target as HTMLElement
      if (targetElement.closest('.react-flow__node')) {
        return
      }

      const position = rfInstance
        ? rfInstance.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          })
        : {
            x: event.clientX,
            y: event.clientY,
          }

      setContextMenuPosition(position)
    },
    [rfInstance]
  )

  // Group creation handler
  const handleCreateGroup = useCallback(
    (groupData: { id: string; name: string; color: string; x: number; y: number; width: number; height: number }) => {
      addGroup(groupData)
    },
    [addGroup]
  )

  // Add link handler
  const handleAddLink = useCallback(
    (linkData: any) => {
      useCanvasStore.getState().addLink(linkData)
    },
    []
  )

  // Close context menu when clicking away
  const onPaneClick = useCallback(() => {
    setContextMenuPosition(null)
  }, [])

  if (!canvas) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background text-muted-foreground font-mono">
        LOADING BLUEPRINT...
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-background">
      <CanvasToolbar
        onCreateGroup={() => setIsGroupDialogOpen(true)}
        onAddLink={() => {
          // Center the position in viewport
          const centerX = window.innerWidth / 2
          const centerY = window.innerHeight / 2
          const position = rfInstance 
            ? rfInstance.screenToFlowPosition({ x: centerX, y: centerY })
            : { x: 0, y: 0 }
          
          setLinkPosition(position)
          setIsAddLinkOpen(true)
        }}
        onExport={handleExport}
        onImport={handleImport}
      />
      
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen w-full bg-background text-muted-foreground font-mono">
          LOADING CANVAS ENGINE...
        </div>
      }>
        <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onContextMenu={onContextMenu}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={canvas.viewport}
        fitView
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
        onInit={setRfInstance}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={40}
          size={1}
          color="var(--border)"
          className="opacity-50"
        />

        <Panel position="top-left" className="m-4">
          <div className="bg-background/80 backdrop-blur-sm border border-border p-4 rounded-none shadow-sm space-y-2">
            <h1 className="font-sans font-bold text-xl tracking-tight">{canvas.name}</h1>
            <p className="font-mono text-xs text-muted-foreground">
              {nodes.length} NODES • {edges.length} CONNECTIONS
            </p>
          </div>
        </Panel>

        <Controls
          className="!bg-background !border !border-border !rounded-none !shadow-none [&>button]:!border-b [&>button]:!border-border [&>button]:!rounded-none [&>button]:!fill-foreground hover:[&>button]:!bg-muted"
          showInteractive={false}
        />

        <MiniMap
          className="!bg-background !border !border-border !rounded-none !shadow-sm"
          maskColor="var(--background)"
          nodeColor="var(--ring)"
        />
      </ReactFlow>
      </Suspense>

      {/* Context Menu */}
      {contextMenuPosition && (
        <div
          className="absolute bg-background border-2 border-border rounded-none shadow-lg py-1 z-50"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-1 text-left text-sm font-mono hover:bg-muted text-left"
            onClick={() => {
              setIsGroupDialogOpen(true)
              setContextMenuPosition(null)
            }}
          >
            CREATE GROUP
          </button>
        </div>
      )}

      {/* Group Creation Dialog */}
      <CreateGroupDialog
        isOpen={isGroupDialogOpen}
        onClose={() => setIsGroupDialogOpen(false)}
        onCreateGroup={handleCreateGroup}
        initialPosition={contextMenuPosition || undefined}
      />

      {/* Group Properties Dialog */}
      <GroupPropertiesDialog
        isOpen={isGroupPropertiesOpen}
        onClose={() => {
          setIsGroupPropertiesOpen(false)
          setEditingGroup(undefined)
        }}
        onUpdateGroup={updateGroup}
        group={editingGroup}
      />

      {/* Add Link Dialog */}
      <AddLinkDialog
        isOpen={isAddLinkOpen}
        onClose={() => {
          setIsAddLinkOpen(false)
          setLinkPosition(null)
        }}
        onAddLink={handleAddLink}
        initialPosition={linkPosition || undefined}
      />
    </div>
  )
}
