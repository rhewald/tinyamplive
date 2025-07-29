import * as cheerio from 'cheerio';
import { db } from '../db';
import { venues, artists, events } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface ScrapedEvent {
  title: string;
  date: Date;
  artist: string;
  venue: string;
  description?: string;
  ticketUrl?: string;
  price?: string;
  doors?: Date;
  showTime?: Date;
  imageUrl?: string;
  genre?: string;
}

export class VenueScraper {
  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  async scrapeTheIndependent(): Promise<ScrapedEvent[]> {
    console.log('Scraping The Independent...');
    try {
      const html = await this.fetchPage('https://www.theindependentsf.com/calendar');
      const $ = cheerio.load(html);
      const events: ScrapedEvent[] = [];

      $('.event-item, .show-listing, .calendar-event').each((_, element) => {
        const $event = $(element);
        
        const title = $event.find('.event-title, .show-title, h3, h4').first().text().trim();
        const artist = $event.find('.artist, .headliner, .performer').first().text().trim() || title;
        const dateText = $event.find('.date, .event-date, .show-date').first().text().trim();
        const timeText = $event.find('.time, .doors, .show-time').first().text().trim();
        const description = $event.find('.description, .event-description').first().text().trim();
        const ticketLink = $event.find('a[href*="ticket"], a[href*="buy"]').first().attr('href');
        const imageUrl = $event.find('img').first().attr('src');

        if (title && dateText) {
          const date = this.parseDate(dateText, timeText);
          if (date) {
            events.push({
              title,
              artist,
              venue: 'The Independent',
              date,
              description: description || undefined,
              ticketUrl: ticketLink ? this.resolveUrl(ticketLink, 'https://www.theindependentsf.com') : undefined,
              imageUrl: imageUrl ? this.resolveUrl(imageUrl, 'https://www.theindependentsf.com') : undefined,
              genre: this.inferGenre(title, artist, description)
            });
          }
        }
      });

      console.log(`Found ${events.length} events at The Independent`);
      return events;
    } catch (error) {
      console.error('Error scraping The Independent:', error);
      return [];
    }
  }

  async scrapeCafeDuNord(): Promise<ScrapedEvent[]> {
    console.log('Scraping Cafe du Nord...');
    try {
      const html = await this.fetchPage('https://cafedunord.com/');
      const $ = cheerio.load(html);
      const events: ScrapedEvent[] = [];

      // Based on the screenshots, events appear to be in a calendar/list format
      // Look for actual event containers
      $('tr, .event-row, .calendar-event').each((_, element) => {
        const $event = $(element);
        
        // Extract date from left column (SAT, SUN, etc.)
        const dateText = $event.find('td:first-child, .date-column').text().trim();
        
        // Extract event title and details
        const eventTitle = $event.find('td:nth-child(2), .event-details').text().trim();
        const ticketButton = $event.find('a[href*="ticket"], button:contains("BUY TICKETS")');
        const moreInfoButton = $event.find('a[href*="info"], button:contains("MORE INFO")');
        
        if (eventTitle && dateText && eventTitle !== 'Private Event') {
          // Parse the date properly (SAT 1/18, SUN 6/8, etc.)
          const date = this.parseCalendarDate(dateText);
          if (date) {
            const artist = this.extractArtistFromEventTitle(eventTitle);
            events.push({
              title: eventTitle,
              artist: artist || eventTitle,
              venue: 'Cafe du Nord',
              date,
              ticketUrl: ticketButton.attr('href') || undefined,
              genre: this.inferGenre(eventTitle, artist || eventTitle)
            });
          }
        }
      });

      console.log(`Found ${events.length} real events at Cafe du Nord`);
      return events;
    } catch (error) {
      console.error('Error scraping Cafe du Nord:', error);
      return [];
    }
  }

  async scrapeBottomOfTheHill(): Promise<ScrapedEvent[]> {
    console.log('Scraping Bottom of the Hill...');
    try {
      const urls = [
        'https://www.bottomofthehill.com/calendar.html',
        'https://bottomofthehill.com/calendar.html'
      ];

      for (const url of urls) {
        try {
          const html = await this.fetchPage(url);
          const $ = cheerio.load(html);
          const events: ScrapedEvent[] = [];

          // Look for yellow highlighted event blocks
          const eventCells = $('td[style*="background-color: rgb(204, 204, 51)"], td[bgcolor="#cccc33"]');
          console.log(`Found ${eventCells.length} event cells with yellow background`);
          
          eventCells.each((_, element) => {
            const $event = $(element);
            const text = $event.text().trim();
            console.log(`Processing event cell text (first 200 chars): ${text.substring(0, 200)}`);
            
            // Extract date from the structured format like "Monday June 16 2025"
            const dateMatch = text.match(/([A-Z][a-z]+\s+[A-Z][a-z]+\s+\d{1,2}\s+20\d{2})/);
            if (dateMatch) {
              const dateStr = dateMatch[1];
              console.log(`Found date: ${dateStr}`);
              const date = this.parseDate(dateStr);
              
              // Look for band information in <big class="band"> elements
              const artistElements = $event.find('big.band');
              console.log(`Found ${artistElements.length} band elements in this event`);
              
              if (artistElements.length > 0) {
                artistElements.each((_, artistEl) => {
                  const artist = $(artistEl).text().trim();
                  console.log(`Found band: "${artist}"`);
                  
                  // Filter out placeholder entries and get real band names
                  if (artist && 
                      artist.length > 2 && 
                      artist !== 'TBA' && 
                      !artist.includes('...') &&
                      !artist.match(/^\s*$/) &&
                      artist.length < 100) {
                    
                    console.log(`Adding valid event: ${artist} on ${dateStr}`);
                    events.push({
                      title: artist,
                      artist: artist,
                      venue: 'Bottom of the Hill',
                      date: date!,
                      genre: this.inferGenre(artist, artist)
                    });
                  } else {
                    console.log(`Skipping band "${artist}" - doesn't meet criteria`);
                  }
                });
              } else {
                console.log(`No band elements found in event with date ${dateStr}`);
              }
            } else {
              console.log(`No date match found in text`);
            }
          });

          // Also check table rows for event data
          $('tr').each((_, element) => {
            const $row = $(element);
            const cells = $row.find('td');
            
            if (cells.length >= 2) {
              const firstCell = cells.eq(0).text().trim();
              const secondCell = cells.eq(1).text().trim();
              
              // Look for date patterns
              const dateMatch = firstCell.match(/\d{1,2}\/\d{1,2}\/\d{4}/) || 
                              secondCell.match(/([A-Z][a-z]+ \d{1,2},? 20\d{2})/);
              
              if (dateMatch && (firstCell.length > 5 || secondCell.length > 5)) {
                const dateStr = dateMatch[0].replace(',', '');
                const date = this.parseDate(dateStr);
                const eventText = firstCell.length > secondCell.length ? firstCell : secondCell;
                
                // Extract artist name from event text
                const artistMatch = eventText.match(/^([^0-9]+)/);
                if (date && artistMatch) {
                  const artist = artistMatch[1].trim();
                  if (artist && artist.length > 2) {
                    events.push({
                      title: artist,
                      artist: artist,
                      venue: 'Bottom of the Hill',
                      date,
                      genre: 'Alternative Rock'
                    });
                  }
                }
              }
            }
          });

          if (events.length > 0) {
            console.log(`Found ${events.length} events at Bottom of the Hill`);
            return events;
          }
        } catch (urlError) {
          console.log(`Failed to scrape ${url}, trying next URL...`);
        }
      }

      console.log('No events found at Bottom of the Hill');
      return [];
    } catch (error) {
      console.error('Error scraping Bottom of the Hill:', error);
      return [];
    }
  }

  async scrapeTheChapel(): Promise<ScrapedEvent[]> {
    console.log('Scraping The Chapel...');
    try {
      const html = await this.fetchPage('https://www.thechapelsf.com/calendar');
      const $ = cheerio.load(html);
      const events: ScrapedEvent[] = [];

      $('.event-item, .show-listing').each((_, element) => {
        const $event = $(element);
        
        const title = $event.find('.event-title, .artist-name').first().text().trim();
        const dateText = $event.find('.event-date, .date').first().text().trim();
        const timeText = $event.find('.event-time, .time').first().text().trim();
        const description = $event.find('.event-description').first().text().trim();
        const ticketLink = $event.find('a[href*="ticket"]').first().attr('href');
        const imageUrl = $event.find('.event-image img, img').first().attr('src');

        if (title && dateText) {
          const date = this.parseDate(dateText, timeText);
          if (date) {
            events.push({
              title,
              artist: title,
              venue: 'The Chapel',
              date,
              description: description || undefined,
              ticketUrl: ticketLink ? this.resolveUrl(ticketLink, 'https://www.thechapelsf.com') : undefined,
              imageUrl: imageUrl ? this.resolveUrl(imageUrl, 'https://www.thechapelsf.com') : undefined,
              genre: this.inferGenre(title, title, description)
            });
          }
        }
      });

      console.log(`Found ${events.length} events at The Chapel`);
      return events;
    } catch (error) {
      console.error('Error scraping The Chapel:', error);
      return [];
    }
  }

  private parseDate(dateStr: string, timeStr?: string): Date | null {
    try {
      // Remove common prefixes and clean up
      const cleanDate = dateStr.replace(/^(date|when|on)\s*:?\s*/i, '').trim();
      const cleanTime = timeStr?.replace(/^(time|doors|show)\s*:?\s*/i, '').trim();

      // Try various date formats
      let date: Date | null = null;

      // Format: "December 20, 2024" or "Dec 20, 2024"
      const dateMatch = cleanDate.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
      if (dateMatch) {
        const [, month, day, year] = dateMatch;
        date = new Date(`${month} ${day}, ${year}`);
      }

      // Format: "12/20/2024" or "12-20-2024"
      if (!date) {
        const numericMatch = cleanDate.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (numericMatch) {
          const [, month, day, year] = numericMatch;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      }

      // Add time if provided
      if (date && cleanTime) {
        const timeMatch = cleanTime.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
        if (timeMatch) {
          const [, hours, minutes = '00', ampm] = timeMatch;
          let hour = parseInt(hours);
          
          if (ampm?.toLowerCase() === 'pm' && hour !== 12) {
            hour += 12;
          } else if (ampm?.toLowerCase() === 'am' && hour === 12) {
            hour = 0;
          }
          
          date.setHours(hour, parseInt(minutes));
        }
      }

      return date && !isNaN(date.getTime()) ? date : null;
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
  }

  private resolveUrl(url: string, baseUrl: string): string {
    if (url.startsWith('http')) {
      return url;
    }
    if (url.startsWith('/')) {
      return baseUrl + url;
    }
    return baseUrl + '/' + url;
  }

  private parseCalendarDate(dateStr: string): Date | null {
    try {
      // Parse formats like "SAT 1/18", "SUN 6/8", etc.
      const match = dateStr.match(/(\w{3})\s+(\d{1,2})\/(\d{1,2})/);
      if (match) {
        const [, dayOfWeek, month, day] = match;
        const currentYear = new Date().getFullYear();
        const date = new Date(currentYear, parseInt(month) - 1, parseInt(day));
        
        // If the date is in the past, assume it's next year
        if (date < new Date()) {
          date.setFullYear(currentYear + 1);
        }
        
        return date;
      }
      return null;
    } catch (error) {
      console.error('Calendar date parsing error:', error);
      return null;
    }
  }

  private extractArtistFromEventTitle(title: string): string | null {
    // Remove common prefixes and suffixes to extract artist name
    let artist = title
      .replace(/^(live|concert|show)\s+/i, '')
      .replace(/\s+(live|concert|show)$/i, '')
      .replace(/\s+at\s+.+$/i, '')
      .trim();
    
    return artist || null;
  }

  private inferGenre(title: string, artist: string, description?: string): string {
    const text = `${title} ${artist} ${description || ''}`.toLowerCase();
    
    if (text.includes('electronic') || text.includes('edm') || text.includes('techno')) {
      return 'Electronic';
    }
    if (text.includes('folk') || text.includes('acoustic')) {
      return 'Folk';
    }
    if (text.includes('jazz')) {
      return 'Jazz';
    }
    if (text.includes('punk') || text.includes('hardcore')) {
      return 'Punk';
    }
    if (text.includes('indie')) {
      return 'Indie Rock';
    }
    if (text.includes('rock')) {
      return 'Rock';
    }
    
    return 'Alternative';
  }

  async scrapeAllVenues(): Promise<ScrapedEvent[]> {
    console.log('Starting venue scraping...');
    
    const scrapers = [
      this.scrapeTheIndependent(),
      this.scrapeCafeDuNord(),
      this.scrapeBottomOfTheHill(),
      this.scrapeTheChapel()
    ];

    const results = await Promise.allSettled(scrapers);
    const allEvents: ScrapedEvent[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      } else {
        console.error(`Scraper ${index} failed:`, result.reason);
      }
    });

    console.log(`Total scraped events: ${allEvents.length}`);
    return allEvents;
  }

  async saveScrapedEvents(scrapedEvents: ScrapedEvent[]): Promise<void> {
    console.log('Saving scraped events to database...');

    for (const scrapedEvent of scrapedEvents) {
      try {
        // Find or create venue
        let venue = await db.select().from(venues).where(eq(venues.name, scrapedEvent.venue)).limit(1);
        if (venue.length === 0) {
          console.log(`Creating new venue: ${scrapedEvent.venue}`);
          // Create basic venue record - would need to be enhanced with more details
          const [newVenue] = await db.insert(venues).values({
            name: scrapedEvent.venue,
            slug: scrapedEvent.venue.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            neighborhood: 'Unknown', // Would need to be filled in
            address: 'Unknown', // Would need to be filled in
            capacity: 0, // Would need to be filled in
            venueType: 'Music Venue',
            primaryGenres: [scrapedEvent.genre || 'Alternative']
          }).returning();
          venue = [newVenue];
        }

        // Find or create artist
        let artist = await db.select().from(artists).where(eq(artists.name, scrapedEvent.artist)).limit(1);
        if (artist.length === 0) {
          console.log(`Creating new artist: ${scrapedEvent.artist}`);
          const [newArtist] = await db.insert(artists).values({
            name: scrapedEvent.artist,
            slug: scrapedEvent.artist.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            genre: scrapedEvent.genre || 'Alternative',
            location: 'San Francisco Bay Area'
          }).returning();
          artist = [newArtist];
        }

        // Create event
        const eventSlug = `${scrapedEvent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${scrapedEvent.date.toISOString().split('T')[0]}`;
        
        // Check if event already exists
        const existingEvent = await db.select().from(events).where(eq(events.slug, eventSlug)).limit(1);
        if (existingEvent.length === 0) {
          await db.insert(events).values({
            title: scrapedEvent.title,
            slug: eventSlug,
            artistId: artist[0].id,
            venueId: venue[0].id,
            date: scrapedEvent.date,
            doors: scrapedEvent.doors,
            showTime: scrapedEvent.showTime,
            description: scrapedEvent.description,
            ticketUrl: scrapedEvent.ticketUrl,
            imageUrl: scrapedEvent.imageUrl,
            isActive: true,
            isFeatured: false,
            openingActs: []
          });
          console.log(`Created event: ${scrapedEvent.title}`);
        } else {
          console.log(`Event already exists: ${scrapedEvent.title}`);
        }

      } catch (error) {
        console.error(`Error saving event "${scrapedEvent.title}":`, error);
      }
    }

    console.log('Finished saving scraped events');
  }
}

export const venueScraper = new VenueScraper();