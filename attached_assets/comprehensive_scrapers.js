import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComprehensiveEventScraper {
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

  async scrapeBottomOfHillComprehensive() {
    try {
      console.log('Scraping Bottom of the Hill comprehensively...');
      await this.page.goto('https://www.bottomofthehill.com/calendar.html', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(5000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        
        // Get all table rows
        const rows = document.querySelectorAll('tr');
        
        rows.forEach((row, index) => {
          const text = row.textContent.trim();
          
          // Look for date patterns
          const datePatterns = [
            /(\w+\s+\d{1,2},?\s+20\d{2})/g,
            /(\d{1,2}\/\d{1,2}\/\d{4})/g,
            /(\w+\s+\d{1,2}\s+20\d{2})/g,
          ];
          
          let foundDate = null;
          for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
              foundDate = match[1].replace(',', '');
              break;
            }
          }
          
          if (foundDate && text.length > 20) {
            // Extract artist names - look for common patterns
            const artistPatterns = [
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z][a-z\s]+$/gm,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\[co-headlining\]/g,
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z][a-z\s]+(?=\s+at\s+Bottom)/g,
            ];
            
            let artistText = text.replace(foundDate, '').trim();
            
            // Clean up the text
            artistText = artistText.replace(/^\s*[A-Z][a-z]+\s+\d{1,2}:\d{2}[AP]M.*$/gm, '');
            artistText = artistText.replace(/doors.*$/gm, '');
            artistText = artistText.replace(/\$\d+.*$/gm, '');
            artistText = artistText.replace(/21 AND OVER.*$/gm, '');
            artistText = artistText.replace(/ALL AGES.*$/gm, '');
            
            if (artistText.length > 5) {
              events.push({
                title: `${artistText} at Bottom of the Hill`,
                date: foundDate,
                venue: 'Bottom of the Hill',
                venue_slug: 'bottom-of-the-hill',
                raw_text: text.substring(0, 200)
              });
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

  async scrapeIndependentComprehensive() {
    try {
      console.log('Scraping The Independent comprehensively...');
      await this.page.goto('https://www.theindependentsf.com/', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(5000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        
        // Try multiple selectors for events
        const selectors = [
          '[class*="event"]',
          '[class*="show"]',
          '[class*="listing"]',
          'article',
          '.event',
          '.show',
          '.listing',
          'div[class*="event"]',
          'div[class*="show"]',
          'div[class*="listing"]',
          'li[class*="event"]',
          'li[class*="show"]',
          'li[class*="listing"]',
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach((element, index) => {
            if (index > 50) return; // Limit per selector
            
            const text = element.textContent.trim();
            
            // Look for date patterns
            const datePatterns = [
              /(\w+\s+\d{1,2},?\s+20\d{2})/g,
              /(\d{1,2}\/\d{1,2}\/\d{4})/g,
              /(\w+\s+\d{1,2}\s+20\d{2})/g,
            ];
            
            let foundDate = null;
            for (const pattern of datePatterns) {
              const match = text.match(pattern);
              if (match) {
                foundDate = match[1].replace(',', '');
                break;
              }
            }
            
            if (foundDate && text.length > 10) {
              const title = element.querySelector('h1, h2, h3, h4, h5, a, strong, b')?.textContent?.trim() || 
                           text.split('\n')[0].trim();
              
              if (title.length > 3) {
                events.push({
                  title: title,
                  date: foundDate,
                  venue: 'The Independent',
                  venue_slug: 'the-independent',
                  raw_text: text.substring(0, 200)
                });
              }
            }
          });
        }
        
        return events;
      });
      
      console.log(`Found ${events.length} events at The Independent`);
      return events;
      
    } catch (error) {
      console.error('Error scraping The Independent:', error);
      return [];
    }
  }

  async scrapeCafeDuNordComprehensive() {
    try {
      console.log('Scraping Café du Nord comprehensively...');
      await this.page.goto('https://www.cafedunord.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      await this.page.waitForTimeout(3000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        
        // Try multiple approaches
        const selectors = [
          '[class*="event"]',
          '[class*="show"]',
          '[class*="listing"]',
          'article',
          '.event',
          '.show',
          '.listing',
          'div[class*="event"]',
          'div[class*="show"]',
          'div[class*="listing"]',
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach((element, index) => {
            if (index > 30) return;
            
            const text = element.textContent.trim();
            
            // Look for date patterns
            const datePatterns = [
              /(\w+\s+\d{1,2},?\s+20\d{2})/g,
              /(\d{1,2}\/\d{1,2}\/\d{4})/g,
              /(\w+\s+\d{1,2}\s+20\d{2})/g,
            ];
            
            let foundDate = null;
            for (const pattern of datePatterns) {
              const match = text.match(pattern);
              if (match) {
                foundDate = match[1].replace(',', '');
                break;
              }
            }
            
            if (foundDate && text.length > 10) {
              const title = element.querySelector('h1, h2, h3, h4, h5, a, strong, b')?.textContent?.trim() || 
                           text.split('\n')[0].trim();
              
              if (title.length > 3) {
                events.push({
                  title: title,
                  date: foundDate,
                  venue: 'Café du Nord',
                  venue_slug: 'cafe-du-nord',
                  raw_text: text.substring(0, 200)
                });
              }
            }
          });
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

  async scrapeGreatAmericanMusicHall() {
    try {
      console.log('Scraping Great American Music Hall...');
      await this.page.goto('https://gamh.com/events/', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(5000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        
        // Look for event elements
        const eventElements = document.querySelectorAll('[class*="event"], [class*="show"], article, .event, .show');
        
        eventElements.forEach((element, index) => {
          if (index > 50) return;
          
          const text = element.textContent.trim();
          
          // Look for date patterns
          const datePatterns = [
            /(\w+\s+\d{1,2},?\s+20\d{2})/g,
            /(\d{1,2}\/\d{1,2}\/\d{4})/g,
            /(\w+\s+\d{1,2}\s+20\d{2})/g,
          ];
          
          let foundDate = null;
          for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
              foundDate = match[1].replace(',', '');
              break;
            }
          }
          
          if (foundDate && text.length > 10) {
            const title = element.querySelector('h1, h2, h3, h4, h5, a, strong, b')?.textContent?.trim() || 
                         text.split('\n')[0].trim();
            
            if (title.length > 3) {
              events.push({
                title: title,
                date: foundDate,
                venue: 'Great American Music Hall',
                venue_slug: 'great-american-music-hall',
                raw_text: text.substring(0, 200)
              });
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

  async scrapeAllVenuesComprehensive() {
    try {
      await this.init();
      
      const allEvents = [];
      
      // Scrape each venue with comprehensive approach
      const bthEvents = await this.scrapeBottomOfHillComprehensive();
      allEvents.push(...bthEvents);
      
      await this.page.waitForTimeout(3000);
      
      const independentEvents = await this.scrapeIndependentComprehensive();
      allEvents.push(...independentEvents);
      
      await this.page.waitForTimeout(3000);
      
      const cafeEvents = await this.scrapeCafeDuNordComprehensive();
      allEvents.push(...cafeEvents);
      
      await this.page.waitForTimeout(3000);
      
      const gamhEvents = await this.scrapeGreatAmericanMusicHall();
      allEvents.push(...gamhEvents);
      
      console.log(`Total events found: ${allEvents.length}`);
      
      // Remove duplicates based on title and date
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
      const outputPath = path.join(__dirname, 'comprehensive_scraped_events.json');
      fs.writeFileSync(outputPath, JSON.stringify(uniqueEvents, null, 2));
      console.log(`Events saved to ${outputPath}`);
      
      return uniqueEvents;
      
    } catch (error) {
      console.error('Error in comprehensive scraping:', error);
      return [];
    } finally {
      await this.close();
    }
  }
}

// Run the comprehensive scraper
async function main() {
  const scraper = new ComprehensiveEventScraper();
  const events = await scraper.scrapeAllVenuesComprehensive();
  
  console.log('\nSample events:');
  events.slice(0, 10).forEach(event => {
    console.log(`- ${event.title} at ${event.venue} on ${event.date}`);
  });
  
  console.log(`\nTotal events found: ${events.length}`);
}

main().catch(console.error); 