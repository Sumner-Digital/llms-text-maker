// Root Layout Component
// This wraps all pages in our application

import type { Metadata } from 'next';
import '@/styles/main.css';

/**
 * Metadata for SEO and social sharing
 * This information appears in search results and when sharing links
 */
export const metadata: Metadata = {
  title: 'LLMS Text Maker - Generate AI-Optimized LLMS.txt Files',
  description: 'Automatically generate LLMS.txt files for your website to help AI assistants understand your business. Free, fast, and optimized for all types of companies.',
  keywords: 'LLMS.txt, AI optimization, LLM optimization, website AI readability, structured data',
  authors: [{ name: 'LLMS Text Maker' }],
  
  // Open Graph tags for social media
  openGraph: {
    title: 'LLMS Text Maker',
    description: 'Generate AI-optimized LLMS.txt files for your website',
    type: 'website',
    locale: 'en_US',
  },
  
  // Twitter card tags
  twitter: {
    card: 'summary_large_image',
    title: 'LLMS Text Maker',
    description: 'Generate AI-optimized LLMS.txt files for your website',
  },
  
  // Robots directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Viewport settings for responsive design
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  
  // Icons
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

/**
 * Root Layout Component
 * This component wraps every page in our application
 * It's like the foundation and walls of a house - everything else goes inside
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Additional meta tags for iframe compatibility */}
        <meta httpEquiv="X-Frame-Options" content="ALLOWALL" />
        <meta name="referrer" content="no-referrer-when-downgrade" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
      </head>
      
      <body>
        {/* Main content area where pages are rendered */}
        <div id="root">
          {children}
        </div>
        
        {/* No analytics or tracking scripts to respect privacy and keep the app fast */}
      </body>
    </html>
  );
}