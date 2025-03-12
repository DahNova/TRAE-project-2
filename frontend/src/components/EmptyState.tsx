import React from 'react';

export function EmptyState() {
  return (
    <div className="bg-card p-8 rounded-lg shadow-md border border-border text-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="rounded-full bg-muted p-3">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-muted-foreground"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-lg font-medium">No results yet</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Enter a URL above and click "Start Crawling" to analyze a website.
          The results will appear here.
        </p>
      </div>
    </div>
  );
}