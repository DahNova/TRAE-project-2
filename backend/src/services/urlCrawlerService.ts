import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import { UrlCheckRequest, UrlResponse, LinkData, CrawlSession } from '../models/url.model';
import { HttpService } from './httpService';
import { SeoAnalyzerService } from './seoAnalyzerService';
import { normalizeUrl, isExternalUrl, resolveUrl, shouldExcludeUrl, extractDomain } from '../utils/urlUtils';
import { logger } from '../config/logger';
import { config } from '../config/environment';

/**
 * Service for crawling URLs and analyzing them
 */
export class UrlCrawlerService {
  private httpService: HttpService;
  private seoAnalyzer: SeoAnalyzerService;
  private activeCrawlSessions: Map<string, CrawlSession>;

  constructor() {
    this.httpService = new HttpService();
    this.seoAnalyzer = new SeoAnalyzerService();
    this.activeCrawlSessions = new Map();
  }

  /**
   * Check a single URL and analyze it
   */
  async checkUrl(url: string): Promise<UrlResponse> {
    try {
      const normalizedUrl = normalizeUrl(url);
      logger.info(`Checking URL: ${normalizedUrl}`);
      
      const response = await this.httpService.fetch(normalizedUrl, {
        followRedirects: true,
      });
      
      let title = '';
      let description = '';
      let h1 = '';
      let links: LinkData[] = [];
      let seoData = undefined;
      
      // Only parse HTML content
      if (response.status === 200 && 
          response.headers['content-type']?.includes('text/html')) {
        const $ = cheerio.load(response.data);
        
        title = $('title').text().trim();
        description = $('meta[name="description"]').attr('content') || '';
        h1 = $('h1').first().text().trim();
        
        // Extract links
        links = this.seoAnalyzer.extractLinks($, normalizedUrl);
        
        // Analyze SEO data
        seoData = this.seoAnalyzer.analyze(response.data, normalizedUrl);
      }
      
      return {
        url: normalizedUrl,
        status: response.status,
        title,
        description,
        h1,
        responseTime: response.responseTime,
        contentLength: parseInt(response.headers['content-length'] || '0'),
        contentType: response.headers['content-type'],
        redirectChain: response.redirectChain,
        links,
        seoData,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error checking URL ${url}:`, error);
      
      return {
        url,
        status: 0,
        responseTime: 0,
        errors: [error.message],
        timestamp: new Date()
      };
    }
  }

  /**
   * Start a new crawl session
   */
  async startCrawl(request: UrlCheckRequest): Promise<string> {
    const sessionId = uuidv4();
    const startUrl = normalizeUrl(request.url);
    const depth = request.depth || 1;
    const followExternalLinks = request.followExternalLinks || false;
    const maxPages = request.maxPages || 100;
    
    logger.info(`Starting new crawl session: ${sessionId} for URL: ${startUrl}`);
    
    const crawlSession: CrawlSession = {
      id: sessionId,
      startUrl,
      crawledUrls: [],
      startTime: new Date(),
      status: 'running',
      stats: {
        totalUrls: 0,
        successUrls: 0,
        failedUrls: 0,
        avgResponseTime: 0
      }
    };
    
    this.activeCrawlSessions.set(sessionId, crawlSession);
    
    // Start crawling asynchronously
    this.crawlRecursive(sessionId, startUrl, depth, followExternalLinks, maxPages);
    
    return sessionId;
  }

  /**
   * Recursively crawl URLs up to the specified depth
   */
  private async crawlRecursive(
    sessionId: string, 
    url: string, 
    depth: number, 
    followExternalLinks: boolean, 
    maxPages: number, 
    visited: Set<string> = new Set(), 
    currentDepth: number = 0
  ): Promise<void> {
    // Get the crawl session
    const session = this.activeCrawlSessions.get(sessionId);
    if (!session || session.status !== 'running') {
      return;
    }
    
    // Check if we've reached the maximum pages
    if (session.crawledUrls.length >= maxPages) {
      this.completeCrawlSession(sessionId);
      return;
    }
    
    // Skip if URL has been visited
    const normalizedUrl = normalizeUrl(url);
    if (visited.has(normalizedUrl)) {
      return;
    }
    
    // Mark URL as visited
    visited.add(normalizedUrl);
    
    try {
      // Check the URL
      const result = await this.checkUrl(normalizedUrl);
      
      // Update session with results
      session.crawledUrls.push(result);
      
      // Update stats
      session.stats.totalUrls++;
      if (result.status >= 200 && result.status < 400) {
        session.stats.successUrls++;
      } else {
        session.stats.failedUrls++;
      }
      
      const totalResponseTime = session.crawledUrls.reduce((sum, url) => sum + url.responseTime, 0);
      session.stats.avgResponseTime = totalResponseTime / session.crawledUrls.length;
      
      // Stop if we've reached the maximum depth
      if (currentDepth >= depth) {
        // If we're at the last level of depth and have processed all URLs, complete the session
        if (currentDepth === depth) {
          this.completeCrawlSession(sessionId);
        }
        return;
      }
      
      // Extract links for the next level
      const links = result.links || [];
      const baseDomain = extractDomain(normalizedUrl);
      
      // Filter links based on criteria
      const linksToCrawl = links.filter(link => {
        // Skip non-HTTP(S) links
        if (shouldExcludeUrl(link.url)) {
          return false;
        }
        
        // Resolve relative URLs
        const absoluteUrl = resolveUrl(link.url, normalizedUrl);
        
        // Check if external
        const external = isExternalUrl(absoluteUrl, normalizedUrl);
        
        // Skip external links if not following them
        if (external && !followExternalLinks) {
          return false;
        }
        
        // Skip nofollow links
        if (!link.isFollow) {
          return false;
        }
        
        return true;
      });
      
      // Introduce delay between requests
      const requestDelay = config.concurrency.requestDelay;
      
      // Crawl the next level of links with a delay between requests
      for (const link of linksToCrawl) {
        if (session.status !== 'running') {
          break;
        }
        
        const absoluteUrl = resolveUrl(link.url, normalizedUrl);
        
        // Add a delay between requests to be polite to servers
        await new Promise(resolve => setTimeout(resolve, requestDelay));
        
        await this.crawlRecursive(
          sessionId,
          absoluteUrl,
          depth,
          followExternalLinks,
          maxPages,
          visited,
          currentDepth + 1
        );
      }
      
      // If this was the entry point, complete the session
      if (currentDepth === 0) {
        this.completeCrawlSession(sessionId);
      }
    } catch (error) {
      logger.error(`Error during crawl of ${normalizedUrl}:`, error);
      
      // Update session with error
      session.stats.totalUrls++;
      session.stats.failedUrls++;
      
      session.crawledUrls.push({
        url: normalizedUrl,
        status: 0,
        responseTime: 0,
        errors: [error.message],
        timestamp: new Date()
      });
      
      // If this was the entry point and it failed, complete the session
      if (currentDepth === 0) {
        this.completeCrawlSession(sessionId);
      }
    }
  }

  /**
   * Mark a crawl session as complete
   */
  private completeCrawlSession(sessionId: string): void {
    const session = this.activeCrawlSessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = new Date();
      logger.info(`Crawl session completed: ${sessionId}`);
    }
  }

  /**
   * Get the status of a crawl session
   */
  getCrawlStatus(sessionId: string): CrawlSession | null {
    return this.activeCrawlSessions.get(sessionId) || null;
  }

  /**
   * Cancel an active crawl session
   */
  cancelCrawl(sessionId: string): boolean {
    const session = this.activeCrawlSessions.get(sessionId);
    if (session && (session.status === 'running' || session.status === 'pending')) {
      session.status = 'failed';
      session.endTime = new Date();
      logger.info(`Crawl session cancelled: ${sessionId}`);
      return true;
    }
    return false;
  }
}