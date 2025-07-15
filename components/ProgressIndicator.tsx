// Progress Indicator Component
// This component shows users what's happening during the generation process

'use client';

import React from 'react';
import { ProcessingStage } from '@/types';

// Props for our progress indicator
interface ProgressIndicatorProps {
  stage: ProcessingStage;
  message?: string;
  progress?: number; // 0-100
}

/**
 * ProgressIndicator component - keeps users informed during processing
 * Think of this as a GPS navigation system showing your journey progress
 */
export default function ProgressIndicator({ 
  stage, 
  message, 
  progress 
}: ProgressIndicatorProps) {
  // Don't show anything if we're idle or complete
  if (stage === 'idle' || stage === 'complete') {
    return null;
  }
  
  /**
   * Determines the appropriate icon or emoji for each stage
   * This provides visual cues about what's happening
   */
  const getStageIcon = () => {
    switch (stage) {
      case 'validating':
        return '🔍'; // Magnifying glass for checking
      case 'scraping':
        return '🌐'; // Globe for web access
      case 'extracting':
        return '📊'; // Chart for data processing
      case 'generating':
        return '✨'; // Sparkles for AI magic
      case 'error':
        return '❌'; // X for errors
      default:
        return '⏳'; // Hourglass for waiting
    }
  };
  
  /**
   * Gets a user-friendly message for each stage
   * These messages help users understand what's happening
   */
  const getStageMessage = () => {
    if (message) return message; // Use custom message if provided
    
    switch (stage) {
      case 'validating':
        return 'Checking if the website is accessible...';
      case 'scraping':
        return 'Reading website content...';
      case 'extracting':
        return 'Extracting business information...';
      case 'generating':
        return 'Creating your LLMS.txt file...';
      case 'error':
        return 'Something went wrong. Please try again.';
      default:
        return 'Processing...';
    }
  };
  
  /**
   * Calculates estimated progress if not provided
   * This gives users a sense of how much longer they need to wait
   */
  const getProgress = () => {
    if (progress !== undefined) return progress;
    
    // Estimate progress based on stage
    switch (stage) {
      case 'validating':
        return 20;
      case 'scraping':
        return 40;
      case 'extracting':
        return 60;
      case 'generating':
        return 80;
      default:
        return 0;
    }
  };
  
  const currentProgress = getProgress();
  
  return (
    <div className="progress-container" role="status" aria-live="polite">
      {/* Stage indicator with icon */}
      <div className="progress-header">
        <span className="stage-icon" aria-hidden="true">
          {getStageIcon()}
        </span>
        <span className="stage-message">
          {getStageMessage()}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="progress-bar-container">
        <div 
          className="progress-bar"
          style={{ width: `${currentProgress}%` }}
          role="progressbar"
          aria-valuenow={currentProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${currentProgress}%`}
        />
      </div>
      
      {/* Percentage display */}
      <div className="progress-percentage">
        {currentProgress}% complete
      </div>
      
      {/* Additional hints based on stage */}
      {stage === 'scraping' && (
        <p className="progress-hint">
          This may take longer for JavaScript-heavy websites...
        </p>
      )}
      
      {stage === 'generating' && (
        <p className="progress-hint">
          Almost there! Our AI is crafting your LLMS.txt file...
        </p>
      )}
      
      {stage === 'error' && (
        <p className="progress-hint error-hint">
          Check that the URL is correct and the website is accessible.
        </p>
      )}
    </div>
  );
}