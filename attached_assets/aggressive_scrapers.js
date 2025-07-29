import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AggressiveEventScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeBottomOfHillAggressive() {
    try {
      console.log('Scraping Bottom of the Hill aggressively...');
      const events = [];
      
      // Try multiple URLs and approaches
      const urls = [
        'https://www.bottomofthehill.com/calendar.html',
        'https://www.bottomofthehill.com/',
        'https://www.bottomofthehill.com/events.html',
        'https://www.bottomofthehill.com/shows.html'
      ];
      
      for (const url of urls) {
        try {
          await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await this.page.waitForTimeout(3000);
          
          const pageEvents = await this.page.evaluate(() => {
            const events = [];
            
            // Get ALL text content from the page
            const allText = document.body.textContent;
            
            // Look for date patterns in the entire page
            const datePatterns = [
              /(\w+\s+\d{1,2},?\s+20\d{2})/g,
              /(\d{1,2}\/\d{1,2}\/\d{4})/g,
              /(\w+\s+\d{1,2}\s+20\d{2})/g,
              /(\d{1,2}\/\d{1,2}\/\d{2})/g,
            ];
            
            for (const pattern of datePatterns) {
              const matches = allText.matchAll(pattern);
              
              for (const match of matches) {
                const dateStr = match[1];
                
                // Look for text around the date that might be an artist name
                const contextStart = Math.max(0, match.index - 200);
                const contextEnd = Math.min(allText.length, match.index + 200);
                const context = allText.substring(contextStart, contextEnd);
                
                // Extract potential artist names from context
                const lines = context.split('\n').filter(line => line.trim().length > 0);
                
                for (const line of lines) {
                  const cleanLine = line.trim();
                  
                  // Look for artist name patterns
                  if (cleanLine.length > 3 && cleanLine.length < 100 && 
                      !cleanLine.includes('PM') && !cleanLine.includes('doors') &&
                      !cleanLine.includes('$') && !cleanLine.includes('AND OVER') &&
                      !cleanLine.includes('ALL AGES') && !cleanLine.includes('advance') &&
                      !cleanLine.includes('door') && !cleanLine.includes('music at') &&
                      !cleanLine.includes('Bottom of the Hill') && !cleanLine.includes('bottomofthehill.com')) {
                    
                    // Check if it looks like an artist name (capitalized words)
                    const artistMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
                    if (artistMatch && artistMatch[1].length > 2) {
                      events.push({
                        title: `${artistMatch[1]} at Bottom of the Hill`,
                        date: dateStr,
                        venue: 'Bottom of the Hill',
                        venue_slug: 'bottom-of-the-hill',
                        raw_text: context.substring(0, 100)
                      });
                      break; // Only take the first artist per date
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
      
      console.log(`Total events found at Bottom of the Hill: ${events.length}`);
      return events;
      
    } catch (error) {
      console.error('Error scraping Bottom of the Hill:', error);
      return [];
    }
  }

  async scrapeIndependentAggressive() {
    try {
      console.log('Scraping The Independent aggressively...');
      const events = [];
      
      const urls = [
        'https://www.theindependentsf.com/',
        'https://www.theindependentsf.com/events',
        'https://www.theindependentsf.com/shows',
        'https://www.theindependentsf.com/calendar'
      ];
      
      for (const url of urls) {
        try {
          await this.page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await this.page.waitForTimeout(3000);
          
          const pageEvents = await this.page.evaluate(() => {
            const events = [];
            
            // Get all text content
            const allText = document.body.textContent;
            
            // Look for date patterns
            const datePatterns = [
              /(\w+\s+\d{1,2},?\s+20\d{2})/g,
              /(\d{1,2}\/\d{1,2}\/\d{4})/g,
              /(\w+\s+\d{1,2}\s+20\d{2})/g,
            ];
            
            for (const pattern of datePatterns) {
              const matches = allText.matchAll(pattern);
              
              for (const match of matches) {
                const dateStr = match[1];
                
                // Look for text around the date
                const contextStart = Math.max(0, match.index - 150);
                const contextEnd = Math.min(allText.length, match.index + 150);
                const context = allText.substring(contextStart, contextEnd);
                
                const lines = context.split('\n').filter(line => line.trim().length > 0);
                
                for (const line of lines) {
                  const cleanLine = line.trim();
                  
                  if (cleanLine.length > 3 && cleanLine.length < 80 && 
                      !cleanLine.includes('PM') && !cleanLine.includes('doors') &&
                      !cleanLine.includes('$') && !cleanLine.includes('The Independent')) {
                    
                    const artistMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
                    if (artistMatch && artistMatch[1].length > 2) {
                      events.push({
                        title: `${artistMatch[1]} at The Independent`,
                        date: dateStr,
                        venue: 'The Independent',
                        venue_slug: 'the-independent',
                        raw_text: context.substring(0, 100)
                      });
                      break;
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
      
      console.log(`Total events found at The Independent: ${events.length}`);
      return events;
      
    } catch (error) {
      console.error('Error scraping The Independent:', error);
      return [];
    }
  }

  async scrapeCafeDuNordAggressive() {
    try {
      console.log('Scraping Café du Nord aggressively...');
      const events = [];
      
      const urls = [
        'https://www.cafedunord.com/',
        'https://www.cafedunord.com/events',
        'https://www.cafedunord.com/shows',
        'https://www.cafedunord.com/calendar'
      ];
      
      for (const url of urls) {
        try {
          await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await this.page.waitForTimeout(3000);
          
          const pageEvents = await this.page.evaluate(() => {
            const events = [];
            
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
                
                const contextStart = Math.max(0, match.index - 150);
                const contextEnd = Math.min(allText.length, match.index + 150);
                const context = allText.substring(contextStart, contextEnd);
                
                const lines = context.split('\n').filter(line => line.trim().length > 0);
                
                for (const line of lines) {
                  const cleanLine = line.trim();
                  
                  if (cleanLine.length > 3 && cleanLine.length < 80 && 
                      !cleanLine.includes('PM') && !cleanLine.includes('doors') &&
                      !cleanLine.includes('$') && !cleanLine.includes('Café du Nord')) {
                    
                    const artistMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
                    if (artistMatch && artistMatch[1].length > 2) {
                      events.push({
                        title: `${artistMatch[1]} at Café du Nord`,
                        date: dateStr,
                        venue: 'Café du Nord',
                        venue_slug: 'cafe-du-nord',
                        raw_text: context.substring(0, 100)
                      });
                      break;
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
      
      console.log(`Total events found at Café du Nord: ${events.length}`);
      return events;
      
    } catch (error) {
      console.error('Error scraping Café du Nord:', error);
      return [];
    }
  }

  async scrapeAllVenuesAggressive() {
    try {
      await this.init();
      
      const allEvents = [];
      
      // Scrape each venue with aggressive approach
      const bthEvents = await this.scrapeBottomOfHillAggressive();
      allEvents.push(...bthEvents);
      
      await this.page.waitForTimeout(2000);
      
      const independentEvents = await this.scrapeIndependentAggressive();
      allEvents.push(...independentEvents);
      
      await this.page.waitForTimeout(2000);
      
      const cafeEvents = await this.scrapeCafeDuNordAggressive();
      allEvents.push(...cafeEvents);
      
      console.log(`Total events found: ${allEvents.length}`);
      
      // Remove duplicates based on title, date, and venue
      const uniqueEvents = [];
      const seen = new Set();
      
      allEvents.forEach(event => {
        const key = `${event.title}-${event.date}-${event.venue}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueEvents.push(event);
        }
      });
      
      console.log(`Unique events after deduplication: ${uniqueEvents.length}`);
      
      // Save to file
      const outputPath = path.join(__dirname, 'aggressive_scraped_events.json');
      fs.writeFileSync(outputPath, JSON.stringify(uniqueEvents, null, 2));
      console.log(`Events saved to ${outputPath}`);
      
      return uniqueEvents;
      
    } catch (error) {
      console.error('Error in aggressive scraping:', error);
      return [];
    } finally {
      await this.close();
    }
  }
}

// Run the aggressive scraper
async function main() {
  const scraper = new AggressiveEventScraper();
  const events = await scraper.scrapeAllVenuesAggressive();
  
  console.log('\nSample events:');
  events.slice(0, 20).forEach(event => {
    console.log(`- ${event.title} at ${event.venue} on ${event.date}`);
  });
  
  console.log(`\nTotal events found: ${events.length}`);
}

main().catch(console.error); 