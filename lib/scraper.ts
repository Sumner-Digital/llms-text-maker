// Web scraping functionality
// This module handles downloading and parsing website content

import * as cheerio from 'cheerio';
import { chromium } from 'playwright';
import { ScraperConfig, ScrapedContent } from '@/types';
import { USER_AGENT, TIMEOUTS } from '@/utils/constants';

// Default configuration for our scraper
const defaultConfig: ScraperConfig = {
  timeout: TIMEOUTS.PAGE_LOAD,
  userAgent: USER_AGENT,
  usePlaywright: false,
};

/**
 * Scrapes a website using Cheerio (fast, works for most sites)
 * Cheerio is like jQuery for the server - it lets us parse HTML easily
 */
async function scrapeWithCheerio(url: string, config: ScraperConfig): Promise<ScrapedContent> {
  try {
    // Fetch the HTML content from the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': config.userAgent,
        // These headers make our request look more like a real browser
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // AbortSignal allows us to cancel the request if it takes too long
      signal: AbortSignal.timeout(config.timeout),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    
    // Load the HTML into Cheerio for parsing
    const $ = cheerio.load(html);
    
    // Extract various parts of the page
    const scrapedContent: ScrapedContent = {
      html,
      textContent: extractTextContent($),
      metaTags: extractMetaTags($),
      jsonLd: extractJsonLd($),
      finalUrl: response.url, // This captures the URL after any redirects
    };
    
    return scrapedContent;
  } catch (error) {
    // If Cheerio fails, we'll fall back to Playwright
    console.error('Cheerio scraping failed:', error);
    throw error;
  }
}

/**
 * Scrapes a website using Playwright (slower but handles JavaScript)
 * Playwright is like a robot that controls a real browser
 */
async function scrapeWithPlaywright(url: string, config: ScraperConfig): Promise<ScrapedContent> {
  let browser;
  
  try {
    // Launch a headless browser (invisible browser that runs in the background)
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
    });
    
    // Create a new page (like opening a new tab)
    const context = await browser.newContext({
      userAgent: config.userAgent,
      viewport: { width: 1920, height: 1080 },
    });
    
    const page = await context.newPage();
    
    // Navigate to the URL and wait for content to load
    await page.goto(url, {
      waitUntil: 'networkidle', // Wait until network activity settles
      timeout: config.timeout,
    });
    
    // Wait a bit for any dynamic content to render
    await page.waitForTimeout(2000);
    
    // Get the page content after JavaScript has executed
    const html = await page.content();
    const finalUrl = page.url();
    
    // Extract text content visible to users
    const textContent = await page.evaluate(() => {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());
      
      // Get the text content
      return document.body?.innerText || '';
    });
    
    // Extract meta tags
    const metaTags = await page.evaluate(() => {
      const tags: Record<string, string> = {};
      const metaElements = document.querySelectorAll('meta');
      
      metaElements.forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property');
        const content = meta.getAttribute('content');
        
        if (name && content) {
          tags[name] = content;
        }
      });
      
      return tags;
    });
    
    // Extract JSON-LD structured data
    const jsonLd = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      const data: any[] = [];
      
      scripts.forEach(script => {
        try {
          const parsed = JSON.parse(script.textContent || '');
          data.push(parsed);
        } catch (e) {
          // Invalid JSON, skip it
        }
      });
      
      return data;
    });
    
    await browser.close();
    
    return {
      html,
      textContent,
      metaTags,
      jsonLd,
      finalUrl,
    };
  } catch (error) {
    console.error('Playwright scraping failed:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * Extracts visible text content from the page
 * This gives us the text that users actually see
 */
function extractTextContent($: cheerio.CheerioAPI): string {
  // Remove elements that don't contain useful content
  $('script, style, noscript, iframe').remove();
  
  // Get all text, clean it up, and join with spaces
  const text = $('body').text()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim();
  
  return text;
}

/**
 * Extracts meta tags from the page
 * Meta tags often contain valuable information about the page
 */
function extractMetaTags($: cheerio.CheerioAPI): Record<string, string> {
  const metaTags: Record<string, string> = {};
  
  $('meta').each((_, element) => {
    const $meta = $(element);
    const name = $meta.attr('name') || $meta.attr('property');
    const content = $meta.attr('content');
    
    if (name && content) {
      metaTags[name] = content;
    }
  });
  
  // Also get the title tag
  const title = $('title').text();
  if (title) {
    metaTags.title = title;
  }
  
  return metaTags;
}

/**
 * Extracts JSON-LD structured data from the page
 * This is often the best source of structured information about a business
 */
function extractJsonLd($: cheerio.CheerioAPI): any[] {
  const jsonLdData: any[] = [];
  
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      const scriptContent = $(element).html();
      if (scriptContent) {
        const parsed = JSON.parse(scriptContent);
        jsonLdData.push(parsed);
      }
    } catch (error) {
      // Invalid JSON, skip it
      console.warn('Failed to parse JSON-LD:', error);
    }
  });
  
  return jsonLdData;
}

/**
 * Main scraping function that tries Cheerio first, then falls back to Playwright
 * This gives us the best of both worlds: speed when possible, reliability when needed
 */
export async function scrapeWebsite(
  url: string, 
  config: Partial<ScraperConfig> = {}
): Promise<ScrapedContent> {
  const finalConfig = { ...defaultConfig, ...config };
  
  // Validate the URL
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL provided');
  }
  
  try {
    // Try Cheerio first (it's much faster)
    if (!finalConfig.usePlaywright) {
      console.log('Attempting to scrape with Cheerio...');
      return await scrapeWithCheerio(url, finalConfig);
    }
  } catch (error) {
    console.log('Cheerio failed, falling back to Playwright...');
  }
  
  // Fall back to Playwright for JavaScript-heavy sites
  return await scrapeWithPlaywright(url, finalConfig);
}

/**
 * Validates if a string is a valid URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}