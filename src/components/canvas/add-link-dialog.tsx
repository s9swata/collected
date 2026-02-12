'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Link } from '@/types'
import { generateId } from '@/lib/utils'
import { urlSchema } from '@/lib/validations'
import { useCanvasStore } from '@/store/canvas-store'

interface AddLinkDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddLink: (link: Link) => void
  initialPosition?: { x: number; y: number }
}

export default function AddLinkDialog({ 
  isOpen, 
  onClose, 
  onAddLink, 
  initialPosition 
}: AddLinkDialogProps) {
  const [url, setUrl] = useState('')
  const [x, setX] = useState(initialPosition?.x || 0)
  const [y, setY] = useState(initialPosition?.y || 0)
  const [isCreating, setIsCreating] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) return

    // Validate URL
    try {
      urlSchema.parse(url.trim())
    } catch (error) {
      console.error('Invalid URL:', error)
      return
    }

    setIsCreating(true)

    try {
      const urlObj = new URL(url.trim())
      
      // Create placeholder link
      const newLink: Link = {
        id: generateId(),
        url: url.trim(),
        title: 'Loading...',
        domain: urlObj.hostname.replace('www.', ''),
        x,
        y,
        width: 320,
        height: 200,
        zIndex: 1,
      }

      onAddLink(newLink)

      // Fetch metadata in background
      try {
        const response = await fetch(`/api/metadata?url=${encodeURIComponent(url.trim())}`)
        const metadata = await response.json()
        
        // Update the link with metadata - this would need to be handled by parent
        const updatedLink = {
          ...newLink,
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
          favicon: metadata.favicon,
        }
        
        // Update the link with fetched metadata
        useCanvasStore.getState().updateLink(newLink.id, {
          title: metadata.title,
          description: metadata.description,
          imageUrl: metadata.imageUrl,
          favicon: metadata.favicon,
        })
      } catch (metadataError) {
        console.error('Failed to fetch metadata:', metadataError)
        // Keep the original URL as title if metadata fails
      }
    } catch (error) {
      console.error('Failed to create link:', error)
    } finally {
      setIsCreating(false)
      onClose()
      
      // Reset form
      setUrl('')
      setX(initialPosition?.x || 0)
      setY(initialPosition?.y || 0)
    }
  }, [url, x, y, initialPosition, onAddLink, onClose])

  const handleClose = () => {
    onClose()
    setUrl('')
    setX(initialPosition?.x || 0)
    setY(initialPosition?.y || 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-none border-2 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">Add Link</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Add a link to your canvas. Position can be set precisely using coordinates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkUrl" className="font-mono text-xs uppercase tracking-wider">
              URL
            </Label>
            <Input
              id="linkUrl"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="rounded-none border-2 font-mono"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkX" className="font-mono text-xs uppercase tracking-wider">
                X Position
              </Label>
              <Input
                id="linkX"
                type="number"
                value={x}
                onChange={(e) => setX(parseInt(e.target.value) || 0)}
                className="rounded-none border-2 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkY" className="font-mono text-xs uppercase tracking-wider">
                Y Position
              </Label>
              <Input
                id="linkY"
                type="number"
                value={y}
                onChange={(e) => setY(parseInt(e.target.value) || 0)}
                className="rounded-none border-2 font-mono"
              />
            </div>
          </div>

          {initialPosition && (
            <div className="text-[10px] text-muted-foreground font-mono">
              Position set to clicked location: ({Math.round(initialPosition.x)}, {Math.round(initialPosition.y)})
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
              className="rounded-none border-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!url.trim() || isCreating}
              className="rounded-none"
            >
              {isCreating ? 'Adding...' : 'Add Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}