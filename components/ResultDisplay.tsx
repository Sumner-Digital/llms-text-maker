// Result Display Component
// This component shows the generated LLMS.txt content and provides download/copy options

'use client';

import React, { useState } from 'react';
import { GeneratedContent } from '@/types';

// Props for our result display
interface ResultDisplayProps {
  result: GeneratedContent | null;
  onReset: () => void; // Function to start over
}

/**
 * ResultDisplay component - presents the generated LLMS.txt file
 * This is like the checkout counter where users receive their finished product
 */
export default function ResultDisplay({ result, onReset }: ResultDisplayProps) {
  // State to track if content was copied
  const [copied, setCopied] = useState(false);
  
  // Don't render anything if there's no result
  if (!result) {
    return null;
  }
  
  /**
   * Copies the content to clipboard
   * Modern browsers provide a clipboard API for this
   */
  const handleCopy = async () => {
    try {
      // Use the clipboard API to copy text
      await navigator.clipboard.writeText(result.content);
      
      // Show feedback that content was copied
      setCopied(true);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = result.content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please select and copy manually.');
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };
  
  /**
   * Downloads the content as a text file
   * This creates a temporary download link and clicks it programmatically
   */
  const handleDownload = () => {
    // Create a blob (binary large object) from the text content
    const blob = new Blob([result.content], { type: 'text/plain' });
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = 'llms.txt'; // The filename for download
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the temporary URL
    window.URL.revokeObjectURL(url);
  };
  
  /**
   * Formats the file size for display
   * Converts bytes to a human-readable format
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };
  
  // Calculate file size
  const fileSize = new Blob([result.content]).size;
  
  return (
    <div className="result-container">
      {/* Header with metadata */}
      <div className="result-header">
        <h2>Your LLMS.txt file is ready!</h2>
        <div className="result-metadata">
          <span className="metadata-item">
            📄 Size: {formatFileSize(fileSize)}
          </span>
          <span className="metadata-item">
            📝 Words: {result.metadata.wordCount}
          </span>
          <span className="metadata-item">
            🏢 Type: {result.metadata.businessType}
          </span>
        </div>
      </div>
      
      {/* Content display area */}
      <div className="result-content-wrapper">
        <textarea
          className="result-content"
          value={result.content}
          readOnly
          rows={20}
          aria-label="Generated LLMS.txt content"
        />
      </div>
      
      {/* Action buttons */}
      <div className="result-actions">
        <button
          onClick={handleCopy}
          className={`action-button copy-button ${copied ? 'copied' : ''}`}
          aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
        >
          {copied ? (
            <>✓ Copied!</>
          ) : (
            <>📋 Copy to Clipboard</>
          )}
        </button>
        
        <button
          onClick={handleDownload}
          className="action-button download-button"
          aria-label="Download as text file"
        >
          💾 Download File
        </button>
        
        <button
          onClick={onReset}
          className="action-button reset-button"
          aria-label="Generate another file"
        >
          🔄 Generate Another
        </button>
      </div>
      
      {/* Instructions for users */}
      <div className="result-instructions">
        <h3>Next Steps:</h3>
        <p>
          1. Save this file as <code>llms.txt</code> in your website's root directory
        </p>
        <p>
          2. Make sure it's accessible at <code>https://yourdomain.com/llms.txt</code>
        </p>
        <p>
          3. Update the file whenever your business information changes significantly
        </p>
      </div>
      
      {/* Source attribution */}
      <div className="result-footer">
        <p className="source-info">
          Generated from: <a href={result.metadata.sourceUrl} target="_blank" rel="noopener noreferrer">
            {result.metadata.sourceUrl}
          </a>
        </p>
        <p className="timestamp">
          Created at: {new Date(result.metadata.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}