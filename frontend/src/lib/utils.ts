import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_BASE_URL = 'http://localhost:4000';

export interface CrawlResult {
  url: string;
  status: number;
  title?: string;
  description?: string;
  h1?: string;
  responseTime: number;
  contentLength?: number;
  contentType?: string;
  redirectChain?: string[];
  
  // SEO data
  seoData?: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonicalUrl?: string;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    imageCount: number;
    imagesWithoutAlt: number;
    wordCount: number;
    metaRobots?: string;
    hasViewport: boolean;
    hasOpenGraph: boolean;
    hasTwitterCard: boolean;
    hasSchema: boolean;
    internalLinks: number;
    externalLinks: number;
    brokenLinks?: { url: string; status: number }[];
  };
  
  links?: Array<{
    url: string;
    text: string;
    isExternal: boolean;
    isFollow: boolean;
  }>;
  
  errors?: string[];
  timestamp: Date;
}

// Helper to show formatted time
export function formatLoadTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Helper to determine if a URL is valid
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}
