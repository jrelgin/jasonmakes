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

### Phase 1: Remove Outstatic Dependencies and Files
1. **Remove package dependencies**
   - Run `pnpm uninstall outstatic`
   - Remove any other Outstatic-related dependencies

2. **Remove Outstatic directories and files**
   - Delete `/outstatic` directory and all contents
   - Delete `/src/app/(cms)` directory and all contents
   - Delete `/src/app/api/outstatic` directory and all contents

3. **Clean up environment variables**
   - Remove Outstatic-related environment variables from `.env.local`
   - Remove references to these variables in the codebase

4. **Extract and save any valuable content**
   - Move any created content from `/outstatic/content` to be migrated
   - Save any images or media files for reuse

### Phase 2: Set Up Markdown-Based Content Structure
1. **Create content directories**
   - Create `/content/articles` directory for article markdown files
   - Create `/content/case-studies` directory for case study markdown files

2. **Install minimal dependencies**
   - `pnpm install gray-matter remark remark-html`
   - These will handle markdown parsing and frontmatter extraction

3. **Create utility functions**
   - Create `/lib/content.js` with functions to:
     - Fetch all articles/case studies
     - Get individual content by slug
     - Filter content by tags
     - Convert markdown to HTML

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
