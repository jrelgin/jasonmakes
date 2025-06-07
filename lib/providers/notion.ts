import { Client } from '@notionhq/client'
import { getRecordMap } from '../notionRecordMap'
import { ExtendedRecordMap } from 'notion-types'
import { unstable_cache } from 'next/cache'

// Define type for post metadata
export type PostMeta = {
  id: string
  title: string
  slug: string
  excerpt: string
  date: string
  feature: string | null
  type: string
  tags: string[]
}

const NOTION_TOKEN = process.env.NOTION_TOKEN
const DB_ID = process.env.NOTION_DATABASE_ID

if (!NOTION_TOKEN) {
  throw new Error('NOTION_TOKEN environment variable is required')
}

if (!DB_ID) {
  throw new Error('NOTION_DATABASE_ID environment variable is required')
}

// Initialize Notion client
const notionOfficial = new Client({ auth: NOTION_TOKEN as string })

/**
 * List posts from Notion database with optional filters
 * Cached with 'post' tag for manual revalidation
 */
async function _listPosts(options: {
  filter?: any
  sorts?: any[]
} = {}): Promise<PostMeta[]> {
  try {
    // Apply default Type filter if no custom filter is provided
    const filter = options.filter || {
      and: [
        { property: 'Status', select: { equals: 'Published' } },
        { property: 'Type', select: { equals: 'Post' } }
      ]
    }

    // Apply default sorting if no custom sort is provided
    const sorts = options.sorts || [
      { property: 'Publication Date', direction: 'descending' }
    ]

    const { results } = await notionOfficial.databases.query({
      database_id: DB_ID as string,
      filter,
      sorts
    })

    return results.map(normalize)
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error fetching Notion posts:', { filter: options.filter, error })
    }
    return []
  }
}

// Export cached version with the 'post' tag that your webhook uses
export const listPosts = unstable_cache(
  _listPosts,
  ['list-posts'],
  { 
    tags: ['post'],
    revalidate: process.env.NODE_ENV === 'development' ? 300 : false // 5 min in dev, manual in prod
  }
)

/**
 * Get a specific post by slug
 */
async function _getPost(slug: string): Promise<{ meta: PostMeta; recordMap: ExtendedRecordMap } | null> {
  try {
    const { results } = await notionOfficial.databases.query({
      database_id: DB_ID as string,
      filter: {
        and: [
          { property: 'Slug', rich_text: { equals: slug } },
          { property: 'Status', select: { equals: 'Published' } }
        ]
      }
    });
    
    if (!results.length) {
      return null;
    }
    const page = results[0];
    
    // Get record map for rendering
    const recordMap = await getRecordMap(page.id);
    const normalizedData = normalize(page);
    
    return {
      meta: normalizedData,
      recordMap
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`Error fetching Notion post with slug ${slug}:`, error);
    }
    return null;
  }
}

// Export cached version with the 'post' tag that your webhook uses
export const getPost = unstable_cache(
  _getPost,
  ['get-post'],
  { 
    tags: ['post'],
    revalidate: process.env.NODE_ENV === 'development' ? 300 : false // 5 min in dev, manual in prod
  }
)

/**
 * Normalize Notion page data into a consistent format
 */
function normalize(p: any): PostMeta {
  const props = p.properties
  return {
    id: p.id,
    title: props.Title?.title[0]?.plain_text ?? '',
    slug: props.Slug?.rich_text[0]?.plain_text ?? '',
    excerpt: props.Excerpt?.rich_text[0]?.plain_text ?? '',
    date: props['Publication Date']?.date?.start ?? '',
    feature: props['Featured Image']?.files?.[0]?.file?.url ?? null,
    type: props.Type?.select?.name ?? '',
    tags: props.Tags?.multi_select?.map((t: any) => t.name) ?? []
  }
}