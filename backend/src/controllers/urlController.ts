import { Request, Response } from 'express';
import { UrlCrawlerService } from '../services/urlCrawlerService';
import { UrlCheckRequest } from '../models/url.model';
import { logger } from '../config/logger';

export class UrlController {
  private crawlerService: UrlCrawlerService;

  constructor() {
    this.crawlerService = new UrlCrawlerService();
  }

  /**
   * Check a single URL
   */
  async checkUrl(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;
      
      if (!url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }
      
      logger.info(`Received request to check URL: ${url}`);
      const result = await this.crawlerService.checkUrl(url);
      
      res.json(result);
    } catch (error) {
      logger.error('Error in checkUrl controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Start a new crawl session
   */
  async startCrawl(req: Request, res: Response): Promise<void> {
    try {
      const crawlRequest: UrlCheckRequest = req.body;
      
      if (!crawlRequest.url) {
        res.status(400).json({ error: 'URL is required' });
        return;
      }
      
      logger.info(`Received request to start crawl for: ${crawlRequest.url}`);
      const sessionId = await this.crawlerService.startCrawl(crawlRequest);
      
      res.json({ 
        sessionId,
        message: 'Crawl session started successfully',
        status: 'running'
      });
    } catch (error) {
      logger.error('Error in startCrawl controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get the status of a crawl session
   */
  async getCrawlStatus(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
      }
      
      const status = this.crawlerService.getCrawlStatus(sessionId);
      
      if (!status) {
        res.status(404).json({ error: 'Crawl session not found' });
        return;
      }
      
      res.json(status);
    } catch (error) {
      logger.error('Error in getCrawlStatus controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Cancel an active crawl session
   */
  async cancelCrawl(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      if (!sessionId) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
      }
      
      const canceled = this.crawlerService.cancelCrawl(sessionId);
      
      if (!canceled) {
        res.status(404).json({ error: 'Crawl session not found or already completed' });
        return;
      }
      
      res.json({ message: 'Crawl session canceled successfully' });
    } catch (error) {
      logger.error('Error in cancelCrawl controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}