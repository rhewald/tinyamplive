// Using built-in fetch API
import * as cheerio from 'cheerio';
import { db } from './db.js';
import { events, venues, artists } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

interface IndependentEvent {
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

export class IndependentScraperEnhanced {
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async fetchWithRetry(url: string, maxRetries = 3): Promise<string> {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, { 
          headers,
          redirect: 'follow'
        });

        if (response.ok) {
          return await response.text();
        }
        
        console.log(`Attempt ${i + 1} failed with status: ${response.status}`);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        }
      } catch (error) {
        console.log(`Attempt ${i + 1} failed:`, error);
        
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
        }
      }
    }
    
    throw new Error(`Failed to fetch ${url} after ${maxRetries} attempts`);
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    try {
      // Handle various date formats
      const patterns = [
        /(\w{3})\s+(\w{3})\s+(\d{1,2})/i,  // "Fri Dec 20"
        /(\w{3})\s+(\d{1,2})/i,            // "Dec 20"
        /(\d{1,2})\/(\d{1,2})/,            // "12/20"
        /(\d{4})-(\d{2})-(\d{2})/          // "2025-12-20"
      ];

      const months: Record<string, number> = {
        'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12,
        'january': 1, 'february': 2, 'march': 3, 'april': 4, 'june': 6,
        'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12
      };

      // Try "Fri Dec 20" or "Dec 20" format
      const monthDayMatch = dateStr.match(patterns[0]) || dateStr.match(patterns[1]);
      if (monthDayMatch) {
        const monthStr = monthDayMatch[monthDayMatch.length - 2].toLowerCase();
        const day = parseInt(monthDayMatch[monthDayMatch.length - 1]);
        const monthNum = months[monthStr];
        
        if (monthNum && day >= 1 && day <= 31) {
          const year = 2025; // Assume current/next year for upcoming events
          return new Date(year, monthNum - 1, day);
        }
      }

      // Try MM/DD format
      const mmddMatch = dateStr.match(patterns[2]);
      if (mmddMatch) {
        const month = parseInt(mmddMatch[1]);
        const day = parseInt(mmddMatch[2]);
        
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return new Date(2025, month - 1, day);
        }
      }

      // Try YYYY-MM-DD format
      const isoMatch = dateStr.match(patterns[3]);
      if (isoMatch) {
        return new Date(dateStr);
      }

      // Fallback: try to parse as-is
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }

    } catch (error) {
      console.log(`Date parsing error for "${dateStr}":`, error);
    }

    return null;
  }

  private extractArtistName(title: string): string | null {
    if (!title) return null;
    
    // Clean up common prefixes/suffixes
    let cleaned = title
      .replace(/^(live at|at|show|concert|performance)\s+/i, '')
      .replace(/\s+(live|show|concert|performance|at .+)$/i, '')
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove content in parentheses
      .replace(/\s*\[[^\]]*\]\s*/g, '') // Remove content in brackets
      .trim();

    // Skip if it's too generic or likely not an artist name
    const skipPatterns = [
      /^(event|show|concert|performance|music|live|tonight|today|this)$/i,
      /^(calendar|schedule|upcoming|events)$/i,
      /^(tickets|buy|purchase|info|information)$/i
    ];

    if (skipPatterns.some(pattern => pattern.test(cleaned))) {
      return null;
    }

    return cleaned.length > 2 && cleaned.length < 100 ? cleaned : null;
  }

  private inferGenre(title: string, artist: string): string {
    const text = `${title} ${artist}`.toLowerCase();
    
    if (text.includes('punk') || text.includes('hardcore')) return 'Punk';
    if (text.includes('metal') || text.includes('heavy')) return 'Metal';
    if (text.includes('electronic') || text.includes('techno') || text.includes('house')) return 'Electronic';
    if (text.includes('jazz') || text.includes('blues')) return 'Jazz';
    if (text.includes('country') || text.includes('folk')) return 'Country';
    if (text.includes('hip hop') || text.includes('rap')) return 'Hip Hop';
    if (text.includes('classical') || text.includes('orchestra')) return 'Classical';
    
    return 'Indie Rock'; // Default for The Independent
  }

  async scrapeTheIndependentComprehensive(): Promise<IndependentEvent[]> {
    console.log('Starting comprehensive scrape of The Independent...');
    
    const events: IndependentEvent[] = [];
    const urls = [
      'https://www.theindependentsf.com/',
      'https://www.theindependentsf.com/events',
      'https://www.theindependentsf.com/calendar',
      'https://www.theindependentsf.com/shows'
    ];

    for (const url of urls) {
      try {
        console.log(`Scraping ${url}...`);
        const html = await this.fetchWithRetry(url);
        const $ = cheerio.load(html);
        
        // Strategy 1: Look for tw-event-item elements (your original approach)
        $('.tw-event-item').each((i, element) => {
          try {
            const $el = $(element);
            
            const artistEl = $el.find('div.tw-name > a');
            const dateEl = $el.find('span.tw-event-date');
            const timeEl = $el.find('span.tw-event-time-complete');
            
            const artist = artistEl.text().trim();
            const dateStr = dateEl.text().trim();
            const timeStr = timeEl.text().trim();
            const link = artistEl.attr('href');
            
            const parsedDate = this.parseDate(dateStr);
            const cleanArtist = this.extractArtistName(artist);
            
            if (cleanArtist && parsedDate) {
              const fullLink = link && !link.startsWith('http') 
                ? `https://www.theindependentsf.com${link}` 
                : link || url;
              
              events.push({
                title: cleanArtist,
                artist: cleanArtist,
                venue: 'The Independent',
                date: parsedDate,
                ticketUrl: fullLink,
                genre: this.inferGenre(artist, cleanArtist),
                description: `${cleanArtist} live at The Independent`
              });
            }
          } catch (error) {
            console.log(`Error processing tw-event-item ${i}:`, error);
          }
        });

        // Strategy 2: Look for any event-related links
        $('a[href*="/e/"], a[href*="event"], a[href*="show"]').each((i, element) => {
          try {
            const $el = $(element);
            const text = $el.text().trim();
            const href = $el.attr('href');
            
            const cleanArtist = this.extractArtistName(text);
            
            if (cleanArtist && href) {
              const fullLink = href.startsWith('http') 
                ? href 
                : `https://www.theindependentsf.com${href}`;
              
              // Try to find date in nearby elements
              let dateStr = '';
              const parent = $el.parent();
              const siblings = $el.siblings();
              
              // Look for date in parent or sibling elements
              parent.find('*').each((_, dateEl) => {
                const elText = $(dateEl).text();
                if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|\d{1,2}\/\d{1,2})/i.test(elText)) {
                  dateStr = elText;
                  return false; // Break
                }
              });
              
              const parsedDate = this.parseDate(dateStr) || new Date('2025-07-01');
              
              events.push({
                title: cleanArtist,
                artist: cleanArtist,
                venue: 'The Independent',
                date: parsedDate,
                ticketUrl: fullLink,
                genre: this.inferGenre(text, cleanArtist),
                description: `${cleanArtist} live at The Independent`
              });
            }
          } catch (error) {
            console.log(`Error processing event link ${i}:`, error);
          }
        });

        // Strategy 3: Look for structured data in scripts
        $('script').each((i, element) => {
          try {
            const scriptContent = $(element).html() || '';
            
            if (scriptContent.includes('event') || scriptContent.includes('show')) {
              // Look for JSON-LD structured data
              if (scriptContent.includes('"@type":"Event"') || scriptContent.includes('"@type": "Event"')) {
                const jsonMatches = scriptContent.match(/\{[^}]*"@type"\s*:\s*"Event"[^}]*\}/g);
                
                if (jsonMatches) {
                  jsonMatches.forEach(match => {
                    try {
                      const eventData = JSON.parse(match);
                      const artist = this.extractArtistName(eventData.name || eventData.performer?.name);
                      const dateStr = eventData.startDate || eventData.date;
                      
                      if (artist && dateStr) {
                        const parsedDate = this.parseDate(dateStr);
                        if (parsedDate) {
                          events.push({
                            title: artist,
                            artist: artist,
                            venue: 'The Independent',
                            date: parsedDate,
                            ticketUrl: eventData.url || url,
                            genre: this.inferGenre(eventData.name || '', artist),
                            description: eventData.description || `${artist} live at The Independent`
                          });
                        }
                      }
                    } catch (parseError) {
                      // Ignore individual JSON parsing errors
                    }
                  });
                }
              }
            }
          } catch (error) {
            console.log(`Error processing script ${i}:`, error);
          }
        });

      } catch (error) {
        console.log(`Failed to scrape ${url}:`, error);
      }
    }

    // Remove duplicates
    const uniqueEvents = new Map<string, IndependentEvent>();
    
    events.forEach(event => {
      const key = `${event.artist.toLowerCase().trim()}-${event.date.toISOString().split('T')[0]}`;
      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event);
      }
    });

    const finalEvents = Array.from(uniqueEvents.values());
    console.log(`Found ${finalEvents.length} unique events from The Independent`);
    
    return finalEvents;
  }

  async saveEventsToDatabase(scrapedEvents: IndependentEvent[]): Promise<number> {
    if (!scrapedEvents.length) {
      console.log('No events to save');
      return 0;
    }

    // Get The Independent venue
    const [venue] = await db
      .select()
      .from(venues)
      .where(eq(venues.name, 'The Independent'))
      .limit(1);

    if (!venue) {
      throw new Error('The Independent venue not found in database');
    }

    // Get existing artists
    const existingArtists = await db.select().from(artists);
    const artistMap = new Map<string, number>();
    
    existingArtists.forEach(artist => {
      artistMap.set(artist.name.toLowerCase(), artist.id);
    });

    // Create new artists
    const newArtistNames = new Set<string>();
    const newArtistsToInsert = [];
    
    for (const event of scrapedEvents) {
      const artistKey = event.artist.toLowerCase();
      if (!artistMap.has(artistKey) && !newArtistNames.has(artistKey)) {
        newArtistNames.add(artistKey);
        newArtistsToInsert.push({
          name: event.artist,
          slug: this.createSlug(`${event.artist}-${Date.now()}-${Math.random()}`),
          genre: event.genre || 'Indie Rock',
          location: 'San Francisco, CA',
          description: `${event.artist} performing at The Independent`
        });
      }
    }

    if (newArtistsToInsert.length > 0) {
      console.log(`Creating ${newArtistsToInsert.length} new artist records...`);
      const insertedArtists = await db.insert(artists).values(newArtistsToInsert).returning();
      
      insertedArtists.forEach(artist => {
        artistMap.set(artist.name.toLowerCase(), artist.id);
      });
    }

    // Create events
    const eventsToInsert = [];
    for (let i = 0; i < scrapedEvents.length; i++) {
      const event = scrapedEvents[i];
      const artistId = artistMap.get(event.artist.toLowerCase());
      
      if (artistId) {
        const eventDate = event.date;
        const doors = event.doors || new Date(eventDate.getTime() - 60 * 60 * 1000);
        const showTime = event.showTime || eventDate;
        
        eventsToInsert.push({
          title: event.title,
          slug: this.createSlug(`${event.artist}-independent-${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}-${i}`),
          artistId,
          venueId: venue.id,
          date: eventDate,
          doors,
          showTime,
          ticketUrl: event.ticketUrl || 'https://www.theindependentsf.com/',
          description: event.description || `${event.artist} live at The Independent`,
          genre: event.genre || 'Indie Rock',
          isActive: true,
          isFeatured: false
        });
      }
    }

    if (eventsToInsert.length > 0) {
      console.log(`Inserting ${eventsToInsert.length} events...`);
      await db.insert(events).values(eventsToInsert);
      return eventsToInsert.length;
    }

    return 0;
  }

  async runComprehensiveScrape(): Promise<number> {
    try {
      const scrapedEvents = await this.scrapeTheIndependentComprehensive();
      
      if (scrapedEvents.length > 0) {
        console.log(`\nScraped events sample:`);
        scrapedEvents.slice(0, 5).forEach((event, idx) => {
          console.log(`${idx + 1}. ${event.artist} - ${event.date.toDateString()}`);
        });
        
        const insertedCount = await this.saveEventsToDatabase(scrapedEvents);
        console.log(`Successfully inserted ${insertedCount} events to the database`);
        return insertedCount;
      } else {
        console.log('No events found during scraping');
        return 0;
      }
      
    } catch (error) {
      console.error('Error during comprehensive scrape:', error);
      return 0;
    }
  }
}

export const independentScraperEnhanced = new IndependentScraperEnhanced();