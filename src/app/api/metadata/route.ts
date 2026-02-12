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

export async function GET(request: NextRequest) {
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

    // Fetch the page with timeout
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
