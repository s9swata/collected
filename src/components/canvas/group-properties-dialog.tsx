'use client'

import { useState, useEffect } from 'react'
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
import type { Group } from '@/types'

interface GroupPropertiesDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdateGroup: (id: string, updates: Partial<Group>) => void
  group?: Group
}

export default function GroupPropertiesDialog({ 
  isOpen, 
  onClose, 
  onUpdateGroup, 
  group 
}: GroupPropertiesDialogProps) {
  // Initialize state from group prop directly
  const [name, setName] = useState(group?.name ?? '')
  const [color, setColor] = useState(group?.color ?? '#FF4F00')
  const [width, setWidth] = useState(group?.width ?? 400)
  const [height, setHeight] = useState(group?.height ?? 300)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!group || !name.trim()) return

    const updates: Partial<Group> = {
      name: name.trim(),
      color,
      width,
      height,
    }

    onUpdateGroup(group.id, updates)
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-none border-2 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">Group Properties</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Edit group name, color, and dimensions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName" className="font-mono text-xs uppercase tracking-wider">
              Group Name
            </Label>
            <Input
              id="groupName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Research, Design, Development"
              className="rounded-none border-2 font-mono"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupColor" className="font-mono text-xs uppercase tracking-wider">
              Accent Color
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="groupColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-16 h-10 rounded-none border-2 cursor-pointer"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#FF4F00"
                className="rounded-none border-2 font-mono flex-1"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Safety orange (#FF4F00) is the blueprint accent
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupWidth" className="font-mono text-xs uppercase tracking-wider">
                Width (px)
              </Label>
              <Input
                id="groupWidth"
                type="number"
                min="200"
                max="1200"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 400)}
                className="rounded-none border-2 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupHeight" className="font-mono text-xs uppercase tracking-wider">
                Height (px)
              </Label>
              <Input
                id="groupHeight"
                type="number"
                min="150"
                max="800"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 300)}
                className="rounded-none border-2 font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="rounded-none border-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!group || !name.trim()}
              className="rounded-none"
            >
              Update Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}