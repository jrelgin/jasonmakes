import type { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints'
import type { ExtendedRecordMap, Role } from 'notion-types'
import { getProxiedNotionImage } from './utils/notion-image'

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
      case 'image':                return 'image'
      case 'video':                return 'video'
      case 'file':                 return 'file'
      case 'pdf':                  return 'pdf'
      case 'bookmark':             return 'bookmark'
      case 'code':                 return 'code'
      case 'quote':                return 'quote'
      case 'callout':              return 'callout'
      case 'toggle':               return 'toggle'
      case 'divider':              return 'divider'
      case 'table_of_contents':    return 'table_of_contents'
      case 'column_list':          return 'column_list'
      case 'column':               return 'column'
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
  
  // Collect all image URLs that need to be in signed_urls
  const signedUrls: Record<string, string> = {}

  for (const b of blocks) {
    const legacyType = legacyName((b as any).type)
    const base = { ...b, type: legacyType }

    let block: any
    
    // Handle text-based blocks
    if (['text','header','sub_header','sub_sub_header',
         'bulleted_list','numbered_list','todo'].includes(legacyType)) {
      block = {
        ...base,
        properties: {
          title: toTitle((b as any)[(b as any).type].rich_text)
        }
      }
    }
    // Handle image blocks
    else if (legacyType === 'image' && (b as any).image) {
      const imageData = (b as any).image
      const originalUrl = imageData.file?.url || imageData.external?.url || ''
      const proxiedUrl = getProxiedNotionImage(originalUrl) || originalUrl
      
      // Add to signed URLs if it's a file URL
      if (originalUrl && imageData.file?.url) {
        signedUrls[b.id] = proxiedUrl
      }
      
      block = {
        ...base,
        properties: {
          source: [[proxiedUrl]],
          caption: imageData.caption ? toTitle(imageData.caption) : [['', []]]
        },
        format: {
          block_width: 512,
          block_height: 512,
          display_source: proxiedUrl,
          block_full_width: false,
          block_page_width: true,
          block_aspect_ratio: 1,
          block_preserve_scale: true
        }
      }
    }
    // Handle code blocks
    else if (legacyType === 'code' && (b as any).code) {
      const codeData = (b as any).code
      block = {
        ...base,
        properties: {
          title: toTitle(codeData.rich_text),
          language: [[codeData.language || 'plain text']]
        }
      }
    }
    // Handle quote blocks
    else if (legacyType === 'quote' && (b as any).quote) {
      block = {
        ...base,
        properties: {
          title: toTitle((b as any).quote.rich_text)
        }
      }
    }
    // Handle callout blocks
    else if (legacyType === 'callout' && (b as any).callout) {
      const calloutData = (b as any).callout
      block = {
        ...base,
        properties: {
          title: toTitle(calloutData.rich_text)
        },
        format: {
          page_icon: calloutData.icon?.emoji || calloutData.icon?.external?.url || calloutData.icon?.file?.url || '📌'
        }
      }
    }
    // Handle toggle blocks
    else if (legacyType === 'toggle' && (b as any).toggle) {
      block = {
        ...base,
        properties: {
          title: toTitle((b as any).toggle.rich_text)
        }
      }
    }
    // Handle divider blocks
    else if (legacyType === 'divider') {
      block = base // Dividers don't need special properties
    }
    // Handle video, file, pdf, bookmark blocks
    else if (['video', 'file', 'pdf', 'bookmark'].includes(legacyType)) {
      const blockData = (b as any)[legacyType]
      if (blockData) {
        block = {
          ...base,
          properties: {
            source: [[blockData.file?.url || blockData.external?.url || '']],
            caption: blockData.caption ? toTitle(blockData.caption) : [['', []]]
          }
        }
      } else {
        block = base
      }
    }
    // Default handling for other blocks
    else {
      block = base
    }

    recordMap.block[b.id] = wrap(block)
  }
  
  // Add signed URLs to the record map
  recordMap.signed_urls = signedUrls

  return recordMap
}
