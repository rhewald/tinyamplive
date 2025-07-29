import { venueScraper } from './scrapers/venue-scraper';
import { pythonScrapers } from './python-scrapers';
import { storage } from './storage';
import { scraperMonitor } from './scraper-monitor';
import { db } from './db';
import { venues } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface AuthenticEvent {
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

export class AuthenticVenueScrapers {
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async scrapeTheIndependent(): Promise<AuthenticEvent[]> {
    console.log('🎸 Starting authentic scraping for The Independent...');
    try {
      const events = await venueScraper.scrapeTheIndependent();
      console.log(`Found ${events.length} events at The Independent`);
      return this.convertScrapedEvents(events);
    } catch (error) {
      console.error('Error scraping The Independent:', error);
      await scraperMonitor.recordScraperRun('The Independent', 'error', 0, String(error));
      return [];
    }
  }

  async scrapeCafeDuNord(): Promise<AuthenticEvent[]> {
    console.log('🎸 Starting authentic scraping for Cafe du Nord...');
    try {
      const events = await venueScraper.scrapeCafeDuNord();
      console.log(`Found ${events.length} events at Cafe du Nord`);
      return this.convertScrapedEvents(events);
    } catch (error) {
      console.error('Error scraping Cafe du Nord:', error);
      await scraperMonitor.recordScraperRun('Cafe du Nord', 'error', 0, String(error));
      return [];
    }
  }

  async scrapeBottomOfTheHill(): Promise<AuthenticEvent[]> {
    console.log('🎸 Starting authentic scraping for Bottom of the Hill...');
    try {
      const events = await venueScraper.scrapeBottomOfTheHill();
      console.log(`Found ${events.length} events at Bottom of the Hill`);
      return this.convertScrapedEvents(events);
    } catch (error) {
      console.error('Error scraping Bottom of the Hill:', error);
      await scraperMonitor.recordScraperRun('Bottom of the Hill', 'error', 0, String(error));
      return [];
    }
  }

  async scrapeTheChapel(): Promise<AuthenticEvent[]> {
    console.log('🎸 Starting authentic scraping for The Chapel...');
    try {
      const events = await venueScraper.scrapeTheChapel();
      console.log(`Found ${events.length} events at The Chapel`);
      return this.convertScrapedEvents(events);
    } catch (error) {
      console.error('Error scraping The Chapel:', error);
      await scraperMonitor.recordScraperRun('The Chapel', 'error', 0, String(error));
      return [];
    }
  }

  async scrapeGreatAmericanMusicHall(): Promise<AuthenticEvent[]> {
    console.log('🎸 Starting authentic scraping for Great American Music Hall...');
    try {
      const pythonEvents = await pythonScrapers.scrapeGreatAmericanMusicHall();
      console.log(`Found ${pythonEvents.length} events at Great American Music Hall via Python`);
      return this.convertPythonEvents(pythonEvents);
    } catch (error) {
      console.error('Error scraping Great American Music Hall:', error);
      await scraperMonitor.recordScraperRun('Great American Music Hall', 'error', 0, String(error));
      return [];
    }
  }

  private convertPythonEvents(scrapedEvents: any[]): AuthenticEvent[] {
    return scrapedEvents.map(event => ({
      title: event.artist || 'TBA',
      artist: event.artist || 'TBA',
      venue: event.venue || 'Great American Music Hall',
      date: this.normalizeDate(event.date),
      description: null,
      ticketUrl: event.link || null,
      price: null,
      doors: null,
      showTime: null,
      imageUrl: null,
      genre: this.inferGenre(event.artist || '', event.artist || '')
    }));
  }

  private normalizeDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    
    try {
      // Handle various date formats
      const cleanDate = dateStr.trim();
      
      // Try parsing as ISO date first
      let date = new Date(cleanDate);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // Try parsing common formats
      const formats = [
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i, // "December 15, 2024" or "Dec 15 2024"
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,   // "12/15/2024"
        /(\d{4})-(\d{1,2})-(\d{1,2})/     // "2024-12-15"
      ];
      
      for (const format of formats) {
        const match = cleanDate.match(format);
        if (match) {
          if (format === formats[0]) { // Month name format
            const monthName = match[1];
            const day = parseInt(match[2]);
            const year = parseInt(match[3]);
            const monthMap: { [key: string]: number } = {
              'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
              'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5,
              'july': 6, 'jul': 6, 'august': 7, 'aug': 7, 'september': 8, 'sep': 8,
              'october': 9, 'oct': 9, 'november': 10, 'nov': 10, 'december': 11, 'dec': 11
            };
            const month = monthMap[monthName.toLowerCase()];
            if (month !== undefined) {
              date = new Date(year, month, day);
              if (!isNaN(date.getTime())) return date;
            }
          }
        }
      }
      
      // Fallback to current date if parsing fails
      console.warn(`Could not parse date: ${dateStr}, using current date`);
      return new Date();
    } catch (error) {
      console.warn(`Date parsing error for "${dateStr}":`, error);
      return new Date();
    }
  }

  private convertScrapedEvents(scrapedEvents: any[]): AuthenticEvent[] {
    return scrapedEvents.map(event => ({
      title: event.title || 'TBA',
      artist: event.artist || this.extractArtistName(event.title) || 'TBA',
      venue: event.venue,
      date: event.date || new Date(),
      description: event.description || null,
      ticketUrl: event.ticketUrl || null,
      price: event.price || null,
      doors: event.doors || null,
      showTime: event.showTime || null,
      imageUrl: event.imageUrl || null,
      genre: event.genre || this.inferGenre(event.title || '', event.artist || '')
    }));
  }

  private parseCalendarDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private parseEventDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  private extractArtistName(title: string): string | null {
    if (!title) return null;
    
    // Remove common venue prefixes and suffixes
    const cleaned = title
      .replace(/^(live|concert|show|performance|presents?)\s*:?\s*/i, '')
      .replace(/\s*(live|concert|show|performance)\s*$/i, '')
      .replace(/\s*@\s*.+$/i, '') // Remove venue mentions
      .replace(/\s*\+\s*guests?\s*$/i, '') // Remove "+ guests"
      .replace(/\s*w\/.*$/i, '') // Remove "w/ support"
      .replace(/\s*\(.*\)\s*$/i, '') // Remove parenthetical info
      .trim();
    
    return cleaned || null;
  }

  private isValidEvent(title: string): boolean {
    if (!title) return false;
    
    const invalidPatterns = [
      /^(closed|private|members only|staff|maintenance|cleaning)$/i,
      /^(tbd|tba|coming soon|stay tuned)$/i,
      /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/i
    ];
    
    return !invalidPatterns.some(pattern => pattern.test(title.trim()));
  }

  private inferGenre(title: string, artist: string): string {
    const text = `${title} ${artist}`.toLowerCase();
    
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
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return `https:${url}`;
    if (url.startsWith('/')) return `${baseUrl}${url}`;
    return `${baseUrl}/${url}`;
  }

  async scrapeAllVenues(): Promise<AuthenticEvent[]> {
    console.log('🎸 Starting comprehensive venue scraping...');
    
    const allEvents: AuthenticEvent[] = [];
    
    const venues = [
      { name: 'The Independent', scraper: () => this.scrapeTheIndependent() },
      { name: 'Cafe du Nord', scraper: () => this.scrapeCafeDuNord() },
      { name: 'Bottom of the Hill', scraper: () => this.scrapeBottomOfTheHill() },
      { name: 'The Chapel', scraper: () => this.scrapeTheChapel() },
      { name: 'Great American Music Hall', scraper: () => this.scrapeGreatAmericanMusicHall() }
    ];

    for (const venue of venues) {
      try {
        console.log(`🎯 Scraping ${venue.name}...`);
        const events = await venue.scraper();
        console.log(`✅ Found ${events.length} events at ${venue.name}`);
        allEvents.push(...events);
        
        await scraperMonitor.recordScraperRun(venue.name, events.length > 0 ? 'success' : 'no_events', events.length);
      } catch (error) {
        console.error(`❌ Error scraping ${venue.name}:`, error);
        await scraperMonitor.recordScraperRun(venue.name, 'error', 0, String(error));
      }
    }

    console.log(`📊 Total authentic events found: ${allEvents.length}`);
    return allEvents;
  }

  async saveAuthenticEvents(events: AuthenticEvent[]): Promise<void> {
    for (const event of events) {
      try {
        // Find venue using direct database query for known venues
        let venue: any = null;
        
        console.log(`Looking for venue: "${event.venue}"`);
        
        if (event.venue === 'Bottom of the Hill') {
          const result = await db.select().from(venues).where(eq(venues.name, 'Bottom of the Hill'));
          venue = result[0];
          console.log(`Found Bottom of the Hill venue:`, venue ? `ID ${venue.id}` : 'not found');
        } else if (event.venue === 'The Independent') {
          const result = await db.select().from(venues).where(eq(venues.name, 'The Independent'));
          venue = result[0];
        } else if (event.venue === 'Cafe du Nord') {
          const result = await db.select().from(venues).where(eq(venues.name, 'Cafe du Nord'));
          venue = result[0];
        } else if (event.venue === 'The Chapel') {
          const result = await db.select().from(venues).where(eq(venues.name, 'The Chapel'));
          venue = result[0];
        } else if (event.venue === 'Great American Music Hall') {
          const result = await db.select().from(venues).where(eq(venues.name, 'Great American Music Hall'));
          venue = result[0];
        } else {
          venue = await storage.getVenueBySlug(this.createSlug(event.venue));
        }
        
        if (!venue) {
          console.warn(`Venue not found: ${event.venue}`);
          continue;
        }
        
        console.log(`Processing event for venue ${venue.name} (ID: ${venue.id}): ${event.title}`);

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

        // Create event with duplicate check
        const eventSlug = this.createSlug(`${event.title}-${event.date.getTime()}`);
        
        // Check if event already exists
        const existingEvent = await storage.getEventBySlug(eventSlug);
        if (existingEvent) {
          console.log(`Event already exists, skipping: ${event.title}`);
          continue;
        }

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

        console.log(`✅ Saved authentic event: ${event.title} at ${event.venue}`);
      } catch (error) {
        console.error(`Failed to save event ${event.title}:`, error);
      }
    }
  }
}

export const authenticScrapers = new AuthenticVenueScrapers();