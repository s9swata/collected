'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { ExternalLink, Trash2, GripHorizontal, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Link } from '@/types'
import { cn } from '@/lib/utils'

interface LinkNodeData extends Link, Record<string, unknown> {
  onDelete?: (id: string) => void
  onRefreshMetadata?: (id: string) => void
}

type LinkNode = Node<LinkNodeData>

function LinkNode({ data, selected }: NodeProps<LinkNode>) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.onDelete) {
      data.onDelete(data.id)
    }
  }

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (data.onRefreshMetadata) {
      data.onRefreshMetadata(data.id)
    }
  }

  return (
    <Card
      className={cn(
        "w-[320px] rounded-none border shadow-none transition-all duration-200",
        selected ? "border-ring ring-1 ring-ring" : "border-border hover:border-foreground/50"
      )}
    >
      {/* Connection Handles - Technical/Blueprint style (square) */}
      <Handle
        type="source"
        position={Position.Top}
        className="!bg-ring !w-3 !h-3 !rounded-none !border-none -mt-[7px]"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-ring !w-3 !h-3 !rounded-none !border-none -mr-[7px]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-ring !w-3 !h-3 !rounded-none !border-none -mb-[7px]"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!bg-ring !w-3 !h-3 !rounded-none !border-none -ml-[7px]"
      />

      <Handle
        type="target"
        position={Position.Top}
        className="!bg-foreground !w-2 !h-2 !rounded-none !border-none -mt-[5px]"
      />
      <Handle
        type="target"
        position={Position.Right}
        className="!bg-foreground !w-2 !h-2 !rounded-none !border-none -mr-[5px]"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="!bg-foreground !w-2 !h-2 !rounded-none !border-none -mb-[5px]"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-foreground !w-2 !h-2 !rounded-none !border-none -ml-[5px]"
      />

      {/* Header / Drag Handle */}
      <div className="bg-muted/30 px-3 py-1.5 border-b border-border flex items-center justify-between drag-handle cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-2">
          {data.favicon && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.favicon}
              alt=""
              className={cn(
                "w-4 h-4",
                data.needsMetadataRefresh && "animate-pulse opacity-60"
              )}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          )}
          <span className={cn(
            "text-[10px] font-mono uppercase tracking-wider truncate max-w-[150px]",
            data.needsMetadataRefresh ? "text-amber-600" : "text-muted-foreground"
          )}>
            {data.domain}
          </span>
          {data.needsMetadataRefresh && (
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" title="Metadata needs refresh" />
          )}
        </div>
        <GripHorizontal className="w-4 h-4 text-muted-foreground/50" />
      </div>

      {/* Image Preview - fills most of card */}
      {data.imageUrl && (
        <div className="w-full h-48 bg-muted/20 border-b border-border overflow-hidden relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.imageUrl}
            alt={data.title}
            className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-500"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Content - reduced padding */}
      <CardContent className="p-3 space-y-2">
        <h3 className="font-sans font-bold text-sm leading-tight line-clamp-2">
          {data.title}
        </h3>
        {data.description && (
          <p className="font-mono text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
            {data.description}
          </p>
        )}
      </CardContent>

      <Separator />

{/* Footer / Actions */}
      <CardFooter className="p-2 bg-muted/10 flex items-center justify-between gap-1">
         {/* Left actions */}
         <div className="flex items-center gap-1">
           {/* Show refresh button if metadata is stale */}
           {data.needsMetadataRefresh && (
             <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6 rounded-none text-amber-600 hover:text-amber-700 hover:bg-amber-50 animate-pulse"
               onClick={handleRefresh}
               title="Refresh metadata"
             >
               <RefreshCw size={12} />
             </Button>
           )}
           
           <Button
               variant="ghost"
               size="icon"
               className="h-6 w-6 rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/10"
               onClick={handleDelete}
             >
               <Trash2 size={12} />
             </Button>
         </div>

         {/* Right action - Open link */}
           <Button
             variant="ghost"
             size="sm"
             className="h-6 rounded-none text-[10px] font-mono hover:text-primary hover:bg-primary/5 gap-1.5 px-2 flex-shrink-0"
             asChild
           >
             <a
               href={data.url}
               target="_blank"
               rel="noopener noreferrer"
               onClick={(e) => e.stopPropagation()}
             >
               OPEN <ExternalLink size={10} />
             </a>
           </Button>
      </CardFooter>
    </Card>
  )
}

export default memo(LinkNode)
