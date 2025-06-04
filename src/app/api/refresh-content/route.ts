import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';

// List of allowed paths for content refreshing
const ALLOWED_PATHS = [
  '/',                 // Homepage
  '/articles',          // Articles listing
  '/case-studies',      // Case studies listing
  // Dynamic path patterns are handled with path.startsWith()
];

/**
 * Content refresh endpoint for on-demand ISR (Incremental Static Regeneration)
 * Can be called by webhooks or manually to refresh content after updates in CMS
 */
export async function POST(request: NextRequest) {
  try {
    // Check for internal cron header to throttle spam attempts
    const isInternalCron = request.headers.get('x-internal-cron') === 'true';
    if (!isInternalCron && process.env.NODE_ENV === 'production') {
      console.warn('Revalidation attempt without internal cron header');
      // Still continue processing but log the suspicious attempt
    }
    
    // Get the path to revalidate from query params
    const requestedPath = request.nextUrl.searchParams.get('path') || '/';
    
    // Validate path is on our whitelist or matches dynamic patterns
    let path = '/';
    
    // Check if it's an exact match to allowed paths
    if (ALLOWED_PATHS.includes(requestedPath)) {
      path = requestedPath;
    }
    // Check for article dynamic routes
    else if (requestedPath.startsWith('/articles/')) {
      path = requestedPath;
    }
    // Check for case study dynamic routes
    else if (requestedPath.startsWith('/case-studies/')) {
      path = requestedPath;
    }
    // If no matches, log warning and default to homepage
    else {
      console.warn(`Attempted to refresh non-whitelisted path: ${requestedPath}, defaulting to /`);
    }
    
    // Get and validate the secret token
    const secret = request.nextUrl.searchParams.get('secret');
    const expectedSecret = process.env.REVALIDATION_TOKEN;
    
    // If no secret is provided or it doesn't match, return 401
    if (!secret || secret !== expectedSecret) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid revalidation token' 
        },
        { status: 401 }
      );
    }
    
    // Revalidate the path
    revalidatePath(path);
    
    // Return success
    return NextResponse.json({
      success: true,
      message: `Revalidated path: ${path}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Return error
    return NextResponse.json(
      {
        success: false,
        message: 'Error revalidating',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Handle GET requests with a 405 Method Not Allowed response
 * This prevents crawlers from getting 500 errors
 */
export async function GET() {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Method not allowed. Use POST for revalidation.' 
    },
    { status: 405 }
  );
}

/**
 * Required for Next.js App Router to allow passing params in the URL
 */
export const dynamic = 'force-dynamic';
