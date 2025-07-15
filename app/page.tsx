// Main Page Component
// This is the home page of our LLMS Text Maker application

'use client';

import React, { useState, useCallback } from 'react';
import URLInput from '@/components/URLInput';
import ProgressIndicator from '@/components/ProgressIndicator';
import ResultDisplay from '@/components/ResultDisplay';
import { ProcessingStage, GeneratedContent, ApiResponse, ScrapedContent, ExtractedData } from '@/types';
import { ERROR_MESSAGES } from '@/utils/constants';

/**
 * HomePage Component
 * This is the main orchestrator of our application
 * It manages the entire flow from URL input to LLMS.txt generation
 */
export default function HomePage() {
  // State management for the entire generation process
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  
  /**
   * Resets the application to its initial state
   * This is like hitting the reset button on a game console
   */
  const handleReset = useCallback(() => {
    setStage('idle');
    setError('');
    setResult(null);
    setCurrentMessage('');
  }, []);
  
  /**
   * Main orchestration function that handles the entire generation process
   * This is like a recipe that calls each step in order
   */
  const handleGenerate = useCallback(async (url: string) => {
    // Reset any previous state
    handleReset();
    
    try {
      // Step 1: Validate the URL
      setStage('validating');
      setCurrentMessage('Checking if the website is accessible...');
      
      const validateResponse = await fetch('/api/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      const validateResult: ApiResponse<{ finalUrl: string }> = await validateResponse.json();
      
      if (!validateResult.success) {
        throw new Error(validateResult.error || 'URL validation failed');
      }
      
      // Use the final URL (after redirects) for subsequent steps
      const finalUrl = validateResult.data?.finalUrl || url;
      
      // Step 2: Scrape the website
      setStage('scraping');
      setCurrentMessage('Reading website content...');
      
      const scrapeResponse = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: finalUrl }),
      });
      
      const scrapeResult: ApiResponse<ScrapedContent> = await scrapeResponse.json();
      
      if (!scrapeResult.success) {
        throw new Error(scrapeResult.error || 'Website scraping failed');
      }
      
      // Check for warnings in headers
      const scrapeWarnings = scrapeResponse.headers.get('X-Scraping-Warnings');
      if (scrapeWarnings) {
        console.log('Scraping warnings:', JSON.parse(scrapeWarnings));
      }
      
      // Step 3: Extract structured data
      setStage('extracting');
      setCurrentMessage('Extracting business information...');
      
      const extractResponse = await fetch('/api/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scrapedContent: scrapeResult.data }),
      });
      
      const extractResult: ApiResponse<ExtractedData & { qualityScore: number }> = await extractResponse.json();
      
      if (!extractResult.success) {
        throw new Error(extractResult.error || 'Data extraction failed');
      }
      
      // Check quality score
      const qualityScore = extractResponse.headers.get('X-Quality-Score');
      console.log('Extraction quality score:', qualityScore);
      
      // Step 4: Generate LLMS.txt
      setStage('generating');
      setCurrentMessage('Creating your LLMS.txt file...');
      
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extractedData: extractResult.data,
          sourceUrl: finalUrl,
          qualityScore: extractResult.data?.qualityScore,
        }),
      });
      
      const generateResult: ApiResponse<GeneratedContent> = await generateResponse.json();
      
      if (!generateResult.success) {
        throw new Error(generateResult.error || 'Generation failed');
      }
      
      // Success! Update state with the result
      setStage('complete');
      setResult(generateResult.data!);
      
      // Log generation statistics
      const generationTime = generateResponse.headers.get('X-Generation-Time');
      if (generationTime) {
        console.log(`Generation completed in ${generationTime}ms`);
      }
      
    } catch (error) {
      // Handle errors gracefully
      console.error('Generation process failed:', error);
      
      setStage('error');
      
      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          setError(ERROR_MESSAGES.NETWORK_ERROR);
        } else if (error.message.includes('timeout')) {
          setError(ERROR_MESSAGES.TIMEOUT);
        } else if (error.message.includes('blocking')) {
          setError(ERROR_MESSAGES.BLOCKED_SITE);
        } else {
          setError(error.message);
        }
      } else {
        setError(ERROR_MESSAGES.GENERATION_FAILED);
      }
    }
  }, [handleReset]);
  
  return (
    <main className="main-container">
      {/* Application header */}
      <header className="app-header">
        <h1 className="app-title">LLMS Text Maker</h1>
        <p className="app-subtitle">
          Generate AI-optimized LLMS.txt files for any website in seconds
        </p>
      </header>
      
      {/* URL input section - always visible */}
      <section aria-label="URL Input">
        <URLInput 
          onSubmit={handleGenerate} 
          disabled={stage !== 'idle' && stage !== 'complete' && stage !== 'error'}
        />
      </section>
      
      {/* Progress indicator - shown during processing */}
      {stage !== 'idle' && stage !== 'complete' && (
        <section aria-label="Progress">
          <ProgressIndicator 
            stage={stage} 
            message={currentMessage || undefined}
          />
        </section>
      )}
      
      {/* Error display */}
      {stage === 'error' && error && (
        <section aria-label="Error" className="error-container">
          <div className="error-box">
            <h2 className="error-title">⚠️ Something went wrong</h2>
            <p className="error-description">{error}</p>
            <button 
              onClick={handleReset}
              className="error-retry-button"
              aria-label="Try again"
            >
              Try Again
            </button>
          </div>
        </section>
      )}
      
      {/* Result display - shown when generation is complete */}
      {stage === 'complete' && result && (
        <section aria-label="Generated LLMS.txt">
          <ResultDisplay 
            result={result} 
            onReset={handleReset}
          />
        </section>
      )}
      
      {/* Footer with helpful information */}
      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-text">
            Learn more about LLMS.txt files and best practices at{' '}
            <a 
              href="https://websitehq.com/why-your-website-needs-an-llms-txt-file-and-what-the-heck-that-even-means/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
            >
              our guide
            </a>
          </p>
          <p className="footer-copyright">
            Built with ❤️ for the AI-powered future
          </p>
        </div>
      </footer>
    </main>
  );
}

// Add some additional styles for elements not in our components
const additionalStyles = `
.error-container {
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.error-box {
  text-align: center;
}

.error-title {
  color: #dc2626;
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.error-description {
  color: #7f1d1d;
  margin-bottom: 1rem;
}

.error-retry-button {
  background-color: #dc2626;
  color: white;
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 150ms;
}

.error-retry-button:hover {
  background-color: #b91c1c;
}

.app-footer {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.footer-content {
  text-align: center;
  color: #6b7280;
  font-size: 0.875rem;
}

.footer-text {
  margin-bottom: 0.5rem;
}

.footer-link {
  color: #2563eb;
  text-decoration: none;
}

.footer-link:hover {
  text-decoration: underline;
}

.footer-copyright {
  color: #9ca3af;
}
`;

// Add the additional styles to the page
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = additionalStyles;
  document.head.appendChild(styleElement);
}