import { Client } from "@notionhq/client"
import type { ExtendedRecordMap } from "notion-types"
import { mapBlocksToRecordMap } from "../lib/mapBlocksToRecordMap"

// Simple interface for the block properties we need
interface BlockMeta {
  id: string
  has_children: boolean
}

const notion = new Client({ auth: process.env.NOTION_TOKEN! })

/**
 * Recursively fetch all blocks for a page and convert them
 * into the recordMap format react-notion-x expects.
 */
export async function getRecordMap(pageIdWithDashes: string): Promise<ExtendedRecordMap> {
  const page = await notion.pages.retrieve({ page_id: pageIdWithDashes })

  const blocks: any[] = []
  async function fetchChildren(id: string) {
    let cursor: string | undefined
    do {
      const { results, next_cursor, has_more } = await notion.blocks.children.list({
        block_id: id,
        page_size: 100,
        start_cursor: cursor,
      })
      blocks.push(...results)
      cursor = has_more ? next_cursor! : undefined
      await Promise.all(
        (results as BlockMeta[])
          .filter(b => b.has_children)
          .map(b => fetchChildren(b.id))
      )
    } while (cursor)
  }

  await fetchChildren(pageIdWithDashes)
  return mapBlocksToRecordMap(page as any, blocks)
}
