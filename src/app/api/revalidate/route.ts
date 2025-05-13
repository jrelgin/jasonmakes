import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';

// List of allowed paths for revalidation
const ALLOWED_PATHS = ['/', '/blog', '/about'];

/**
 * Revalidation endpoint for on-demand ISR
 * Called by the cron job to refresh the homepage after data updates
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
    
    // Validate path is on our whitelist
    const path = ALLOWED_PATHS.includes(requestedPath) ? requestedPath : '/';
    if (path !== requestedPath) {
      console.warn(`Attempted to revalidate non-whitelisted path: ${requestedPath}, defaulting to /`);
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
    
    // Log success for better visibility in Vercel logs
    console.log(`Revalidated ${path} at ${new Date().toISOString()}`);
    
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
