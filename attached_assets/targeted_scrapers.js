import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TargetedEventScraper {
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

  async scrapeBottomOfHillTargeted() {
    try {
      console.log('Scraping Bottom of the Hill with targeted approach...');
      await this.page.goto('https://www.bottomofthehill.com/calendar.html', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(3000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        const rows = document.querySelectorAll('tr');
        
        rows.forEach((row) => {
          const text = row.textContent;
          
          // Look for specific patterns in Bottom of the Hill's format
          const dateMatch = text.match(/(\w+\s+\d{1,2},?\s+20\d{2})/);
          
          if (dateMatch) {
            const dateStr = dateMatch[1].replace(',', '');
            const remainingText = text.replace(dateStr, '').trim();
            
            // Extract artist names from the remaining text
            const lines = remainingText.split('\n').filter(line => line.trim().length > 0);
            
            for (const line of lines) {
              const cleanLine = line.trim();
              
              // Skip lines that are clearly not artist names
              if (cleanLine.includes('PM') || 
                  cleanLine.includes('doors') || 
                  cleanLine.includes('$') ||
                  cleanLine.includes('AND OVER') ||
                  cleanLine.includes('ALL AGES') ||
                  cleanLine.length < 3 ||
                  cleanLine.length > 100) {
                continue;
              }
              
              // Look for artist names (capitalized words)
              const artistMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
              if (artistMatch && artistMatch[1].length > 2) {
                events.push({
                  title: `${artistMatch[1]} at Bottom of the Hill`,
                  date: dateStr,
                  venue: 'Bottom of the Hill',
                  venue_slug: 'bottom-of-the-hill',
                  raw_text: cleanLine.substring(0, 100)
                });
              }
            }
          }
        });
        
        return events;
      });
      
      console.log(`Found ${events.length} events at Bottom of the Hill`);
      return events;
      
    } catch (error) {
      console.error('Error scraping Bottom of the Hill:', error);
      return [];
    }
  }

  async scrapeIndependentTargeted() {
    try {
      console.log('Scraping The Independent with targeted approach...');
      await this.page.goto('https://www.theindependentsf.com/', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(3000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        
        // Look for specific elements that might contain events
        const possibleEventElements = document.querySelectorAll('div, article, section');
        
        possibleEventElements.forEach((element) => {
          const text = element.textContent;
          
          // Look for date patterns
          const datePatterns = [
            /(\w+\s+\d{1,2},?\s+20\d{2})/g,
            /(\d{1,2}\/\d{1,2}\/\d{4})/g,
          ];
          
          for (const pattern of datePatterns) {
            const matches = text.matchAll(pattern);
            
            for (const match of matches) {
              const dateStr = match[1];
              const title = element.querySelector('h1, h2, h3, h4, h5, a, strong, b')?.textContent?.trim();
              
              if (title && title.length > 3) {
                events.push({
                  title: title,
                  date: dateStr,
                  venue: 'The Independent',
                  venue_slug: 'the-independent',
                  raw_text: text.substring(0, 100)
                });
              }
            }
          }
        });
        
        return events;
      });
      
      console.log(`Found ${events.length} events at The Independent`);
      return events;
      
    } catch (error) {
      console.error('Error scraping The Independent:', error);
      return [];
    }
  }

  async scrapeCafeDuNordTargeted() {
    try {
      console.log('Scraping Café du Nord with targeted approach...');
      await this.page.goto('https://www.cafedunord.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      await this.page.waitForTimeout(3000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        
        // Look for any text content that might contain events
        const allText = document.body.textContent;
        
        // Look for date patterns in the entire page
        const datePatterns = [
          /(\w+\s+\d{1,2},?\s+20\d{2})/g,
          /(\d{1,2}\/\d{1,2}\/\d{4})/g,
        ];
        
        for (const pattern of datePatterns) {
          const matches = allText.matchAll(pattern);
          
          for (const match of matches) {
            const dateStr = match[1];
            
            // Look for text around the date that might be an artist name
            const contextStart = Math.max(0, match.index - 100);
            const contextEnd = Math.min(allText.length, match.index + 100);
            const context = allText.substring(contextStart, contextEnd);
            
            // Extract potential artist names from context
            const lines = context.split('\n').filter(line => line.trim().length > 0);
            
            for (const line of lines) {
              const cleanLine = line.trim();
              
              if (cleanLine.length > 3 && cleanLine.length < 50 && 
                  !cleanLine.includes('PM') && !cleanLine.includes('doors')) {
                events.push({
                  title: `${cleanLine} at Café du Nord`,
                  date: dateStr,
                  venue: 'Café du Nord',
                  venue_slug: 'cafe-du-nord',
                  raw_text: context.substring(0, 100)
                });
                break; // Only take the first artist per date
              }
            }
          }
        }
        
        return events;
      });
      
      console.log(`Found ${events.length} events at Café du Nord`);
      return events;
      
    } catch (error) {
      console.error('Error scraping Café du Nord:', error);
      return [];
    }
  }

  async scrapeGreatAmericanMusicHallTargeted() {
    try {
      console.log('Scraping Great American Music Hall with targeted approach...');
      await this.page.goto('https://gamh.com/events/', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(3000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        
        // Look for event elements
        const eventElements = document.querySelectorAll('[class*="event"], [class*="show"], article, .event, .show, .listing');
        
        eventElements.forEach((element) => {
          const text = element.textContent;
          
          // Look for date patterns
          const datePatterns = [
            /(\w+\s+\d{1,2},?\s+20\d{2})/g,
            /(\d{1,2}\/\d{1,2}\/\d{4})/g,
          ];
          
          for (const pattern of datePatterns) {
            const matches = text.matchAll(pattern);
            
            for (const match of matches) {
              const dateStr = match[1];
              const title = element.querySelector('h1, h2, h3, h4, h5, a, strong, b')?.textContent?.trim();
              
              if (title && title.length > 3) {
                events.push({
                  title: title,
                  date: dateStr,
                  venue: 'Great American Music Hall',
                  venue_slug: 'great-american-music-hall',
                  raw_text: text.substring(0, 100)
                });
              }
            }
          }
        });
        
        return events;
      });
      
      console.log(`Found ${events.length} events at Great American Music Hall`);
      return events;
      
    } catch (error) {
      console.error('Error scraping Great American Music Hall:', error);
      return [];
    }
  }

  async scrapeAllVenuesTargeted() {
    try {
      await this.init();
      
      const allEvents = [];
      
      // Scrape each venue with targeted approach
      const bthEvents = await this.scrapeBottomOfHillTargeted();
      allEvents.push(...bthEvents);
      
      await this.page.waitForTimeout(2000);
      
      const independentEvents = await this.scrapeIndependentTargeted();
      allEvents.push(...independentEvents);
      
      await this.page.waitForTimeout(2000);
      
      const cafeEvents = await this.scrapeCafeDuNordTargeted();
      allEvents.push(...cafeEvents);
      
      await this.page.waitForTimeout(2000);
      
      const gamhEvents = await this.scrapeGreatAmericanMusicHallTargeted();
      allEvents.push(...gamhEvents);
      
      console.log(`Total events found: ${allEvents.length}`);
      
      // Remove duplicates
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
      const outputPath = path.join(__dirname, 'targeted_scraped_events.json');
      fs.writeFileSync(outputPath, JSON.stringify(uniqueEvents, null, 2));
      console.log(`Events saved to ${outputPath}`);
      
      return uniqueEvents;
      
    } catch (error) {
      console.error('Error in targeted scraping:', error);
      return [];
    } finally {
      await this.close();
    }
  }
}

// Run the targeted scraper
async function main() {
  const scraper = new TargetedEventScraper();
  const events = await scraper.scrapeAllVenuesTargeted();
  
  console.log('\nSample events:');
  events.slice(0, 15).forEach(event => {
    console.log(`- ${event.title} at ${event.venue} on ${event.date}`);
  });
  
  console.log(`\nTotal events found: ${events.length}`);
}

main().catch(console.error); 