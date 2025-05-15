# Environment Variable Instructions

## Add to your local .env.local or .env.development.local:

```bash
# Cron Secret for secure API access
CRON_SECRET=your-local-development-secret
```

## Add to your Vercel project environment variables:

1. Go to your Vercel dashboard
2. Select the project
3. Navigate to "Settings" > "Environment Variables"
4. Add the following variable:
   - Name: `CRON_SECRET`
   - Value: `[generate a secure random string]`
   - Environment: Production (or all environments as needed)

## Testing locally:

To test your cron job locally, use this curl command:

```bash
curl -X POST "http://localhost:3000/api/cron/update-profile?secret=your-local-development-secret"
```

Or add this to your package.json for convenience:

```json
"scripts": {
  "trigger-cron": "curl -X POST \"http://localhost:3000/api/cron/update-profile?secret=$CRON_SECRET\""
}
```

Then run with:
```bash
npm run trigger-cron
```
