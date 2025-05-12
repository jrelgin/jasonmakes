# Jason Makes

## Jason Elgin's Personal Portfolio Site

Welcome to the repository for my personal portfolio site at [jasonmakes.com](https://jasonmakes.co). This project showcases my work, articles, and case studies in design and development.

I'm a designer and developer with over 15 years of experience creating beautiful, usable, and accessible web applications. This site serves as both my portfolio and a platform to share my thoughts on design, development, and technology.

## About This Site

This site is built on:

- **Framework**: [Next.js 15.3.2](https://nextjs.org) with the App Router
- **React**: [React 19.0.0](https://react.dev)
- **Content**: Markdown-based content system using gray-matter and remark
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **Deployment**: [Vercel](https://vercel.com)

## Features

- Dynamic articles with Markdown content and frontmatter
- Case studies showcasing work with detailed project information
- Responsive design with modern UI
- Fast page loads with Next.js App Router and static generation
- Image optimization with Next.js Image component
- SEO optimization with metadata generation
- Content tagging system

## Project Structure

```
/content         # Markdown files for articles and case studies
/lib            # Utility functions for content processing
/public         # Static assets
/src
  /app          # Next.js App Router structure
    /articles   # Article pages with dynamic routing
    /case-studies # Case study pages with dynamic routing
  /components   # Reusable React components
  /lib          # Client-side utility functions
```

## Development

This project uses PNPM as the package manager and Turbopack in development mode for faster refresh times and improved developer experience.

```bash
# Install dependencies
pnpm install

# Start development server with Turbopack
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Content Management

Content is managed through Markdown files in the `/content` directory:

- Each Markdown file includes frontmatter for metadata (title, date, tags, etc.)
- Articles have `type: article` in frontmatter
- Case studies have `type: case-study` in frontmatter
- Add images to `/public/images` and reference them in content

## Future Improvements

The following improvements are planned for future development:

### 1. Enhanced Metadata and Social Sharing

- **Custom OG Images**: Add dynamic Open Graph images for articles and case studies
- **Social Media Preview**: Improve sharing cards for Twitter, LinkedIn, etc.

### 2. Performance Optimizations

- **Data Caching**: Implement `unstable_cache` for filesystem operations
- **Content Sanitization**: Add HTML sanitization for markdown content

### 3. Content Enhancements

- **Rich Media Support**: Improve embedding of videos and interactive elements
- **Advanced Tag System**: Add filtering and navigation by content tags
- **Search Functionality**: Add site-wide search for content

## Git Workflow

This project follows a structured Git workflow:

- `main`: Production-ready code
- `feature/*`: New features (e.g., `feature/add-dashboard`)
- `fix/*`: Bug fixes (e.g., `fix/navbar-styling`)

## Contact

If you have any questions or would like to get in touch, feel free to reach out to me here on [GitHub](https://github.com/jrelgin).
