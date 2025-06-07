/**
 * Transform a Notion S3 image URL to use our proxy
 * This prevents 403 errors from expired signed URLs
 */
export function getProxiedNotionImage(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Only proxy Notion S3 URLs
  if (url.includes('amazonaws.com') && url.includes('X-Amz-')) {
    return `/api/notion-image?url=${encodeURIComponent(url)}`;
  }

  // Return original URL for non-S3 images
  return url;
}

/**
 * Check if a URL is a Notion S3 URL that might expire
 */
export function isNotionS3Url(url: string): boolean {
  return url.includes('amazonaws.com') && url.includes('X-Amz-');
}
