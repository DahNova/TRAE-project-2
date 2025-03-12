import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { config } from '../config/environment';
import { logger } from '../config/logger';

interface FetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
  followRedirects?: boolean;
  useProxy?: boolean;
  proxyUrl?: string;
}

interface FetchResult {
  data: string;
  status: number;
  headers: Record<string, string>;
  redirectChain: string[];
  responseTime: number;
  url: string;
}

/**
 * Service for handling HTTP requests with features like proxy support,
 * timeouts, redirect tracking, and response time measurement
 */
export class HttpService {
  private proxyList: string[];
  private currentProxyIndex: number = 0;

  constructor() {
    this.proxyList = config.proxies;
  }

  /**
   * Get the next proxy in the rotation
   */
  private getNextProxy(): string | undefined {
    if (this.proxyList.length === 0) return undefined;
    
    const proxy = this.proxyList[this.currentProxyIndex];
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    return proxy;
  }

  /**
   * Fetch a URL with advanced options
   */
  async fetch(url: string, options: FetchOptions = {}): Promise<FetchResult> {
    const startTime = Date.now();
    const redirectChain: string[] = [];
    
    // Configure request
    const axiosConfig: AxiosRequestConfig = {
      timeout: options.timeout || config.timeouts.httpRequestTimeout,
      headers: {
        'User-Agent': config.userAgent,
        ...options.headers,
      },
      maxRedirects: options.followRedirects ? 10 : 0,
      validateStatus: (status) => true, // Don't throw on any status code
    };

    // Add proxy if enabled
    if (options.useProxy) {
      const proxyUrl = options.proxyUrl || this.getNextProxy();
      if (proxyUrl) {
        logger.debug(`Using proxy for request: ${url}`);
        
        if (url.startsWith('https:')) {
          axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
        } else {
          axiosConfig.httpAgent = new HttpProxyAgent(proxyUrl);
        }
      }
    }

    try {
      // Track redirects
      if (options.followRedirects) {
        const originalAdapter = axios.defaults.adapter;
        axios.defaults.adapter = async (config) => {
          // @ts-ignore - we know originalAdapter exists
          const response = await originalAdapter(config);
          if (response.status >= 300 && response.status < 400 && response.headers.location) {
            redirectChain.push(response.config.url as string);
          }
          return response;
        };
      }

      // Make the request
      const response: AxiosResponse = await axios.get(url, axiosConfig);
      
      // Reset adapter if we modified it
      if (options.followRedirects) {
        // @ts-ignore - we're just resetting the adapter
        axios.defaults.adapter = undefined;
      }

      const responseTime = Date.now() - startTime;
      
      return {
        data: response.data,
        status: response.status,
        headers: response.headers as Record<string, string>,
        redirectChain,
        responseTime,
        url: response.config.url || url,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error(`Error fetching ${url}:`, error);
      
      return {
        data: '',
        status: error.response?.status || 0,
        headers: error.response?.headers || {},
        redirectChain,
        responseTime,
        url,
      };
    }
  }
}