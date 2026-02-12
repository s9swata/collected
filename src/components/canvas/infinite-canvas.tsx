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
  OnConnect,
  Viewport,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import LinkNode from './link-node'
import ConnectionEdge from './connection-edge'
import { useCanvasStore } from '@/store/canvas-store'
import { generateId } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Plus, Save, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'

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
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [rfInstance, setRfInstance] = useState<any>(null)

  const canvas = useCanvasStore(state => state.canvas)
  const updateLink = useCanvasStore(state => state.updateLink)
  const deleteLink = useCanvasStore(state => state.deleteLink)
  const addConnection = useCanvasStore(state => state.addConnection)
  const deleteConnection = useCanvasStore(state => state.deleteConnection)
  const setViewport = useCanvasStore(state => state.setViewport)
  const loadCanvas = useCanvasStore(state => state.loadCanvas)
  const updateCanvas = useCanvasStore(state => state.updateCanvas)
  const saveToStorage = useCanvasStore(state => state.saveToStorage)

  // Initialize canvas
  useEffect(() => {
    loadCanvas(canvasId)
  }, [canvasId, loadCanvas])

  // Sync store -> local state
  useEffect(() => {
    if (canvas) {
      // Map links to nodes
      const initialNodes: Node[] = canvas.links.map(link => ({
        id: link.id,
        type: 'linkCard',
        position: { x: link.x, y: link.y },
        data: {
          ...link,
          onDelete: (id: string) => deleteLink(id)
        },
      }))
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
  }, [canvas, setNodes, setEdges, deleteLink, deleteConnection])

  // Node drag handler
  const onNodeDragStop = useCallback(
    (event: React.MouseEvent, node: Node) => {
      updateLink(node.id, {
        x: node.position.x,
        y: node.position.y,
      })
    },
    [updateLink]
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
    (event: any, viewport: Viewport) => {
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
    []
  )

  if (!canvas) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-background text-muted-foreground font-mono">
        LOADING BLUEPRINT...
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-background">
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
    </div>
  )
}
