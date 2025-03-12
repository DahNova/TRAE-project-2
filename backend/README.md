# Fast URL Checker Backend

A robust backend service for crawling URLs and analyzing them for SEO and other metrics, similar to Screaming Frog but as a web service.

## Features

- Single URL analysis with detailed SEO metrics
- Multi-page crawling with configurable depth and limits
- SEO analysis including title, meta description, headings, images, and more
- Link analysis with internal/external classification
- Performance metrics including response time and content size
- Proxy support for bypassing IP restrictions
- Rate limiting and concurrency controls to be respectful of target servers
- Asynchronous crawling with session management

## Tech Stack

- Node.js & Express.js
- TypeScript
- Axios for HTTP requests
- Cheerio for HTML parsing
- Winston for logging
- Jest for testing

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

4. Modify the `.env` file with your settings

## Usage

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### Testing

```bash
npm test
```

## API Endpoints

### Health Check

```
GET /health
```

Returns the status of the service.

### Check Single URL

```
POST /api/url/check
```

Request body:
```json
{
  "url": "https://example.com"
}
```

### Start Crawl Session

```
POST /api/url/crawl
```

Request body:
```json
{
  "url": "https://example.com",
  "depth": 2,
  "followExternalLinks": false,
  "maxPages": 100,
  "checkSeoOnly": false
}
```

### Get Crawl Status

```
GET /api/url/crawl/:sessionId
```

Returns the status and results of a crawl session.

### Cancel Crawl

```
DELETE /api/url/crawl/:sessionId
```

Cancels an active crawl session.

## Folder Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Request handlers
├── middleware/      # Express middleware
├── models/          # Data models/interfaces
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
├── test/            # Test files
└── index.ts         # Entry point
```

## Future Enhancements

- Database integration for storing crawl results
- User authentication and API keys
- Advanced SEO metrics and recommendations
- Performance optimizations for large crawls
- Export functionality for crawl results
- Scheduled crawls and monitoring

## License

MIT