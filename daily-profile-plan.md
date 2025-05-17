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

* **Single hourly hit** to each upstream API → predictable costs / quota.  
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
| **P3** | **Spotify** provider (track title via refresh‑token flow)                                   |
| **P4** | Build App‑Router components for weather, articles, blurb                                    |
| **P5** | Set up Vercel cron schedule for daily updates                                               |
| **P6** | Provider‑level fallback + logging                                                           |
| **P7a** | **OpenAI blurb generation inside the hourly cron**                                         |
| **P7b** | **Article‑level summaries via background queue worker**                                    |

The generated blurb should use a **casual tone** (“Jason’s been reading…”) and will be placed in the hero section of the home page alongside the widgets.


## Phase 7 · LLM strategy (two‑step)

**P7a — daily “About Jason” blurb**

* Runs **inside the existing `/api/cron/update-profile` Edge Function.**
* After the providers succeed, we send **one** Chat Completion request (≈ 60 tokens) and store the returned sentence in KV (`blurb` key).
* Uses an `AbortController` to hard‑stop the OpenAI fetch after 12 s, so the entire cron stays well below Vercel’s 30 s Edge limit.  
* Cost ≈ 720 calls / month ⇒ &lt;$1.

**P7b — article summaries (scales later)**

* The cron enqueues the IDs of any *new* Feedly articles into **Vercel Queues** (or Upstash Q).  
* A background worker (10‑minute budget) consumes that queue and calls OpenAI **in parallel** to generate 2‑sentence summaries.  
* Summaries are stored back in KV under `articleSummaries:{id}` so widgets can render them without extra API calls.  
* Keeps cron fast and bounds OpenAI usage even if you save 20 articles a day.

### Phase 7 · LLM strategy (two-step, why it’s structured this way)

We split the AI work into **P7a** and **P7b** to keep the hourly cron _fast_ and costs _predictable_, while still leaving room for richer content later.

| Step | What happens | Why this design works |
|------|--------------|-----------------------|
| **P7a — daily “About Jason” blurb (in-cron)** | • Inside `/api/cron/update-profile` we call **one** Chat Completion<br>• Hard-abort the call after 12 s (`AbortController`)<br>• Store result in KV as `blurb` before revalidating `/` | • Keeps total cron time ≲ 20 s (Edge limit = 30 s).<br>• Only 24 calls/day → cost ≪ $1/mo.<br>• If OpenAI stalls, we simply reuse yesterday’s blurb (KV fallback). |
| **P7b — article summaries (background worker)** | • After profile is written, cron enqueues new Feedly article IDs to **Vercel Queues**.<br>• A queue worker (10-min runtime budget) pulls IDs and calls OpenAI **in parallel**, storing `articleSummaries:{id}` in KV.<br>• Widgets fetch summaries lazily from KV. | • Heavy/variable workload moves **off** the Edge cron, so it never times out.<br>• Parallel calls keep latency low even for 20 articles.<br>• Costs capped: at most *new-article-count × summary-tokens* per day.<br>• Worker retries automatically if OpenAI returns 429 / 500. |

---

### ✅  Out-of-code setup checklist (Vercel + OpenAI)

| Platform | Task |
|----------|------|
| **Vercel → Storage → Edge Config** | 1. Create store **`daily-profile-config`**.<br>2. Add key **`prompt:blurb-v1`** with the system prompt (≤ 32 KB). |
| **Vercel → Settings → Environment Variables** | • `OPENAI_API_KEY` (Prod + Dev)<br>• `CRON_SECRET` (Prod) — used for the cron auth header<br>• `REVALIDATION_TOKEN` (Prod + Dev) — for `/api/revalidate` route |
| **Vercel → Storage → KV** | Create KV database; run `vercel env pull .env.local` to sync `UPSTASH_REDIS_*` locally. |
| **Vercel → Queues (optional, for P7b)** | Create a queue **`article-summaries`**; note its ID → add `QUEUE_ID` env var. |
| **OpenAI dashboard** | 1. Create a project, obtain **API key**.<br>2. Set a hard usage cap ≤ $2/day.<br>3. (Optional) enable “Usage Alerts” e-mail. |
| **Edge Config prompt tweaks** | To change tone/guard-rails: Dashboard → Edge Config → Edit `prompt:blurb-v1` → **Save**. New prompt takes effect on the next hourly cron. |
| **(Optional) local dev** | Add the same keys to `.env.local` so you can trigger the cron manually without pushing to Vercel. |
---

## 3 · Future idea

* **Rephrase button** – client‑side streaming endpoint that lets a visitor generate alternate blurbs (max 3 clicks/session). Implement **after** the core OpenAI cron work is proven.

---

## 5 · Security & cost pointers

- Store tokens only in environment variables, never in KV or frontend code.  
  • Mock data should never include personal tokens.  
- Use `cache: 'no-store'` for upstream fetches to avoid stale data.  
- Limit OpenAI usage to scheduled jobs to control costs.  
- The 3‑click cap keeps worst‑case OpenAI spend well below the $2/day budget.

---