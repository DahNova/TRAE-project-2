import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const API_BASE_URL = 'http://localhost:4000';

export interface CrawlResult {
  url: string;
  status: number;
  title: string;
  description: string;
  loadTime: number;
  
  // Additional potential SEO data
  headers?: Record<string, string>;
  metaTags?: Record<string, string>;
  wordCount?: number;
  links?: Array<{
    url: string;
    text: string;
    isExternal: boolean;
  }>;
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
