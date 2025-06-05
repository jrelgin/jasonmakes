'use client'

import { NotionRenderer } from 'react-notion-x'
import { ExtendedRecordMap } from 'notion-types'
import { getProxiedNotionImage } from '../../lib/utils/notion-image'
import 'react-notion-x/src/styles.css'



// Client component wrapper for NotionRenderer
export default function NotionClient({ recordMap }: { recordMap: ExtendedRecordMap }) {
  // Define custom components for rendering unsupported Notion blocks
  // This is just a stub for future implementation
  const components = {} as Record<string, React.ComponentType<any>>

  return (
    <div className="notion-renderer-wrapper prose max-w-none">
      <NotionRenderer
        recordMap={recordMap}
        components={components}
        mapImageUrl={(url: string) => getProxiedNotionImage(url) ?? url}
        fullPage={false}
        darkMode={false} // Set to false for now without theme integration
        disableHeader
      />
    </div>
  )
}
