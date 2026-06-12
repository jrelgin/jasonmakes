# Daily Profile Builder - Actual Implementation Guide
*Next.js (App Router) / Vercel-native architecture*

> **Current Status:** ✅ **Fully implemented and working** - Weather, Readwise Reader, Spotify, and OpenAI blurb generation with hourly updates via Vercel Cron.

---

## 🏗️ How It Actually Works

### Architecture Overview
```
Vercel Cron (hourly) ──▶  /api/cron/update-profile  ──▶  Vercel KV
                              ├─ fetchWeather()     // Open-Meteo API
                              ├─ fetchReadwise()    // Readwise Reader API
                              ├─ fetchSpotify()     // Spotify API
                              ├─ generateBlurb()    // OpenAI GPT-4
                              ├─ kv.set('profile')  // Store data
                              ├─ kv.set('blurb')    // Store AI blurb
                              └─ revalidatePath('/') // Refresh homepage
```

**Key Insight:** The cron job runs every hour, fetches fresh data, generates an AI blurb, stores everything in KV, and revalidates the homepage so new data appears immediately.

---

## 📁 Actual File Structure

```
/lib
  /providers
    weather.ts         # ✅ Open-Meteo API (no auth required)
    readwise.ts        # ✅ Readwise Reader tagged article/email parser
    spotify.ts         # ✅ Spotify API with refresh token flow
    openai.ts          # ✅ GPT-4 blurb generation
  profile.ts           # ✅ Combines all providers
  kv.ts                # ✅ Vercel KV wrapper with local fallback

/src/app
  /components
    AboutBlurb.tsx     # ✅ Renders kv.get('blurb') - updates hourly
    WeatherWidget.tsx  # ✅ Renders kv.get('profile').weather - updates hourly
    LatestReadsWidget.tsx # ✅ Renders kv.get('profile').reading - updates daily
    SpotifyWidget.tsx  # ✅ Renders kv.get('profile').spotify.track - updates hourly
  /api
    /cron
      update-profile/  # ✅ Main orchestrator (Node.js runtime)
        route.ts       # ✅ Handles GET (cron) + POST (local testing)
        utils.ts       # ✅ Helper functions
    /debug            # ✅ Development endpoints for testing providers

vercel.json           # ✅ Cron schedule: "0 * * * *" (every hour)
```

---

## ⚡ Current Implementation Status

| Component | Status | Update Frequency | Notes |
|-----------|--------|------------------|-------|
| **Weather** | ✅ Working | Hourly | Open-Meteo API, no auth needed |
| **Readwise Reader** | ✅ Working | Daily (24h) | Tagged article/email publishing |
| **Spotify** | ✅ Working | Hourly | Refresh token flow |
| **OpenAI Blurb** | ✅ Working | Hourly | GPT-4, 12s timeout |
| **Homepage Updates** | ✅ Working | Hourly | Via revalidatePath('/') |

---

## 🔧 Critical Implementation Details

### 1. Runtime Configuration
```typescript
// CRITICAL: Use Node.js runtime, NOT Edge runtime
export const runtime = 'nodejs';  // ✅ revalidatePath() works
// export const runtime = 'edge';  // ❌ revalidatePath() broken
```

**Why:** Edge Runtime has limitations with Next.js revalidation features. The cron needs `revalidatePath('/')` to work properly.

### 2. Widget Revalidation Settings
```typescript
// Weather, Spotify, Blurb: Update hourly with cron
export const revalidate = 3600; // 1 hour

// Latest Reads: Update daily (less frequent)
export const revalidate = 86_400; // 24 hours
```

**Why:** Widgets need to refresh more frequently than the default 24 hours to show new data from the hourly cron.

### 3. Authentication Strategy
```typescript
// Cron accepts multiple auth methods:
// 1. Bearer token: Authorization: Bearer <CRON_SECRET>
// 2. Vercel Cron supplies the configured bearer token in production
```

---

## 🚀 How to Use

### Production (Vercel)
- **Automatic:** Cron runs every hour via `vercel.json`
- **Manual:** Trigger via Vercel dashboard → Functions → Run

### Local Development
```bash
# Test the cron endpoint locally
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/update-profile"

# Check current data
curl "http://localhost:3000/api/debug/profile"
curl "http://localhost:3000/api/debug/weather"
curl "http://localhost:3000/api/debug/readwise"
```

---

## 🔍 Troubleshooting

### Common Issues & Solutions

| Problem | Cause | Solution |
|---------|-------|----------|
| **Homepage not updating** | Widget `revalidate` too long | Set to 3600 (1 hour) |
| **Revalidation not working** | Edge Runtime | Use `runtime = 'nodejs'` |
| **Cron failing** | Auth issues | Check `CRON_SECRET` env var |
| **Providers failing** | API limits/timeouts | Built-in fallbacks handle this |

### Debug Endpoints
- `/api/debug/profile` - View current KV data
- `/api/debug/weather` - Test weather provider
- `/api/debug/readwise` - Test Readwise provider

---

## 🌐 Environment Variables Required

```bash
# Required for production
CRON_SECRET=your-secure-random-string
KV_REST_API_URL=your-vercel-kv-url
KV_REST_API_TOKEN=your-vercel-kv-token
OPENAI_API_KEY=your-openai-key

# Provider-specific
READWISE_ACCESS_TOKEN=your-readwise-access-token
READWISE_POST_TAG=jasonmakes
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_REFRESH_TOKEN=your-spotify-refresh-token

# Optional (weather defaults to Atlanta)
WEATHER_LATITUDE=33.749
WEATHER_LONGITUDE=-84.388
WEATHER_CITY=Atlanta
```

---

## 📊 Data Flow & Caching

### 1. Hourly Cron Execution
```
1. Fetch fresh data from all providers (10s timeout each)
2. Generate AI blurb using OpenAI (12s timeout)
3. Store in Vercel KV with 48h TTL
4. Call revalidatePath('/') to refresh homepage
5. Return success response
```

### 2. Homepage Rendering
```
1. Server components read from KV on each request
2. Weather/Spotify/Blurb refresh every hour
3. Latest Reads refresh every 24 hours
4. Data is always fresh (no stale cache issues)
```

### 3. Fallback Strategy
- **Provider failures:** Use previous data from KV
- **OpenAI failures:** Generate manual fallback blurb
- **KV failures:** Use in-memory mock data (dev only)

---

## 🎯 Key Lessons Learned

### What Works Well
- **Hourly updates:** Perfect balance of freshness vs. API costs
- **Fallback strategy:** System is resilient to provider failures
- **KV storage:** Fast reads, automatic expiration
- **Revalidation:** Homepage updates immediately after cron

### What Was Tricky
- **Edge Runtime:** Broke revalidation, had to use Node.js
- **Widget caching:** Had to adjust `revalidate` values
- **Auth flexibility:** Needed to support multiple auth methods

### Performance Characteristics
- **Cron execution:** ~15-20 seconds (well under 30s limit)
- **Homepage load:** ~100-200ms (KV reads are fast)
- **API costs:** ~$1-2/month (OpenAI + external APIs)

---

## 🚧 Future Enhancements

### Phase 8: Advanced Features
- [ ] **Article summaries:** Background queue for Readwise articles
- [ ] **Rephrase button:** Client-side blurb regeneration
- [ ] **Analytics:** Track which data sources are most reliable
- [ ] **Health monitoring:** Alert when providers fail repeatedly

### Phase 9: Optimization
- [ ] **Parallel fetching:** Reduce cron execution time
- [ ] **Smart caching:** Cache successful provider responses
- [ ] **Rate limiting:** Handle API quota management

---

## 📚 Resources

- **Vercel Cron:** [Documentation](https://vercel.com/docs/cron-jobs)
- **Vercel KV:** [Documentation](https://vercel.com/docs/storage/vercel-kv)
- **Next.js Revalidation:** [Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating)
- **OpenAI API:** [Documentation](https://platform.openai.com/docs/api-reference)

---

*Last updated: Based on actual implementation analysis - this system is working in production and serving fresh data every hour! 🎉*
