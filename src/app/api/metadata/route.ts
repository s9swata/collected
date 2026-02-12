import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

interface LinkMetadata {
  url: string
  title: string
  description?: string
  imageUrl?: string
  favicon?: string
  domain: string
}

/**
 * Fetch YouTube metadata using oEmbed API
 */
async function fetchYouTubeMetadata(url: string): Promise<LinkMetadata> {
  try {
    // Extract video ID for shorter URLs
    let videoId = ''
    if (url.includes('youtu.be/')) {
      videoId = url.split('/').pop() || ''
    } else if (url.includes('youtube.com/watch')) {
      const urlParams = new URL(url).searchParams
      videoId = urlParams.get('v') || ''
    } else {
      videoId = url.split('v=').pop()?.split('&')[0] || ''
    }

    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    // Use YouTube oEmbed API
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkCanvas/1.0; +https://linkcanvas.app)',
        'Accept': 'application/json',
      },
      signal: new AbortController().signal, // 10s timeout
    })

    if (!response.ok) {
      throw new Error(`YouTube oEmbed error: ${response.status}`)
    }

    const oembedData = await response.json()
    
    return {
      url,
      title: oembedData.title || 'YouTube Video',
      description: oembedData.author_name || '',
      imageUrl: oembedData.thumbnail_url || '',
      favicon: 'https://www.youtube.com/favicon.ico',
      domain: 'youtube.com',
    }
  } catch (error) {
    console.error('YouTube metadata fetch error:', error)
    throw error
  }
}

/**
 * Fetch Reddit metadata with enhanced content extraction
 */
async function fetchRedditMetadata(url: string): Promise<LinkMetadata> {
  try {
    // Extract subreddit and post info from URL
    const redditMatch = url.match(/reddit\.com\/r\/([^\/]+)\/comments\/([a-z0-9]+)(?:\/[^\/]+)?\/?([a-z0-9]+)?/)
    const subreddit = redditMatch?.[1] || 'unknown'
    const postId = redditMatch?.[2]
    const isComment = !!redditMatch?.[3]

    // Fetch the page with Reddit-friendly headers
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout for Reddit

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Reddit HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)



    // Extract title with multiple Reddit-specific fallbacks
    const h1Text = $('h1').first().text().trim()
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      (h1Text && h1Text !== '' && !h1Text.toLowerCase().includes('reddit') ? h1Text : null) ||
      $('title').text().replace(/ : reddit\.com$/, '').replace('Reddit - The heart of the internet', '') ||
      $('[data-testid="post-content"] h3').text() ||
      `[r/${subreddit}] Post`

    // Extract Reddit post content for description
    let description = ''
    
    // Try multiple selectors for post content
    const postContent = 
      $('[data-testid="post-content"]').first().text() ||
      $('.usertext-body').first().text() ||
      $('.expando').first().text() ||
      $('div[data-click-id="text"] p').first().text() ||
      $('div p').first().text() // This seems to work for current Reddit structure
    
    if (postContent) {
      // Create short summary (max 200 chars)
      description = postContent.length > 200 
        ? postContent.substring(0, 200) + '...' 
        : postContent
    } else {
      // Fallback to meta description
      description = 
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="twitter:description"]').attr('content') ||
        `Post from r/${subreddit}`
    }

    // Add subreddit context
    if (description && !description.includes(`r/${subreddit}`)) {
      description = `${description} • r/${subreddit}`
    }

    // Extract main thumbnail/image
    let imageUrl = 
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content')

    // Reddit-specific image processing
    if (imageUrl) {
      // Handle Reddit's CDN URLs
      if (imageUrl.includes('preview.redd.it') || imageUrl.includes('i.redd.it')) {
        // Ensure absolute URL and remove size parameters for better quality
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl
        }
        // Remove width/height parameters to get higher quality
        imageUrl = imageUrl.replace(/(?:\?|&)(?:width|height|format|auto)=webp[^&]*/g, '')
      }
      
      // Make sure image URL is absolute
      if (!imageUrl.startsWith('http')) {
        try {
          imageUrl = new URL(imageUrl, url).href
        } catch {
          imageUrl = undefined
        }
      }
    }

    // Favicon
    const favicon = 'https://www.reddit.com/favicon.ico'

    return {
      url,
      title: title.trim(),
      description: description.trim() || `A post from r/${subreddit}`,
      imageUrl: imageUrl || undefined,
      favicon,
      domain: 'reddit.com',
    }

  } catch (error) {
    console.error('Reddit metadata fetch error:', error)
    
    // Simple fallback - basic info
    try {
      const urlObj = new URL(url)
      const pathMatch = urlObj.pathname.match(/\/r\/([^\/]+)/)
      const subreddit = pathMatch?.[1] || 'reddit'
      
      return {
        url,
        title: `[r/${subreddit}] Post`,
        description: `A post from r/${subreddit} on Reddit`,
        imageUrl: undefined,
        favicon: 'https://www.reddit.com/favicon.ico',
        domain: 'reddit.com',
      }
    } catch {
      return {
        url,
        title: 'Reddit Post',
        description: 'A post from Reddit',
        imageUrl: undefined,
        favicon: 'https://www.reddit.com/favicon.ico',
        domain: 'reddit.com',
      }
    }
  }
}

/**
 * Fetch X (Twitter) metadata using oEmbed API
 */
async function fetchXMetadata(url: string): Promise<LinkMetadata> {
  try {

    
    // Extract username and tweet ID from URL
    const xMatch = url.match(/(?:x\.com|twitter\.com)\/([^\/]+)\/status\/(\d+)/)
    const username = xMatch?.[1] || 'user'
    const tweetId = xMatch?.[2]

    if (!tweetId) {
      throw new Error('Invalid X/Twitter URL format')
    }

    // Use X's oEmbed API for reliable content extraction
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkCanvas/1.0; +https://linkcanvas.app)',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`X oEmbed error: ${response.status}`)
    }

    const oembedData = await response.json()

    // Extract tweet text from HTML content
    let tweetText = ''
    if (oembedData.html) {
      // Parse the HTML to extract clean tweet text
      const tempDiv = cheerio.load(oembedData.html)
      const tweetContent = tempDiv('p').first().text()
      if (tweetContent) {
        tweetText = tweetContent
          .replace(/https?:\/\/t\.co\/\w+/g, '') // Remove t.co links
          .replace(/<br\s*\/?>/g, ' ') // Replace line breaks with spaces
          .replace(/&gt;/g, '>') // Fix HTML entities
          .replace(/&lt;/g, '<')
          .replace(/&amp;/g, '&')
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/\s*>\s*/g, ' > ') // Clean up arrow formatting
          .replace(/\s*:\s*/g, ': ') // Clean up colon spacing
          .trim()
      }
    }

    // Use author name as fallback for title if no tweet text
    const title = tweetText || oembedData.author_name || `Tweet by @${username}`

    // Create description with author context
    let description = tweetText || `A tweet by ${oembedData.author_name || username}`
    if (description && oembedData.author_name && !description.includes(oembedData.author_name)) {
      description = `${description} • ${oembedData.author_name}`
    }

    // Try to extract image from the original HTML (as fallback)
    let imageUrl: string | undefined
    
    // Try to fetch the original page to get image metadata
    try {
      const pageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkCanvas/1.0; +https://linkcanvas.app)',
          'Accept': 'text/html',
        },
        signal: new AbortController().signal,
      })

      if (pageResponse.ok) {
        const html = await pageResponse.text()
        const $ = cheerio.load(html)
        
        imageUrl = 
          $('meta[property="og:image"]').attr('content') ||
          $('meta[name="twitter:image"]').attr('content')

        if (imageUrl) {
          // Make sure image URL is absolute
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl
          } else if (!imageUrl.startsWith('http')) {
            imageUrl = undefined
          }
        }
      }
    } catch (imageError) {
      // If we can't get the image, that's fine - we have the content
      console.log('🔍 X: Could not fetch image metadata, using oEmbed only')
    }

    const favicon = 'https://x.com/favicon.ico'

    return {
      url,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl || undefined,
      favicon,
      domain: 'x.com',
    }

  } catch (error) {
    console.error('X/Twitter metadata fetch error:', error)
    
    // Simple fallback - basic info
    try {
      const urlObj = new URL(url)
      const pathMatch = urlObj.pathname.match(/\/([^\/]+)\/status\/(\d+)/)
      const username = pathMatch?.[1] || 'user'
      
      return {
        url,
        title: `Tweet by @${username}`,
        description: `A tweet from @${username} on X`,
        imageUrl: undefined,
        favicon: 'https://x.com/favicon.ico',
        domain: 'x.com',
      }
    } catch {
      return {
        url,
        title: 'X/Twitter Post',
        description: 'A post from X',
        imageUrl: undefined,
        favicon: 'https://x.com/favicon.ico',
        domain: 'x.com',
      }
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<LinkMetadata | { error: string }>> {
  try {
    const url = request.nextUrl.searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      )
    }

    // Validate URL
    let urlObj: URL
    try {
      urlObj = new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const domain = urlObj.hostname.replace('www.', '')

    // Check if this is a YouTube URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return NextResponse.json(await fetchYouTubeMetadata(url))
    }

    // Check if this is a Reddit URL
    if (url.includes('reddit.com') || url.includes('www.reddit.com')) {
      return NextResponse.json(await fetchRedditMetadata(url))
    }

    // Check if this is an X/Twitter URL
    if (url.includes('x.com') || url.includes('twitter.com') || url.includes('www.x.com') || url.includes('www.twitter.com')) {
      return NextResponse.json(await fetchXMetadata(url))
    }

    // Fetch the page with timeout for non-YouTube sites
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkCanvas/1.0; +https://linkcanvas.app)',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract metadata
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      domain

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content')

    let imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content')

    // Make image URL absolute
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        imageUrl = new URL(imageUrl, url).href
      } catch {
        // invalid image url, ignore
      }
    }

    let favicon =
      $('link[rel="icon"]').attr('href') ||
      $('link[rel="shortcut icon"]').attr('href') ||
      $('link[rel="apple-touch-icon"]').attr('href')

    // Make favicon URL absolute or use default
    if (favicon && !favicon.startsWith('http')) {
      try {
        favicon = new URL(favicon, url).href
      } catch {
        // invalid favicon url, ignore
      }
    }

    if (!favicon) {
      favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    }

    const metadata: LinkMetadata = {
      url,
      title: title.trim(),
      description: description?.trim(),
      imageUrl: imageUrl || undefined,
      favicon,
      domain,
    }

    return NextResponse.json(metadata)

  } catch (error) {
    console.error('Error fetching metadata:', error)

    // Return basic metadata on error
    const urlParam = request.nextUrl.searchParams.get('url') || ''
    let domain = ''
    try {
      const urlObj = new URL(urlParam)
      domain = urlObj.hostname.replace('www.', '')
    } catch {
      domain = 'unknown'
    }

    return NextResponse.json({
      url: urlParam,
      title: domain,
      description: undefined,
      imageUrl: undefined,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      domain,
    })
  }
}
