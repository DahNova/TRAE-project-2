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
          <Label className="text-xs text-muted-foreground">Load Time</Label>
          <p className="text-sm font-medium">{formatLoadTime(result.loadTime)}</p>
        </div>
        
        {result.wordCount && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Word Count</Label>
            <p className="text-sm font-medium">{result.wordCount}</p>
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

        {result.metaTags && Object.keys(result.metaTags).length > 0 && (
          <div className="col-span-2 space-y-2 pt-2 border-t">
            <Label className="text-xs text-muted-foreground">Meta Tags</Label>
            <div className="grid grid-cols-1 gap-1">
              {Object.entries(result.metaTags).map(([key, value]) => (
                <div key={key} className="flex text-xs">
                  <span className="font-medium min-w-32">{key}:</span>
                  <span className="text-muted-foreground truncate">{value}</span>
                </div>
              ))}
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