import { Client } from "@notionhq/client"
import type { ExtendedRecordMap } from "notion-types"
import { mapBlocksToRecordMap } from "../lib/mapBlocksToRecordMap"
import { unstable_cache } from 'next/cache'

// Simple interface for the block properties we need
interface BlockMeta {
  id: string
  has_children: boolean
}

const notion = new Client({ auth: process.env.NOTION_TOKEN! })

/**
 * Recursively fetch all blocks for a page and convert them
 * into the recordMap format react-notion-x expects.
 * Optimized to batch API calls where possible.
 */
async function _getRecordMap(pageIdWithDashes: string): Promise<ExtendedRecordMap> {
  const isDev = process.env.NODE_ENV === 'development'
  const startTime = isDev ? Date.now() : 0
  
  const page = await notion.pages.retrieve({ page_id: pageIdWithDashes })
  const blocks: any[] = []
  let apiCallCount = 0
  
  // Batch fetch children to reduce sequential API calls
  async function fetchChildrenBatch(ids: string[], depth = 0) {
    const childrenToFetch: string[] = []
    
    // Fetch all blocks at this level in parallel
    await Promise.all(
      ids.map(async (id) => {
        let cursor: string | undefined
        do {
          apiCallCount++
          const { results, next_cursor, has_more } = await notion.blocks.children.list({
            block_id: id,
            page_size: 100,
            start_cursor: cursor,
          })
          
          blocks.push(...results)
          cursor = has_more ? next_cursor! : undefined
          
          // Collect children for next batch
          const children = (results as BlockMeta[])
            .filter(b => b.has_children)
            .map(b => b.id)
          childrenToFetch.push(...children)
        } while (cursor)
      })
    )
    
    // Recursively fetch next batch if there are children
    if (childrenToFetch.length > 0) {
      // Limit parallel requests to avoid rate limiting
      const batchSize = 10
      for (let i = 0; i < childrenToFetch.length; i += batchSize) {
        const batch = childrenToFetch.slice(i, i + batchSize)
        await fetchChildrenBatch(batch, depth + 1)
      }
    }
  }

  // Start with the page itself
  await fetchChildrenBatch([pageIdWithDashes])
  
  // Only log timing in development
  if (isDev) {
    const duration = Date.now() - startTime
    console.log(`[Notion] Fetched recordMap for ${pageIdWithDashes.substring(0, 8)}... in ${duration}ms`)
    console.log(`[Notion] Total API calls: ${apiCallCount}, Total blocks: ${blocks.length}`)
  }
  
  return mapBlocksToRecordMap(page as any, blocks)
}

// Export cached version with 'post' tag for manual revalidation
export const getRecordMap = unstable_cache(
  _getRecordMap,
  ['notion-recordmap'],
  { tags: ['post'] }
)