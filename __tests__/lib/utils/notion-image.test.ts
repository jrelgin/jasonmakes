import { describe, it, expect } from 'vitest';
import { getProxiedNotionImage, isNotionS3Url } from '../../../lib/utils/notion-image';

describe('Notion image helpers', () => {
  it('detects Notion S3 URLs', () => {
    const s3 = 'https://s3.us-west-2.amazonaws.com/example.png?X-Amz-Signature=abc';
    const other = 'https://example.com/image.png';
    expect(isNotionS3Url(s3)).toBe(true);
    expect(isNotionS3Url(other)).toBe(false);
  });

  it('proxies S3 URLs and leaves others intact', () => {
    const s3 = 'https://s3.amazonaws.com/img.png?X-Amz-Signature=abc';
    const other = 'https://example.com/img.png';
    expect(getProxiedNotionImage(s3)).toBe(`/api/notion-image?url=${encodeURIComponent(s3)}`);
    expect(getProxiedNotionImage(other)).toBe(other);
  });

  it('returns null when url is empty', () => {
    expect(getProxiedNotionImage(null)).toBeNull();
    expect(getProxiedNotionImage(undefined)).toBeNull();
  });
});
