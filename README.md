# Jason Makes

## Jason Elgin's Personal Portfolio Site

Welcome to the repository for my personal portfolio site. This project will showcase my work, articles, and case studies.


## About This Site

This site is built on:

- **Framework**: [Next.js 15](https://nextjs.org) with the App Router
- **Content**: Markdown-based content system for simple, Git-based workflow
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Deployment**: [Vercel](https://vercel.com)

## Features

- Articles/blog with Markdown content
- Case studies showcasing my work
- Responsive design
- Fast page loads with Next.js App Router
- Simple content management through Markdown files

## Future Improvements

The following improvements are planned for future development:

### 1. Enhanced Metadata and Social Sharing

- **File-based Metadata**: Implement Next.js 15's file-based metadata system for improved SEO
- **Custom OG Images**: Add dynamic Open Graph images for articles and case studies
- **Implementation Example**:
  ```
  /app
    /favicon.ico
    /opengraph-image.png  # Default OG image
    /articles
      /[slug]
        /opengraph-image.js  # Dynamic OG image generator
  ```

### 2. Performance Optimizations

- **Data Caching**: Implement `unstable_cache` for filesystem operations
- **Content Sanitization**: Add HTML sanitization for markdown content

### 3. Content Enhancements

- **Rich Media Support**: Improve embedding of videos and interactive elements
- **Tag-based Navigation**: Add filtering and navigation by content tags

## Contact

If you have any questions or would like to get in touch, feel free to reach out to me here on [GitHub](https://github.com/jrelgin).
