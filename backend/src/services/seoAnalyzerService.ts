import * as cheerio from 'cheerio';
import { SeoData, LinkData } from '../models/url.model';
import { isExternalUrl } from '../utils/urlUtils';

export class SeoAnalyzerService {
  /**
   * Analyze a webpage for SEO metrics and insights
   */
  analyze(html: string, url: string): SeoData {
    const $ = cheerio.load(html);
    
    // Extract basic SEO data
    const title = $('title').text().trim();
    const description = $('meta[name="description"]').attr('content') || '';
    const keywords = $('meta[name="keywords"]').attr('content')?.split(',').map(k => k.trim()) || [];
    const canonicalUrl = $('link[rel="canonical"]').attr('href') || '';
    const metaRobots = $('meta[name="robots"]').attr('content') || '';
    
    // Count heading elements
    const h1Count = $('h1').length;
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;
    
    // Image analysis
    const images = $('img');
    const imageCount = images.length;
    let imagesWithoutAlt = 0;
    
    images.each((_, el) => {
      if (!$(el).attr('alt')) {
        imagesWithoutAlt++;
      }
    });
    
    // Check for required meta tags
    const hasViewport = $('meta[name="viewport"]').length > 0;
    
    // Check for social media tags
    const hasOpenGraph = $('meta[property^="og:"]').length > 0;
    const hasTwitterCard = $('meta[name^="twitter:"]').length > 0;
    
    // Check for structured data
    const hasSchema = $('script[type="application/ld+json"]').length > 0 || 
      html.includes('itemtype="http://schema.org/');
    
    // Count words in the main content
    // This is a simple implementation; a more sophisticated one would exclude navigation, footers, etc.
    const bodyText = $('body').text();
    const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Analyze links
    const links = this.extractLinks($, url);
    const internalLinks = links.filter(link => !link.isExternal).length;
    const externalLinks = links.filter(link => link.isExternal).length;
    
    return {
      title,
      description,
      keywords,
      canonicalUrl,
      h1Count,
      h2Count,
      h3Count,
      imageCount,
      imagesWithoutAlt,
      wordCount,
      metaRobots,
      hasViewport,
      hasOpenGraph,
      hasTwitterCard,
      hasSchema,
      internalLinks,
      externalLinks
    };
  }
  
  /**
   * Extract all links from a webpage
   */
  extractLinks($: cheerio.CheerioAPI, baseUrl: string): LinkData[] {
    const links: LinkData[] = [];
    
    $('a').each((_, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      
      if (!href) return;
      
      const linkData: LinkData = {
        url: href,
        text: $link.text().trim(),
        isExternal: isExternalUrl(href, baseUrl),
        isFollow: !$link.attr('rel')?.includes('nofollow')
      };
      
      links.push(linkData);
    });
    
    return links;
  }
  
  /**
   * Generate SEO recommendations based on analysis
   */
  generateRecommendations(seoData: SeoData): string[] {
    const recommendations: string[] = [];
    
    // Title recommendations
    if (!seoData.title) {
      recommendations.push('Add a title tag to the page');
    } else if (seoData.title.length < 30) {
      recommendations.push('Title tag is too short (ideally 50-60 characters)');
    } else if (seoData.title.length > 60) {
      recommendations.push('Title tag is too long (ideally 50-60 characters)');
    }
    
    // Meta description recommendations
    if (!seoData.description) {
      recommendations.push('Add a meta description to the page');
    } else if (seoData.description.length < 120) {
      recommendations.push('Meta description is too short (ideally 150-160 characters)');
    } else if (seoData.description.length > 160) {
      recommendations.push('Meta description is too long (ideally 150-160 characters)');
    }
    
    // Heading structure
    if (seoData.h1Count === 0) {
      recommendations.push('Add an H1 heading to the page');
    } else if (seoData.h1Count > 1) {
      recommendations.push('Multiple H1 headings detected - consider using only one main H1');
    }
    
    // Image optimization
    if (seoData.imagesWithoutAlt > 0) {
      recommendations.push(`${seoData.imagesWithoutAlt} images are missing alt text`);
    }
    
    // Mobile optimization
    if (!seoData.hasViewport) {
      recommendations.push('Add a viewport meta tag for mobile optimization');
    }
    
    // Social media optimization
    if (!seoData.hasOpenGraph) {
      recommendations.push('Add Open Graph meta tags for better social media sharing');
    }
    
    if (!seoData.hasTwitterCard) {
      recommendations.push('Add Twitter Card meta tags for better Twitter sharing');
    }
    
    // Structured data
    if (!seoData.hasSchema) {
      recommendations.push('Add structured data (Schema.org) to improve search results');
    }
    
    // Content analysis
    if (seoData.wordCount < 300) {
      recommendations.push('Content is thin (less than 300 words). Consider adding more content.');
    }
    
    return recommendations;
  }
}