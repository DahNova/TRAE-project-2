import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CrawlResult, formatLoadTime, cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table/table";

interface ResultCardProps {
  result: CrawlResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const isSuccess = result.status >= 200 && result.status < 300;
  
  // For debugging
  console.log("Rendering result:", result);
  
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

      {/* Basic Info */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Basic Information</h3>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Status</TableCell>
              <TableCell className={cn(isSuccess ? "text-green-500" : "text-destructive")}>
                {result.status}
              </TableCell>
              <TableCell className="font-medium">Response Time</TableCell>
              <TableCell>{formatLoadTime(result.responseTime)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Title</TableCell>
              <TableCell colSpan={3}>{result.title || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Description</TableCell>
              <TableCell colSpan={3}>{result.description || "N/A"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Content Type</TableCell>
              <TableCell>{result.contentType || "N/A"}</TableCell>
              <TableCell className="font-medium">Content Length</TableCell>
              <TableCell>{result.contentLength ? `${(result.contentLength / 1024).toFixed(2)} KB` : "N/A"}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* SEO Analysis */}
      {result.seoData && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">SEO Analysis</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Word Count</TableCell>
                <TableCell>{result.seoData.wordCount || 0}</TableCell>
                <TableCell className="font-medium">Total Links</TableCell>
                <TableCell>{(result.seoData.internalLinks || 0) + (result.seoData.externalLinks || 0)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">H1 Tags</TableCell>
                <TableCell>{result.seoData.h1Count}</TableCell>
                <TableCell className="font-medium">H2 Tags</TableCell>
                <TableCell>{result.seoData.h2Count}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">H3 Tags</TableCell>
                <TableCell>{result.seoData.h3Count}</TableCell>
                <TableCell className="font-medium">Images</TableCell>
                <TableCell>{result.seoData.imageCount}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Missing Alt</TableCell>
                <TableCell className={result.seoData.imagesWithoutAlt > 0 ? "text-destructive" : ""}>
                  {result.seoData.imagesWithoutAlt}
                </TableCell>
                <TableCell className="font-medium">Canonical URL</TableCell>
                <TableCell>{result.seoData.canonicalUrl || "None"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Meta Tags */}
      {result.seoData && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Meta Tags & Social Media</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Meta Viewport</TableCell>
                <TableCell className={result.seoData.hasViewport ? "text-green-500" : "text-destructive"}>
                  {result.seoData.hasViewport ? "Present" : "Missing"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Meta Robots</TableCell>
                <TableCell>{result.seoData.metaRobots || "Not specified"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Open Graph Tags</TableCell>
                <TableCell className={result.seoData.hasOpenGraph ? "text-green-500" : "text-destructive"}>
                  {result.seoData.hasOpenGraph ? "Present" : "Missing"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Twitter Card Tags</TableCell>
                <TableCell className={result.seoData.hasTwitterCard ? "text-green-500" : "text-destructive"}>
                  {result.seoData.hasTwitterCard ? "Present" : "Missing"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Schema Markup</TableCell>
                <TableCell className={result.seoData.hasSchema ? "text-green-500" : "text-destructive"}>
                  {result.seoData.hasSchema ? "Present" : "Missing"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Links */}
      {result.links && result.links.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Links ({result.links.length})</h3>
          <div className="max-h-60 overflow-y-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Follow</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.links.map((link, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge variant={link.isExternal ? "warning" : "success"} className="font-normal">
                        {link.isExternal ? "External" : "Internal"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-32 truncate">{link.text || "No text"}</TableCell>
                    <TableCell className="max-w-48 truncate">{link.url}</TableCell>
                    <TableCell>{link.isFollow ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Redirect Chain if any */}
      {result.redirectChain && result.redirectChain.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Redirect Chain</h3>
          <Table>
            <TableBody>
              {result.redirectChain.map((url, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>{url}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-medium">{result.redirectChain.length + 1}</TableCell>
                <TableCell className="text-green-500">{result.url}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Errors if any */}
      {result.errors && result.errors.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2 text-destructive">Errors</h3>
          <Table>
            <TableBody>
              {result.errors.map((error, i) => (
                <TableRow key={i}>
                  <TableCell className="text-destructive">{error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}