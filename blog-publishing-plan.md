# Implementation Plan for TinaCMS

## Content‑Model Decision

After weighing the trade‑offs, **use two collections**—`articles` and `caseStudies`—instead of one “posts” collection with a `category` field.  
They share 90 % of their fields today, but splitting them now keeps future schema tweaks (e.g. unique case‑study metrics) clean and gives editors a dedicated sidebar section in Tina.

| Consideration          | Separate collections (✅ chosen) | Single collection |
| ---------------------- | -------------------------------- | ----------------- |
| **Editor UX**          | Clear “Articles” vs “Case Studies” menus | Requires filtering |
| **Shared fields**      | Duplicate in two templates, but Tina templates keep it DRY | All in one place |
| **Future divergence**  | Easy—add fields only to the relevant collection | Risk of clutter for one type |
| **Routing**            | Maps neatly to `/articles` and `/case-studies` folders | Needs filter logic |
| **Build performance**  | Negligible difference at <500 docs | Same |

---

## Step‑by‑Step Implementation

1. **Prep**  
   * Node 18 + and Next 15 already installed  
   * Commit / push a clean branch called `feat/tina` for easy rollback

2. **Install Tina**  
   ```bash
   pnpm add tinacms
   pnpm add -D @tinacms/cli
   ```

3. **Scaffold**  
   ```bash
   npx @tinacms/cli@latest init
   ```
   Creates `/tina`, updates package.json scripts.

4. **Define schema** — `/tina/config.ts`  
   ```ts
   import { defineConfig } from 'tinacms'

   export default defineConfig({
     branch: process.env.VERCEL_GIT_COMMIT_REF ?? 'main',
     clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
     token: process.env.TINA_TOKEN,
     schema: {
       collections: [
         {
           name: 'articles',
           label: 'Articles',
           path: 'content/articles',
           format: 'md',
           templates: [{ name: 'default', label: 'Article', fields: sharedFields }]
         },
         {
           name: 'caseStudies',
           label: 'Case Studies',
           path: 'content/case-studies',
           format: 'md',
           templates: [{ name: 'default', label: 'Case Study', fields: sharedFields }]
         }
       ]
     }
   })

   // /tina/sharedFields.ts
   export const sharedFields = [
     { type: 'string', name: 'title', isTitle: true, required: true },
     { type: 'datetime', name: 'date' },
     { type: 'string', name: 'slug', required: true },
     { type: 'rich-text', name: 'body', isBody: true },
     // add more as needed
   ]
   ```

5. **Re‑organise content**  
   ```bash
   mkdir -p content/articles content/case-studies
   git mv content/sample-article.md      content/articles/sample-article.md
   git mv content/sample-case-study.md   content/case-studies/sample-case-study.md
   # move / rename other dummy files similarly
   ```

6. **Update routes** (`src/app/...`)  
   * `articles/[slug]/page.tsx` → fetch from `articles` collection  
   * `case-studies/[slug]/page.tsx` → fetch from `caseStudies` collection  
   * Util: `allSlugs(collection)` to feed `generateStaticParams`

7. **Env vars**  
   Add to `.env.local` and Vercel dashboard:  
   ```
   NEXT_PUBLIC_TINA_CLIENT_ID=xxx
   TINA_TOKEN=yyy
   ```

8. **Dev test**  
   ```bash
   pnpm dev     # runs Tina + Next
   # open http://localhost:3000/admin
   ```
   Create a new Article & Case Study to verify sidebar separation.

9. **Clean‑up legacy code**  
   * Remove any `gray-matter`, `remark`, `fs` loaders.  
   * Delete your old `lib/posts.ts` utilities once pages compile without them.

10. **Deploy**  
    Push branch → Vercel runs `tinacms build` automatically.  
    Test admin at `/admin` on preview URL.

11. **Merge & celebrate** 🥳  
    Merge `feat/tina` → main once preview looks good.

---

### Next upgrades

* **Media uploads** → Add S3 credentials and `media` config.  
* **MDX support** → `pnpm add @tinacms/mdx` and swap `rich-text` → `mdx`.  
* **Editorial workflow** → Enable PR‑based mode in Tina Cloud settings.
