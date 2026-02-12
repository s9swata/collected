'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { Edit2, Trash2, GripHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Group } from '@/types'
import { cn } from '@/lib/utils'

interface GroupNodeData extends Group, Record<string, unknown> {
  onDelete?: (id: string) => void
  onUpdate?: (id: string, updates: Partial<Group>) => void
  onEdit?: (group: Group) => void
  childNodeIds?: string[]
}

type GroupNode = Node<GroupNodeData>

function GroupNode({ data, selected }: NodeProps<GroupNode>) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.onDelete) {
      data.onDelete(data.id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.onEdit) {
      data.onEdit(data)
    }
  }

  return (
    <div
      className={cn(
        "relative border-2 bg-card/30 transition-all duration-200",
        selected ? "border-ring ring-1 ring-ring/50" : "border-border/60",
        // Blueprint aesthetic: dashed border for groups
        "border-dashed"
      )}
      style={{
        width: data.width || 400,
        height: data.height || 300,
        backgroundColor: data.color ? `${data.color}20` : 'transparent',
        borderColor: data.color || 'var(--border)',
      }}
    >
      {/* Group Header */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-muted/50 border-b border-border/60 flex items-center justify-between px-2 group">
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing" />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            {data.name}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={handleEdit}
          >
            <Edit2 size={10} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
          >
            <Trash2 size={10} />
          </Button>
        </div>
      </div>

      {/* Resize Handles - Blueprint style (square, sharp) */}
      {/* Corner handles */}
      <div className="absolute -top-1 -left-1 w-3 h-3 bg-border border border-background cursor-nw-resize" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-border border border-background cursor-ne-resize" />
      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-border border border-background cursor-sw-resize" />
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-border border border-background cursor-se-resize" />
      
      {/* Edge handles */}
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-border border border-background cursor-n-resize" />
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-border border border-background cursor-s-resize" />
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-border border border-background cursor-w-resize" />
      <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-border border border-background cursor-e-resize" />

      {/* Optional: Child count indicator */}
      {data.childNodeIds && data.childNodeIds.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-background/80 border border-border px-2 py-1">
          <span className="font-mono text-[9px] text-muted-foreground">
            {data.childNodeIds.length} ITEM{data.childNodeIds.length !== 1 ? 'S' : ''}
          </span>
        </div>
      )}

      {/* Group-specific handles for potential connections */}
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-ring !w-2 !h-2 !rounded-none !border-none"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-foreground !w-2 !h-2 !rounded-none !border-none"
      />
    </div>
  )
}

export default memo(GroupNode)