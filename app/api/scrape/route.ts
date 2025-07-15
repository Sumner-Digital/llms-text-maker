// API Route: Scrape Website
// This endpoint handles web scraping and content extraction

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { scrapeWebsite } from '@/lib/scraper';
import { ApiResponse, ScrapedContent } from '@/types';

// Schema for the request body
const scrapeSchema = z.object({
  url: z.string().url(),
  usePlaywright: z.boolean().optional(), // Allow forcing Playwright usage
});

/**
 * POST /api/scrape
 * Scrapes a website and returns the HTML content and metadata
 * This is like sending a robot to visit a website and take detailed notes
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { url, usePlaywright } = scrapeSchema.parse(body);
    
    console.log(`Starting scrape for: ${url}`);
    console.log(`Using Playwright: ${usePlaywright ? 'Yes' : 'Auto-detect'}`);
    
    // Call our scraper function
    // This might take a while, especially for JavaScript-heavy sites
    const scrapedContent = await scrapeWebsite(url, {
      usePlaywright,
    });
    
    // Check if we got meaningful content
    if (!scrapedContent.textContent || scrapedContent.textContent.trim().length < 100) {
      console.warn('Scraped content seems too short');
      
      // If content is too short and we haven't tried Playwright yet, retry with it
      if (!usePlaywright) {
        console.log('Retrying with Playwright due to short content');
        const retryContent = await scrapeWebsite(url, {
          usePlaywright: true,
        });
        
        if (retryContent.textContent && retryContent.textContent.trim().length > 100) {
          return NextResponse.json<ApiResponse<ScrapedContent>>({
            success: true,
            data: retryContent,
          });
        }
      }
    }
    
    // Log some statistics about what we scraped
    console.log(`Scraping complete. Stats:
      - Text content length: ${scrapedContent.textContent.length} characters
      - Meta tags found: ${Object.keys(scrapedContent.metaTags).length}
      - JSON-LD objects found: ${scrapedContent.jsonLd.length}
      - Final URL: ${scrapedContent.finalUrl}
    `);
    
    // Check for potential issues
    const warnings: string[] = [];
    
    if (scrapedContent.jsonLd.length === 0) {
      warnings.push('No structured data (JSON-LD) found. Consider adding schema.org markup.');
    }
    
    if (!scrapedContent.metaTags.description) {
      warnings.push('No meta description found. This might affect content quality.');
    }
    
    // Return the scraped content
    const response: ApiResponse<ScrapedContent> = {
      success: true,
      data: scrapedContent,
    };
    
    // Add warnings to response headers if any
    const nextResponse = NextResponse.json(response);
    
    if (warnings.length > 0) {
      nextResponse.headers.set('X-Scraping-Warnings', JSON.stringify(warnings));
    }
    
    return nextResponse;
    
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Determine the type of error and provide helpful feedback
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Invalid request data. Please provide a valid URL.',
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('timeout')) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: 'The website took too long to respond. It might be slow or blocking our access.',
          },
          { status: 408 }
        );
      }
      
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: 'Could not connect to the website. Please check the URL and try again.',
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('403') || error.message.includes('401')) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: 'The website is blocking our access. Try using your own schema data instead.',
          },
          { status: 403 }
        );
      }
    }
    
    // Generic error response
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to scrape the website. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scrape
 * Returns information about the scraping endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Scraping endpoint',
    method: 'POST',
    body: {
      url: 'string (required) - The URL to scrape',
      usePlaywright: 'boolean (optional) - Force Playwright usage',
    },
    description: 'Scrapes a website and returns HTML content, text, meta tags, and structured data.',
  });
}