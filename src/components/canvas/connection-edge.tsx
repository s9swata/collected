'use client'

import { memo } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
  type Edge,
} from '@xyflow/react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ConnectionEdgeData extends Record<string, unknown> {
  onDelete?: (id: string) => void
}

type CustomEdge = Edge<ConnectionEdgeData>

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
}: EdgeProps<CustomEdge>) {
  // Use SmoothStep (orthogonal) path for that "circuit board" look
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0, // Sharp corners for blueprint look
  })

  const handleDelete = () => {
    if (data?.onDelete) {
      data.onDelete(id)
    }
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 1.5,
          stroke: 'var(--ring)', // Use accent color
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <Button
            variant="outline"
            size="icon"
            className="h-5 w-5 rounded-none border-ring bg-background hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
            onClick={handleDelete}
          >
            <X size={10} />
          </Button>
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export default memo(ConnectionEdge)
