// This file defines all the TypeScript types used throughout our application
// Think of these as blueprints or contracts that ensure data consistency

// Represents the different stages of our LLMS.txt generation process
export type ProcessingStage = 'idle' | 'validating' | 'scraping' | 'extracting' | 'generating' | 'complete' | 'error';

// The data we extract from a website
export interface ExtractedData {
  // Basic company information
  companyName?: string;
  tagline?: string;
  description?: string;
  
  // Services and products offered
  services: string[];
  products: string[];
  
  // Contact information
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
    socialMedia?: Record<string, string>;
  };
  
  // Additional metadata
  mission?: string;
  teamInfo?: string[];
  apiDocs?: string;
  
  // Schema.org data if found
  schemaData?: any;
  
  // The type of business (used for template selection)
  businessType?: 'catalog' | 'specialist' | 'ecosystem';
}

// Configuration for our web scraper
export interface ScraperConfig {
  // Maximum time to wait for page load (in milliseconds)
  timeout: number;
  
  // User agent string to identify our scraper
  userAgent: string;
  
  // Whether to use Playwright for JavaScript-heavy sites
  usePlaywright?: boolean;
}

// The result of our scraping operation
export interface ScrapedContent {
  // The raw HTML content
  html: string;
  
  // Extracted text content (visible to users)
  textContent: string;
  
  // Meta tags found in the page
  metaTags: Record<string, string>;
  
  // JSON-LD structured data if present
  jsonLd?: any[];
  
  // The final URL after any redirects
  finalUrl: string;
}

// API response types for better error handling
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Progress update for real-time feedback
export interface ProgressUpdate {
  stage: ProcessingStage;
  message: string;
  progress?: number; // 0-100
}

// The final generated LLMS.txt content
export interface GeneratedContent {
  content: string;
  metadata: {
    generatedAt: string;
    sourceUrl: string;
    businessType: string;
    wordCount: number;
  };
}