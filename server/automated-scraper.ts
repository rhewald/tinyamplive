import { db } from "./db";
import { events, artists, venues, eventArtists } from "@shared/schema";
import { eq, and, or, like } from "drizzle-orm";
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScrapedEvent {
  title: string;
  date: string;
  venue: string;
  venue_slug: string;
  raw_text?: string;
}

class AutomatedEventScraper {
  private browser: any = null;
  private page: any = null;
  private isRunning = false;
  private lastRunTime = 0;
  private readonly RUN_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  private readonly MAX_EVENTS_PER_RUN = 1000;

  constructor() {
    this.init();
  }

  async init() {
    try {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      
      await this.page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      console.log('Automated scraper initialized');
    } catch (error) {
      console.error('Error initializing automated scraper:', error);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // Enhanced filtering function
  private isValidArtistName(name: string): boolean {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const genericTerms = ['indie', 'pop', 'rock', 'punk', 'folk', 'surf', 'emo', 'shoegaze', 'post', 'metal', 'psychedelic', 'garage', 'alternative', 'americana', 'country', 'jazz', 'swing', 'blues', 'stoner', 'synthwave', 'style', 'music', 'doors', 'advance', 'door', 'over', 'ages', 'pm', 'am'];
    
    const cleanName = name.trim();
    
    if (cleanName.length < 3 || cleanName.length > 50) return false;
    if (dayNames.includes(cleanName) || monthNames.includes(cleanName)) return false;
    if (genericTerms.some(term => cleanName.toLowerCase().includes(term))) return false;
    if (cleanName.match(/^\d{1,2}:\d{2}/)) return false;
    if (cleanName.match(/^\$\d+/)) return false;
    if (cleanName.includes('AND OVER') || cleanName.includes('ALL AGES')) return false;
    if (cleanName.toLowerCase().includes('bottom of the hill') || 
        cleanName.toLowerCase().includes('the independent') ||
        cleanName.toLowerCase().includes('café du nord') ||
        cleanName.toLowerCase().includes('cafe du nord')) return false;
    if (!cleanName.match(/^[A-Z][a-zA-Z\s]+$/)) return false;
    
    return true;
  }

  private extractArtistsFromTitle(title: string, rawText?: string): string[] {
    const artists: string[] = [];
    
    let cleanTitle = title.replace(/ at .*$/, '').trim();
    
    if (rawText) {
      const artistPatterns = [
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\[co-headlining\]/g,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z][a-z\s]+$/gm,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z][a-z\s]+(?=\s+at\s+Bottom)/g,
      ];
      
      for (const pattern of artistPatterns) {
        const matches = rawText.match(pattern);
        if (matches) {
          matches.forEach(match => {
            const artistName = match.replace(/\[co-headlining\]/, '').trim();
            if (artistName.length > 2 && !artists.includes(artistName)) {
              artists.push(artistName);
            }
          });
        }
      }
    }
    
    if (artists.length === 0 && cleanTitle.length > 2) {
      const parts = cleanTitle.split(/[,\-\+]/).map(part => part.trim()).filter(part => part.length > 2);
      artists.push(...parts.slice(0, 3));
    }
    
    return artists.slice(0, 3);
  }

  private parseDate(dateStr: string): Date | null {
    try {
      const cleanDate = dateStr.replace(/\n/g, ' ').trim();
      
      const patterns = [
        /(\w+)\s+(\d{1,2})\s+(\d{4})/,
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
      ];
      
      for (const pattern of patterns) {
        const match = cleanDate.match(pattern);
        if (match) {
          const month = match[1];
          const day = parseInt(match[2]);
          const year = parseInt(match[3]);
          
          const monthMap: { [key: string]: number } = {
            'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
            'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
            'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'october': 9, 'oct': 9,
            'november': 10, 'nov': 10, 'december': 11, 'dec': 11,
          };
          
          const monthIndex = monthMap[month.toLowerCase()];
          if (monthIndex !== undefined) {
            return new Date(year, monthIndex, day);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return null;
    }
  }

  private async scrapeVenue(venueUrl: string, venueName: string, venueSlug: string): Promise<ScrapedEvent[]> {
    try {
      console.log(`Scraping ${venueName}...`);
      await this.page.goto(venueUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await this.page.waitForTimeout(2000);
      
      const events = await this.page.evaluate(() => {
        const events: any[] = [];
        const allText = document.body.textContent;
        
        const datePatterns = [
          /(\w+\s+\d{1,2},?\s+20\d{2})/g,
          /(\d{1,2}\/\d{1,2}\/\d{4})/g,
          /(\w+\s+\d{1,2}\s+20\d{2})/g,
        ];
        
        for (const pattern of datePatterns) {
          const matches = allText.matchAll(pattern);
          
          for (const match of matches) {
            const dateStr = match[1];
            const contextStart = Math.max(0, match.index - 200);
            const contextEnd = Math.min(allText.length, match.index + 200);
            const context = allText.substring(contextStart, contextEnd);
            
            const lines = context.split('\n').filter(line => line.trim().length > 0);
            
            for (const line of lines) {
              const cleanLine = line.trim();
              
              if (cleanLine.length > 3 && cleanLine.length < 80 && 
                  !cleanLine.includes('PM') && !cleanLine.includes('doors') &&
                  !cleanLine.includes('$') && !cleanLine.includes(venueName)) {
                
                const artistMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
                if (artistMatch && artistMatch[1].length > 2) {
                  const artistName = artistMatch[1];
                  
                  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                  const genericTerms = ['indie', 'pop', 'rock', 'punk', 'folk', 'surf', 'emo', 'shoegaze', 'post', 'metal', 'psychedelic', 'garage', 'alternative', 'americana', 'country', 'jazz', 'swing', 'blues', 'stoner', 'synthwave'];
                  
                  if (!dayNames.includes(artistName) && 
                      !monthNames.includes(artistName) &&
                      !genericTerms.some(term => artistName.toLowerCase().includes(term))) {
                    
                    events.push({
                      title: `${artistName} at ${venueName}`,
                      date: dateStr,
                      venue: venueName,
                      venue_slug: venueSlug,
                      raw_text: context.substring(0, 100)
                    });
                  }
                }
              }
            }
          }
        }
        
        return events;
      });
      
      console.log(`Found ${events.length} events at ${venueName}`);
      return events;
      
    } catch (error) {
      console.error(`Error scraping ${venueName}:`, error);
      return [];
    }
  }

  private async checkForDuplicates(event: ScrapedEvent): Promise<boolean> {
    try {
      const eventDate = this.parseDate(event.date);
      if (!eventDate) return false;
      
      // Check for existing event with same title and date
      const existingEvents = await db.select()
        .from(events)
        .where(
          and(
            eq(events.title, event.title),
            eq(events.date, eventDate)
          )
        );
      
      return existingEvents.length > 0;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false;
    }
  }

  private async importEvent(event: ScrapedEvent): Promise<boolean> {
    try {
      const eventDate = this.parseDate(event.date);
      if (!eventDate) return false;
      
      // Skip events that are too far in the past or future
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
      const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      
      if (eventDate < sixMonthsAgo || eventDate > oneYearFromNow) {
        return false;
      }
      
      // Check for duplicates
      if (await this.checkForDuplicates(event)) {
        console.log(`Skipping duplicate event: ${event.title}`);
        return false;
      }
      
      // Find venue
      const existingVenues = await db.select().from(venues);
      const venue = existingVenues.find(v => v.slug === event.venue_slug);
      if (!venue) {
        console.log(`Venue not found: ${event.venue_slug}`);
        return false;
      }
      
      // Extract artists from title
      const artistNames = this.extractArtistsFromTitle(event.title, event.raw_text);
      if (artistNames.length === 0) return false;
      
      // Filter valid artist names
      const validArtistNames = artistNames.filter(name => this.isValidArtistName(name));
      if (validArtistNames.length === 0) return false;
      
      // Create or find artists
      const artistIds: number[] = [];
      const existingArtists = await db.select().from(artists);
      
      for (const artistName of validArtistNames) {
        let artistId: number;
        
        const existingArtist = existingArtists.find(a => 
          a.name.toLowerCase() === artistName.toLowerCase()
        );
        
        if (existingArtist) {
          artistId = existingArtist.id;
        } else {
          const newArtist = await db.insert(artists).values({
            name: artistName,
            slug: artistName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            genre: 'indie',
            location: 'San Francisco',
            description: `${artistName} - Live performance`,
          }).returning();
          artistId = newArtist[0].id;
        }
        
        artistIds.push(artistId);
      }
      
      // Create event with unique slug
      const eventSlug = event.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50) + '-' + Date.now();
      const newEvent = await db.insert(events).values({
        title: event.title.substring(0, 200),
        slug: eventSlug,
        venueId: venue.id,
        date: eventDate,
        description: `Live music at ${event.venue}`,
        price: "15.00",
        isFeatured: false,
        isActive: true,
      }).returning();
      
      const eventId = newEvent[0].id;
      
      // Create event-artist relationships
      for (let i = 0; i < artistIds.length; i++) {
        await db.insert(eventArtists).values({
          eventId: eventId,
          artistId: artistIds[i],
          isHeadliner: i === 0,
          order: i,
        });
      }
      
      console.log(`Created event: ${event.title} with ${artistIds.length} artists`);
      return true;
      
    } catch (error) {
      console.error(`Error importing event ${event.title}:`, error);
      return false;
    }
  }

  async runScrapingCycle(): Promise<void> {
    if (this.isRunning) {
      console.log('Scraping cycle already running, skipping...');
      return;
    }

    const now = Date.now();
    if (now - this.lastRunTime < this.RUN_INTERVAL) {
      console.log('Not time for next scraping cycle yet');
      return;
    }

    this.isRunning = true;
    console.log('Starting automated scraping cycle...');

    try {
      const allEvents: ScrapedEvent[] = [];
      
      // Define venues to scrape
      const venues = [
        { url: 'https://www.bottomofthehill.com/calendar.html', name: 'Bottom of the Hill', slug: 'bottom-of-the-hill' },
        { url: 'https://www.theindependentsf.com/', name: 'The Independent', slug: 'the-independent' },
        { url: 'https://www.cafedunord.com/', name: 'Café du Nord', slug: 'cafe-du-nord' }
      ];
      
      // Scrape each venue
      for (const venue of venues) {
        const venueEvents = await this.scrapeVenue(venue.url, venue.name, venue.slug);
        allEvents.push(...venueEvents);
        await this.page.waitForTimeout(2000);
      }
      
      console.log(`Total events found: ${allEvents.length}`);
      
      // Remove duplicates
      const uniqueEvents: ScrapedEvent[] = [];
      const seen = new Set();
      
      allEvents.forEach(event => {
        const key = `${event.title}-${event.date}-${event.venue}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEvents.push(event);
        }
      });
      
      console.log(`Unique events after deduplication: ${uniqueEvents.length}`);
      
      // Import events (limit to prevent overwhelming the system)
      let importedCount = 0;
      for (const event of uniqueEvents.slice(0, this.MAX_EVENTS_PER_RUN)) {
        const success = await this.importEvent(event);
        if (success) importedCount++;
      }
      
      console.log(`Successfully imported ${importedCount} new events`);
      this.lastRunTime = now;
      
    } catch (error) {
      console.error('Error in scraping cycle:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async startAutomation(): Promise<void> {
    console.log('Starting automated scraper...');
    
    // Run initial cycle
    await this.runScrapingCycle();
    
    // Set up periodic execution
    setInterval(async () => {
      await this.runScrapingCycle();
    }, this.RUN_INTERVAL);
    
    console.log(`Automated scraper started. Will run every ${this.RUN_INTERVAL / (60 * 60 * 1000)} hours`);
  }

  async cleanup(): Promise<void> {
    console.log('Cleaning up automated scraper...');
    await this.close();
  }
}

// Export for use in other modules
export { AutomatedEventScraper };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new AutomatedEventScraper();
  
  scraper.startAutomation().catch(console.error);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down automated scraper...');
    await scraper.cleanup();
    process.exit(0);
  });
} 