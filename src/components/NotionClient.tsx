'use client'

import { useEffect } from 'react'
import { NotionRenderer } from 'react-notion-x'
import { ExtendedRecordMap } from 'notion-types'
import 'react-notion-x/src/styles.css'



// Client component wrapper for NotionRenderer
export default function NotionClient({ recordMap }: { recordMap: ExtendedRecordMap }) {

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('NotionClient recordMap', {
        blocks: Object.keys(recordMap.block ?? {}).length,
      });
    }
  }, [recordMap])
  
  // Define custom components for rendering unsupported Notion blocks
  // This is just a stub for future implementation
  const components = {} as Record<string, React.ComponentType<any>>

  return (
    <div className="notion-renderer-wrapper prose max-w-none">
      <NotionRenderer 
        recordMap={recordMap}
        components={components}
        fullPage={false} 
        darkMode={false} // Set to false for now without theme integration
        disableHeader
      />
    </div>
  )
}
