import * as cheerio from 'cheerio';

interface CafeDuNordEvent {
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

export class CafeDuNordScraper {
  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
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

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    
    try {
      // Clean the date string
      const cleanDate = dateStr.replace(/[^\w\s\-\/,]/g, '').trim();
      
      // Try various date formats
      const formats = [
        // WordPress event plugin formats
        /(\w+)\s+(\d{1,2}),?\s+(\d{4})/i, // "January 15, 2025" or "January 15 2025"
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,   // "01/15/2025"
        /(\d{4})-(\d{1,2})-(\d{1,2})/,    // "2025-01-15"
        /(\w+)\s+(\d{1,2})/i              // "January 15" (current year)
      ];

      for (const format of formats) {
        const match = cleanDate.match(format);
        if (match) {
          let year = new Date().getFullYear();
          let month = 0;
          let day = 1;

          if (format === formats[0]) { // Month Day, Year
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                              'july', 'august', 'september', 'october', 'november', 'december'];
            month = monthNames.indexOf(match[1].toLowerCase());
            day = parseInt(match[2]);
            year = parseInt(match[3]);
          } else if (format === formats[1]) { // MM/DD/YYYY
            month = parseInt(match[1]) - 1;
            day = parseInt(match[2]);
            year = parseInt(match[3]);
          } else if (format === formats[2]) { // YYYY-MM-DD
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            day = parseInt(match[3]);
          } else if (format === formats[3]) { // Month Day (current year)
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                              'july', 'august', 'september', 'october', 'november', 'december'];
            month = monthNames.indexOf(match[1].toLowerCase());
            day = parseInt(match[2]);
          }

          const parsedDate = new Date(year, month, day);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
      }

      // Fallback: try direct Date parsing
      const directParse = new Date(cleanDate);
      if (!isNaN(directParse.getTime())) {
        return directParse;
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

  async scrapeCafeDuNordComprehensive(): Promise<CafeDuNordEvent[]> {
    console.log('🎸 Comprehensive scraping for Cafe du Nord...');
    
    const events: CafeDuNordEvent[] = [];
    
    const urls = [
      'https://cafedunord.com/',
      'https://cafedunord.com/calendar/',
      'https://cafedunord.com/events/',
      'https://cafedunord.com/shows/',
      'https://cafedunord.com/upcoming-shows/'
    ];

    for (const url of urls) {
      try {
        console.log(`🔍 Checking ${url}...`);
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);
        
        // Multiple comprehensive selectors for WordPress event plugins
        const eventSelectors = [
          '.tw-event-item',           // Common WordPress event plugin
          '.event-item',              // Generic event item
          '.calendar-event',          // Calendar events
          '.show-item',               // Show listings
          '.concert-item',            // Concert listings
          '[data-event]',             // Data attribute events
          '.event',                   // Generic event class
          '.show',                    // Generic show class
          '.fc-event',                // FullCalendar events
          '.tribe-events-list-event-title', // Events Calendar plugin
          '.event-listing',           // Event listing
          '.upcoming-show',           // Upcoming shows
          '[class*="event"]',         // Any class containing "event"
          '[class*="show"]',          // Any class containing "show"
          '[class*="concert"]'        // Any class containing "concert"
        ];

        for (const selector of eventSelectors) {
          $(selector).each((i, element) => {
            const $event = $(element);
            
            // Extract title/artist from multiple possible locations
            const titleSelectors = [
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              '.title', '.event-title', '.show-title',
              '.artist', '.artist-name', '.performer',
              '.headline', '.name', '.event-name',
              'a[href*="event"]', 'a[href*="show"]',
              '.tw-name', '.tw-title'
            ];
            
            let title = '';
            for (const titleSelector of titleSelectors) {
              const foundTitle = $event.find(titleSelector).first().text().trim();
              if (foundTitle && foundTitle.length > 2) {
                title = foundTitle;
                break;
              }
            }

            // Extract date from multiple possible locations
            const dateSelectors = [
              '.date', '.event-date', '.show-date',
              '.tw-event-date', '.tw-date',
              '.time', '.datetime', '.event-time',
              '[class*="date"]', '[class*="time"]',
              '.fc-title', '.fc-time'
            ];
            
            let dateText = '';
            for (const dateSelector of dateSelectors) {
              const foundDate = $event.find(dateSelector).first().text().trim();
              if (foundDate) {
                dateText = foundDate;
                break;
              }
            }

            // Extract additional info
            const description = $event.find('.description, .details, .summary, p').first().text().trim();
            const ticketLink = $event.find('a[href*="ticket"], a[href*="buy"], a[href*="purchase"]').attr('href');
            
            // Extract image
            let imageUrl = $event.find('img').first().attr('src');
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = this.resolveUrl(imageUrl, url);
            }

            // Extract price info
            const priceText = $event.find('.price, .cost, [class*="price"], [class*="cost"]').first().text().trim();

            if (title && title.length > 2) {
              const parsedDate = this.parseDate(dateText) || new Date();
              
              events.push({
                title,
                artist: this.extractArtistName(title) || title,
                venue: 'Café du Nord',
                date: parsedDate,
                description: description || undefined,
                ticketUrl: ticketLink || undefined,
                imageUrl: imageUrl || undefined,
                price: priceText || undefined,
                genre: this.inferGenre(title)
              });
            }
          });
        }

        // Also check for JSON-LD structured data
        $('script[type="application/ld+json"]').each((i, element) => {
          try {
            const jsonText = $(element).html();
            if (jsonText && jsonText.includes('Event')) {
              const data = JSON.parse(jsonText);
              
              const extractEventsFromJSON = (obj: any): void => {
                if (Array.isArray(obj)) {
                  obj.forEach(extractEventsFromJSON);
                } else if (obj && typeof obj === 'object') {
                  if (obj['@type'] === 'Event' || obj['@type'] === 'MusicEvent') {
                    const name = obj.name || obj.headline;
                    const startDate = obj.startDate;
                    const location = obj.location?.name || 'Café du Nord';
                    
                    if (name && startDate) {
                      events.push({
                        title: name,
                        artist: this.extractArtistName(name) || name,
                        venue: 'Café du Nord',
                        date: new Date(startDate),
                        description: obj.description || undefined,
                        ticketUrl: obj.url || undefined,
                        imageUrl: obj.image?.url || obj.image || undefined,
                        genre: this.inferGenre(name)
                      });
                    }
                  }
                  
                  Object.values(obj).forEach(extractEventsFromJSON);
                }
              };
              
              extractEventsFromJSON(data);
            }
          } catch (error) {
            // Skip invalid JSON
          }
        });

      } catch (error) {
        console.log(`Failed to scrape ${url}:`, error.message);
        continue;
      }
    }

    // Remove duplicates based on title and date
    const uniqueEvents = events.filter((event, index, self) => 
      index === self.findIndex(e => 
        e.title.toLowerCase() === event.title.toLowerCase() && 
        e.date.toDateString() === event.date.toDateString()
      )
    );

    console.log(`Found ${uniqueEvents.length} unique events at Cafe du Nord`);
    return uniqueEvents;
  }
}

export const cafeDuNordScraper = new CafeDuNordScraper();