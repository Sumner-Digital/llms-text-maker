// Data extraction functionality
// This module processes scraped content to extract structured business information

import { ExtractedData, ScrapedContent } from '@/types';
import { BUSINESS_TYPE_KEYWORDS, REGEX_PATTERNS, EXCLUDED_CONTENT } from '@/utils/constants';

/**
 * Main extraction function that processes scraped content
 * Think of this as a detective gathering clues from a crime scene
 */
export async function extractData(scrapedContent: ScrapedContent): Promise<ExtractedData> {
  // Start with data from structured sources (most reliable)
  const structuredData = extractFromStructuredData(scrapedContent.jsonLd);
  
  // Extract from meta tags (second most reliable)
  const metaData = extractFromMetaTags(scrapedContent.metaTags);
  
  // Extract from page content (least reliable but most comprehensive)
  const contentData = extractFromContent(scrapedContent.textContent, scrapedContent.html);
  
  // Merge all extracted data, prioritizing structured data over scraped content
  // This is like combining witness testimonies - we trust the most reliable sources first
  const mergedData = mergeExtractedData(structuredData, metaData, contentData);
  
  // Determine business type based on the extracted data
  mergedData.businessType = classifyBusinessType(mergedData);
  
  // Clean and validate the final data
  return cleanExtractedData(mergedData);
}

/**
 * Extracts data from JSON-LD structured data
 * This is often the best source because it's meant for machines to read
 */
function extractFromStructuredData(jsonLdArray: any[]): Partial<ExtractedData> {
  const extracted: Partial<ExtractedData> = {
    services: [],
    products: [],
    contactInfo: {},
    teamInfo: [],
  };
  
  // Process each JSON-LD object
  jsonLdArray.forEach(jsonLd => {
    // Handle different schema.org types
    const type = jsonLd['@type'];
    
    if (type === 'Organization' || type === 'Corporation' || type === 'LocalBusiness') {
      // Extract company information
      extracted.companyName = jsonLd.name || extracted.companyName;
      extracted.description = jsonLd.description || extracted.description;
      extracted.tagline = jsonLd.slogan || extracted.tagline;
      
      // Extract contact information
      if (jsonLd.contactPoint) {
        const contact = Array.isArray(jsonLd.contactPoint) ? jsonLd.contactPoint[0] : jsonLd.contactPoint;
        extracted.contactInfo = {
          ...extracted.contactInfo,
          email: contact.email || extracted.contactInfo?.email,
          phone: contact.telephone || extracted.contactInfo?.phone,
        };
      }
      
      // Extract address
      if (jsonLd.address) {
        extracted.contactInfo = {
          ...extracted.contactInfo,
          address: formatAddress(jsonLd.address),
        };
      }
      
      // Extract social media links
      if (jsonLd.sameAs && Array.isArray(jsonLd.sameAs)) {
        extracted.contactInfo.socialMedia = {};
        jsonLd.sameAs.forEach((url: string) => {
          const platform = identifySocialPlatform(url);
          if (platform) {
            extracted.contactInfo.socialMedia![platform] = url;
          }
        });
      }
    }
    
    // Extract products and services
    if (type === 'Product' || jsonLd.makesOffer) {
      const products = Array.isArray(jsonLd.makesOffer) ? jsonLd.makesOffer : [jsonLd.makesOffer];
      products.forEach((product: any) => {
        if (product?.name && !containsExcludedContent(product.name)) {
          extracted.products?.push(product.name);
        }
      });
    }
    
    if (type === 'Service' || jsonLd.hasOfferCatalog) {
      const services = jsonLd.hasOfferCatalog?.itemListElement || [];
      services.forEach((service: any) => {
        if (service?.name && !containsExcludedContent(service.name)) {
          extracted.services?.push(service.name);
        }
      });
    }
    
    // Extract team information
    if (jsonLd.employee || jsonLd.founder) {
      const people = [...(jsonLd.employee || []), ...(jsonLd.founder || [])];
      people.forEach((person: any) => {
        if (person?.name) {
          const role = person.jobTitle || person.role || 'Team Member';
          extracted.teamInfo?.push(`${person.name} - ${role}`);
        }
      });
    }
  });
  
  // Store the raw schema data for reference
  extracted.schemaData = jsonLdArray;
  
  return extracted;
}

/**
 * Extracts data from meta tags
 * Meta tags are like the book's summary on the back cover
 */
function extractFromMetaTags(metaTags: Record<string, string>): Partial<ExtractedData> {
  const extracted: Partial<ExtractedData> = {
    services: [],
    products: [],
    contactInfo: {},
  };
  
  // Common meta tag names for descriptions
  const descriptionKeys = ['description', 'og:description', 'twitter:description'];
  for (const key of descriptionKeys) {
    if (metaTags[key]) {
      extracted.description = metaTags[key];
      break;
    }
  }
  
  // Company name from meta tags
  const titleKeys = ['og:site_name', 'application-name', 'title', 'og:title'];
  for (const key of titleKeys) {
    if (metaTags[key]) {
      extracted.companyName = cleanCompanyName(metaTags[key]);
      break;
    }
  }
  
  // Extract tagline from Twitter tags
  if (metaTags['twitter:title'] && metaTags['twitter:title'] !== extracted.companyName) {
    extracted.tagline = metaTags['twitter:title'];
  }
  
  return extracted;
}

/**
 * Extracts data from page content using pattern matching
 * This is like reading between the lines to find information
 */
function extractFromContent(textContent: string, html: string): Partial<ExtractedData> {
  const extracted: Partial<ExtractedData> = {
    services: [],
    products: [],
    contactInfo: {},
    teamInfo: [],
  };
  
  // Extract email addresses
  const emails = textContent.match(REGEX_PATTERNS.EMAIL) || [];
  // Filter out personal emails and only keep general contact emails
  const contactEmails = emails.filter(email => 
    !email.includes('@gmail.') && 
    !email.includes('@yahoo.') && 
    !email.includes('@hotmail.') &&
    (email.includes('contact') || email.includes('info') || email.includes('support') || email.includes('sales'))
  );
  
  if (contactEmails.length > 0) {
    extracted.contactInfo!.email = contactEmails[0];
  }
  
  // Extract phone numbers
  const phones = textContent.match(REGEX_PATTERNS.PHONE) || [];
  if (phones.length > 0) {
    extracted.contactInfo!.phone = phones[0];
  }
  
  // Look for services and products sections
  // This is a simplified approach - in production, you might use NLP
  const servicesMatch = textContent.match(/(?:services|what we do|our solutions)[:\s]+([^.]+\.)/i);
  if (servicesMatch) {
    const servicesList = servicesMatch[1].split(/[,;]/).map(s => s.trim());
    extracted.services = servicesList.filter(s => !containsExcludedContent(s));
  }
  
  // Look for mission statement
  const missionMatch = textContent.match(/(?:our mission|mission statement)[:\s]+([^.]+\.)/i);
  if (missionMatch) {
    extracted.mission = missionMatch[1].trim();
  }
  
  // Extract API documentation links
  const apiMatch = html.match(/href="([^"]*(?:api|developer|docs)[^"]*)"[^>]*>([^<]+)</gi);
  if (apiMatch) {
    extracted.apiDocs = 'API documentation available';
  }
  
  return extracted;
}

/**
 * Merges data from multiple sources, prioritizing reliability
 * Structured data > Meta tags > Content extraction
 */
function mergeExtractedData(...dataSources: Partial<ExtractedData>[]): ExtractedData {
  const merged: ExtractedData = {
    services: [],
    products: [],
    contactInfo: {},
    teamInfo: [],
  };
  
  // Merge each data source, with later sources overwriting earlier ones
  dataSources.forEach(source => {
    Object.entries(source).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value) && Array.isArray(merged[key as keyof ExtractedData])) {
          // Merge arrays and remove duplicates
          const existing = merged[key as keyof ExtractedData] as any[];
          const combined = [...existing, ...value];
          merged[key as keyof ExtractedData] = [...new Set(combined)] as any;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          // Merge objects
          merged[key as keyof ExtractedData] = {
            ...merged[key as keyof ExtractedData] as any,
            ...value,
          };
        } else {
          // Direct assignment for primitives
          merged[key as keyof ExtractedData] = value as any;
        }
      }
    });
  });
  
  return merged;
}

/**
 * Classifies the business type based on extracted data
 * This helps us choose the right template later
 */
function classifyBusinessType(data: ExtractedData): 'catalog' | 'specialist' | 'ecosystem' {
  const allText = [
    data.companyName,
    data.description,
    data.tagline,
    ...data.services,
    ...data.products,
  ].join(' ').toLowerCase();
  
  // Count keyword matches for each business type
  let catalogScore = 0;
  let specialistScore = 0;
  let ecosystemScore = 0;
  
  BUSINESS_TYPE_KEYWORDS.catalog.forEach(keyword => {
    if (allText.includes(keyword)) catalogScore++;
  });
  
  BUSINESS_TYPE_KEYWORDS.specialist.forEach(keyword => {
    if (allText.includes(keyword)) specialistScore++;
  });
  
  BUSINESS_TYPE_KEYWORDS.ecosystem.forEach(keyword => {
    if (allText.includes(keyword)) ecosystemScore++;
  });
  
  // Return the type with the highest score
  if (catalogScore >= specialistScore && catalogScore >= ecosystemScore) {
    return 'catalog';
  } else if (ecosystemScore >= specialistScore) {
    return 'ecosystem';
  } else {
    return 'specialist';
  }
}

/**
 * Cleans and validates the extracted data
 * Removes duplicates, empty values, and excluded content
 */
function cleanExtractedData(data: ExtractedData): ExtractedData {
  // Remove duplicate services and products
  data.services = [...new Set(data.services)].filter(Boolean);
  data.products = [...new Set(data.products)].filter(Boolean);
  
  // Remove any services/products that contain excluded content
  data.services = data.services.filter(s => !containsExcludedContent(s));
  data.products = data.products.filter(p => !containsExcludedContent(p));
  
  // Clean team info
  data.teamInfo = [...new Set(data.teamInfo)].filter(Boolean);
  
  // Ensure we have at least some basic information
  if (!data.companyName) {
    data.companyName = 'Company Name';
  }
  
  if (!data.description) {
    data.description = 'No description available.';
  }
  
  return data;
}

// Helper functions

/**
 * Formats an address object into a readable string
 */
function formatAddress(address: any): string {
  const parts = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    address.addressCountry,
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Identifies social media platform from URL
 */
function identifySocialPlatform(url: string): string | null {
  const platforms: Record<string, string> = {
    'facebook.com': 'facebook',
    'twitter.com': 'twitter',
    'x.com': 'twitter',
    'linkedin.com': 'linkedin',
    'instagram.com': 'instagram',
    'youtube.com': 'youtube',
    'github.com': 'github',
  };
  
  for (const [domain, platform] of Object.entries(platforms)) {
    if (url.includes(domain)) {
      return platform;
    }
  }
  
  return null;
}

/**
 * Checks if content contains excluded terms (like pricing)
 */
function containsExcludedContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return EXCLUDED_CONTENT.some(excluded => lowerText.includes(excluded));
}

/**
 * Cleans company name by removing common suffixes
 */
function cleanCompanyName(name: string): string {
  return name
    .replace(/\s*[-|]\s*.*$/, '') // Remove everything after dash or pipe
    .replace(/\s+(Inc|LLC|Ltd|Corporation|Corp)\.?$/i, '') // Remove legal suffixes
    .trim();
}