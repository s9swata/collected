'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Layout, ArrowRight, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCanvases, saveCanvas, deleteCanvas } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import type { Canvas } from '@/types'
import { toast } from 'sonner'

export default function Home() {
  const router = useRouter()
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newCanvasName, setNewCanvasName] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    loadCanvases()
  }, [])

  const loadCanvases = async () => {
    try {
      const data = await getCanvases()
      // Sort by updated at desc
      data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      setCanvases(data)
    } catch (error) {
      console.error('Failed to load canvases', error)
      toast.error('Failed to load canvases')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCanvas = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCanvasName.trim()) return

    try {
      const newCanvas: Canvas = {
        id: generateId(),
        name: newCanvasName.trim(),
        links: [],
        connections: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await saveCanvas(newCanvas)
      setNewCanvasName('')
      setIsDialogOpen(false)
      toast.success('Canvas created')
      router.push(`/canvas/${newCanvas.id}`)
    } catch (error) {
      console.error('Failed to create canvas', error)
      toast.error('Failed to create canvas')
    }
  }

  const handleDeleteCanvas = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this canvas?')) return

    try {
      await deleteCanvas(id)
      await loadCanvases()
      toast.success('Canvas deleted')
    } catch (error) {
      console.error('Failed to delete canvas', error)
      toast.error('Failed to delete canvas')
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-sans font-bold tracking-tight">LINK CANVAS</h1>
            <p className="text-muted-foreground font-mono text-sm">
              DIGITAL BLUEPRINT // LOCAL STORAGE
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-none gap-2">
                <Plus size={16} /> NEW CANVAS
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-none border-ring sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-sans">CREATE CANVAS</DialogTitle>
                <DialogDescription className="font-mono text-xs">
                  Enter a name for your new workspace.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCanvas}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="font-mono text-xs uppercase">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={newCanvasName}
                      onChange={(e) => setNewCanvasName(e.target.value)}
                      className="rounded-none font-sans"
                      placeholder="Project Alpha..."
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="rounded-none w-full">
                    CREATE BLUEPRINT
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Canvas Grid */}
        {isLoading ? (
          <div className="text-center py-20 font-mono text-muted-foreground">
            LOADING WORKSPACES...
          </div>
        ) : canvases.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border bg-muted/10">
            <Layout className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium">No canvases yet</h3>
            <p className="text-muted-foreground mb-6 font-mono text-sm">
              Create your first blueprint to get started.
            </p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="rounded-none">
              CREATE FIRST CANVAS
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {canvases.map((canvas) => (
              <Link key={canvas.id} href={`/canvas/${canvas.id}`}>
                <Card className="rounded-none transition-all hover:border-ring hover:shadow-md group h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-sans text-lg truncate">
                      {canvas.name}
                    </CardTitle>
                    <CardDescription className="font-mono text-xs">
                      UPDATED: {new Date(canvas.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-3">
                    <div className="h-24 bg-muted/20 border border-border/50 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]"></div>
                      <div className="p-4 font-mono text-[10px] text-muted-foreground">
                        {canvas.links.length} ITEMS<br/>
                        {canvas.connections.length} CONNECTIONS
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between items-center text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={(e) => handleDeleteCanvas(e, canvas.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                    <ArrowRight size={16} className="text-ring opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
