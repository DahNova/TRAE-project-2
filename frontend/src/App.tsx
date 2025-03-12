import { useState } from 'react';
import { CrawlResult } from '@/lib/utils';
import { CrawlForm } from '@/components/CrawlForm';
import { ResultCard } from '@/components/ResultCard';
import { HeaderSection } from '@/components/HeaderSection';
import { EmptyState } from '@/components/EmptyState';

export default function App() {
  const [results, setResults] = useState<CrawlResult[]>([]);

  const handleNewResult = (result: CrawlResult) => {
    setResults(prevResults => [result, ...prevResults]);
  };

  const handleClearResults = () => {
    setResults([]);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <HeaderSection 
          onClearResults={handleClearResults} 
          hasResults={results.length > 0} 
        />
        
        <CrawlForm onResultReceived={handleNewResult} />

        <div className="space-y-4">
          {results.length === 0 ? (
            <EmptyState />
          ) : (
            results.map((result, index) => (
              <ResultCard key={index} result={result} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}