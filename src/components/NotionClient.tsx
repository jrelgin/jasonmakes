'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { NotionRenderer } from 'react-notion-x'
import { ExtendedRecordMap } from 'notion-types'
import {
  getProxiedNotionImage,
  isNotionS3Url,
} from '../../lib/utils/notion-image'
import 'react-notion-x/src/styles.css'



// Client component wrapper for NotionRenderer
export default function NotionClient({ recordMap }: { recordMap: ExtendedRecordMap }) {
  // Define custom components for rendering unsupported Notion blocks
  // This is just a stub for future implementation
  const components = {
    nextImage: Image,
  } as Record<string, React.ComponentType<any>>

  const mapImageUrl = (url: string) => {
    return isNotionS3Url(url) ? getProxiedNotionImage(url)! : url
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
    <div className="notion-renderer-wrapper prose max-w-none dark:prose-invert">
      <NotionRenderer
        recordMap={recordMap}
        components={components}
        mapImageUrl={mapImageUrl}
        fullPage={false}
        darkMode={darkMode}
        disableHeader
      />
    </div>
  )
}
