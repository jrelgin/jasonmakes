

# Next 15 × Notion CMS × Vercel — Implementation Guide  
*(Blog + Case Studies · Free tier · On‑Demand Publish Button)*

---

## 0 · Quick Overview

* **Tech stack:** Next.js 15 (App Router) + `@notionhq/client` + `react-notion‑x`  
* **Authoring:** Notion database — no extra UI to host  
* **Publishing:** One‑click **Publish** button in Notion triggers on‑demand ISR (`/api/revalidate`)  
* **Cost:** \$0 on Notion free tier + Vercel hobby

---

## 1 · Create the Notion database

| Property (type)      | Example value          | Purpose                  |
|----------------------|------------------------|--------------------------|
| **Name** (Title)     | “My First Post”        | Page title               |
| **Slug** (Text)      | `my-first-post`        | URL slug (must be unique)|
| **Status** (Select)  | Draft / Published      | Publish control          |
| **Published At** (Date) | 2025‑06‑01        | Sort & SEO               |
| **Excerpt** (Rich text) | “Short teaser …”  | Meta description         |
| **Featured Image** (Files) | *(upload)*     | Hero / OG image          |
| **Tags** (Multi‑select) | Design, CaseStudy | Filtering (optional)     |

> The article body lives inside the page as normal Notion blocks—no extra column needed.

---

## 2 · Add the **Publish Site** button (Automation)

1. In the DB, add a **Button** property named **Publish Site**.  
2. Action → **Call webhook**.  
3. URL: `https://<YOUR_DOMAIN>/api/revalidate`  
4. Method: `POST`  
5. Body (JSON):  
   ```json
   { "tag": "post" }
   ```
6. Set button visibility to show only when **Status = Published**.

---

## 3 · Install dependencies

```bash
pnpm add @notionhq/client react-notion-x notion-types
```

---

## 4 · Environment variables (Vercel)

```env
NOTION_TOKEN=<secret integration token>
NOTION_DATABASE_ID=<db id>
```

Create an internal integration at notion.com → Settings → Integrations, share the DB with it, and grab the token.

---

## 5 · Helper layer – `/lib/notion.ts`

```ts
import { Client } from '@notionhq/client'

export const notion = new Client({ auth: process.env.NOTION_TOKEN! })
export const DB_ID = process.env.NOTION_DATABASE_ID!

export async function listPosts() {
  const { results } = await notion.databases.query({
    database_id: DB_ID,
    filter: { property: 'Status', select: { equals: 'Published' } },
    sorts: [{ property: 'Published At', direction: 'descending' }]
  })
  return results.map(normalize)
}

export async function getPost(slug: string) {
  const { results } = await notion.databases.query({
    database_id: DB_ID,
    filter: { property: 'Slug', rich_text: { equals: slug } }
  })
  if (!results.length) return null
  const page = results[0]
  const blocks = await notion.blocks.children.list({ block_id: page.id, page_size: 999 })
  return { meta: normalize(page), blocks }
}

function normalize(p: any) {
  const props = p.properties
  return {
    id: p.id,
    title: props.Name.title[0]?.plain_text ?? '',
    slug: props.Slug.rich_text[0]?.plain_text ?? '',
    excerpt: props.Excerpt?.rich_text[0]?.plain_text ?? '',
    date: props['Published At']?.date?.start ?? '',
    feature: props['Featured Image']?.files?.[0]?.file?.url ?? null,
    tags: props.Tags?.multi_select.map((t: any) => t.name) ?? []
  }
}
```

---

## 6 · Next 15 Pages

### Blog listing — `app/blog/page.tsx`

```tsx
export const dynamic = 'force-static'
export const fetchCache = 'force-cache'

import { listPosts } from '@/lib/notion'
import PostCard from '@/components/PostCard'

export default async function Blog() {
  const posts = await listPosts({ next: { tags: ['post'] } })
  return <ul>{posts.map(p => <PostCard key={p.id} {...p} />)}</ul>
}
```

### Detail page — `app/blog/[slug]/page.tsx`

```tsx
export const dynamic = 'force-static'
export const fetchCache = 'force-cache'

import { getPost } from '@/lib/notion'
import { NotionRenderer } from 'react-notion-x'

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug, { next: { tags: ['post'] } })
  if (!post) notFound()

  return (
    <>
      <Hero img={post.meta.feature} title={post.meta.title}/>
      <NotionRenderer recordMap={post.blocks}/>
    </>
  )
}
```

> **Optional safety net:** add `export const revalidate = 86_400` (24 h) if you want a daily auto-refresh in case the button fails.

---

## 7 · On‑Demand ISR endpoint — `app/api/revalidate/route.ts`

```ts
import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { tag } = await req.json()
    revalidateTag(tag ?? 'post')
    return Response.json({ revalidated: true })
  } catch {
    return Response.json({ revalidated: false }, { status: 400 })
  }
}
```

---

## 8 · Image handling

* Use Next 15 `<Image src={url} width={…} height={…} />` — it will download, optimize, and store variants in Vercel’s cache.  
* For **alt text**, use the Notion block caption or add a custom “Alt” property.  
* If an image 403s (URL expired), the next request refetches a new signed URL automatically.

---

## 9 · SEO checklist

- `<title>` → `meta.title`  
- `<meta name="description">` → `excerpt`  
- OpenGraph image → `feature`  
- JSON‑LD (`Article`) using slug/date/title  
- Sitemap.xml → generate in `/app/api/sitemap/route.ts` and tag with `revalidateTag('sitemap')`.

---

## 10 · Effort snapshot

| Task                          | Time |
|-------------------------------|------|
| Notion DB + button setup      | 15 min |
| Install deps & helpers        | 30 min |
| Build listing + detail pages  | 45 min |
| `/api/revalidate` endpoint    | 10 min |
| **First post live**           | **~2 hours** |

---

### That’s it—click **Publish Site** in Notion, watch pages update instantly, and enjoy a friction‑free CMS workflow.