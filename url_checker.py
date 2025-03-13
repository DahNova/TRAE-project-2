import asyncio
import aiohttp
from bs4 import BeautifulSoup
import time
import csv
import json
from urllib.parse import urlparse, urljoin
import logging
from typing import List, Dict, Any, Set, Optional
import re

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('URLChecker')

class URLChecker:
    def __init__(self, concurrency: int = 10, max_depth: int = 3, timeout: int = 30,
                 user_agent: str = 'URLChecker Bot/1.0', same_domain_only: bool = True):
        """
        Initialize URL Checker with configuration options
        
        Args:
            concurrency: Number of concurrent requests
            max_depth: Maximum depth to crawl
            timeout: Timeout for requests in seconds
            user_agent: User agent string for requests
            same_domain_only: Whether to only crawl URLs from the same domain
        """
        self.concurrency = concurrency
        self.max_depth = max_depth
        self.timeout = timeout
        self.user_agent = user_agent
        self.same_domain_only = same_domain_only
        
        self.results = []
        self.visited = set()
        self.session = None
        self.start_time = time.time()
        
        # Store original domains to check
        self.allowed_domains = set()

    async def _create_session(self):
        """Create aiohttp session with default headers"""
        return aiohttp.ClientSession(
            headers={
                'User-Agent': self.user_agent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout=aiohttp.ClientTimeout(total=self.timeout)
        )

    async def check_url(self, url: str, depth: int = 0) -> Dict[str, Any]:
        """
        Check a single URL and return its details
        
        Args:
            url: URL to check
            depth: Current crawl depth
            
        Returns:
            Dict containing URL check results
        """
        if depth > self.max_depth:
            return {'url': url, 'status': 'skipped', 'reason': 'max_depth_exceeded'}
        
        result = {
            'url': url,
            'checked_at': time.strftime('%Y-%m-%d %H:%M:%S'),
            'depth': depth,
        }
        
        try:
            start_time = time.time()
            
            # Normalize URL
            parsed_url = urlparse(url)
            if not parsed_url.scheme:
                url = f"http://{url}"
            
            async with self.session.get(url, allow_redirects=True) as response:
                result['status_code'] = response.status
                result['response_time'] = round(time.time() - start_time, 2)
                result['content_type'] = response.headers.get('Content-Type', '')
                result['content_length'] = int(response.headers.get('Content-Length', 0))
                result['redirect_chain'] = [str(r.url) for r in response.history]
                result['final_url'] = str(response.url)
                
                # Only process HTML content
                if 'text/html' in result['content_type'].lower():
                    try:
                        content = await response.text()
                        # Parse HTML content
                        soup = BeautifulSoup(content, 'html.parser')
                        
                        # Extract metadata
                        result['title'] = soup.title.string.strip() if soup.title else None
                        meta_desc = soup.find('meta', attrs={'name': 'description'})
                        result['meta_description'] = meta_desc['content'] if meta_desc else None
                        
                        # Extract canonical URL
                        canonical = soup.find('link', {'rel': 'canonical'})
                        result['canonical'] = canonical['href'] if canonical else None
                        
                        # Check if canonical matches current URL
                        if result['canonical'] and result['canonical'] != url:
                            result['canonical_matches'] = False
                        else:
                            result['canonical_matches'] = True
                        
                        # Extract hreflang tags
                        hreflangs = {}
                        for tag in soup.find_all('link', {'rel': 'alternate'}):
                            if tag.get('hreflang'):
                                hreflangs[tag['hreflang']] = tag['href']
                        result['hreflangs'] = hreflangs
                        
                        # Extract robots meta tag
                        robots = soup.find('meta', attrs={'name': 'robots'})
                        result['robots'] = robots['content'] if robots else None
                        
                        # Check for noindex, nofollow
                        result['noindex'] = 'noindex' in (result['robots'] or '')
                        result['nofollow'] = 'nofollow' in (result['robots'] or '')
                        
                        # Extract and process links
                        links = []
                        for a in soup.find_all('a', href=True):
                            link = a['href'].strip()
                            if link and not link.startswith(('#', 'javascript:', 'mailto:', 'tel:')):
                                # Normalize link
                                absolute_link = urljoin(url, link)
                                links.append({
                                    'url': absolute_link,
                                    'text': a.get_text(strip=True) or '',
                                    'nofollow': 'nofollow' in (a.get('rel', '') or '')
                                })
                        
                        result['links'] = links
                        
                        # Count links
                        result['link_count'] = len(links)
                        
                        # Extract images
                        images = []
                        for img in soup.find_all('img', src=True):
                            img_src = img['src'].strip()
                            if img_src:
                                absolute_src = urljoin(url, img_src)
                                images.append({
                                    'src': absolute_src,
                                    'alt': img.get('alt', '') or '',
                                    'title': img.get('title', '') or ''
                                })
                        
                        result['images'] = images
                        result['image_count'] = len(images)
                        
                        # Extract h1 tags
                        h1_tags = [h1.get_text(strip=True) for h1 in soup.find_all('h1')]
                        result['h1_tags'] = h1_tags
                        result['h1_count'] = len(h1_tags)
                        
                    except Exception as e:
                        result['parsing_error'] = f"{type(e).__name__}: {str(e)}"
                
                # Add headers info
                result['headers'] = dict(response.headers)
                
                # Check for common SEO issues
                issues = []
                
                if result.get('title') and len(result.get('title', '')) > 60:
                    issues.append('Title too long (> 60 characters)')
                
                if result.get('meta_description') and len(result.get('meta_description', '')) > 160:
                    issues.append('Meta description too long (> 160 characters)')
                
                if result.get('h1_count', 0) == 0:
                    issues.append('Missing H1 tag')
                
                if result.get('h1_count', 0) > 1:
                    issues.append('Multiple H1 tags')
                
                result['seo_issues'] = issues
                
                return result
                
        except asyncio.TimeoutError:
            return {'url': url, 'status': 'error', 'error': 'Request timeout', 'depth': depth}
        except aiohttp.ClientError as e:
            return {'url': url, 'status': 'error', 'error': f'Client error: {str(e)}', 'depth': depth}
        except Exception as e:
            return {'url': url, 'status': 'error', 'error': f'{type(e).__name__}: {str(e)}', 'depth': depth}

    async def worker(self, queue):
        """Process URLs from the queue"""
        while True:
            url, depth = await queue.get()
            
            try:
                if url not in self.visited:
                    logger.info(f"Checking URL: {url} (depth: {depth})")
                    self.visited.add(url)
                    
                    result = await self.check_url(url, depth)
                    self.results.append(result)
                    
                    # Add links to queue if not at max depth
                    if depth < self.max_depth and not result.get('nofollow', False):
                        for link_info in result.get('links', []):
                            link = link_info['url']
                            
                            # Skip if nofollow or already visited
                            if link_info.get('nofollow') or link in self.visited:
                                continue
                                
                            # Parse URL
                            parsed = urlparse(link)
                            
                            # Skip if not http(s)
                            if parsed.scheme not in ('http', 'https'):
                                continue
                            
                            # Skip if same domain only and domain doesn't match
                            if self.same_domain_only:
                                link_domain = parsed.netloc
                                if not any(link_domain == domain or link_domain.endswith(f".{domain}") 
                                          for domain in self.allowed_domains):
                                    continue
                            
                            # Add to queue
                            await queue.put((link, depth + 1))
            except Exception as e:
                logger.error(f"Worker error processing {url}: {str(e)}")
            finally:
                queue.task_done()

    async def run(self, start_urls: List[str]):
        """
        Run the URL checker with the given start URLs
        
        Args:
            start_urls: List of URLs to start checking from
        """
        self.session = await self._create_session()
        
        # Extract domains from start URLs
        for url in start_urls:
            parsed = urlparse(url)
            if parsed.netloc:
                self.allowed_domains.add(parsed.netloc)
        
        queue = asyncio.Queue()
        
        # Add start URLs to queue
        for url in start_urls:
            await queue.put((url, 0))
        
        # Create worker tasks
        workers = [asyncio.create_task(self.worker(queue)) 
                  for _ in range(self.concurrency)]
        
        # Wait for all tasks to complete
        logger.info(f"Starting URL check with {self.concurrency} workers")
        start_time = time.time()
        await queue.join()
        total_time = time.time() - start_time
        logger.info(f"URL check completed in {total_time:.2f} seconds")
        
        # Cleanup
        for worker in workers:
            worker.cancel()
        
        await self.session.close()
        
        # Add summary
        self.summary = {
            'total_urls': len(self.results),
            'total_time': round(total_time, 2),
            'urls_per_second': round(len(self.results) / total_time, 2) if total_time > 0 else 0,
            'start_time': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(start_time)),
            'end_time': time.strftime('%Y-%m-%d %H:%M:%S'),
        }
        
        # Count status codes
        status_counts = {}
        for result in self.results:
            status = result.get('status_code')
            if status:
                status_counts[status] = status_counts.get(status, 0) + 1
        
        self.summary['status_counts'] = status_counts
        
        return self.results

    def export_csv(self, filename: str):
        """Export results to CSV file"""
        if not self.results:
            logger.warning("No results to export")
            return
        
        # Flatten results for CSV
        flat_results = []
        for result in self.results:
            flat_result = {k: v for k, v in result.items() 
                          if not isinstance(v, (list, dict)) and v is not None}
            
            # Convert lists to strings
            for key, value in result.items():
                if isinstance(value, list) and key != 'links' and key != 'images':
                    flat_result[key] = ', '.join(str(v) for v in value)
            
            flat_results.append(flat_result)
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            if flat_results:
                writer = csv.DictWriter(f, fieldnames=flat_results[0].keys())
                writer.writeheader()
                writer.writerows(flat_results)
                logger.info(f"Exported {len(flat_results)} results to {filename}")

    def export_json(self, filename: str):
        """Export results to JSON file"""
        if not self.results:
            logger.warning("No results to export")
            return
            
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                'summary': self.summary,
                'results': self.results
            }, f, indent=2, ensure_ascii=False)
            logger.info(f"Exported {len(self.results)} results to {filename}")

    def generate_report(self, filename: str):
        """Generate HTML report"""
        if not self.results:
            logger.warning("No results to generate report")
            return
            
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(f"""<!DOCTYPE html>
<html>
<head>
    <title>URL Checker Report</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
        h1, h2 {{ color: #333; }}
        table {{ border-collapse: collapse; width: 100%; margin-bottom: 20px; }}
        th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
        th {{ background-color: #f2f2f2; }}
        tr:nth-child(even) {{ background-color: #f9f9f9; }}
        .status-200 {{ color: green; }}
        .status-3xx {{ color: orange; }}
        .status-4xx, .status-5xx {{ color: red; }}
        .summary-box {{ background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
    </style>
</head>
<body>
    <h1>URL Checker Report</h1>
    
    <div class="summary-box">
        <h2>Summary</h2>
        <p>Total URLs: {self.summary['total_urls']}</p>
        <p>Total Time: {self.summary['total_time']} seconds</p>
        <p>URLs per Second: {self.summary['urls_per_second']}</p>
        <p>Start Time: {self.summary['start_time']}</p>
        <p>End Time: {self.summary['end_time']}</p>
        
        <h3>Status Codes</h3>
        <table>
            <tr>
                <th>Status Code</th>
                <th>Count</th>
            </tr>
            {
                ''.join(f'<tr><td>{status}</td><td>{count}</td></tr>' 
                    for status, count in self.summary['status_counts'].items())
            }
        </table>
    </div>
    
    <h2>Results</h2>
    <table>
        <tr>
            <th>URL</th>
            <th>Status</th>
            <th>Title</th>
            <th>Response Time</th>
            <th>Links</th>
            <th>Images</th>
            <th>Issues</th>
        </tr>
        {
            ''.join(f'''
                <tr>
                    <td><a href="{result['url']}" target="_blank">{result['url'][:50]}...</a></td>
                    <td class="status-{str(result.get('status_code', 0))[0]}xx">{result.get('status_code', 'Error')}</td>
                    <td>{result.get('title', 'N/A')}</td>
                    <td>{result.get('response_time', 'N/A')} s</td>
                    <td>{result.get('link_count', 0)}</td>
                    <td>{result.get('image_count', 0)}</td>
                    <td>{', '.join(result.get('seo_issues', []))}</td>
                </tr>
            ''' for result in self.results)
        }
    </table>
</body>
</html>
""")
            logger.info(f"Generated HTML report at {filename}")


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Advanced URL Checker - Similar to Screaming Frog')
    parser.add_argument('urls', nargs='+', help='URL(s) to check')
    parser.add_argument('--concurrency', type=int, default=10, help='Number of concurrent requests')
    parser.add_argument('--max-depth', type=int, default=3, help='Maximum crawl depth')
    parser.add_argument('--timeout', type=int, default=30, help='Request timeout in seconds')
    parser.add_argument('--user-agent', default='URLChecker Bot/1.0', help='User agent string')
    parser.add_argument('--same-domain', action='store_true', help='Only check URLs from the same domain')
    parser.add_argument('--csv', help='Export results to CSV file')
    parser.add_argument('--json', help='Export results to JSON file')
    parser.add_argument('--html-report', help='Generate HTML report')
    parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output')
    
    args = parser.parse_args()
    
    # Set logging level
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    
    # Run the URL checker
    checker = URLChecker(concurrency=args.concurrency, 
                         max_depth=args.max_depth,
                         timeout=args.timeout,
                         user_agent=args.user_agent,
                         same_domain_only=args.same_domain)
    
    try:
        asyncio.run(checker.run(args.urls))
        
        # Export results
        if args.csv:
            checker.export_csv(args.csv)
        if args.json:
            checker.export_json(args.json)
        if args.html_report:
            checker.generate_report(args.html_report)
        
        logger.info(f"URL check completed. Checked {len(checker.results)} URLs.")
    except KeyboardInterrupt:
        logger.info("URL check interrupted. Exporting partial results...")
        if args.csv:
            checker.export_csv(args.csv)
        if args.json:
            checker.export_json(args.json)
        if args.html_report:
            checker.generate_report(args.html_report)