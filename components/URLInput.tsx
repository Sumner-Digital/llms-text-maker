// URL Input Component
// This component handles user input and validation for website URLs

'use client'; // This tells Next.js this component runs in the browser

import React, { useState } from 'react';
import { REGEX_PATTERNS } from '@/utils/constants';

// Props (properties) are like parameters passed to our component
interface URLInputProps {
  onSubmit: (url: string) => void; // Function to call when user submits
  disabled?: boolean; // Whether the input should be disabled
}

/**
 * URLInput component - the starting point of our user's journey
 * This is like the front door of our application
 */
export default function URLInput({ onSubmit, disabled = false }: URLInputProps) {
  // State is like the component's memory - it remembers the current URL
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  
  /**
   * Validates the URL before submission
   * This prevents users from submitting invalid URLs
   */
  const validateUrl = (urlToValidate: string): boolean => {
    // First, check if it's empty
    if (!urlToValidate.trim()) {
      setError('Please enter a URL');
      return false;
    }
    
    // Check if it matches our URL pattern
    if (!REGEX_PATTERNS.URL.test(urlToValidate)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return false;
    }
    
    // Clear any previous errors
    setError('');
    return true;
  };
  
  /**
   * Handles form submission
   * This is called when the user clicks the generate button
   */
  const handleSubmit = (e: React.FormEvent) => {
    // Prevent the default form submission (which would reload the page)
    e.preventDefault();
    
    // Validate the URL
    if (validateUrl(url)) {
      // If valid, call the parent component's onSubmit function
      onSubmit(url);
    }
  };
  
  /**
   * Handles input changes
   * This updates our state every time the user types
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };
  
  return (
    <div className="url-input-container">
      <form onSubmit={handleSubmit} className="url-form">
        <div className="input-group">
          <label htmlFor="url-input" className="input-label">
            Enter Website URL
          </label>
          
          <div className="input-wrapper">
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={handleInputChange}
              placeholder="https://example.com"
              disabled={disabled}
              className={`url-input ${error ? 'input-error' : ''}`}
              aria-label="Website URL"
              aria-invalid={!!error}
              aria-describedby={error ? 'url-error' : undefined}
            />
            
            <button
              type="submit"
              disabled={disabled || !url.trim()}
              className="generate-button"
              aria-label="Generate LLMS.txt file"
            >
              {disabled ? 'Processing...' : 'Generate LLMS.txt'}
            </button>
          </div>
          
          {/* Show error message if there's an error */}
          {error && (
            <p id="url-error" className="error-message" role="alert">
              {error}
            </p>
          )}
        </div>
      </form>
      
      {/* Helpful hint for users */}
      <p className="input-hint">
        Enter the homepage URL of any website to generate an AI-optimized LLMS.txt file.
        The process typically takes 30-60 seconds.
      </p>
    </div>
  );
}