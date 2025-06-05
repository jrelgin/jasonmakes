import { Client } from "@notionhq/client"

// Simple interface for the block properties we need
interface BlockMeta {
  id: string
  has_children: boolean
}

const notion = new Client({ auth: process.env.NOTION_TOKEN! })

/**
 * Recursively fetch all blocks for a page
 * Returns a flat array of blocks for @9gustin/react-notion-render
 */
export async function getBlocks(pageIdWithDashes: string): Promise<any[]> {
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
  return blocks
}