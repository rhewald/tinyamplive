import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AggressiveIndependentScraper {
  constructor() {
    this.browser = null;
    this.page = null;
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
      
      console.log('Aggressive Independent scraper initialized');
    } catch (error) {
      console.error('Error initializing scraper:', error);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeIndependentAggressive() {
    try {
      console.log('Scraping The Independent aggressively...');
      
      const events = [];
      const urls = [
        'https://www.theindependentsf.com/',
        'https://www.theindependentsf.com/calendar',
        'https://www.theindependentsf.com/events',
        'https://www.theindependentsf.com/shows',
        'https://www.theindependentsf.com/upcoming',
        'https://www.theindependentsf.com/lineup'
      ];

      for (const url of urls) {
        try {
          console.log(`Trying URL: ${url}`);
          await this.page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
          await this.page.waitForTimeout(2000);
          
          const pageEvents = await this.page.evaluate(() => {
            const events = [];
            const allText = document.body.textContent || '';
            
            // Multiple patterns to catch different date formats
            const datePatterns = [
              /(\w+\s+\d{1,2},?\s+20\d{2})/g,
              /(\d{1,2}\/\d{1,2}\/\d{4})/g,
              /(\w+\s+\d{1,2}\s+20\d{2})/g,
              /(\d{1,2}\.\d{1,2}\.\d{4})/g,
              /(\w+\s+\d{1,2}st,?\s+20\d{2})/g,
              /(\w+\s+\d{1,2}nd,?\s+20\d{2})/g,
              /(\w+\s+\d{1,2}rd,?\s+20\d{2})/g,
              /(\w+\s+\d{1,2}th,?\s+20\d{2})/g,
            ];
            
            // Artist name patterns
            const artistPatterns = [
              /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gm,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\[/g,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+at\s+The\s+Independent/g,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Live/g,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Concert/g,
            ];
            
            for (const datePattern of datePatterns) {
              const dateMatches = Array.from(allText.matchAll(datePattern));
              
              for (const dateMatch of dateMatches) {
                const dateStr = dateMatch[1];
                const contextStart = Math.max(0, dateMatch.index - 300);
                const contextEnd = Math.min(allText.length, dateMatch.index + 300);
                const context = allText.substring(contextStart, contextEnd);
                
                // Look for artist names in the context
                for (const artistPattern of artistPatterns) {
                  const artistMatches = Array.from(context.matchAll(artistPattern));
                  
                  for (const artistMatch of artistMatches) {
                    const artistName = artistMatch[1].trim();
                    
                    // Filter out invalid artist names
                    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    const genericTerms = ['indie', 'pop', 'rock', 'punk', 'folk', 'surf', 'emo', 'shoegaze', 'post', 'metal', 'psychedelic', 'garage', 'alternative', 'americana', 'country', 'jazz', 'swing', 'blues', 'stoner', 'synthwave', 'doors', 'advance', 'ticket', 'show', 'concert', 'live', 'music'];
                    
                    if (artistName.length > 2 && artistName.length < 50 &&
                        !dayNames.includes(artistName) &&
                        !monthNames.includes(artistName) &&
                        !genericTerms.some(term => artistName.toLowerCase().includes(term)) &&
                        !artistName.includes('The Independent') &&
                        !artistName.includes('Independent')) {
                      
                      events.push({
                        title: `${artistName} at The Independent`,
                        date: dateStr,
                        venue: 'The Independent',
                        venue_slug: 'the-independent',
                        raw_text: context.substring(0, 150)
                      });
                    }
                  }
                }
              }
            }
            
            return events;
          });
          
          events.push(...pageEvents);
          console.log(`Found ${pageEvents.length} events from ${url}`);
          
        } catch (error) {
          console.log(`Error scraping ${url}:`, error.message);
        }
      }
      
      // Remove duplicates
      const uniqueEvents = [];
      const seen = new Set();
      
      events.forEach(event => {
        const key = `${event.title}-${event.date}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEvents.push(event);
        }
      });
      
      console.log(`Total unique events found: ${uniqueEvents.length}`);
      return uniqueEvents;
      
    } catch (error) {
      console.error('Error scraping The Independent:', error);
      return [];
    }
  }

  async scrapeBottomOfHillAggressive() {
    try {
      console.log('Scraping Bottom of the Hill aggressively...');
      
      const events = [];
      const urls = [
        'https://www.bottomofthehill.com/calendar.html',
        'https://www.bottomofthehill.com/',
        'https://www.bottomofthehill.com/shows',
        'https://www.bottomofthehill.com/events',
        'https://www.bottomofthehill.com/upcoming'
      ];

      for (const url of urls) {
        try {
          console.log(`Trying URL: ${url}`);
          await this.page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
          await this.page.waitForTimeout(2000);
          
          const pageEvents = await this.page.evaluate(() => {
            const events = [];
            const allText = document.body.textContent || '';
            
            const datePatterns = [
              /(\w+\s+\d{1,2},?\s+20\d{2})/g,
              /(\d{1,2}\/\d{1,2}\/\d{4})/g,
              /(\w+\s+\d{1,2}\s+20\d{2})/g,
              /(\d{1,2}\.\d{1,2}\.\d{4})/g,
            ];
            
            const artistPatterns = [
              /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gm,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\[/g,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+at\s+Bottom/g,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+Live/g,
            ];
            
            for (const datePattern of datePatterns) {
              const dateMatches = Array.from(allText.matchAll(datePattern));
              
              for (const dateMatch of dateMatches) {
                const dateStr = dateMatch[1];
                const contextStart = Math.max(0, dateMatch.index - 300);
                const contextEnd = Math.min(allText.length, dateMatch.index + 300);
                const context = allText.substring(contextStart, contextEnd);
                
                for (const artistPattern of artistPatterns) {
                  const artistMatches = Array.from(context.matchAll(artistPattern));
                  
                  for (const artistMatch of artistMatches) {
                    const artistName = artistMatch[1].trim();
                    
                    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    const genericTerms = ['indie', 'pop', 'rock', 'punk', 'folk', 'surf', 'emo', 'shoegaze', 'post', 'metal', 'psychedelic', 'garage', 'alternative', 'americana', 'country', 'jazz', 'swing', 'blues', 'stoner', 'synthwave', 'doors', 'advance', 'ticket', 'show', 'concert', 'live', 'music'];
                    
                    if (artistName.length > 2 && artistName.length < 50 &&
                        !dayNames.includes(artistName) &&
                        !monthNames.includes(artistName) &&
                        !genericTerms.some(term => artistName.toLowerCase().includes(term)) &&
                        !artistName.includes('Bottom of the Hill') &&
                        !artistName.includes('Bottom')) {
                      
                      events.push({
                        title: `${artistName} at Bottom of the Hill`,
                        date: dateStr,
                        venue: 'Bottom of the Hill',
                        venue_slug: 'bottom-of-the-hill',
                        raw_text: context.substring(0, 150)
                      });
                    }
                  }
                }
              }
            }
            
            return events;
          });
          
          events.push(...pageEvents);
          console.log(`Found ${pageEvents.length} events from ${url}`);
          
        } catch (error) {
          console.log(`Error scraping ${url}:`, error.message);
        }
      }
      
      // Remove duplicates
      const uniqueEvents = [];
      const seen = new Set();
      
      events.forEach(event => {
        const key = `${event.title}-${event.date}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEvents.push(event);
        }
      });
      
      console.log(`Total unique events found: ${uniqueEvents.length}`);
      return uniqueEvents;
      
    } catch (error) {
      console.error('Error scraping Bottom of the Hill:', error);
      return [];
    }
  }

  async scrapeAllVenuesAggressive() {
    try {
      console.log('Starting aggressive scraping of all venues...');
      
      const allEvents = [];
      
      // Scrape The Independent
      const independentEvents = await this.scrapeIndependentAggressive();
      allEvents.push(...independentEvents);
      
      // Scrape Bottom of the Hill
      const bottomEvents = await this.scrapeBottomOfHillAggressive();
      allEvents.push(...bottomEvents);
      
      // Remove duplicates across all venues
      const uniqueEvents = [];
      const seen = new Set();
      
      allEvents.forEach(event => {
        const key = `${event.title}-${event.date}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEvents.push(event);
        }
      });
      
      console.log(`Total unique events found across all venues: ${uniqueEvents.length}`);
      
      // Save to file
      const outputPath = path.join(__dirname, 'aggressive_scraped_events.json');
      fs.writeFileSync(outputPath, JSON.stringify(uniqueEvents, null, 2));
      console.log(`Saved ${uniqueEvents.length} events to ${outputPath}`);
      
      return uniqueEvents;
      
    } catch (error) {
      console.error('Error in aggressive scraping:', error);
      return [];
    }
  }
}

async function main() {
  const scraper = new AggressiveIndependentScraper();
  
  try {
    await scraper.init();
    const events = await scraper.scrapeAllVenuesAggressive();
    
    console.log('\nSample events:');
    events.slice(0, 10).forEach(event => {
      console.log(`- ${event.title} on ${event.date}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await scraper.close();
  }
}

main().catch(console.error); 