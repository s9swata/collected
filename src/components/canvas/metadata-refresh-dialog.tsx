'use client'

import { useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
// import Progress from '@/components/ui/progress'
import { refreshMetadata, type MetadataRefreshOptions } from '@/lib/metadata-refresher'
import type { Link } from '@/types'
import { useCanvasStore } from '@/store/canvas-store'
import { cn } from '@/lib/utils'

interface MetadataRefreshDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function MetadataRefreshDialog({ isOpen, onClose }: MetadataRefreshDialogProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [processed, setProcessed] = useState(0)
  const [total, setTotal] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [errors, setErrors] = useState<{ linkId: string; error: string }[]>([])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setProcessed(0)
    setTotal(0)
    setSuccessCount(0)
    setFailedCount(0)
    setErrors([])

    const canvas = useCanvasStore.getState().canvas
    if (!canvas) return

    const options: MetadataRefreshOptions = {
      onProgress: (processed, total) => {
        setProcessed(processed)
        setTotal(total)
      },
      onComplete: (success, failed) => {
        setSuccessCount(success)
        setFailedCount(failed)
        setIsRefreshing(false)
      },
      onError: (error, linkId) => {
        setErrors(prev => [...prev, { linkId, error }])
      }
    }

    await refreshMetadata(canvas.links, options)
  }

  const handleClose = () => {
    onClose()
    // Reset state after a short delay to allow dialog to close
    setTimeout(() => {
      setProcessed(0)
      setTotal(0)
      setSuccessCount(0)
      setFailedCount(0)
      setErrors([])
      setIsRefreshing(false)
    }, 200)
  }

  const progressPercentage = total > 0 ? Math.round((processed / total) * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-none border-2 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans flex items-center gap-2">
            <RefreshCw size={16} className={cn("text-foreground", isRefreshing && "animate-spin")} />
            Refresh Metadata
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Fetch metadata for links that are missing or outdated information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          {isRefreshing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm font-mono">
                <span>Processing Links</span>
                <span>{processed} / {total}</span>
              </div>
              
              {/* Progress bar - simple div for now */}
              <div className="w-full bg-secondary rounded-none h-2 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              
              <p className="text-xs text-muted-foreground font-mono">
                {progressPercentage}% complete
              </p>
            </div>
          )}

          {/* Results */}
          {!isRefreshing && total > 0 && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-muted/50 border border-border">
                  <div className="text-2xl font-bold text-foreground">{successCount}</div>
                  <div className="text-xs text-muted-foreground font-mono">SUCCESS</div>
                </div>
                <div className="text-center p-3 bg-destructive/10 border border-destructive/30">
                  <div className="text-2xl font-bold text-destructive">{failedCount}</div>
                  <div className="text-xs text-muted-foreground font-mono">FAILED</div>
                </div>
              </div>

              {/* Error Details */}
              {errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    Error Details
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1 border border-border rounded-none p-2 bg-muted/30">
                    {errors.map((error, index) => (
                      <div key={index} className="text-xs font-mono space-y-1">
                        <div className="text-muted-foreground">Link ID: {error.linkId}</div>
                        <div className="text-destructive">{error.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Initial State */}
          {!isRefreshing && total === 0 && (
            <div className="text-center py-8 space-y-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <RefreshCw size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground font-mono">
                Ready to refresh metadata for all links that need updates.
              </p>
              <p className="text-xs text-muted-foreground">
                Links missing metadata or with outdated information will be processed.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isRefreshing}
            className="rounded-none border-2"
          >
            {isRefreshing ? 'Processing...' : 'Close'}
          </Button>
          
          {!isRefreshing && (
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-none"
            >
              Start Refresh
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}