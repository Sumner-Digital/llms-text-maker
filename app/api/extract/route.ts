// API Route: Extract Data
// This endpoint processes scraped content to extract structured business information

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractData } from '@/lib/extractor';
import { ApiResponse, ExtractedData, ScrapedContent } from '@/types';

// Schema for the request body
// We expect to receive the scraped content from the previous step
const extractSchema = z.object({
  scrapedContent: z.object({
    html: z.string(),
    textContent: z.string(),
    metaTags: z.record(z.string()),
    jsonLd: z.array(z.any()),
    finalUrl: z.string().url(),
  }),
});

/**
 * POST /api/extract
 * Extracts structured business information from scraped content
 * This is like a detective analyzing clues to build a complete picture
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { scrapedContent } = extractSchema.parse(body);
    
    console.log(`Starting extraction for: ${scrapedContent.finalUrl}`);
    
    // Call our extraction function
    // This analyzes the scraped content and extracts structured data
    const extractedData = await extractData(scrapedContent as ScrapedContent);
    
    // Log extraction results for debugging
    console.log(`Extraction complete. Found:
      - Company Name: ${extractedData.companyName || 'Not found'}
      - Business Type: ${extractedData.businessType}
      - Services: ${extractedData.services.length} items
      - Products: ${extractedData.products.length} items
      - Contact Email: ${extractedData.contactInfo.email || 'Not found'}
      - Team Members: ${extractedData.teamInfo.length} people
    `);
    
    // Validate extraction quality
    const qualityIssues: string[] = [];
    
    if (!extractedData.companyName || extractedData.companyName === 'Company Name') {
      qualityIssues.push('Could not determine company name');
    }
    
    if (!extractedData.description || extractedData.description === 'No description available.') {
      qualityIssues.push('No company description found');
    }
    
    if (extractedData.services.length === 0 && extractedData.products.length === 0) {
      qualityIssues.push('No services or products identified');
    }
    
    if (!extractedData.contactInfo.email && !extractedData.contactInfo.phone) {
      qualityIssues.push('No contact information found');
    }
    
    // Calculate a quality score (0-100)
    const qualityScore = calculateQualityScore(extractedData);
    
    // Add quality metadata to the response
    const enrichedData: ExtractedData & { qualityScore: number } = {
      ...extractedData,
      qualityScore,
    };
    
    // Return the extracted data
    const response: ApiResponse<typeof enrichedData> = {
      success: true,
      data: enrichedData,
    };
    
    const nextResponse = NextResponse.json(response);
    
    // Add quality information to headers
    if (qualityIssues.length > 0) {
      nextResponse.headers.set('X-Extraction-Issues', JSON.stringify(qualityIssues));
    }
    nextResponse.headers.set('X-Quality-Score', qualityScore.toString());
    
    return nextResponse;
    
  } catch (error) {
    console.error('Extraction error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Invalid scraped content format. Please ensure the scraping step completed successfully.',
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      // Log the full error for debugging
      console.error('Extraction error details:', error.message);
      
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: `Failed to extract data: ${error.message}`,
        },
        { status: 500 }
      );
    }
    
    // Generic error response
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to extract data from the website content.',
      },
      { status: 500 }
    );
  }
}

/**
 * Calculates a quality score for the extracted data
 * This helps us understand how complete and useful the extraction was
 */
function calculateQualityScore(data: ExtractedData): number {
  let score = 0;
  const maxScore = 100;
  
  // Company identification (20 points)
  if (data.companyName && data.companyName !== 'Company Name') {
    score += 10;
  }
  if (data.description && data.description !== 'No description available.') {
    score += 10;
  }
  
  // Services and products (20 points)
  if (data.services.length > 0) {
    score += Math.min(10, data.services.length * 2);
  }
  if (data.products.length > 0) {
    score += Math.min(10, data.products.length * 2);
  }
  
  // Contact information (20 points)
  if (data.contactInfo.email) score += 10;
  if (data.contactInfo.phone) score += 5;
  if (data.contactInfo.address) score += 5;
  
  // Additional information (20 points)
  if (data.mission) score += 5;
  if (data.teamInfo.length > 0) score += 5;
  if (data.apiDocs) score += 5;
  if (data.contactInfo.socialMedia && Object.keys(data.contactInfo.socialMedia).length > 0) {
    score += 5;
  }
  
  // Schema data bonus (20 points)
  if (data.schemaData && data.schemaData.length > 0) {
    score += 20;
  }
  
  // Ensure score doesn't exceed maximum
  return Math.min(score, maxScore);
}

/**
 * GET /api/extract
 * Returns information about the extraction endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Data extraction endpoint',
    method: 'POST',
    body: {
      scrapedContent: {
        html: 'string - Raw HTML content',
        textContent: 'string - Visible text content',
        metaTags: 'object - Meta tag key-value pairs',
        jsonLd: 'array - JSON-LD structured data objects',
        finalUrl: 'string - Final URL after redirects',
      },
    },
    description: 'Extracts structured business information from scraped website content.',
    returns: 'Structured data including company info, services, products, contact details, and more.',
  });
}