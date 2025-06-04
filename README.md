# Jason Makes

## Jason Elgin's Personal Portfolio Site

Welcome to the repository for my personal portfolio site at [jasonmakes.co](https://jasonmakes.co). This project showcases my work, articles, and case studies in design and development.

I'm a designer and developer with over 15 years of experience creating beautiful, usable, and accessible web applications. This site serves as both my portfolio and a platform to share my thoughts on design, development, and technology.

## About This Site

This site is built on:

- **Framework**: [Next.js 15.3.2](https://nextjs.org) with the App Router
- **React**: [React 19.0.0](https://react.dev)
- **Content**: Markdown-based content system using gray-matter and remark
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Deployment**: [Vercel](https://vercel.com)

## Features

- Dynamic articles with Markdown content and frontmatter
- Case studies showcasing work with detailed project information
- Responsive design with modern UI
- Fast page loads with Next.js App Router and static generation
- Image optimization with Next.js Image component
- SEO optimization with metadata generation
- Content tagging system

## Project Structure

```
/content               # Markdown files for articles and case studies
/lib
  profile.ts           # builds the daily profile
  kv.ts                # Vercel KV wrapper (mocked locally)
  /providers           # External data providers
/public                # Static assets
/src
  /app
    api/               # API routes (cron, debug, revalidate)
    articles/          # Article pages
    case-studies/      # Case study pages
    components/        # Server components reading from KV
```

## Development

This project uses PNPM as the package manager and Turbopack in development mode for faster refresh times and improved developer experience.

```bash
# Install dependencies
pnpm install

# Start development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Content Management

### Notion Integration

The site also supports content management through Notion as a headless CMS:

- Uses the official Notion API with `@notionhq/client`
- Articles are stored in a Notion database and rendered with `react-notion-x`
- Custom block rendering and conversion from Notion API format to `react-notion-x` format
- Handles rich text content with proper formatting (bold, italic, etc.)
- Supports various block types including paragraphs, headings, lists, and todos

#### Nice-to-Haves / Next Up

- [ ] **Add same functionality for case studies**  
  - Work on the case study page to add the same functionality as the article page
  - Work on the case study list page to add the same functionality as the article list page

- [ ] **Finish the _Publish Site_ button flow**  
  - Confirm the button posts to `/api/revalidate` with `X-Revalidate-Secret`  
  - Verify page refreshes end-to-end after a click

- [ ] **Remove dev-only console logs**  
  - Guard logs with `if (process.env.NODE_ENV !== 'production')` or delete

- [ ] **Add SEO & social meta**  
  - `<title>` and `<meta name="description">` from Notion → Excerpt  
  - `<meta property="og:image">` from Featured Image  
  - Optional JSON-LD `Article` schema

- [ ] **Fallback revalidation safety net**  
  - Add `export const revalidate = 86_400` (24 h) to article & case-study pages

- [ ] **Support custom / new Notion blocks**  
  - Map unsupported block types in `components` prop inside `NotionClient`  
  - Example: Notion "Button" → custom `<MyButton />`

## Daily Profile System

The homepage shows a daily profile built from external data sources. A Vercel Cron job calls `/api/cron/update-profile` hourly (see `vercel.json`). This endpoint:
1. Fetches weather and Feedly data via modules in `lib/providers`.
2. Stores the profile and a short blurb in Vercel KV using `lib/kv.ts`.
3. Revalidates the homepage so new data appears quickly.

Server components like `WeatherWidget`, `FeedlyArticlesWidget`, and `AboutBlurb` read from KV on every request (with Next.js revalidation). Development mode offers `/api/debug/*` routes for inspecting raw provider output.
## Future Improvements

The following improvements are planned for future development:

### 1. Enhanced Metadata and Social Sharing

- **Custom OG Images**: Add dynamic Open Graph images for articles and case studies
- **Social Media Preview**: Improve sharing cards for Twitter, LinkedIn, etc.

### 2. Performance Optimizations

- **Data Caching**: Implement `unstable_cache` for filesystem operations
- **Content Sanitization**: Add HTML sanitization for markdown content

### 3. Content Enhancements

- **Rich Media Support**: Improve embedding of videos and interactive elements
- **Advanced Tag System**: Add filtering and navigation by content tags
- **Search Functionality**: Add site-wide search for content

## Environment Setup

See `env-instructions.md` for the required variables. In development the KV client falls back to an in-memory store seeded with sample data. Use `pnpm trigger-cron` (or the provided curl command) to run the cron endpoint locally.
## Testing

Run `pnpm test` to execute the Vitest unit tests. The suite validates provider logic (such as weather code mapping) and the cron profile builder.
## Git Workflow

This project follows a structured Git workflow:

- `main`: Production-ready code
- `feature/*`: New features (e.g., `feature/add-dashboard`)
- `fix/*`: Bug fixes (e.g., `fix/navbar-styling`)

## Next Steps

The roadmap in `daily-profile-plan.md` outlines future phases including Spotify integration and OpenAI blurb generation. Adding a new data provider simply means creating a module in `lib/providers` and wiring it into `buildProfile()`.
## Contact

If you have any questions or would like to get in touch, feel free to reach out to me here on [GitHub](https://github.com/jrelgin).
