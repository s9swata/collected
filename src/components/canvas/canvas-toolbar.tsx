'use client'

import { useState } from 'react'
import { Plus, Folder, Download, Upload, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface CanvasToolbarProps {
  onCreateGroup: () => void
  onAddLink: () => void
  onExport: () => void
  onImport: () => void
  className?: string
}

export default function CanvasToolbar({
  onCreateGroup,
  onAddLink,
  onExport,
  onImport,
  className
}: CanvasToolbarProps) {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)

  return (
    <div className={cn(
      "fixed top-4 right-4 z-10 bg-background/90 backdrop-blur-sm border-2 border-border rounded-none shadow-lg p-1",
      "font-mono text-xs uppercase tracking-wider",
      className
    )}>
      <div className="flex items-center gap-1">
        {/* Add Link Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddLink}
          className="h-8 px-2 rounded-none border border-transparent hover:border-border hover:bg-muted flex items-center gap-2"
          title="Add Link"
        >
          <Plus size={12} />
          <span className="hidden sm:inline">LINK</span>
        </Button>

        {/* Group Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateGroup}
          className="h-8 px-2 rounded-none border border-transparent hover:border-border hover:bg-muted flex items-center gap-2"
          title="Create Group"
        >
          <Folder size={12} />
          <span className="hidden sm:inline">GROUP</span>
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1 bg-border" />

        {/* Import Button */}
        <Popover open={isImportOpen} onOpenChange={setIsImportOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-none border border-transparent hover:border-border hover:bg-muted flex items-center gap-2"
              title="Import Data"
            >
              <Upload size={12} />
              <span className="hidden sm:inline">IMPORT</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 rounded-none border-2 p-2" 
            align="end" 
            side="bottom"
          >
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Import Canvas Data
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onImport()
                  setIsImportOpen(false)
                }}
                className="w-full rounded-none border-2 text-xs justify-start"
              >
                Import JSON File
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Export Button */}
        <Popover open={isExportOpen} onOpenChange={setIsExportOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 rounded-none border border-transparent hover:border-border hover:bg-muted flex items-center gap-2"
              title="Export Data"
            >
              <Download size={12} />
              <span className="hidden sm:inline">EXPORT</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-48 rounded-none border-2 p-2" 
            align="end" 
            side="bottom"
          >
            <div className="space-y-2">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Export Canvas Data
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onExport()
                  setIsExportOpen(false)
                }}
                className="w-full rounded-none border-2 text-xs justify-start"
              >
                Export as JSON
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Blueprint-style label */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <div className="inline-block bg-background/80 backdrop-blur-sm border border-border px-2 py-0.5">
          <span className="text-[8px] font-mono uppercase tracking-widest text-muted-foreground">
            TOOLBOX
          </span>
        </div>
      </div>
    </div>
  )
}