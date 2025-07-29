# Automated Event Scraper System

## Overview

The automated event scraper system keeps TinyAmp's database updated with fresh events from San Francisco venues. It runs automatically in production and includes intelligent deduplication to prevent duplicate events.

## Features

### 🕐 **Optimal Cadence**
- **Runs every 6 hours** in production
- **Manual triggering** available via API
- **Status monitoring** with real-time stats

### 🧠 **Intelligent Deduplication**
- **Event-level deduplication**: Prevents duplicate events with same title and date
- **Artist-level deduplication**: Reuses existing artists instead of creating duplicates
- **Venue-level deduplication**: Links events to existing venues

### 🎯 **Smart Filtering**
- **Day name filtering**: Removes "Mon", "Tue", "Wed", etc. from artist names
- **Month name filtering**: Removes "Jan", "Feb", "Mar", etc. from artist names
- **Generic term filtering**: Removes genre terms and venue names
- **Quality validation**: Ensures artist names are properly formatted

### 📊 **Comprehensive Coverage**
- **Bottom of the Hill**: Multiple URL exploration
- **The Independent**: Comprehensive event extraction
- **Café du Nord**: Enhanced text parsing

## API Endpoints

### Manual Trigger
```http
POST /api/scraping/trigger
```
Triggers a manual scraping cycle and returns success status.

### Status Check
```http
GET /api/scraping/status
```
Returns current scraping status and database statistics.

**Response:**
```json
{
  "status": "active",
  "stats": {
    "events": 214,
    "artists": 285,
    "venues": 3
  },
  "lastRun": "2024-01-15T10:30:00.000Z",
  "nextRun": "2024-01-15T16:30:00.000Z"
}
```

## Production Deployment

The automated scraper is automatically started when the server runs in production mode:

```typescript
// In server/index.ts
if (app.get("env") === "production") {
  const scheduler = new ScrapingScheduler();
  scheduler.start().catch(error => {
    log(`Error starting scraper scheduler: ${error}`);
  });
}
```

## Configuration

### Run Interval
Default: 6 hours (6 * 60 * 60 * 1000 milliseconds)
Can be modified in `server/automated-scraper.ts`:

```typescript
private readonly RUN_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
```

### Max Events Per Run
Default: 1000 events per cycle
Can be modified in `server/automated-scraper.ts`:

```typescript
private readonly MAX_EVENTS_PER_RUN = 1000;
```

## Monitoring

### Logs
The scraper logs all activities:
- Event discovery counts
- Import success/failure
- Duplicate detection
- Error handling

### Database Stats
Monitor via `/api/scraping/status`:
- Total events in database
- Total artists in database
- Total venues in database
- Last run time
- Next scheduled run

## Error Handling

### Graceful Degradation
- Continues running even if individual venues fail
- Logs errors without stopping the entire cycle
- Maintains existing data if scraping fails

### Resource Management
- Automatic browser cleanup after each cycle
- Memory-efficient processing
- Timeout handling for slow websites

## Testing

### Manual Test
```bash
npx tsx server/test-automated-scraper.ts
```

### API Test
```bash
# Trigger manual scraping
curl -X POST http://localhost:5000/api/scraping/trigger

# Check status
curl http://localhost:5000/api/scraping/status
```

## Venues Covered

1. **Bottom of the Hill**
   - URL: https://www.bottomofthehill.com/calendar.html
   - Coverage: Comprehensive event listings

2. **The Independent**
   - URL: https://www.theindependentsf.com/
   - Coverage: Multiple page exploration

3. **Café du Nord**
   - URL: https://www.cafedunord.com/
   - Coverage: Enhanced text parsing

## Data Quality

### Artist Name Validation
- Minimum 3 characters, maximum 50 characters
- Must start with capital letter
- No day/month names
- No generic genre terms
- No venue names

### Event Validation
- Must have valid date within 6 months to 1 year
- Must have at least one valid artist
- Must be associated with existing venue

### Deduplication Rules
- Same title + same date = duplicate
- Same artist name (case-insensitive) = reuse existing
- Same venue slug = reuse existing venue

## Performance

### Optimization
- Batch processing of events
- Efficient database queries
- Memory-conscious browser management
- Intelligent rate limiting

### Scalability
- Configurable event limits
- Modular venue support
- Extensible filtering system
- Production-ready error handling

## Troubleshooting

### Common Issues

1. **Browser Launch Failures**
   - Check Playwright installation
   - Verify headless mode compatibility

2. **Database Connection Errors**
   - Verify DATABASE_URL environment variable
   - Check Neon database status

3. **Rate Limiting**
   - Scraper includes built-in delays
   - Respects website terms of service

### Debug Mode
Enable detailed logging by setting environment variable:
```bash
DEBUG=scraper npm run dev
```

## Future Enhancements

- **More Venues**: Easy to add new venues
- **Better Filtering**: Machine learning for artist name validation
- **Real-time Updates**: WebSocket notifications
- **Analytics Dashboard**: Detailed scraping metrics
- **A/B Testing**: Different scraping strategies

---

The automated scraper ensures TinyAmp always has fresh, high-quality event data while maintaining excellent performance and reliability. 