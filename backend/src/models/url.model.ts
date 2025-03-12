export interface UrlCheckRequest {
  url: string;
  depth?: number;
  followExternalLinks?: boolean;
  maxPages?: number;
  checkSeoOnly?: boolean;
}

export interface UrlResponse {
  url: string;
  status: number;
  title?: string;
  description?: string;
  h1?: string;
  responseTime: number;
  contentLength?: number;
  contentType?: string;
  redirectChain?: string[];
  links?: LinkData[];
  seoData?: SeoData;
  errors?: string[];
  timestamp: Date;
}

export interface LinkData {
  url: string;
  text: string;
  isExternal: boolean;
  isFollow: boolean;
}

export interface SeoData {
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
}

export interface CrawlSession {
  id: string;
  startUrl: string;
  crawledUrls: UrlResponse[];
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  stats: {
    totalUrls: number;
    successUrls: number;
    failedUrls: number;
    avgResponseTime: number;
  };
}