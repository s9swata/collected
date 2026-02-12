import InfiniteCanvas from '@/components/canvas/infinite-canvas'

interface PageProps {
  params: Promise<{
    canvasId: string
  }>
}

export default async function CanvasPage({ params }: PageProps) {
  const { canvasId } = await params

  return <InfiniteCanvas canvasId={canvasId} />
}
