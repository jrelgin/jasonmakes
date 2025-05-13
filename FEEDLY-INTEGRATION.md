# Daily Profile Builder (Feedly + Spotify + …​)  
*Next 14 / Vercel‑native architecture*

> **Goal:** surface a few up‑to‑date data points (latest Feedly saves, last‑played Spotify track, etc.) **and** a one‑sentence “About Jason” paragraph generated daily by an LLM—without triggering full site redeploys or leaking tokens.

---

## 0 · Conceptual overview

```
Vercel Cron  ──▶  /api/cron/update-profile   ──▶  Vercel KV
                   ├─ fetchFeedly()
                   ├─ fetchSpotify()
                   ├─ …otherProviders()
                   ├─ buildProfileJSON()
                   ├─ callOpenAI()  → "aboutParagraph"
                   └─ kv.set({ profile, blurb })
```

* **Single daily hit** to each upstream API → predictable costs / quota.  
* Output cached in **Vercel KV** → edge‑fast reads.  
* Next 14 server components use `next.revalidate` (ISR) to pick up fresh KV data automatically.  
* Optional: end the cron route with `res.revalidate('/about')` if you want new HTML the moment the job finishes.

---

## 1 · File & folder layout

```
/lib
  /providers
    feedly.ts           # public JSON stream – no auth required
    spotify.ts          # handles refresh_token flow
    ...
  profile.ts            # combines provider data → profile JSON

/app
  /components
    AboutBlurb.tsx      # renders kv.get('blurb')
    LatestArticles.tsx  # renders kv.get('profile').feedly
/api
  /cron
    update-profile.ts   # orchestrator (Edge Function)

vercel.json             # cron schedule
```

---

## 2 · Provider modules

`lib/providers/feedly.ts`

```ts
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

Add new providers the same way—module just returns a plain JS object ready for JSON.stringify.

---

## 3 · Profile builder

`lib/profile.ts`

```ts
import { fetchFeedly } from './providers/feedly';
import { fetchSpotify } from './providers/spotify';

export type Profile = {
  feedly:   Awaited<ReturnType<typeof fetchFeedly>>;
  spotify:  Awaited<ReturnType<typeof fetchSpotify>>;
  // add new keys as providers grow
};

export async function buildProfile(): Promise<Profile> {
  const [feedly, spotify] = await Promise.all([
    fetchFeedly(),
    fetchSpotify(),
  ]);
  return { feedly, spotify };
}
```

---

## 4 · Cron orchestrator

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

## 5 · Cron schedule

`vercel.json`

```json
{
  "cron": [
    {
      "path": "/api/cron/update-profile",
      "schedule": "0 5 * * *"   // every day at 05:00 UTC
    }
  ]
}
```

---

## 6 · Display components (App Router, Next 14)

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

Each component ships **zero client‑side JS** (static HTML after ISR) and automatically updates after the next cron run.

---

## 7 · Why this matches your future roadmap

| Need | How the stack handles it |
|------|--------------------------|
| Add a new provider tomorrow | Drop `providers/newSource.ts`, import it in `buildProfile()`. |
| Keep API quotas/token limits sane | One daily fetch per provider. |
| Control LLM usage/cost | Single scheduled OpenAI call instead of per‑request generation. |
| Edge‑fast delivery | Reads from KV, rendered in a server component, cached via ISR. |
| Latest Next .js features | Uses App Router, async components, `export const revalidate`, Edge runtime. |

---

### Next TODOs

1. Create the Feedly and Spotify env vars in Vercel.  
2. `npm i @vercel/kv openai`  
3. Commit the scaffolding above, deploy, then set up the cron job.  
4. Expand the prompt & frontend styling once real data flows.

*That’s it—one tidy loop for all the “Jason daily profile” goodness, future‑proofed for more sources and the bleeding‑edge Next.js you’re on.*  
``` 
