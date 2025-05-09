import fs from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

// Define the content directory path
const contentDirectory = join(process.cwd(), 'content');

/**
 * Get all content files from the content directory
 * @returns {Array} Array of content items with frontmatter and slug
 */
export function getAllContent() {
  // Get all files from the content directory
  const filenames = fs.readdirSync(contentDirectory);
  const allContent = filenames
    .filter(filename => filename.endsWith('.md'))
    .map(filename => {
      // Remove ".md" from filename to get the slug
      const slug = filename.replace(/\.md$/, '');
      
      // Read file content
      const fullPath = join(contentDirectory, filename);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      
      // Parse frontmatter
      const { data, content } = matter(fileContents);
      
      // Return content with frontmatter and slug
      return {
        ...data,
        slug,
        content
      };
    });

  // Sort by date (newest first)
  return allContent.sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });
}

/**
 * Get content by slug
 * @param {string} slug - The slug of the content to retrieve
 * @returns {Object} Content item with frontmatter and content
 */
export function getContentBySlug(slug) {
  const fullPath = join(contentDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  
  // Parse frontmatter
  const { data, content } = matter(fileContents);
  
  // Return content with frontmatter and slug
  return {
    ...data,
    slug,
    content
  };
}

/**
 * Get all articles
 * @returns {Array} Array of articles
 */
export function getArticles() {
  const allContent = getAllContent();
  return allContent.filter(item => item.type === 'article');
}

/**
 * Get all case studies
 * @returns {Array} Array of case studies
 */
export function getCaseStudies() {
  const allContent = getAllContent();
  return allContent.filter(item => item.type === 'case-study');
}

/**
 * Convert markdown content to HTML
 * @param {string} markdown - Markdown content to convert
 * @returns {string} HTML content
 */
export async function convertMarkdownToHtml(markdown) {
  const result = await remark()
    .use(html)
    .process(markdown);
    
  return result.toString();
}
