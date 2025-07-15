// API Route: Validate URL
// This endpoint checks if a URL is valid and accessible

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { REGEX_PATTERNS, ERROR_MESSAGES } from '@/utils/constants';

// Define the expected request body schema using Zod
// Zod helps us validate data and provides TypeScript types automatically
const validateSchema = z.object({
  url: z.string().url().regex(REGEX_PATTERNS.URL),
});

/**
 * POST /api/validate
 * Validates that a URL is properly formatted and accessible
 * This is like a bouncer checking IDs at a club entrance
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the request body against our schema
    // This throws an error if validation fails
    const { url } = validateSchema.parse(body);
    
    // Try to create a URL object (additional validation)
    const urlObject = new URL(url);
    
    // Check if the protocol is HTTP or HTTPS
    if (!['http:', 'https:'].includes(urlObject.protocol)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only HTTP and HTTPS protocols are supported',
        },
        { status: 400 }
      );
    }
    
    // Try to fetch the URL to see if it's accessible
    // We use HEAD request which is faster than GET
    console.log(`Validating URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'LLMS-Text-Maker/1.0',
      },
      // Don't follow too many redirects
      redirect: 'follow',
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });
    
    // Check if the response is successful (2xx status code)
    if (!response.ok) {
      // Handle specific status codes with helpful messages
      if (response.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: 'Page not found. Please check the URL.',
          },
          { status: 400 }
        );
      }
      
      if (response.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error: ERROR_MESSAGES.BLOCKED_SITE,
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: `Website returned status ${response.status}`,
        },
        { status: 400 }
      );
    }
    
    // Get the final URL after redirects
    const finalUrl = response.url;
    
    // Success! The URL is valid and accessible
    return NextResponse.json({
      success: true,
      data: {
        originalUrl: url,
        finalUrl: finalUrl,
        redirected: url !== finalUrl,
      },
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    
    // Handle different types of errors
    if (error instanceof z.ZodError) {
      // Validation error from Zod
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.INVALID_URL,
        },
        { status: 400 }
      );
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Network error
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.NETWORK_ERROR,
        },
        { status: 500 }
      );
    }
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      // Timeout error
      return NextResponse.json(
        {
          success: false,
          error: ERROR_MESSAGES.TIMEOUT,
        },
        { status: 408 }
      );
    }
    
    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate URL',
      },
      { status: 500 }
    );
  }
}

// This route only accepts POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}