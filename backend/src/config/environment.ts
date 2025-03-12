import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  rateLimiting: {
    points: parseInt(process.env.RATE_LIMIT_POINTS || '100'),
    duration: parseInt(process.env.RATE_LIMIT_DURATION || '900'), // 15 minutes in seconds
  },
  concurrency: {
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
    requestDelay: parseInt(process.env.REQUEST_DELAY || '200'), // ms between requests
  },
  timeouts: {
    httpRequestTimeout: parseInt(process.env.HTTP_REQUEST_TIMEOUT || '30000'), // 30s
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  proxies: process.env.PROXY_LIST ? process.env.PROXY_LIST.split(',') : [],
  userAgent: process.env.USER_AGENT || 'FastURLCrawler/1.0',
};