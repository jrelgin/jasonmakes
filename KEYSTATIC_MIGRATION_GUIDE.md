# Keystatic Migration Implementation Guide

This guide outlines the steps for migrating the site from the current Notion-based CMS to a basic Keystatic setup that supports content editing directly from the production deployment. Each step is framed as a short, testable task so progress can be verified incrementally. The migration targets a simple personal blog with a single editor, direct commits to `main`, and no legacy Notion content that must be preserved beyond reference.

### Progress snapshot
- [x] **Step 1 – Establish Baseline** (docs captured in `docs/notion-baseline.md`, representative snapshot in `tmp/notion-export/`)
- [ ] **Step 2 – Install Keystatic**
- [ ] **Step 3 – Enable Production Editing**
- [ ] **Step 4 – Swap Runtime**
- [ ] **Step 5 – Decommission Notion**

---

## 1. Establish Baseline

1. **Document current Notion usage** ✅  
   - Identify the exact blog content types that still rely on Notion (posts, author profile snippet, homepage highlights).  
   - Capture the API touchpoints (`lib/providers/notion.ts`, `/api/notion-image`, `NotionClient` renderer, etc.).  
   - Confirm all environment variables and secrets that power Notion integrations.  
   _Acceptance:_ Inventory document stored in `/docs` covering endpoints, schemas, and env vars.

2. **Snapshot current content structure** ✅  
   - Save the Markdown/JSON for one current Notion-driven blog post strictly for field mapping (representative data is sufficient; no live export required).  
   - Store the snapshot in `/tmp/notion-export` (ignored by git) and note any data that will not return (e.g., experimental embeds).  
   _Acceptance:_ Snapshot reviewed and fields mapped to their Keystatic equivalents.

---

## 2. Install Keystatic

3. **Add Keystatic packages**  
   - Run `pnpm add keystatic @keystatic/next`.  
   _Acceptance:_ `package.json` and `pnpm-lock.yaml` list the new dependencies.

4. **Initialize Keystatic config**
   - Create `keystatic.config.ts` at the repo root.
   - Define schema coverage for the two active content surfaces: articles and case studies. Start with a single `articles` collection that mirrors the existing Notion fields (title, slug, excerpt, hero image, tags, publish date, Markdown/MDX body) and introduce a `contentType` select field if you need to differentiate case studies. If field needs diverge, split into a dedicated `caseStudies` collection reusing the shared field definitions.
   - Add singletons only if future baseline work identifies non-article content that must be editable (the current scope does not require additional singletons).
   - Configure `storage: { kind: 'github', repo: '<github-owner>/<repo-name>', branch: 'main' }` (replace with the real slug) to align with the production Git strategy.
   _Acceptance:_ `pnpm keystatic validate` (or equivalent lint script) passes.

5. **Generate content directories**
   - Configure collections to write content as Markdown + frontmatter under `content/articles` (and `content/case-studies` if a separate collection is introduced).
   - Seed the directories with one sample article and case study entry via the Keystatic UI so Git commits the canonical Markdown/MDX files. No manual file editing needed.
   - Ensure the generated `content/` paths are tracked by git (update `.gitignore` if necessary) so production has access to seeded entries.

   _Acceptance:_ Running `pnpm keystatic build` produces the expected content structure.

---

## 3. Enable Production Editing

6. **Configure Git-backed storage**
   - Use Keystatic’s GitHub mode so edits made in production create commits in the repository (local Git history remains source of truth).
   - Configure Keystatic to commit directly to the `main` branch (per the team’s decision) rather than opening pull requests or introducing a draft workflow.
   - Point Keystatic’s storage config at the canonical `<github-owner>/<repo-name>` repo and confirm the `main` branch is accessible with the current token scopes.
   _Acceptance:_ `pnpm keystatic validate` (or the project’s equivalent lint script) passes with the GitHub storage options targeting the correct repo and branch.

   _Note:_ In GitHub storage mode, the authenticated editor’s OAuth session allows Keystatic to author commits in the configured branch; no additional “merge” step occurs unless PR mode is explicitly enabled.

7. **Implement self-hosted GitHub OAuth**
   - Register a GitHub OAuth app owned by the repo maintainer (details in the self-hosted OAuth reference below) so production and local editing both use the same client credentials.
   - Configure the app’s callback URLs for local (`http://localhost:3000/keystatic/api/auth/callback/github`) and production (`https://<production-domain>/keystatic/api/auth/callback/github`) use.
   - Store `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, and `KEYSTATIC_SECRET` in `.env.local` and Vercel project settings (Production, Preview, and Development) and document them in `env-instructions.md`.
   - Update `keystatic.config.ts` and any `next.config.ts` rewrites so the admin UI references the correct public URL when computing OAuth redirects.
   _Acceptance:_ Visiting `/keystatic` locally prompts for GitHub login, completes the OAuth flow, and lists repo content without errors.

8. **Add admin route to Next.js app**
   - Following the Keystatic Next.js guide, add `src/app/(admin)/keystatic/[[...params]]/page.tsx` that renders `<KeystaticApp config={config} />`.
   - Rely solely on Keystatic’s GitHub auth for access control since there is only one trusted editor.
   _Acceptance:_ Running `pnpm dev` exposes the admin UI at `/keystatic` locally.

9. **Wire up production base URL**
   - Ensure the Keystatic config’s `cloud.projectId` (or GitHub repo slug) matches the production deployment.  
   - Set the `BASE_URL` / `KEYSTATIC_PUBLIC_URL` to the production domain so OAuth callbacks succeed.  
   _Acceptance:_ Accessing `/keystatic` on a staging or preview deployment completes the auth flow and lists content.

---

## 4. Replace Data Fetching

10. **Create a content loader abstraction**
    - Introduce a data access layer (e.g., `lib/data/posts.ts`) that reads markdown files using Keystatic’s `reader` API.
    - Provide list and detail fetchers to replace `listPostsFromNotion` and `getNotionPostBySlug`.
    - Export TypeScript types derived from the Keystatic schema so consuming components stay strongly typed.
    _Acceptance:_ Unit tests cover listing and fetching a post from the filesystem.

11. **Update Next.js routes**
    - Replace Notion providers in `src/app/articles/*.tsx`, `src/app/case-studies/*.tsx`, and any other Notion-backed routes with the new loader (or consolidate them into a single route powered by the articles collection if the shared schema remains sufficient).
    - Remove `NotionClient` usage and swap with Markdown/MDX rendering (e.g., `next-mdx-remote`, `@keystatic/mdx`).
    - Update any `generateMetadata`/SEO helpers to pull data from the new loader and ensure slugs resolve correctly at build time.
    _Acceptance:_ Pages render locally using only Keystatic data (no Notion API calls).

12. **Handle images and assets**
    - Replace the Notion image proxy with assets tracked in the repo (e.g., store blog imagery under `public/images/posts`).
    - Update image components to use Next.js `Image` with local/static URLs.
    - Remove Notion-hosted domains from `next.config.ts` image allowlists and ensure new asset paths are optimized at build time.
    _Acceptance:_ `pnpm lint` and `pnpm test` pass with no references to Notion image proxy utilities.

13. **Seed launch content**
    - Author the initial set of Keystatic posts directly in the new CMS (starting clean per migration plan) and commit them to the repo.
    - Remove the temporary Notion export once the new entries are committed so legacy data does not linger locally.
    _Acceptance:_ All intended launch content exists in the tracked Keystatic directories (articles and case studies) and no Notion exports remain.

---

## 5. Decommission Notion

14. **Remove Notion-specific code**  
    - Delete `lib/providers/notion.ts`, `lib/notionRecordMap.ts`, `lib/utils/notion-image.ts`, `src/app/api/notion-image/route.ts`, `src/components/NotionClient.tsx`, and related utilities.  
    - Clean up references, types, and helper functions.  
    _Acceptance:_ `pnpm lint` succeeds and `rg "Notion"` returns only documentation references.

15. **Clean environment variables and docs**  
    - Remove Notion env vars from `.env*`, `env-instructions.md`, and deployment configs.  
    - Update README and `/docs` to describe Keystatic workflows instead of Notion.  
    _Acceptance:_ Documentation reviewed and merged via PR.

16. **Verify deployment pipeline**
    - Trigger a staging/preview deploy to ensure Keystatic content is bundled.
    - Confirm the admin UI works on production and edits create commits in GitHub via the configured OAuth app.
    _Acceptance:_ Successful production deploy with edited content visible and no Notion runtime logs.

---

## 6. Post-Migration Hardening

17. **Backfill tests**
    - Add integration tests to ensure each Keystatic-powered page (blog index, individual posts, singleton-driven sections) renders expected frontmatter and body content.
    - Add visual regression tests for the Keystatic-rendered pages if possible.
    _Acceptance:_ CI suite passes and guards against regressions.

18. **Monitoring and rollback**
    - Set up monitoring for the new admin route (uptime check, auth errors).
    - Document a rollback strategy (e.g., revert PR) should Keystatic encounter outages.
    _Acceptance:_ Operations runbook updated with new monitoring endpoints and rollback steps.

---

### Self-hosted GitHub OAuth reference

Use this checklist when opting for a self-hosted GitHub OAuth app instead of Keystatic Cloud’s managed auth.

1. **Create the OAuth app**
   - In the GitHub account that owns the repository, navigate to _Settings → Developer settings → OAuth Apps_ and click **New OAuth App**.
   - Set the _Homepage URL_ to the canonical production domain (e.g., `https://example.com`).
   - Set the _Authorization callback URL_ to `https://<your-domain>/keystatic/api/auth/callback/github` for production. Add `http://localhost:3000/keystatic/api/auth/callback/github` once and reuse it during local development by toggling between the domains in GitHub’s UI.

2. **Capture credentials**
   - After creation, copy the displayed _Client ID_ and generate a _Client Secret_.
   - Store both values as `KEYSTATIC_GITHUB_CLIENT_ID` and `KEYSTATIC_GITHUB_CLIENT_SECRET` locally and in Vercel (Production, Preview, and Development environments if needed).

3. **Align Keystatic config**
   - Set `storage: { kind: 'github', repo: '<owner>/<repo>', branch: 'main' }` and provide `cloud: { project: undefined }` when managing auth yourself.
   - Ensure `KEYSTATIC_SECRET` is defined in every environment; Keystatic uses it to encrypt session cookies for the GitHub OAuth flow.

4. **Test end-to-end**
   - Run `pnpm dev`, visit `http://localhost:3000/keystatic`, and authenticate with GitHub. Confirm Keystatic lists the `main` branch and accepts edits.
   - Deploy to Vercel, visit `https://<production-domain>/keystatic`, and verify that the OAuth callback completes and commits from production appear in Git history.

---

## Open Questions

1. Which GitHub account or organization should own the OAuth app (and therefore author the production commits) to align with the team’s governance expectations?
