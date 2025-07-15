// Application-wide constants
// These values remain consistent throughout the app's lifecycle

// User agent string to identify our scraper
// We use a browser-like user agent to avoid being blocked
export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// Timeout values in milliseconds
export const TIMEOUTS = {
  // Maximum time to wait for initial page load
  PAGE_LOAD: 30000, // 30 seconds
  
  // Maximum time for API endpoints to respond
  API_RESPONSE: 60000, // 60 seconds
  
  // Time to wait between retries
  RETRY_DELAY: 1000, // 1 second
} as const;

// Maximum file size for generated LLMS.txt (2MB as specified in PRD)
export const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB in bytes

// API configuration
export const API_CONFIG = {
  // Maximum tokens to use per generation (cost optimization)
  MAX_TOKENS: 500,
  
  // Model to use for generation
  MODEL: 'claude-sonnet-4-20250514', // Using Sonnet for cost efficiency
  
  // Temperature for AI responses (0 = deterministic, 1 = creative)
  TEMPERATURE: 0.3,
} as const;

// Regular expressions for validation
export const REGEX_PATTERNS = {
  // Valid URL pattern
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  
  // Email pattern for contact extraction
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Phone pattern (US format, can be extended)
  PHONE: /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
} as const;

// Content that should never be included in LLMS.txt
export const EXCLUDED_CONTENT = [
  'pricing',
  'price',
  'cost',
  'fee',
  'payment',
  'credit card',
  'api key',
  'password',
  'secret',
  'private',
  'confidential',
] as const;

// Business type keywords for classification
export const BUSINESS_TYPE_KEYWORDS = {
  catalog: ['marketplace', 'platform', 'directory', 'listing', 'catalog', 'database'],
  specialist: ['agency', 'consultant', 'expert', 'specialist', 'professional', 'service'],
  ecosystem: ['suite', 'ecosystem', 'integrated', 'all-in-one', 'complete solution'],
} as const;

// Error messages for user-friendly feedback
export const ERROR_MESSAGES = {
  INVALID_URL: 'Please enter a valid website URL (starting with http:// or https://)',
  BLOCKED_SITE: 'This website is blocking our access. Try using your schema data form first.',
  NO_SCHEMA: 'No schema data found. Consider adding schema markup for better results.',
  TIMEOUT: 'The website took too long to load. Please try again.',
  GENERATION_FAILED: 'Sorry, we couldn\'t generate your file. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
} as const;