# Jason Makes - Architectural Overview

## Project Overview
Jason Makes is a dynamic personal portfolio website built with Next.js 15 that showcases articles and case studies while featuring a unique "Daily Profile" system. Content is edited through Keystatic and committed directly to the repo, while the daily profile aggregates data from external APIs.

## Technology Stack
- **Framework**: Next.js 15.3.2 with App Router
- **UI**: React 19.0.0 with Tailwind CSS 4
- **Content Management**: Keystatic (GitHub storage)
- **Database**: Vercel KV (Redis-compatible)
- **Deployment**: Vercel with Edge Functions
- **Testing**: Vitest with React Testing Library
- **Code Quality**: Biome for linting/formatting

## Architecture Components

### 1. Content Management System (Keystatic)

#### Collections
Keystatic defines two Git-backed collections in `keystatic.config.ts`:
- **Articles** – Markdown/MDX files in `content/articles` with frontmatter (`title`, `slug`, `excerpt`, `publishDate`, `heroImage`, `tags`).
- **Case Studies** – Mirror the article schema but write to `content/case-studies`.

#### Editing Flow

1. **Admin UI** (`src/app/(admin)/keystatic/[[...params]]/page.tsx`): renders the Keystatic interface backed by the GitHub storage adapter.
2. **GitHub App**: `KEYSTATIC_GITHUB_CLIENT_ID/SECRET/SLUG` configure the App so production and local editing use the same credentials. Commits land directly on `main`.
3. **Data Access** (`lib/data/content.ts`): wraps Keystatic's reader for listing and fetching entries. Body content is resolved as Markdown and rendered with a small Markdown component.
4. **Assets**: Hero images are committed under `public/images/...` so Vercel serves them statically without additional storage services.

#### Static Generation
- Article and case-study pages are statically generated and read from the filesystem.
- Revalidation is optional (existing `/api/refresh-content` endpoint can be triggered if on-demand regeneration is needed).

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

All API routes use Edge Runtime for optimal performance unless noted:

- `/api/cron/update-profile`: Main data aggregation endpoint
- `/api/keystatic/[[...params]]`: GitHub-backed Keystatic proxy (Node.js runtime)
- `/api/refresh-content`: Optional ISR helper for forcing page revalidation
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
CRON_SECRET                       - Authorization for cron endpoints
KEYSTATIC_GITHUB_CLIENT_ID        - GitHub App client ID for Keystatic
KEYSTATIC_GITHUB_CLIENT_SECRET    - GitHub App client secret
KEYSTATIC_SECRET                  - Session secret for Keystatic auth
NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG - GitHub App slug for Keystatic UI
FEEDLY_ACCESS_TOKEN               - Feedly OAuth token
SPOTIFY_CLIENT_ID                 - Spotify app credentials
SPOTIFY_CLIENT_SECRET
SPOTIFY_REFRESH_TOKEN
OPENAI_API_KEY                    - OpenAI API key
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

1. **Webhook Security**: Add signature verification for profile refresh webhook (if kept)
2. **Cache Warming**: Pre-generate popular content
3. **Analytics**: Add privacy-focused analytics
4. **A/B Testing**: Experiment with different layouts
5. **Internationalization**: Support multiple languages
