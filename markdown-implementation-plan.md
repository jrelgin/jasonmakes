# Markdown Implementation Plan

## Overview
This document outlines our plan to remove Outstatic CMS from our Next.js project and replace it with a simpler markdown-based content management approach. We will follow a step-by-step approach to ensure a clean transition.

## Current Status (May 9, 2025)
- We've decided to move away from Outstatic due to integration challenges and complexity
- We're transitioning to a simpler markdown-based approach
- We need to remove all Outstatic-related code and dependencies

## Project Requirements
- Homepage
- Articles section
- Case studies section
- One additional page
- Simple, maintainable content management using markdown files

## Implementation Steps

## Current Progress (May 9, 2025)
- ✅ Phase 1: Removal of Outstatic (Steps 1-4 completed)
- ⬜ Phase 2: Setup Markdown Structure (Not started)
- ⬜ Phase 3: Implement Content Pages (Not started)
- ⬜ Phase 4: Testing and Finalization (Not started)

### Phase 1: Remove Outstatic Dependencies and Files ✅
1. **Remove package dependencies** ✅
   - ✅ Ran `pnpm uninstall outstatic`
   - ✅ Verified no other Outstatic-related dependencies

2. **Remove Outstatic directories and files** ✅
   - ✅ Deleted `/outstatic` directory and all contents
   - ✅ Deleted `/src/app/(cms)` directory and all contents
   - ✅ Deleted `/src/app/api/outstatic` directory and all contents
   - ✅ Removed `/src/app/articles/page.tsx` that depended on Outstatic

3. **Clean up environment variables** ✅
   - ✅ Removed `.env.local` file containing Outstatic-related variables
   - ✅ No other environment variable references found in codebase

4. **Extract and save any valuable content** ✅
   - ✅ Skipped as content was dummy/sample content

### Phase 2: Set Up Markdown-Based Content Structure
1. **Create content directory**
   - Create a single `/content` directory for all markdown files
   - Use frontmatter to distinguish between content types (e.g., `type: "article"` or `type: "case-study"`)

2. **Define frontmatter structure**
   - Title: Post title
   - Date: Publication date
   - Type: "article" or "case-study" to distinguish content types
   - Excerpt: Brief summary
   - CoverImage: Featured image path
   - Tags: Array of relevant tags
   - Slug: URL-friendly identifier (optional, can be generated from filename)

3. **Install minimal dependencies**
   - `pnpm install gray-matter remark remark-html`
   - These will handle markdown parsing and frontmatter extraction

4. **Create utility functions**
   - Create `/lib/content.js` with functions to:
     - `getAllContent()`: Fetch all content items
     - `getContentBySlug()`: Get individual content by slug
     - `getArticles()`: Filter content where type is "article"
     - `getCaseStudies()`: Filter content where type is "case-study"
     - `convertMarkdownToHtml()`: Parse and render markdown content

### Phase 3: Implement Content Pages
1. **Create article listing page**
   - Implement `/app/articles/page.tsx`
   - Display grid of articles with images, titles, and excerpts

2. **Create case study listing page**
   - Implement `/app/case-studies/page.tsx`
   - Display case studies in appropriate format

3. **Implement dynamic content pages**
   - Create `/app/articles/[slug]/page.tsx` for individual articles
   - Create `/app/case-studies/[slug]/page.tsx` for individual case studies

4. **Update site navigation**
   - Ensure navigation includes links to the new content sections

### Phase 4: Testing and Finalization
1. **Create sample content**
   - Add sample markdown files for testing
   - Include variety of content formats and metadata

2. **Test all pages and functionality**
   - Ensure content displays correctly
   - Verify routing works properly
   - Check responsive design

3. **Final clean-up**
   - Remove any remaining Outstatic references in code
   - Ensure clean project structure

## Timeline
- Removal of Outstatic: 15 minutes
- Setting up markdown structure: 15 minutes
- Implementing content pages: 30 minutes
- Testing and finalizing: 15 minutes

## Benefits of New Approach
- Simpler, more maintainable codebase
- No external CMS dependencies
- Direct control over content via markdown files
- Easy workflow: write in Bear, export as markdown, place in content directory
- Version control for all content through Git

## Git Workflow
Following our established Git workflow:
1. Always branch from latest `main`
2. Use descriptive branch names with `feature/` prefix
3. Commit frequently with clear messages
4. Push regularly to remote
5. Create PR for review when complete
6. Delete branch after merging

## Testing Checkpoints
After each step, we will:
1. Verify functionality works as expected
2. Check for any errors or warnings
3. Confirm changes don't break existing code
4. Only proceed to next step after successful testing
