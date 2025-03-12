import React from 'react';
import { Button } from '@/components/ui/button';

interface HeaderSectionProps {
  onClearResults: () => void;
  hasResults: boolean;
}

export function HeaderSection({ onClearResults, hasResults }: HeaderSectionProps) {
  return (
    <div className="flex flex-col items-center space-y-4 mb-8">
      <h1 className="text-3xl font-bold text-center">URL Crawler Pro</h1>
      <p className="text-muted-foreground text-center max-w-xl">
        Analyze websites for SEO optimization. Enter a URL below to crawl the page
        and get detailed information about its structure, content, and meta tags.
      </p>
      
      {hasResults && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClearResults}
          className="mt-2"
        >
          Clear Results
        </Button>
      )}
    </div>
  );
}