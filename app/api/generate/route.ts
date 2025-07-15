// API Route: Generate LLMS.txt
// This endpoint uses AI to create the final LLMS.txt file

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateLLMSText, validateGeneratedContent } from '@/lib/generator';
import { ApiResponse, ExtractedData, GeneratedContent } from '@/types';
import { ERROR_MESSAGES } from '@/utils/constants';

// Schema for the request body
const generateSchema = z.object({
  extractedData: z.object({
    companyName: z.string().optional(),
    tagline: z.string().optional(),
    description: z.string().optional(),
    services: z.array(z.string()),
    products: z.array(z.string()),
    contactInfo: z.object({
      email: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      socialMedia: z.record(z.string()).optional(),
    }),
    mission: z.string().optional(),
    teamInfo: z.array(z.string()),
    apiDocs: z.string().optional(),
    schemaData: z.any().optional(),
    businessType: z.enum(['catalog', 'specialist', 'ecosystem']).optional(),
  }),
  sourceUrl: z.string().url(),
  qualityScore: z.number().optional(),
});

/**
 * POST /api/generate
 * Generates the final LLMS.txt file using AI
 * This is the culmination of our entire process - where AI magic happens
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate the request body
    const body = await request.json();
    const { extractedData, sourceUrl, qualityScore } = generateSchema.parse(body);
    
    console.log(`Starting generation for: ${sourceUrl}`);
    console.log(`Business type: ${extractedData.businessType}`);
    console.log(`Quality score: ${qualityScore || 'Not provided'}`);
    
    // Check if we have enough data to generate meaningful content
    if (qualityScore && qualityScore < 20) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Insufficient data extracted from the website. The generated file would be too sparse. Please ensure the website has adequate content and structure.',
        },
        { status: 400 }
      );
    }
    
    // Check if API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not configured');
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'AI service is not configured. Please contact the administrator.',
        },
        { status: 500 }
      );
    }
    
    // Generate the LLMS.txt content
    console.log('Calling AI to generate LLMS.txt...');
    const startTime = Date.now();
    
    const generatedContent = await generateLLMSText(
      extractedData as ExtractedData,
      sourceUrl
    );
    
    const generationTime = Date.now() - startTime;
    console.log(`Generation completed in ${generationTime}ms`);
    
    // Validate the generated content
    if (!validateGeneratedContent(generatedContent.content)) {
      console.error('Generated content failed validation');
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Generated content did not meet quality standards. Please try again.',
        },
        { status: 500 }
      );
    }
    
    // Calculate some statistics about the generated content
    const stats = {
      generationTime,
      characterCount: generatedContent.content.length,
      lineCount: generatedContent.content.split('\n').length,
      sectionCount: (generatedContent.content.match(/^##\s/gm) || []).length,
    };
    
    console.log(`Generation stats:
      - Time: ${stats.generationTime}ms
      - Characters: ${stats.characterCount}
      - Lines: ${stats.lineCount}
      - Sections: ${stats.sectionCount}
      - Words: ${generatedContent.metadata.wordCount}
    `);
    
    // Success! Return the generated content
    const response: ApiResponse<GeneratedContent> = {
      success: true,
      data: generatedContent,
    };
    
    const nextResponse = NextResponse.json(response);
    
    // Add generation statistics to headers
    nextResponse.headers.set('X-Generation-Time', stats.generationTime.toString());
    nextResponse.headers.set('X-Content-Stats', JSON.stringify(stats));
    
    return nextResponse;
    
  } catch (error) {
    console.error('Generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: 'Invalid data format. Please ensure the extraction step completed successfully.',
        },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('API key')) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
          error: 'AI service authentication failed. Please check the API configuration.',
          },
          { status: 401 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: 'AI service rate limit reached. Please try again in a few moments.',
          },
          { status: 429 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: 'AI service took too long to respond. Please try again.',
          },
          { status: 504 }
        );
      }
      
      if (error.message.includes('exceeds maximum file size')) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error: 'Generated content is too large. This might happen with very complex websites.',
          },
          { status: 413 }
        );
      }
    }
    
    // Generic error response
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: ERROR_MESSAGES.GENERATION_FAILED,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate
 * Returns information about the generation endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'LLMS.txt generation endpoint',
    method: 'POST',
    body: {
      extractedData: {
        companyName: 'string (optional) - Company name',
        tagline: 'string (optional) - Company tagline',
        description: 'string (optional) - Company description',
        services: 'string[] - List of services',
        products: 'string[] - List of products',
        contactInfo: 'object - Contact information',
        businessType: 'string - One of: catalog, specialist, ecosystem',
        // ... other fields
      },
      sourceUrl: 'string - Original website URL',
      qualityScore: 'number (optional) - Quality score from extraction',
    },
    description: 'Generates an LLMS.txt file using AI based on extracted website data.',
    returns: 'Generated LLMS.txt content with metadata including word count and generation timestamp.',
    notes: [
      'Requires ANTHROPIC_API_KEY environment variable',
      'Generation typically takes 5-10 seconds',
      'Cost is approximately $0.01-0.02 per generation',
    ],
  });
}