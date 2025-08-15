import { NextRequest, NextResponse } from 'next/server';
import { put, head } from '@vercel/blob';
import { createHash } from 'crypto';

export const runtime = 'nodejs'; // Use Node.js runtime for better compatibility with image proxying

// Generate a stable key for blob storage based on image URL
function generateImageKey(imageUrl: string): string {
  // Extract meaningful parts from the Notion S3 URL
  const urlParts = new URL(imageUrl);
  const pathname = urlParts.pathname;
  
  // Extract the actual file ID (the second UUID in the path)
  // Pattern: /workspace-id/file-id/filename
  const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
  
  if (pathSegments.length >= 2) {
    // Use the second UUID (the actual file ID) + filename
    const fileId = pathSegments[1];
    const filename = pathSegments[pathSegments.length - 1];
    const extension = filename.split('.').pop() || 'jpg';
    
    return `notion-images/${fileId}.${extension}`;
  }
  
  // Fallback: use hash of the full URL
  const urlHash = createHash('md5').update(imageUrl).digest('hex');
  const extension = pathname.split('.').pop()?.split('?')[0] || 'jpg';
  
  return `notion-images/${urlHash}.${extension}`;
}

// Check if image exists in blob storage
async function getExistingImage(blobKey: string) {
  try {
    const blobInfo = await head(blobKey);
    return blobInfo;
  } catch (error) {
    // Image doesn't exist in blob storage
    return null;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  
  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  // Only process Notion S3 URLs - pass through other URLs unchanged
  if (!imageUrl.includes('amazonaws.com') || !imageUrl.includes('X-Amz-')) {
    try {
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (error) {
      console.error('Error fetching non-Notion image:', error);
      return new NextResponse('Error fetching image', { status: 500 });
    }
  }

  const blobKey = generateImageKey(imageUrl);

  try {
    // Check if image already exists in blob storage
    const existingBlob = await getExistingImage(blobKey);
    
    if (existingBlob) {
      // Serve from blob storage
      const blobResponse = await fetch(existingBlob.url);
      const buffer = await blobResponse.arrayBuffer();
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': existingBlob.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'CDN-Cache-Control': 'max-age=31536000',
          'X-Image-Source': 'blob-storage',
        },
      });
    }

    // Image not in blob storage, fetch from Notion and store
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
    
    if (!imageResponse.ok) {
      console.error(`Failed to fetch image from Notion: ${imageResponse.status} ${imageResponse.statusText}`);
      return new NextResponse('Failed to fetch image', { status: imageResponse.status });
    }
    
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Store in blob storage
    try {
      const blob = await put(blobKey, imageBuffer, {
        contentType,
        access: 'public',
      });
      
      console.log(`Stored image in blob storage: ${blobKey} -> ${blob.url}`);
    } catch (blobError) {
      console.error('Failed to store image in blob storage:', blobError);
      // Continue serving the image even if blob storage fails
    }
    
    // Return the image
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'max-age=31536000',
        'X-Image-Source': 'notion-fresh',
      },
    });
  } catch (error) {
    console.error('Error in image proxy:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
