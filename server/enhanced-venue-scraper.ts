import { venueScraper } from './scrapers/venue-scraper';
import { pythonScrapers } from './python-scrapers';
import { storage } from './storage';
import { scraperMonitor } from './scraper-monitor';
import { db } from './db';
import { venues } from '../shared/schema';
import { eq } from 'drizzle-orm';
import * as cheerio from 'cheerio';

interface VenueEvent {
  title: string;
  artist: string;
  venue: string;
  date: Date;
  description?: string;
  ticketUrl?: string;
  price?: string;
  doors?: Date;
  showTime?: Date;
  imageUrl?: string;
  genre?: string;
}

export class EnhancedVenueScraper {
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async fetchPage(url: string, options: RequestInit = {}): Promise<string> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.text();
  }

  async scrapeTheIndependentAlternative(): Promise<VenueEvent[]> {
    console.log('🎸 Alternative scraping approach for The Independent...');
    
    try {
      // Try alternative endpoints and approaches
      const urls = [
        'https://www.theindependentsf.com/events',
        'https://www.theindependentsf.com/shows',
        'https://www.theindependentsf.com'
      ];
      
      for (const url of urls) {
        try {
          const html = await this.fetchPage(url);
          const $ = cheerio.load(html);
          const events: VenueEvent[] = [];
          
          // Look for event patterns in different selectors
          const eventSelectors = [
            '.event-item', '.show-item', '.concert-item',
            '.event', '.show', '.concert',
            '[class*="event"]', '[class*="show"]', '[class*="concert"]'
          ];
          
          for (const selector of eventSelectors) {
            $(selector).each((i, element) => {
              const $event = $(element);
              const title = $event.find('h1, h2, h3, h4, .title, .name, .artist').first().text().trim();
              const dateText = $event.find('.date, .time, [class*="date"]').first().text().trim();
              
              if (title && title.length > 2) {
                events.push({
                  title,
                  artist: this.extractArtistName(title) || title,
                  venue: 'The Independent',
                  date: this.parseDate(dateText) || new Date(),
                  genre: this.inferGenre(title)
                });
              }
            });
          }
          
          if (events.length > 0) {
            console.log(`Found ${events.length} events at The Independent via ${url}`);
            return events;
          }
        } catch (error) {
          console.log(`Failed to scrape ${url}:`, error.message);
          continue;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error with alternative Independent scraping:', error);
      return [];
    }
  }

  async scrapeCafeDuNordEnhanced(): Promise<VenueEvent[]> {
    console.log('🎸 Enhanced scraping for Cafe du Nord...');
    
    try {
      const urls = [
        'https://www.cafedunord.com/calendar',
        'https://www.cafedunord.com/events',
        'https://www.cafedunord.com/shows',
        'https://www.cafedunord.com'
      ];
      
      for (const url of urls) {
        try {
          const html = await this.fetchPage(url);
          const $ = cheerio.load(html);
          const events: VenueEvent[] = [];
          
          // Multiple selector patterns for events
          $('.event, .show, .concert, .performance, [class*="event"], [class*="show"]').each((i, element) => {
            const $event = $(element);
            const title = $event.find('h1, h2, h3, h4, .title, .artist, .name').first().text().trim();
            const dateText = $event.find('.date, .time, [class*="date"], [class*="time"]').first().text().trim();
            const ticketLink = $event.find('a[href*="ticket"], a[href*="buy"], a[href*="purchase"]').attr('href');
            
            // Extract image URL
            let imageUrl = $event.find('img').first().attr('src');
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = this.resolveUrl(imageUrl, url);
            }
            
            if (title && title.length > 2 && !this.isInvalidEvent(title)) {
              events.push({
                title,
                artist: this.extractArtistName(title) || title,
                venue: 'Cafe du Nord',
                date: this.parseDate(dateText) || new Date(),
                ticketUrl: ticketLink || undefined,
                imageUrl: imageUrl || undefined,
                genre: this.inferGenre(title)
              });
            }
          });
          
          if (events.length > 0) {
            console.log(`Found ${events.length} events at Cafe du Nord via ${url}`);
            return events;
          }
        } catch (error) {
          console.log(`Failed to scrape ${url}:`, error.message);
          continue;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error with enhanced Cafe du Nord scraping:', error);
      return [];
    }
  }

  async scrapeTheChapelEnhanced(): Promise<VenueEvent[]> {
    console.log('🎸 Enhanced scraping for The Chapel...');
    
    try {
      const urls = [
        'https://www.thechapelsf.com/calendar',
        'https://www.thechapelsf.com/events',
        'https://www.thechapelsf.com/shows',
        'https://www.thechapelsf.com'
      ];
      
      for (const url of urls) {
        try {
          const html = await this.fetchPage(url);
          const $ = cheerio.load(html);
          const events: VenueEvent[] = [];
          
          // Look for calendar events and show listings
          $('.event, .show, .calendar-event, [data-event], [class*="event"], [class*="show"]').each((i, element) => {
            const $event = $(element);
            const title = $event.find('h1, h2, h3, h4, .title, .artist, .name, .headline').first().text().trim();
            const dateText = $event.find('.date, .time, [class*="date"], [class*="time"]').first().text().trim();
            const description = $event.find('.description, .details, p').first().text().trim();
            const ticketLink = $event.find('a[href*="ticket"], a[href*="buy"]').attr('href');
            
            // Extract image URL
            let imageUrl = $event.find('img').first().attr('src');
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = this.resolveUrl(imageUrl, url);
            }
            
            if (title && title.length > 2 && !this.isInvalidEvent(title)) {
              events.push({
                title,
                artist: this.extractArtistName(title) || title,
                venue: 'The Chapel',
                date: this.parseDate(dateText) || new Date(),
                description: description || undefined,
                ticketUrl: ticketLink || undefined,
                imageUrl: imageUrl || undefined,
                genre: this.inferGenre(title)
              });
            }
          });
          
          if (events.length > 0) {
            console.log(`Found ${events.length} events at The Chapel via ${url}`);
            return events;
          }
        } catch (error) {
          console.log(`Failed to scrape ${url}:`, error.message);
          continue;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error with enhanced Chapel scraping:', error);
      return [];
    }
  }

  async scrapeGreatAmericanMusicHallSimple(): Promise<VenueEvent[]> {
    console.log('🎸 Simple scraping approach for Great American Music Hall...');
    
    try {
      const html = await this.fetchPage('https://www.gamh.com/calendar');
      const $ = cheerio.load(html);
      const events: VenueEvent[] = [];
      
      $('.event, .show, .calendar-item, [class*="event"], [class*="show"]').each((i, element) => {
        const $event = $(element);
        const title = $event.find('h1, h2, h3, h4, .title, .artist, .name').first().text().trim();
        const dateText = $event.find('.date, .time, [class*="date"]').first().text().trim();
        const ticketLink = $event.find('a[href*="ticket"]').attr('href');
        
        if (title && title.length > 2 && !this.isInvalidEvent(title)) {
          events.push({
            title,
            artist: this.extractArtistName(title) || title,
            venue: 'Great American Music Hall',
            date: this.parseDate(dateText) || new Date(),
            ticketUrl: ticketLink || undefined,
            genre: this.inferGenre(title)
          });
        }
      });
      
      console.log(`Found ${events.length} events at Great American Music Hall`);
      return events;
    } catch (error) {
      console.error('Error scraping Great American Music Hall:', error);
      return [];
    }
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    try {
      // Handle various date formats
      const cleanDate = dateStr.trim().replace(/\s+/g, ' ');
      
      // Chapel-specific date patterns (they use formats like "Jun 24" or "Jun 24, 2025")
      const chapelPatterns = [
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i, // "Jun 24, 2025"
        /(\w+)\s+(\d{1,2})/i,             // "Jun 24" (assume 2025)
        /(\d{1,2})\s+(\w+)\s+(\d{4})/i,   // "24 Jun 2025"
        /(\d{1,2})\s+(\w+)/i              // "24 Jun" (assume 2025)
      ];
      
      const monthMap: { [key: string]: number } = {
        'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
        'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5,
        'july': 6, 'jul': 6, 'august': 7, 'aug': 7, 'september': 8, 'sep': 8,
        'october': 9, 'oct': 9, 'november': 10, 'nov': 10, 'december': 11, 'dec': 11
      };
      
      // Try Chapel-specific patterns first
      for (const pattern of chapelPatterns) {
        const match = cleanDate.match(pattern);
        if (match) {
          let month: number, day: number, year: number;
          
          if (pattern === chapelPatterns[0] || pattern === chapelPatterns[1]) {
            // "Jun 24, 2025" or "Jun 24"
            const monthName = match[1].toLowerCase();
            day = parseInt(match[2]);
            year = match[3] ? parseInt(match[3]) : 2025;
            month = monthMap[monthName];
          } else {
            // "24 Jun 2025" or "24 Jun"
            day = parseInt(match[1]);
            const monthName = match[2].toLowerCase();
            year = match[3] ? parseInt(match[3]) : 2025;
            month = monthMap[monthName];
          }
          
          if (month !== undefined && day > 0 && day <= 31) {
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              console.log(`Parsed Chapel date "${cleanDate}" as ${date.toDateString()}`);
              return date;
            }
          }
        }
      }
      
      // Fallback to standard parsing
      const standardPatterns = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,   // "12/15/2024"
        /(\d{4})-(\d{1,2})-(\d{1,2})/      // "2024-12-15"
      ];
      
      for (const pattern of standardPatterns) {
        const match = cleanDate.match(pattern);
        if (match) {
          let date: Date;
          if (pattern === standardPatterns[0]) {
            date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
          } else {
            date = new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
          }
          if (!isNaN(date.getTime())) return date;
        }
      }
      
      // Try direct parsing as last resort
      const date = new Date(cleanDate);
      if (!isNaN(date.getTime()) && date.getFullYear() > 2020) {
        return date;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private extractArtistName(title: string): string | null {
    if (!title) return null;
    
    const cleaned = title
      .replace(/^(live|concert|show|performance|presents?)\s*:?\s*/i, '')
      .replace(/\s*(live|concert|show|performance)\s*$/i, '')
      .replace(/\s*@\s*.+$/i, '')
      .replace(/\s*\+\s*guests?\s*$/i, '')
      .replace(/\s*w\/.*$/i, '')
      .replace(/\s*\(.*\)\s*$/i, '')
      .trim();
    
    return cleaned || null;
  }

  private isInvalidEvent(title: string): boolean {
    const invalidPatterns = [
      /^(closed|private|members only|staff|maintenance|cleaning)$/i,
      /^(tbd|tba|coming soon|stay tuned)$/i,
      /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i,
      /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)$/i
    ];
    
    return invalidPatterns.some(pattern => pattern.test(title.trim()));
  }

  private inferGenre(title: string): string {
    const text = title.toLowerCase();
    
    if (text.includes('jazz') || text.includes('blues')) return 'Jazz';
    if (text.includes('electronic') || text.includes('dj') || text.includes('techno')) return 'Electronic';
    if (text.includes('hip hop') || text.includes('rap')) return 'Hip Hop';
    if (text.includes('folk') || text.includes('acoustic')) return 'Folk';
    if (text.includes('metal') || text.includes('hardcore')) return 'Metal';
    if (text.includes('punk')) return 'Punk';
    if (text.includes('country')) return 'Country';
    if (text.includes('reggae')) return 'Reggae';
    if (text.includes('classical')) return 'Classical';
    
    return 'Alternative';
  }

  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    
    try {
      const base = new URL(baseUrl);
      return new URL(url, base.origin).toString();
    } catch (error) {
      return url;
    }
  }

  async scrapeAllVenuesEnhanced(): Promise<VenueEvent[]> {
    console.log('🎸 Starting comprehensive enhanced venue scraping...');
    
    const allEvents: VenueEvent[] = [];
    
    const venueScrapers = [
      { name: 'Bottom of the Hill', scraper: () => venueScraper.scrapeBottomOfTheHill() },
      { name: 'The Independent', scraper: () => this.scrapeTheIndependentAlternative() },
      { name: 'Cafe du Nord', scraper: () => this.scrapeCafeDuNordEnhanced() },
      { name: 'The Chapel', scraper: () => this.scrapeTheChapelEnhanced() },
      { name: 'Great American Music Hall', scraper: () => this.scrapeGreatAmericanMusicHallSimple() }
    ];

    for (const venue of venueScrapers) {
      try {
        console.log(`🎯 Enhanced scraping ${venue.name}...`);
        const events = await venue.scraper();
        
        if (events && events.length > 0) {
          console.log(`✅ Found ${events.length} events at ${venue.name}`);
          allEvents.push(...events.map(event => ({
            ...event,
            venue: venue.name
          })));
          
          await scraperMonitor.recordScraperRun(venue.name, 'success', events.length);
        } else {
          console.log(`⚠️ No events found at ${venue.name}`);
          await scraperMonitor.recordScraperRun(venue.name, 'no_events', 0);
        }
      } catch (error) {
        console.error(`❌ Error scraping ${venue.name}:`, error);
        await scraperMonitor.recordScraperRun(venue.name, 'error', 0, String(error));
      }
    }

    console.log(`📊 Total enhanced events found: ${allEvents.length}`);
    return allEvents;
  }

  async saveEnhancedEvents(events: VenueEvent[]): Promise<number> {
    let savedCount = 0;
    
    for (const event of events) {
      try {
        // Find venue
        let venue: any = null;
        
        const venueNames = {
          'Bottom of the Hill': 'Bottom of the Hill',
          'The Independent': 'The Independent', 
          'Cafe du Nord': 'Café du Nord',
          'The Chapel': 'The Chapel',
          'Great American Music Hall': 'Great American Music Hall'
        };
        
        const venueName = venueNames[event.venue as keyof typeof venueNames] || event.venue;
        const result = await db.select().from(venues).where(eq(venues.name, venueName));
        venue = result[0];
        
        if (!venue) {
          console.warn(`Venue not found: ${event.venue} (${venueName})`);
          continue;
        }

        // Check for duplicates
        const eventSlug = this.createSlug(`${event.title}-${event.date.getTime()}`);
        const existingEvent = await storage.getEventBySlug(eventSlug);
        if (existingEvent) {
          continue;
        }

        // Find or create artist
        let artist = await storage.getArtistBySlug(this.createSlug(event.artist));
        if (!artist) {
          artist = await storage.createArtist({
            name: event.artist,
            slug: this.createSlug(event.artist),
            genre: event.genre || 'Alternative',
            location: 'San Francisco, CA'
          });
        }

        // Create event
        await storage.createEvent({
          title: event.title,
          slug: eventSlug,
          artistId: artist.id,
          venueId: venue.id,
          date: event.date,
          description: event.description || null,
          ticketUrl: event.ticketUrl || null,
          price: event.price || null,
          doors: event.doors || null,
          showTime: event.showTime || null,
          imageUrl: event.imageUrl || null,
          isFeatured: false,
          isActive: true,
          tags: event.genre ? [event.genre.toLowerCase()] : null
        });

        savedCount++;
        console.log(`✅ Saved enhanced event: ${event.title} at ${event.venue}`);
      } catch (error) {
        console.error(`Failed to save enhanced event ${event.title}:`, error);
      }
    }
    
    return savedCount;
  }
}

export const enhancedVenueScraper = new EnhancedVenueScraper();