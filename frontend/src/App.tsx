import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CrawlResult {
  url: string;
  status: number;
  title: string;
  description: string;
  loadTime: number;
}

export default function App() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<CrawlResult[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const response = await fetch('http://localhost:4000/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      clearInterval(progressInterval);

      if (!response.ok) throw new Error('Crawling failed');

      // For demo, create a mock result if API isn't available yet
      // Remove this mock when backend is ready
      const mockResult = {
        url,
        status: 200,
        title: 'Sample Page Title',
        description: 'This is a sample meta description for the crawled page. In a real scenario, this would be extracted from the page\'s meta tags.',
        loadTime: 350
      };

      // Use actual response data when available
      // const result = await response.json();
      const result = mockResult;
      
      setResults([result, ...results]);
      toast.success('URL crawled successfully');
    } catch (error) {
      toast.error('Failed to crawl URL');
    } finally {
      setIsLoading(false);
      setProgress(100);

      // Reset progress after delay
      setTimeout(() => {
        setProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">URL Crawler Pro</h1>
        
        <div className="bg-card p-6 rounded-lg shadow-md mb-8 border border-border">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-sm font-medium">Enter URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              variant="default"
              size="lg"
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Crawling...' : 'Start Crawling'}
            </Button>

            {isLoading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Crawling in progress...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </form>
        </div>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border">
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b">{result.url}</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className={cn(
                    "text-sm font-medium",
                    result.status >= 200 && result.status < 300 ? "text-green-500" : "text-destructive"
                  )}>
                    {result.status}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Load Time</Label>
                  <p className="text-sm font-medium">{result.loadTime}ms</p>
                </div>
                <div className="col-span-2 space-y-1 pt-2 border-t">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <p className="text-sm">{result.title}</p>
                </div>
                <div className="col-span-2 space-y-1 pt-2 border-t">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm">{result.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}