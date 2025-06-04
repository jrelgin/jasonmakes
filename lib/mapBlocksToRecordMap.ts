import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { ExtendedRecordMap, Role } from 'notion-types'

export function mapBlocksToRecordMap(
  page: any,
  blocks: BlockObjectResponse[]
): ExtendedRecordMap {
  const wrap = (v: any) => ({ role: 'reader' as Role, value: v })

  // map official-API block names → legacy names react-notion-x expects
  const legacyName = (t: string): string => {
    switch (t) {
      case 'paragraph':            return 'text'
      case 'heading_1':            return 'header'
      case 'heading_2':            return 'sub_header'
      case 'heading_3':            return 'sub_sub_header'
      case 'bulleted_list_item':   return 'bulleted_list'
      case 'numbered_list_item':   return 'numbered_list'
      case 'to_do':                return 'todo'
      default:                     return t   // already compatible
    }
  }
  
  // Convert Notion API rich_text array to react-notion-x properties.title format
  function toTitle(rich: any[]) {
    if (!rich?.length) return [['', []]]
    return [
      [
        rich.map((t: any) => t.plain_text).join(''),
        rich.flatMap((t: any) => {
          const ann = t.annotations
          const flags = []
          if (ann.bold) flags.push('b')
          if (ann.italic) flags.push('i')
          if (ann.underline) flags.push('u')
          if (ann.strikethrough) flags.push('s')
          if (ann.code) flags.push('code')
          return flags
        })
      ]
    ]
  }

  const recordMap: ExtendedRecordMap = {
    block: { [page.id]: wrap({ ...page, type: 'page', content: blocks.map(b => b.id) }) },
    collection: {},
    collection_view: {},
    notion_user: {},
    collection_query: {},
    signed_urls: {}
  }

  for (const b of blocks) {
    const legacyType = legacyName((b as any).type)
    const base = { ...b, type: legacyType }

    const block = ['text','header','sub_header','sub_sub_header',
                 'bulleted_list','numbered_list','todo'].includes(legacyType)
      ? {
          ...base,
          properties: {
            title: toTitle((b as any)[(b as any).type].rich_text)
          }
        }
      : base

    recordMap.block[b.id] = wrap(block)
  }

  return recordMap
}
