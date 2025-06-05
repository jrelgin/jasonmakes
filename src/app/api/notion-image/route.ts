import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Use Edge Runtime for better performance

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  
  if (!imageUrl) {
    return new NextResponse('Missing URL parameter', { status: 400 });
  }

  try {
    // Fetch the image from Notion's S3
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      // If the signed URL expired, we could implement fallback logic here
      return new NextResponse('Failed to fetch image', { status: imageResponse.status });
    }
    
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Return the image with cache headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'CDN-Cache-Control': 'max-age=31536000', // Vercel Edge Cache
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
