'use client'

import { useState } from 'react'
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

interface CreateGroupDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateGroup: (group: Group) => void
  initialPosition?: { x: number; y: number }
}

export default function CreateGroupDialog({ 
  isOpen, 
  onClose, 
  onCreateGroup, 
  initialPosition 
}: CreateGroupDialogProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#FF4F00') // Safety orange default

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) return

    const newGroup: Group = {
      id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      color,
      x: initialPosition?.x || 100,
      y: initialPosition?.y || 100,
      width: 400,
      height: 300,
    }

    onCreateGroup(newGroup)
    onClose()
    
    // Reset form
    setName('')
    setColor('#FF4F00')
  }

  const handleClose = () => {
    onClose()
    setName('')
    setColor('#FF4F00')
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-none border-2 max-w-md">
        <DialogHeader>
          <DialogTitle className="font-sans">Create Group</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Create a new group to organize your links spatially.
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
              Safety orange (#FF4F00) is the default blueprint accent
            </p>
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
              disabled={!name.trim()}
              className="rounded-none"
            >
              Create Group
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}