import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CrawlResult, formatLoadTime, cn } from "@/lib/utils";

interface ResultCardProps {
  result: CrawlResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const isSuccess = result.status >= 200 && result.status < 300;
  
  return (
    <div className="bg-card text-card-foreground p-6 rounded-lg shadow-md border border-border">
      <div className="flex justify-between items-start mb-4 pb-2 border-b">
        <h2 className="text-xl font-semibold truncate flex-1">{result.url}</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={isSuccess ? "success" : "destructive"}>
            {isSuccess ? "Success" : "Failed"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <p className={cn(
            "text-sm font-medium",
            isSuccess ? "text-green-500" : "text-destructive"
          )}>
            {result.status}
          </p>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Response Time</Label>
          <p className="text-sm font-medium">{formatLoadTime(result.responseTime)}</p>
        </div>
        
        {result.seoData?.wordCount && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Word Count</Label>
            <p className="text-sm font-medium">{result.seoData.wordCount}</p>
          </div>
        )}
        
        <div className="col-span-2 space-y-1 pt-2 border-t">
          <Label className="text-xs text-muted-foreground">Title</Label>
          <p className="text-sm">{result.title}</p>
        </div>
        
        <div className="col-span-2 space-y-1 pt-2 border-t">
          <Label className="text-xs text-muted-foreground">Description</Label>
          <p className="text-sm">{result.description}</p>
        </div>

        {result.seoData && (
          <div className="col-span-2 space-y-2 pt-2 border-t">
            <Label className="text-xs text-muted-foreground">SEO Analysis</Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex">
                <span className="font-medium min-w-32">H1 Tags:</span>
                <span className="text-muted-foreground">{result.seoData.h1Count}</span>
              </div>
              <div className="flex">
                <span className="font-medium min-w-32">H2 Tags:</span>
                <span className="text-muted-foreground">{result.seoData.h2Count}</span>
              </div>
              <div className="flex">
                <span className="font-medium min-w-32">Images:</span>
                <span className="text-muted-foreground">{result.seoData.imageCount}</span>
              </div>
              <div className="flex">
                <span className="font-medium min-w-32">Missing Alt:</span>
                <span className={cn(
                  "text-muted-foreground", 
                  result.seoData.imagesWithoutAlt > 0 ? "text-destructive" : ""
                )}>
                  {result.seoData.imagesWithoutAlt}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium min-w-32">Viewport:</span>
                <span className={cn(
                  "text-muted-foreground",
                  result.seoData.hasViewport ? "text-green-500" : "text-destructive"
                )}>
                  {result.seoData.hasViewport ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium min-w-32">Open Graph:</span>
                <span className={cn(
                  "text-muted-foreground",
                  result.seoData.hasOpenGraph ? "text-green-500" : "text-destructive"
                )}>
                  {result.seoData.hasOpenGraph ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium min-w-32">Twitter Card:</span>
                <span className={cn(
                  "text-muted-foreground",
                  result.seoData.hasTwitterCard ? "text-green-500" : "text-destructive"
                )}>
                  {result.seoData.hasTwitterCard ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex">
                <span className="font-medium min-w-32">Schema:</span>
                <span className={cn(
                  "text-muted-foreground",
                  result.seoData.hasSchema ? "text-green-500" : "text-destructive"
                )}>
                  {result.seoData.hasSchema ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        )}

        {result.links && result.links.length > 0 && (
          <div className="col-span-2 space-y-2 pt-2 border-t">
            <Label className="text-xs text-muted-foreground">
              Links ({result.links.length})
            </Label>
            <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto text-xs">
              {result.links.map((link, i) => (
                <div key={i} className="flex items-center">
                  <Badge 
                    variant={link.isExternal ? "warning" : "success"} 
                    className="mr-2 w-2 h-2 p-0"
                  />
                  <span className="truncate">{link.text || link.url}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}