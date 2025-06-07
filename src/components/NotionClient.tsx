'use client'

import { useEffect, useState } from 'react'
import { NotionRenderer } from 'react-notion-x'
import { ExtendedRecordMap, Block } from 'notion-types'
import { getProxiedNotionImage } from '../../lib/utils/notion-image'

interface NotionClientProps {
  recordMap: ExtendedRecordMap
}

/**
 * Client component wrapper for NotionRenderer with automatic image proxying
 * Handles Notion content rendering with proper image URL proxying to prevent 403 errors
 */
export default function NotionClient({ recordMap }: NotionClientProps) {
  /**
   * Custom image URL mapper to force all Notion images through our proxy
   * Prevents 403 errors from expired S3 signed URLs by routing through /api/notion-image
   */
  const mapImageUrl = (url: string | undefined, block: Block): string | undefined => {
    if (!url) return url
    
    // If URL is already proxied, return as-is to avoid double-encoding
    if (url.startsWith('/api/notion-image')) {
      return url
    }
    
    return getProxiedNotionImage(url) || url
  }

  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    setDarkMode(query.matches)
    const listener = (e: MediaQueryListEvent) => setDarkMode(e.matches)
    query.addEventListener('change', listener)
    return () => query.removeEventListener('change', listener)
  }, [])

  return (
    <div className="notion-renderer-wrapper">
      <NotionRenderer
        recordMap={recordMap}
        mapImageUrl={mapImageUrl}
        fullPage={false}
        darkMode={darkMode}
        disableHeader
      />
    </div>
  )
}
