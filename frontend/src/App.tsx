import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast, Toaster } from 'sonner';

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
      const response = await fetch('http://localhost:4000/api/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) throw new Error('Crawling failed');

      const result = await response.json();
      setResults([result, ...results]);
      toast.success('URL crawled successfully');
    } catch (error) {
      toast.error('Failed to crawl URL');
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">URL Crawler Pro</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 mb-8">
          <div>
            <Label htmlFor="url">Enter URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isLoading}
            />
          </div>
          
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Crawling...' : 'Start Crawling'}
          </Button>

          {isLoading && (
            <Progress value={progress} className="w-full" />
          )}
        </form>

        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">{result.url}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <p>{result.status}</p>
                </div>
                <div>
                  <Label>Load Time</Label>
                  <p>{result.loadTime}ms</p>
                </div>
                <div className="col-span-2">
                  <Label>Title</Label>
                  <p>{result.title}</p>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <p>{result.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Toaster />
    </div>
  );
}