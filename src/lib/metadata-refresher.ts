import type { Link } from '@/types'
import { useCanvasStore } from '@/store/canvas-store'

// Configuration for batch processing
const BATCH_SIZE = 5
const BATCH_DELAY = 1000 // 1 second between batches
const RETRY_DELAYS = [1000, 2000, 4000]
const MAX_RETRIES = 3
const METADATA_STALE_DAYS = 7 // Consider metadata stale after 7 days

export interface MetadataRefreshOptions {
  onProgress?: (processed: number, total: number) => void
  onComplete?: (success: number, failed: number) => void
  onError?: (error: string, linkId: string) => void
}

/**
 * Check if a link needs metadata refresh
 */
export function needsMetadataRefresh(link: Link): boolean {
  // If explicitly marked for refresh
  if (link.needsMetadataRefresh) {
    return true
  }
  
  // If metadata was never fetched
  if (!link.metadataFetchedAt) {
    return true
  }
  
  // If metadata is older than stale threshold
  const now = new Date()
  const metadataAge = now.getTime() - new Date(link.metadataFetchedAt).getTime()
  const daysSinceMetadata = metadataAge / (1000 * 60 * 60 * 24)
  
  return daysSinceMetadata > METADATA_STALE_DAYS
}

/**
 * Fetch metadata for a single link with retry logic
 */
async function fetchLinkMetadata(link: Link, retryCount = 0): Promise<{ success: boolean; metadata?: any; error?: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
    
    const response = await fetch(`/api/metadata?url=${encodeURIComponent(link.url)}`, {
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const metadata = await response.json()
    return { success: true, metadata }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Retry logic
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)]
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchLinkMetadata(link, retryCount + 1)
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Update a link with new metadata
 */
async function updateLinkWithMetadata(link: Link, metadata: any): Promise<void> {
  const updates = {
    title: metadata.title || link.title,
    description: metadata.description,
    imageUrl: metadata.imageUrl,
    favicon: metadata.favicon,
    metadataFetchedAt: new Date().toISOString(),
    needsMetadataRefresh: false,
  }
  
  useCanvasStore.getState().updateLink(link.id, updates)
}

/**
 * Process a batch of links for metadata refreshing
 */
async function processBatch(links: Link[], options: MetadataRefreshOptions): Promise<{ success: number; failed: number }> {
  let successCount = 0
  let failedCount = 0
  
  for (const link of links) {
    try {
      const result = await fetchLinkMetadata(link)
      
      if (result.success && result.metadata) {
        await updateLinkWithMetadata(link, result.metadata)
        successCount++
      } else {
        // Update with error state but don't remove existing metadata
        useCanvasStore.getState().updateLink(link.id, {
          needsMetadataRefresh: false,
          metadataFetchedAt: new Date().toISOString(),
        })
        failedCount++
        
        if (options.onError) {
          options.onError(result.error || 'Unknown error', link.id)
        }
      }
    } catch (error) {
      failedCount++
      if (options.onError) {
        options.onError(error instanceof Error ? error.message : 'Unknown error', link.id)
      }
    }
    
    // Update progress
    if (options.onProgress) {
      const processed = successCount + failedCount
      const total = links.length
      options.onProgress(processed, total)
    }
  }
  
  return { success: successCount, failed: failedCount }
}

/**
 * Refresh metadata for links that need it
 */
export async function refreshMetadata(
  links: Link[], 
  options: MetadataRefreshOptions = {}
): Promise<void> {
  // Filter links that need metadata refresh
  const linksNeedingRefresh = links.filter(needsMetadataRefresh)
  
  if (linksNeedingRefresh.length === 0) {
    if (options.onComplete) {
      options.onComplete(0, 0)
    }
    return
  }
  
  console.log(`Starting metadata refresh for ${linksNeedingRefresh.length} links`)
  
  let totalSuccess = 0
  let totalFailed = 0
  
  // Process in batches to avoid overwhelming target servers
  for (let i = 0; i < linksNeedingRefresh.length; i += BATCH_SIZE) {
    const batch = linksNeedingRefresh.slice(i, i + BATCH_SIZE)
    const { success, failed } = await processBatch(batch, options)
    
    totalSuccess += success
    totalFailed += failed
    
    // Add delay between batches (except for the last batch)
    if (i + BATCH_SIZE < linksNeedingRefresh.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY))
    }
  }
  
  console.log(`Metadata refresh complete: ${totalSuccess} success, ${totalFailed} failed`)
  
  if (options.onComplete) {
    options.onComplete(totalSuccess, totalFailed)
  }
}

/**
 * Mark a link for metadata refresh
 */
export function markForMetadataRefresh(linkId: string): void {
  useCanvasStore.getState().updateLink(linkId, { needsMetadataRefresh: true })
}

/**
 * Clear the refresh flag for a link
 */
export function clearMetadataRefreshFlag(linkId: string): void {
  useCanvasStore.getState().updateLink(linkId, { needsMetadataRefresh: false })
}