import { URL } from 'url';

/**
 * Normalizes a URL by removing trailing slashes, standardizing protocol, etc.
 */
export function normalizeUrl(url: string): string {
  try {
    // Handle relative URLs or URLs without protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('//')) {
        url = `https:${url}`;
      } else if (!url.startsWith('/')) {
        url = `/${url}`;
      }
    }

    // For absolute URLs, use URL API to normalize
    if (url.startsWith('http')) {
      const parsedUrl = new URL(url);
      // Remove trailing slash from pathname except for root
      if (parsedUrl.pathname.length > 1 && parsedUrl.pathname.endsWith('/')) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
      }
      return parsedUrl.toString();
    }

    return url;
  } catch (error) {
    return url; // Return original if parsing fails
  }
}

/**
 * Determines if a URL is external based on the base URL
 */
export function isExternalUrl(url: string, baseUrl: string): boolean {
  try {
    // Convert to absolute URL if it's relative
    const absoluteUrl = resolveUrl(url, baseUrl);
    const parsedUrl = new URL(absoluteUrl);
    const parsedBaseUrl = new URL(baseUrl);
    
    return parsedUrl.hostname !== parsedBaseUrl.hostname;
  } catch (error) {
    return false; // Assume internal if parsing fails
  }
}

/**
 * Resolves a relative URL to absolute using the base URL
 */
export function resolveUrl(relativeUrl: string, baseUrl: string): string {
  try {
    // Check if it's already absolute
    new URL(relativeUrl);
    return relativeUrl;
  } catch {
    // It's relative, so resolve against base URL
    const base = new URL(baseUrl);
    return new URL(relativeUrl, base).toString();
  }
}

/**
 * Extracts the domain from a URL
 */
export function extractDomain(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    return '';
  }
}

/**
 * Checks if a URL should be excluded from crawling (e.g., file downloads, mailto, tel, etc.)
 */
export function shouldExcludeUrl(url: string): boolean {
  const excludedProtocols = ['mailto:', 'tel:', 'javascript:', 'ftp:'];
  const excludedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.exe', '.jpg', '.jpeg', '.png', '.gif'];
  
  if (excludedProtocols.some(protocol => url.startsWith(protocol))) {
    return true;
  }
  
  if (excludedExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
    return true;
  }
  
  return false;
}

/**
 * Extracts path segments from a URL for easy analysis
 */
export function getPathSegments(url: string): string[] {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.split('/').filter(segment => segment.length > 0);
  } catch (error) {
    return [];
  }
}