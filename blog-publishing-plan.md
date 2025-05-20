# Implementation Plan — iA Writer → Micropub → GitHub → Vercel Blob

## High-level Workflow

1. Draft in iA Writer (Blog Drafts folder).
2. Publish via Micropub.
   - iA Writer uploads images to `/api/micropub/media` (stored in Vercel Blob).
   - Sends metadata (content, images URLs, alt text) to `/api/micropub`.
3. Micropub API handler:
   - Creates markdown (.md) files in the `/content` directory.
   - Commits markdown content to GitHub.
   - Triggers Vercel deployment.
4. Next.js build publishes content and images.

---

## Vercel Dashboard Setup

1. Create Vercel Blob:
   - Dashboard → Storage → Blob.
   - Save your Blob token.
2. Environment Variables (Project → Settings → Environment):

```
VERCEL_BLOB_TOKEN=your_blob_token
GH_TOKEN=your_github_token
VERCEL_DEPLOY_HOOK_URL=your_deploy_hook
```

3. next.config.js (enable images from Blob):

```javascript
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'blob.vercel-storage.com' },
    ],
  },
};
```

---

## GitHub Setup

- Repo structure:

```
content/example-post.md
```

---

## iA Writer Setup

- Library Locations:
  1. Notes (default)
  2. Blog Drafts (new location; no Git repo required)
- Frontmatter template (_frontmatter.md):

```markdown
---
title: "{{title}}"
date: {{date}}
type: "article"  # Can be "article" or "case-study"
excerpt: ""
coverImage: ""  # Will be auto-extracted from first image in content
tags: []
---
```

- Insert template with: `/_frontmatter ⌘↩︎`.
- Micropub Account:
  - Endpoint: `https://yourdomain.com/api/micropub`
  - Token via IndieAuth.

### Authoring notes:
- **First image** in document will be automatically extracted and used as cover image
- Add descriptive alt text to all images: `![Alt description](image.jpg)`
- Set **type** to "article" or "case-study" to control where content appears
- **Filename** will be used as the slug for URLs (no need for slug in frontmatter)
- Images uploaded via iA Writer will be stored in Vercel Blob automatically

---

## Next.js API Routes

### /api/micropub/media.ts

```typescript
import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'node:fs/promises';

export const config = { api: { bodyParser: false } };

export default async (req, res) => {
  const form = formidable();
  const [, files] = await form.parse(req);
  const file = files.file[0];
  const data = await fs.readFile(file.filepath);

  const { url } = await put(`blog/${file.newFilename}`, data, {
    access: 'public',
    token: process.env.VERCEL_BLOB_TOKEN
  });

  res.setHeader('Location', url).status(201).end();
};
```

### /api/micropub/index.ts

```typescript
import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';
import slugify from 'slugify';
import { parseMicropub } from 'micropub-parser';

export default async (req, res) => {
  const props = parseMicropub(req);
  
  // Generate filename/slug from title
  const filename = slugify(props.name, { lower: true });
  
  // Determine content type (default to article if not specified)
  const contentType = props['mp-content-type'] ? props['mp-content-type'][0] : 'article';
  
  // Extract the first image URL from content if present
  const content = props.content.value;
  const firstImageMatch = content.match(/!\[([^\]]*)\]\(([^\)]*)\)/);
  const coverImage = firstImageMatch ? firstImageMatch[2] : '';
  
  // Create frontmatter with extracted cover image
  const mdContent = matter.stringify(content, {
    title: props.name,
    date: new Date().toISOString(),
    type: contentType === 'case-study' ? 'case-study' : 'article',
    excerpt: content.substring(0, 160) + '...',
    coverImage,
    tags: props.category || [],
  });

  const octokit = new Octokit({ auth: process.env.GH_TOKEN });

  await octokit.repos.createOrUpdateFileContents({
    owner: 'jrelgin',
    repo: 'jasonmakes',
    path: `content/${filename}.md`,
    message: `post: ${props.name}`,
    content: Buffer.from(mdContent).toString('base64'),
  });

  await fetch(process.env.VERCEL_DEPLOY_HOOK_URL);

  res.status(201).end();
};
```

---

## Next.js Post Component Example (Post.tsx)

```typescript
import Image from 'next/image';
import { useMemo } from 'react';

// Function to extract the first image from markdown content
function extractFirstImage(content) {
  // Match pattern for markdown image: ![alt text](url)
  const imageMatch = content.match(/!\[([^\]]*)\]\(([^\)]*)\)/);
  if (imageMatch && imageMatch.length >= 3) {
    return {
      url: imageMatch[2],
      alt: imageMatch[1] || ''
    };
  }
  return null;
}

export default function Post({ frontMatter, content, children }) {
  // Extract the first image from content
  const featuredImage = useMemo(() => extractFirstImage(content), [content]);
  
  // Remove the first image from the rendered content if it exists
  const contentWithoutFirstImage = useMemo(() => {
    if (featuredImage) {
      // Replace the first image occurrence with empty string
      return content.replace(/!\[[^\]]*\]\([^\)]*\)/, '');
    }
    return content;
  }, [content, featuredImage]);
  
  return (
    <>
      {featuredImage && (
        <Image
          src={featuredImage.url}
          alt={featuredImage.alt || frontMatter.title}
          width={1200}
          height={600}
          priority
        />
      )}
      <article>{children}</article>
    </>
  );
}
```

---

## Optional: Captions & Galleries

- Extract captions from markdown content using the format:
  ```markdown
  ![Coffee cup on desk](blob_url/image.jpg)
  *Photo by Jason Elgin*
  ```

- Process images and captions together when rendering content.
- For galleries, consider using a special delimiter or syntax in the markdown to group images.

---

## Critical Requirements

### Authentication Security

1. **Strong Secret Generation**:
   - Create a strong, randomly generated `MICROPUB_SECRET` (32+ characters)
   - Use a secure generation method: `openssl rand -hex 16` or similar
   - Store this in Vercel environment variables

2. **Enhanced Auth Validation**:
   ```typescript
   // Example of improved auth validation
   function validateAuth(request: Request): boolean {
     const authHeader = request.headers.get('authorization');
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return false;
     }
     
     // Use constant-time comparison to prevent timing attacks
     const token = authHeader.split(' ')[1];
     const secret = process.env.MICROPUB_SECRET || '';
     
     // Compare in constant time to avoid timing attacks
     if (token.length !== secret.length) return false;
     
     let match = 0;
     for (let i = 0; i < token.length; i++) {
       match |= token.charCodeAt(i) ^ secret.charCodeAt(i);
     }
     
     return match === 0;
   }
   ```

3. **Rate Limiting**:
   - Add basic rate limiting to prevent brute force attempts
   - Consider using a package like `@vercel/edge-rate-limit` or similar

### Robust Error Handling

1. **Input Validation**:
   ```typescript
   function validateMicropubRequest(payload: any): { valid: boolean; error?: string } {
     if (!payload || typeof payload !== 'object') {
       return { valid: false, error: 'Invalid payload format' };
     }
     
     if (!payload.properties) {
       return { valid: false, error: 'Missing required properties object' };
     }
     
     if (!payload.properties.name?.[0]) {
       return { valid: false, error: 'Missing required title' };
     }
     
     if (!payload.properties.content?.[0]) {
       return { valid: false, error: 'Missing required content' };
     }
     
     return { valid: true };
   }
   ```

2. **Graceful Error Handling and Logging**:
   ```typescript
   try {
     // API operations
   } catch (error) {
     console.error('Detailed error information:', {
       message: error.message,
       stack: error.stack,
       context: 'Micropub API',
       timestamp: new Date().toISOString()
     });
     
     // Return appropriate error to client
     return NextResponse.json(
       { error: 'An error occurred during content processing' },
       { status: 500 }
     );
   }
   ```

3. **GitHub API Resilience**:
   - Implement retries for transient GitHub API failures
   - Verify commit success before triggering deployment

---

## Implementation Details

### Slug Handling

- Slugs will be generated from the filename only
- The Micropub API will create files with slugified titles as filenames
- No slug field will be included in frontmatter
- The existing content.js loader already extracts slugs from filenames

### Cover Image Workflow

1. Author adds images to content using standard markdown syntax
2. Micropub API extracts the first image URL automatically
3. API adds this URL to frontmatter as `coverImage`
4. No change to rendering components needed - they already use `coverImage`
5. First image remains visible in the content (not removed)

### Expected Content Storage Structure

```
/content/
  my-first-article.md        <- type: article
  awesome-case-study.md      <- type: case-study
```

---

## Optional: Slack Notifications

- Vercel dashboard → Integrations → Slack.
- Sends "Deployment Ready" alerts to Slack after publishing.

---

## Publishing Steps (day-to-day)

1. New article: ⌘N in iA Writer.
2. Insert frontmatter: `/_frontmatter ⌘↩︎`.
3. Write your post; drag images directly into the document.
4. Set `draft: false` when ready.
5. Hit Publish → Micropub.

Your post is live automatically—no manual commits, uploads, or deploys needed.

---

✅ Done!