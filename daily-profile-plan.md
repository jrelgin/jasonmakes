# Daily Profile Builder (Feedly + Spotify + Weather + …​)  
*Next.js (App Router) / Vercel‑native architecture*

> **Goal:** surface a few up‑to‑date data points (latest Feedly saves, last‑played Spotify track, current weather, etc.) **and** a one‑sentence “About Jason” paragraph generated daily by an LLM—without triggering full site redeploys or leaking tokens.

---

## 0 · Conceptual overview

```
Vercel Cron  ──▶  /api/cron/update-profile   ──▶  Vercel KV
                   ├─ fetchWeather()  // Open‑Meteo, no auth
                   ├─ fetchFeedly()
                   ├─ fetchSpotify()  // returns { trackTitle }
                   ├─ …otherProviders()
                   ├─ buildProfileJSON()
                   ├─ callOpenAI()  → "aboutParagraph"
                   └─ kv.set({ profile, blurb })
```

* **Single daily hit** to each upstream API → predictable costs / quota.  
* Output cached in **Vercel KV** → edge‑fast reads.  
* Next.js App‑Router server components use `next.revalidate` (ISR) to pick up fresh KV data automatically.  
* Optional: end the cron route with `res.revalidate('/about')` if you want new HTML the moment the job finishes.

---

## 1 · File & folder layout

```
/lib
  /providers
    weather.ts         # Open‑Meteo (no auth)
    feedly.ts          # public JSON stream
    spotify.ts         # client‑credentials flow
    ...
  profile.ts            # combines provider data → profile JSON

/app
  /components
    AboutBlurb.tsx      # renders kv.get('blurb')
    WeatherWidget.tsx   # renders kv.get('profile').weather
    LatestArticles.tsx  # renders kv.get('profile').feedly
/api
  /cron
    update-profile.ts   # orchestrator (Edge Function)

vercel.json             # cron schedule
```

---

## 2 · Implementation roadmap

| Phase | Description                                                                                   |
|-------|----------------------------------------------------------------------------------------------|
| **P1** | **Weather** provider (Open‑Meteo) + KV write                                                |
| **P2** | **Feedly** provider & widget; refine blurb prompt                                           |
| **P3** | **Spotify** provider (track title via client‑credentials)                                   |
| **P4** | Add OpenAI integration for blurb generation                                                 |
| **P5** | Build App‑Router components for weather, articles, blurb                                   |
| **P6** | Set up Vercel cron schedule for daily updates                                              |
| **P7** | Provider‑level fallback + logging                                                          |
| **P8** | “Say it differently” button (max 3 clicks/session)                                         |

The generated blurb should use a **casual tone** (“Jason’s been reading…”) and will be placed in the hero section of the home page alongside the widgets.

---

## 3 · Provider interface

`lib/providers/feedly.ts`

```ts
// Example Feedly JSON feed URL: https://cloud.feedly.com/v3/streams/contents?streamId=feed%2Fhttps%3A%2F%2Ffeedly.com%2Ff%2FM9S3L7zFWuvPeZ5sQw90yiiq&count=5&format=json
const FEED_URL = `${process.env.FEEDLY_FEED_URL}&count=5&format=json`;

export async function fetchFeedly() {
  const { items } = await fetch(FEED_URL, { cache: 'no-store' }).then(r => r.json());
  return items.map(({ title, alternate, published }) => ({
    title,
    url:   alternate?.[0]?.href,
    date:  published,
  }));
}
```

`lib/providers/spotify.ts` (sketch)

```ts
import { refreshAccessToken, getLastPlayed } from './spotify-client';

export async function fetchSpotify() {
  const access = await refreshAccessToken(
    process.env.SPOTIFY_CLIENT_ID,
    process.env.SPOTIFY_CLIENT_SECRET,
    process.env.SPOTIFY_REFRESH_TOKEN,
  );
  return await getLastPlayed(access);
}
```

Weather payload returns { temperature, condition, city } from Open‑Meteo.

Add new providers the same way—module just returns a plain JS object ready for JSON.stringify.

For now, Spotify’s payload will include just the track title (more fields can be added later).

---

## 4 · Profile builder

`lib/profile.ts`

```ts
import { fetchWeather } from './providers/weather';
import { fetchFeedly } from './providers/feedly';
import { fetchSpotify } from './providers/spotify';

export type Profile = {
  weather: Awaited<ReturnType<typeof fetchWeather>>;
  feedly:  Awaited<ReturnType<typeof fetchFeedly>>;
  spotify: Awaited<ReturnType<typeof fetchSpotify>>;
};

export async function buildProfile(): Promise<Profile> {
  const [weather, feedly, spotify] = await Promise.all([
    fetchWeather(),
    fetchFeedly(),
    fetchSpotify(),
  ]);
  return { weather, feedly, spotify };
}
```

---

## 5 · Cron orchestrator

`/api/cron/update-profile.ts`

```ts
import { buildProfile } from '@/lib/profile';
import { kv } from '@vercel/kv';
import OpenAI from 'openai';

export const config = { runtime: 'edge' };

const ai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async (_req: Request, res: any) => {
  const profile = await buildProfile();

  // • On failure for any provider, keep yesterday’s data for that slice and log the error (provider‑level fallback).

  const prompt = `Write ONE short third‑person sentence introducing Jason Elgin based on:\n${JSON.stringify(
    profile,
  )}`;

  const { choices } = await ai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 60,
  });

  const blurb = choices[0]?.message?.content?.trim() ?? '';

  await kv.set('profile', profile);
  await kv.set('blurb', blurb);

  // bust ISR cache immediately (optional)
  // await res.revalidate('/');

  return res.json({ ok: true });
};
```

---

## 6 · Display components (App Router)

### About blurb

```tsx
// app/components/AboutBlurb.tsx
export const revalidate = 86_400;       // 24 h

import { kv } from '@vercel/kv';

export default async function AboutBlurb() {
  const blurb = await kv.get<string>('blurb');
  return <p className="prose max-w-xl">{blurb ?? 'Loading…'}</p>;
}
```

### Weather widget

```tsx
// app/components/WeatherWidget.tsx
export const revalidate = 86_400;
import { kv } from '@vercel/kv';

export default async function WeatherWidget() {
  const profile = await kv.get<any>('profile');
  const w = profile?.weather;
  if (!w) return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{w.city}</span>
      <span>{Math.round(w.temperature)}°C</span>
      <span>{w.condition}</span>
    </div>
  );
}
```

### Latest Feedly articles

```tsx
// app/components/LatestArticles.tsx
export const revalidate = 86_400;

import { kv } from '@vercel/kv';

export default async function LatestArticles() {
  const profile = await kv.get<any>('profile');
  const items = profile?.feedly ?? [];
  return (
    <section>
      <h2 className="text-xl font-semibold mb-4">Latest Reads</h2>
      <ul className="space-y-3">
        {items.map((a: any) => (
          <li key={a.url}>
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {a.title}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

### Rephrase button (live stream, 3‑click limit)

```tsx
// app/components/AboutBlurbLive.tsx
'use client';
import { useStreamText } from 'ai/react';
import { useState } from 'react';

export default function AboutBlurbLive({ initial }: { initial: string }) {
  const { data, isLoading, run } = useStreamText({ api: '/api/stream/blurb' });

  // simple in‑memory click counter
  const [clicks, setClicks] = useState(0);

  const handleClick = () => {
    if (clicks >= 3 || isLoading) return;
    run({});
    setClicks(c => c + 1);
  };

  return (
    <div>
      <p>{isLoading ? 'Writing…' : data ?? initial}</p>
      <button
        onClick={handleClick}
        disabled={isLoading || clicks >= 3}
        className="mt-2 text-sm underline"
      >
        {clicks >= 3 ? 'Limit reached' : 'Say it a different way'}
      </button>
    </div>
  );
}
```

---

## 6 · Nice-to-haves

* **Mock data file** – commit `mock-profile.json` for local dev without API calls.  
* Click‑limit logic can be hardened with cookies or localStorage to persist across refreshes.

---

## 7 · Why this matches your future roadmap

| Need | How the stack handles it |
|------|--------------------------|
| Add a new provider tomorrow | Drop `providers/newSource.ts`, import it in `buildProfile()`. |
| Keep API quotas/token limits sane | One daily fetch per provider. |
| Control LLM usage/cost | Single scheduled OpenAI call instead of per‑request generation. |
| Edge‑fast delivery | Reads from KV, rendered in a server component, cached via ISR. |
| Latest Next.js App‑Router features | Uses App Router, async components, `export const revalidate`, Edge runtime. |

---

## 7 · Security & cost pointers

- Store tokens only in environment variables, never in KV or frontend code.  
  • Mock data should never include personal tokens.  
- Use `cache: 'no-store'` for upstream fetches to avoid stale data.  
- Limit OpenAI usage to scheduled jobs to control costs.  
- The 3‑click cap keeps worst‑case OpenAI spend well below the $2/day budget.

---

## Notes & niceties

### KV schema

```json
{
  "profile": {
    "weather": { "temperature": 24.3, "condition": "Partly Cloudy", "city": "Atlanta" },
    "feedly": [
      {
        "title": "...",
        "url": "...",
        "date": "..."
      }
    ],
    "spotify": {
      "trackTitle": "...",
      "playedAt": "..."
    }
  },
  "blurb": "Jason is a software developer who loves reading and music."
}
```

---
