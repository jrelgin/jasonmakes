# Environment Variable Instructions

## Add to your local .env.local or .env.development.local:

```bash
# Cron Secret for secure API access
CRON_SECRET=your-local-development-secret

# Readwise Reader latest reads
READWISE_ACCESS_TOKEN=your-readwise-access-token
READWISE_POST_TAG=jasonmakes

# Keystatic GitHub OAuth (populate once the OAuth app exists)
KEYSTATIC_GITHUB_CLIENT_ID=your-github-oauth-client-id
KEYSTATIC_GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
KEYSTATIC_SECRET=generate-a-long-random-string
NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=your-keystatic-github-app-slug
```

## Add to your Vercel project environment variables:

1. Go to your Vercel dashboard
2. Select the project
3. Navigate to "Settings" > "Environment Variables"
4. Add the following variables:
- Name: `CRON_SECRET`
  - Value: `[generate a secure random string]`
  - Environment: Production (or all environments as needed)
- Name: `READWISE_ACCESS_TOKEN`
  - Value: `[Readwise API access token]`
  - Environment: Development, Preview, Production
- Name: `READWISE_POST_TAG`
  - Value: `jasonmakes`
  - Environment: Development, Preview, Production
- Name: `KEYSTATIC_GITHUB_CLIENT_ID`
  - Value: `[GitHub OAuth app client ID]`
  - Environment: Development, Preview, Production
- Name: `KEYSTATIC_GITHUB_CLIENT_SECRET`
  - Value: `[GitHub OAuth app client secret]`
  - Environment: Development, Preview, Production
- Name: `KEYSTATIC_SECRET`
  - Value: `[long random string used to sign Keystatic sessions]`
  - Environment: Development, Preview, Production
- Name: `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`
  - Value: `[slug GitHub assigns to the OAuth app]`
  - Environment: Development, Preview, Production

## Testing locally:

To test your cron job locally, use this curl command:

```bash
curl -H "Authorization: Bearer your-local-development-secret" "http://localhost:3000/api/cron/update-profile"
```

Or add this to your package.json for convenience:

```json
"scripts": {
  "trigger-cron": "curl -H \"Authorization: Bearer $CRON_SECRET\" \"http://localhost:3000/api/cron/update-profile\""
}
```

Then run with:
```bash
pnpm trigger-cron
```
