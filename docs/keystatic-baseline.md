# Keystatic Baseline Inventory

## Content surfaces backed by Keystatic
- **Articles** (`src/app/articles/page.tsx`, `src/app/articles/[slug]/page.tsx`) – rendered from Markdown/MDX stored under `content/articles`. Data is loaded through `lib/data/content.ts` using the Keystatic reader.
- **Case Studies** (`src/app/case-studies/page.tsx`, `src/app/case-studies/[slug]/page.tsx`) – share the same loader and schema, reading from `content/case-studies`.
- **Admin UI** – `/keystatic` exposes the GitHub-backed Keystatic editor for creating and updating entries directly in the repo.
- **Other site features** (Daily profile widgets, homepage, etc.) rely on KV/Feedly/Spotify providers and are unrelated to Keystatic.

## Integration touchpoints (code level)
- `keystatic.config.ts` – defines the `articles` and `caseStudies` collections, GitHub storage configuration, and image field destinations.
- `lib/data/content.ts` – thin data-access layer that normalises entries from the Keystatic reader for the article and case-study routes.
- `src/app/(admin)/keystatic/[[...params]]/page.tsx` – loads the Keystatic UI inside the Next.js app.
- `src/app/api/keystatic/[[...params]]/route.ts` – GitHub storage API proxy required for commit-backed editing.

## Environment variables & secrets powering Keystatic
| Name | Purpose | Where it is read |
|------|---------|------------------|
| `KEYSTATIC_GITHUB_CLIENT_ID` | OAuth client ID for the GitHub App backing Keystatic. | `src/app/api/keystatic/[[...params]]/route.ts`. |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | OAuth client secret for the GitHub App. | `src/app/api/keystatic/[[...params]]/route.ts`. |
| `KEYSTATIC_SECRET` | Session secret used to sign Keystatic cookies. | `src/app/api/keystatic/[[...params]]/route.ts`. |
| `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | Slug of the GitHub App; required so the UI can initiate auth. | `src/app/(admin)/keystatic/[[...params]]/page.tsx`, `src/app/api/keystatic/[[...params]]/route.ts`. |

## Content format
- **Frontmatter** – stored as YAML with `title`, `slug`, `excerpt`, `publishDate`, `heroImage`, `tags`.
- **Body** – saved as MDX/Markdown text handled by the Keystatic editor (`fields.mdx`).
- **Assets** – hero images are committed alongside the site in `public/images/...` so Vercel’s static hosting and Git history remain the source of truth.

## Operational notes
- Keystatic commits changes directly to `main` through the authenticated GitHub user; no additional webhooks are required.
- The local admin UI and production deployment share the same GitHub App credentials. Register both `http://127.0.0.1:3000/...` and `https://www.jasonmakes.co/...` callbacks on the GitHub App.
- Content changes are picked up by Next.js on the following request because the pages are statically generated; run a redeploy or trigger revalidation if you need immediate updates on production.
