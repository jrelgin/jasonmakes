# Notion Baseline Inventory

## Content surfaces still backed by Notion
- **Articles** (`src/app/articles/page.tsx`, `src/app/articles/[slug]/page.tsx`) – use `listPosts()` and `getPost()` from `lib/providers/notion.ts` to pull entries whose Notion `Type` select is `Article`. Detail pages render Notion blocks through `NotionClient`.
- **Case Studies** (`src/app/case-studies/page.tsx`, `src/app/case-studies/[slug]/page.tsx`) – share the same Notion database and provider, filtering on `Type = "Case Study"`.
- **Fallback "Post" listings** – the default `listPosts()` filter still targets `Type = "Post"`, which powers any legacy routes importing `listPosts` without overrides. No other site sections currently read from Notion.
- **Author profile snippet** – sourced from Vercel KV via `src/app/components/AboutBlurb.tsx`; no Notion dependency.
- **Homepage highlights** – homepage (`src/app/page.tsx`) stitches together widgets with KV / Feedly / Spotify data only.

## Integration touchpoints (code-level)
- `lib/providers/notion.ts` – wraps `@notionhq/client` to query the shared database, normalizes Notion properties, and exposes `listPosts` / `getPost` with `unstable_cache` tagged `post`.
- `lib/notionRecordMap.ts` – recursively hydrates Notion blocks and converts them via `mapBlocksToRecordMap` for `react-notion-x` rendering.
- `src/components/NotionClient.tsx` – client component that feeds the record map into `react-notion-x` and rewrites image URLs.
- `lib/utils/notion-image.ts` & `src/app/api/notion-image/route.ts` – proxy and persist Notion S3 imagery to Vercel Blob storage, returning stable URLs for the frontend.
- `src/app/api/refresh-content/route.ts` – webhook endpoint gated by `REVALIDATION_TOKEN`; clears cached `post` data after Notion edits.
- `next.config.ts` – remote image allowlist for Notion S3 and `www.notion.so` domains so Next/Image will optimise proxied assets.
- `docs/notion-guide.md` – existing high-level explainer on the current Notion integration (kept for historical context).

## Environment variables & secrets powering Notion features
| Name | Purpose | Where it is read |
|------|---------|------------------|
| `NOTION_TOKEN` | Integration token used by `@notionhq/client` for database + block access. | `lib/providers/notion.ts`, `lib/notionRecordMap.ts`. |
| `NOTION_DATABASE_ID` | Shared Notion database backing Articles + Case Studies. | `lib/providers/notion.ts`. |
| `REVALIDATION_TOKEN` | Secret that authorises `/api/refresh-content` ISR webhook calls after Notion updates. | `src/app/api/refresh-content/route.ts`. |
| `BLOB_READ_WRITE_TOKEN` | Grants `/api/notion-image` permission to persist Notion-hosted assets in Vercel Blob storage so they do not expire. | `@vercel/blob` client inside `src/app/api/notion-image/route.ts`. |

## Normalised Notion → site field mapping
| Notion property | Type | Normalised field (`PostMeta`) | Downstream usage |
|-----------------|------|-------------------------------|------------------|
| `Title` | Title | `title` | Rendered as page `<h1>` and listings card title. |
| `Slug` | Rich text | `slug` | Used for route params (`/articles/[slug]`, `/case-studies/[slug]`). |
| `Excerpt` | Rich text | `excerpt` | Cards teaser copy & metadata description. |
| `Publication Date` | Date | `date` | Listing + detail page publish date. |
| `Featured Image` | Files | `feature` (proxied) | Hero/thumbnail image via `/api/notion-image`. |
| `Type` | Select | `type` | Filters entries per surface (`Article`, `Case Study`, legacy `Post`). |
| `Tags` | Multi-select | `tags` | Reserved for future taxonomy display (not yet rendered). |
| `Status` | Select | (filter only) | Determines publish state (`Published` required). |

Caching behaviour: all fetchers use `unstable_cache` with tag `post`, revalidating every 5 minutes locally and manually in production, aligning with webhook-driven invalidation.
