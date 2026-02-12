import type { LinkMetadata } from '@/types'

export async function fetchMetadata(url: string): Promise<LinkMetadata> {
  try {
    const response = await fetch(`/api/metadata?url=${encodeURIComponent(url)}`)

    if (!response.ok) {
      throw new Error('Failed to fetch metadata')
    }

    const metadata: LinkMetadata = await response.json()
    return metadata
  } catch (error) {
    console.error('Error fetching metadata:', error)

    // Return basic fallback metadata
    let domain = ''
    try {
      const urlObj = new URL(url)
      domain = urlObj.hostname.replace('www.', '')
    } catch {
      domain = 'unknown'
    }

    return {
      url,
      title: domain,
      domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    }
  }
}
