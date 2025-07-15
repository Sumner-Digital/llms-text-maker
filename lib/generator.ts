// LLMS.txt generation functionality
// This module uses AI to fill templates with extracted data

import Anthropic from '@anthropic-ai/sdk';
import { ExtractedData, GeneratedContent } from '@/types';
import { getTemplateForBusinessType, cleanTemplate } from './templates';
import { API_CONFIG, MAX_FILE_SIZE } from '@/utils/constants';

// Initialize Anthropic client
// This will use the ANTHROPIC_API_KEY from environment variables
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generates an LLMS.txt file from extracted data
 * This is like having an AI assistant fill out a form for us
 */
export async function generateLLMSText(
  extractedData: ExtractedData,
  sourceUrl: string
): Promise<GeneratedContent> {
  // Select the appropriate template based on business type
  const template = getTemplateForBusinessType(extractedData.businessType || 'specialist');
  
  // Prepare the data for AI processing
  const preparedData = prepareDataForAI(extractedData);
  
  // Create a prompt that instructs AI to fill in the template
  const prompt = createGenerationPrompt(template, preparedData, sourceUrl);
  
  try {
    // Call Claude to fill in the template
    console.log('Calling Claude API to generate LLMS.txt...');
    const response = await anthropic.messages.create({
      model: API_CONFIG.MODEL,
      max_tokens: API_CONFIG.MAX_TOKENS,
      temperature: API_CONFIG.TEMPERATURE,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });
    
    // Extract the generated content from Claude's response
    const generatedText = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '';
    
    // Clean up the generated content
    const cleanedContent = cleanTemplate(generatedText);
    
    // Validate the content size
    const contentSize = new Blob([cleanedContent]).size;
    if (contentSize > MAX_FILE_SIZE) {
      throw new Error('Generated content exceeds maximum file size');
    }
    
    // Return the generated content with metadata
    return {
      content: cleanedContent,
      metadata: {
        generatedAt: new Date().toISOString(),
        sourceUrl,
        businessType: extractedData.businessType || 'specialist',
        wordCount: cleanedContent.split(/\s+/).length,
      },
    };
  } catch (error) {
    console.error('Generation failed:', error);
    throw new Error('Failed to generate LLMS.txt file');
  }
}

/**
 * Prepares extracted data for AI processing
 * This ensures the data is in a format that's easy for AI to understand
 */
function prepareDataForAI(data: ExtractedData): Record<string, string> {
  const prepared: Record<string, string> = {};
  
  // Convert basic fields
  prepared.companyName = data.companyName || 'Company';
  prepared.description = data.description || 'No description available';
  prepared.tagline = data.tagline || '';
  prepared.mission = data.mission || '';
  
  // Convert arrays to formatted strings
  if (data.services.length > 0) {
    prepared.services = data.services
      .map((s, i) => `${i + 1}. ${s}`)
      .join('\n');
  } else {
    prepared.services = 'Services information not available';
  }
  
  if (data.products.length > 0) {
    prepared.products = data.products
      .map((p, i) => `${i + 1}. ${p}`)
      .join('\n');
  } else {
    prepared.products = 'Products information not available';
  }
  
  // Format contact information
  const contactParts: string[] = [];
  if (data.contactInfo.email) {
    contactParts.push(`Email: ${data.contactInfo.email}`);
  }
  if (data.contactInfo.phone) {
    contactParts.push(`Phone: ${data.contactInfo.phone}`);
  }
  if (data.contactInfo.address) {
    contactParts.push(`Address: ${data.contactInfo.address}`);
  }
  if (data.contactInfo.socialMedia) {
    Object.entries(data.contactInfo.socialMedia).forEach(([platform, url]) => {
      contactParts.push(`${platform}: ${url}`);
    });
  }
  prepared.contactInfo = contactParts.join('\n') || 'Contact information not available';
  
  // Format team information
  if (data.teamInfo.length > 0) {
    prepared.teamInfo = data.teamInfo.join('\n');
  } else {
    prepared.teamInfo = 'Team information not available';
  }
  
  // API documentation
  prepared.apiDocs = data.apiDocs || 'API documentation not available';
  
  // Extract domain from URL for email suggestions
  try {
    const url = new URL(data.schemaData?.[0]?.url || '');
    prepared.domain = url.hostname.replace('www.', '');
  } catch {
    prepared.domain = 'example.com';
  }
  
  // Add placeholders for template-specific fields
  // These help AI understand what kind of content to generate
  prepared.primaryAudience = '{describe target audience}';
  prepared.primaryOffering = '{main product/service category}';
  prepared.partnerType = '{type of partners}';
  prepared.userCount = '{number or "thousands"}';
  prepared.itemCount = '{number or "hundreds"}';
  prepared.countryCount = '{number}';
  prepared.yearsExperience = '{number}';
  prepared.industryType = '{industry}';
  prepared.primaryService = '{main service}';
  prepared.expertiseAreas = '{list expertise areas}';
  prepared.approach = '{describe approach}';
  prepared.caseStudies = '{brief case study examples}';
  prepared.differentiator1 = '{key differentiator}';
  prepared.differentiator2 = '{key differentiator}';
  prepared.differentiator3 = '{key differentiator}';
  prepared.teamExpertise = '{team expertise areas}';
  prepared.consultationLink = '{consultation URL}';
  prepared.testimonials = '{client testimonials}';
  prepared.productCategory = '{product category}';
  prepared.integrations = '{list of integrations}';
  prepared.securityInfo = '{security and compliance info}';
  
  return prepared;
}

/**
 * Creates the prompt for Claude to fill in the template
 * This is like giving detailed instructions to a writer
 */
function createGenerationPrompt(
  template: string,
  preparedData: Record<string, string>,
  sourceUrl: string
): string {
  return `You are helping create an LLMS.txt file for a website. This file helps AI assistants understand what the company does.

Here is the extracted information from ${sourceUrl}:

${Object.entries(preparedData)
  .map(([key, value]) => `${key}: ${value}`)
  .join('\n\n')}

Please fill in this template with the provided information. For any placeholders marked with {curly braces}, use the extracted data to create appropriate content. Keep the tone professional and informative.

IMPORTANT RULES:
1. Do NOT include any pricing information
2. Do NOT include personal email addresses
3. Keep descriptions concise but informative
4. If information is missing, skip that section rather than making it up
5. Maintain a professional tone throughout

Template to fill:
${template}

Please provide the filled template, replacing all {placeholder} values with appropriate content based on the extracted data. If you don't have information for a placeholder, remove that line entirely.`;
}

/**
 * Validates that the generated content meets our requirements
 * This is our quality control step
 */
export function validateGeneratedContent(content: string): boolean {
  // Check minimum length (at least 100 characters)
  if (content.length < 100) {
    return false;
  }
  
  // Check that it doesn't contain template placeholders
  if (content.includes('{') && content.includes('}')) {
    return false;
  }
  
  // Check that it doesn't exceed maximum size
  const size = new Blob([content]).size;
  if (size > MAX_FILE_SIZE) {
    return false;
  }
  
  // Check that it has at least some sections
  const sectionCount = (content.match(/^##\s/gm) || []).length;
  if (sectionCount < 2) {
    return false;
  }
  
  return true;
}

/**
 * Estimates the cost of generating an LLMS.txt file
 * This helps users understand the economics of the tool
 */
export function estimateGenerationCost(tokenCount: number): number {
  // Claude 3 Sonnet pricing (as of 2024)
  // Input: $0.003 per 1K tokens
  // Output: $0.015 per 1K tokens
  
  // Rough estimation: prompt is about 500 tokens, output is about 300 tokens
  const inputCost = (500 / 1000) * 0.003;
  const outputCost = (300 / 1000) * 0.015;
  
  return inputCost + outputCost; // Approximately $0.006 per generation
}