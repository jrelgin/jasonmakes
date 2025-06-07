# Jason Makes - Architectural Overview

## Project Overview
Jason Makes is a dynamic personal portfolio website built with Next.js 15 that showcases articles and case studies while featuring a unique "Daily Profile" system. The site combines static content management through Notion with real-time personal data aggregation from multiple APIs.

## Technology Stack
- **Framework**: Next.js 15.3.2 with App Router
- **UI**: React 19.0.0 with Tailwind CSS 4
- **Content Management**: Notion as headless CMS
- **Database**: Vercel KV (Redis-compatible)
- **Deployment**: Vercel with Edge Functions
- **Testing**: Vitest with React Testing Library
- **Code Quality**: Biome for linting/formatting

## Architecture Components

### 1. Content Management System (Notion Integration)

#### Notion Database Structure
The site uses two main Notion databases:
- **Articles Database**: Blog posts with properties for title, excerpt, featured image, tags, and published date
- **Case Studies Database**: Portfolio pieces with similar properties

#### Notion API Integration Flow

1. **Content Fetching** (`lib/providers/notion.ts`):
   ```typescript
   // Key components:
   - NotionClient: Wrapper around @notionhq/client
   - getArticles(): Fetches and transforms article pages
   - getCaseStudies(): Fetches and transforms case study pages
   - getPageContent(): Retrieves full page blocks for rendering
   ```

2. **Data Transformation**:
   - Raw Notion API responses are transformed into typed interfaces
   - Page properties are extracted and normalized
   - Rich text is converted to plain text for excerpts
   - Images are processed and proxied through custom endpoint

3. **Content Rendering** (`src/components/NotionClient.tsx`):
   - Uses `react-notion-x` for rendering Notion blocks
   - Custom components for specific block types
   - Server-side rendering for optimal performance
   - Supports all major Notion block types (text, images, code, embeds, etc.)

4. **Image Handling** (`/api/notion-image/route.ts`):
   - Custom proxy to prevent 403 errors from expired Notion S3 URLs
   - Caches images with proper headers
   - Handles authentication and URL rewriting
   - Preserves image quality and format

#### Static Generation with ISR
- Articles and case studies are statically generated at build time
- On-demand revalidation via webhook (`/api/refresh-content`)
- Content updates in Notion trigger immediate site updates
- Fallback behavior for new content not yet generated

### 2. Daily Profile System

#### Data Aggregation Pipeline
The Daily Profile system runs via an hourly cron job (`/api/cron/update-profile`) that:

1. **Weather Data** (`lib/providers/weather.ts`):
   - Fetches from Open-Meteo API for Boston coordinates
   - Includes temperature, conditions, humidity, wind speed
   - No API key required (open API)

2. **Feedly Integration** (`lib/providers/feedly.ts`):
   - Requires OAuth access token
   - Fetches recently saved articles
   - Extracts title, URL, and engagement metrics
   - Handles empty responses gracefully

3. **Spotify Integration** (`lib/providers/spotify.ts`):
   - Uses refresh token for persistent access
   - Fetches recently played tracks
   - Includes artist, album, and play time
   - Implements token refresh logic

4. **AI Summary** (`lib/providers/openai.ts`):
   - Generates contextual blurb based on aggregated data
   - Uses GPT-4o-mini for cost efficiency
   - Creates personalized, time-aware summaries

#### Data Storage Strategy
- All profile data stored in Vercel KV
- 48-hour TTL for automatic cleanup
- Key structure: `profile:weather`, `profile:feedly`, etc.
- Atomic updates to prevent partial data states

### 3. Frontend Architecture

#### Server Components
All data-fetching components are React Server Components:
- `WeatherWidget.tsx`: Displays current weather
- `SpotifyWidget.tsx`: Shows recent tracks
- `FeedlyArticlesWidget.tsx`: Lists saved articles
- `AboutBlurb.tsx`: Renders AI-generated summary

#### Routing Structure
```
/                    - Homepage with profile widgets
/articles           - Article listing page
/articles/[slug]    - Individual article page
/case-studies       - Case study listing
/case-studies/[slug] - Individual case study
```

### 4. API Routes

All API routes use Edge Runtime for optimal performance:

- `/api/cron/update-profile`: Main data aggregation endpoint
- `/api/refresh-content`: Webhook for Notion content updates
- `/api/notion-image`: Image proxy for Notion assets
- `/api/debug/*`: Development endpoints for testing providers

### 5. Error Handling & Resilience

#### Provider-Level Error Handling
Each data provider implements independent error handling:
- Returns fallback data on failure
- Logs errors for monitoring
- Prevents cascade failures
- Preserves previous data when APIs return empty results

#### Cron Job Resilience
- Validates cron authorization header
- Catches and logs all errors
- Returns success even if individual providers fail
- Ensures other providers continue updating

## Development Workflow

### Environment Variables
Required environment variables:
```
CRON_SECRET          - Authorization for cron endpoints
NOTION_TOKEN         - Notion integration token
NOTION_ARTICLES_DB   - Articles database ID
NOTION_CASE_STUDIES_DB - Case studies database ID
FEEDLY_ACCESS_TOKEN  - Feedly OAuth token
SPOTIFY_CLIENT_ID    - Spotify app credentials
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN
OPENAI_API_KEY       - OpenAI API key
```

### Local Development
1. **Package Manager**: Always use `pnpm` (not npm) - configured as packageManager in package.json
2. Use debug endpoints to test providers individually
3. In-memory caching prevents API rate limits
4. Environment-based configuration for dev/prod

### Testing Strategy
- Unit tests for providers and utilities
- Integration tests for API routes
- Mocked external API responses
- Test data fixtures for consistent testing

## Performance Optimizations

1. **Edge Runtime**: API routes run at edge for low latency
2. **Static Generation**: Content pages built at deploy time
3. **Prefetching**: Links prefetch on hover
4. **Image Optimization**: Next.js Image component with lazy loading
5. **Caching**: Multi-layer caching (CDN, KV, in-memory)

## Security Considerations

1. **API Keys**: All stored as environment variables
2. **Server-Side Only**: External APIs called only from server
3. **CORS**: Proper headers on API routes
4. **Authentication**: Cron routes protected by secret
5. **Rate Limiting**: Implemented via caching strategies

## Deployment

The site is deployed on Vercel with:
- Automatic deployments from main branch
- Preview deployments for PRs
- Edge Functions for API routes
- Integrated KV store
- Cron job scheduling

## Future Considerations

1. **Webhook Security**: Add signature verification for Notion webhooks
2. **Cache Warming**: Pre-generate popular content
3. **Analytics**: Add privacy-focused analytics
4. **A/B Testing**: Experiment with different layouts
5. **Internationalization**: Support multiple languages