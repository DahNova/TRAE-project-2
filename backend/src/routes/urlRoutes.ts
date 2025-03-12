import { Router } from 'express';
import { UrlController } from '../controllers/urlController';
import { rateLimit } from 'express-rate-limit';
import { config } from '../config/environment';

// Create router
const router = Router();
const urlController = new UrlController();

// Create rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: config.rateLimiting.duration * 1000, // Convert to milliseconds
  limit: config.rateLimiting.points,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' }
});

// Single URL check endpoint
router.post('/check', apiLimiter, (req, res) => urlController.checkUrl(req, res));

// Crawl session endpoints
router.post('/crawl', apiLimiter, (req, res) => urlController.startCrawl(req, res));
router.get('/crawl/:sessionId', (req, res) => urlController.getCrawlStatus(req, res));
router.delete('/crawl/:sessionId', (req, res) => urlController.cancelCrawl(req, res));

export default router;