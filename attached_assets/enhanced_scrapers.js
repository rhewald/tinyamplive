import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnhancedEventScraper {
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
    
    // Set user agent
    await this.page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeIndependent() {
    try {
      console.log('Scraping The Independent...');
      await this.page.goto('https://www.theindependentsf.com/', { waitUntil: 'networkidle' });
      
      // Wait for content to load
      await this.page.waitForTimeout(3000);
      
      // Look for event listings
      const events = await this.page.evaluate(() => {
        const eventElements = document.querySelectorAll('[class*="event"], [class*="show"], [class*="listing"]');
        const events = [];
        
        eventElements.forEach((element, index) => {
          if (index > 10) return; // Limit to first 10
          
          const title = element.querySelector('h1, h2, h3, h4, h5, a')?.textContent?.trim();
          const dateText = element.textContent.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
          
          if (title && dateText && title.length > 3) {
            events.push({
              title: title,
              date: dateText[0],
              venue: 'The Independent',
              venue_slug: 'the-independent'
            });
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

  async scrapeBottomOfHill() {
    try {
      console.log('Scraping Bottom of the Hill...');
      await this.page.goto('https://www.bottomofthehill.com/calendar.html', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(3000);
      
      const events = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('tr');
        const events = [];
        
        rows.forEach((row, index) => {
          if (index > 20) return;
          
          const text = row.textContent;
          const dateMatch = text.match(/(\w+\s+\d{1,2},?\s+20\d{2})/);
          
          if (dateMatch && text.length > 20) {
            const dateStr = dateMatch[1].replace(',', '');
            const artistText = text.replace(dateStr, '').trim();
            
            if (artistText.length > 3) {
              events.push({
                title: `${artistText} at Bottom of the Hill`,
                date: dateStr,
                venue: 'Bottom of the Hill',
                venue_slug: 'bottom-of-the-hill'
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

  async scrapeCafeDuNord() {
    try {
      console.log('Scraping Café du Nord...');
      await this.page.goto('https://www.cafedunord.com/', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(3000);
      
      const events = await this.page.evaluate(() => {
        const eventElements = document.querySelectorAll('[class*="event"], [class*="show"], [class*="listing"]');
        const events = [];
        
        eventElements.forEach((element, index) => {
          if (index > 10) return;
          
          const title = element.querySelector('h1, h2, h3, h4, h5, a')?.textContent?.trim();
          const dateText = element.textContent.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
          
          if (title && dateText && title.length > 3) {
            events.push({
              title: title,
              date: dateText[0],
              venue: 'Café du Nord',
              venue_slug: 'cafe-du-nord'
            });
          }
        });
        
        return events;
      });
      
      console.log(`Found ${events.length} events at Café du Nord`);
      return events;
      
    } catch (error) {
      console.error('Error scraping Café du Nord:', error);
      return [];
    }
  }

  async scrapeAllVenues() {
    try {
      await this.init();
      
      const allEvents = [];
      
      // Scrape each venue
      const independentEvents = await this.scrapeIndependent();
      allEvents.push(...independentEvents);
      
      await this.page.waitForTimeout(2000);
      
      const bthEvents = await this.scrapeBottomOfHill();
      allEvents.push(...bthEvents);
      
      await this.page.waitForTimeout(2000);
      
      const cafeEvents = await this.scrapeCafeDuNord();
      allEvents.push(...cafeEvents);
      
      console.log(`Total events found: ${allEvents.length}`);
      
      // Save to file
      const outputPath = path.join(__dirname, 'scraped_events_enhanced.json');
      fs.writeFileSync(outputPath, JSON.stringify(allEvents, null, 2));
      console.log(`Events saved to ${outputPath}`);
      
      return allEvents;
      
    } catch (error) {
      console.error('Error in scrapeAllVenues:', error);
      return [];
    } finally {
      await this.close();
    }
  }
}

// Run the scraper
async function main() {
  const scraper = new EnhancedEventScraper();
  const events = await scraper.scrapeAllVenues();
  
  console.log('\nSample events:');
  events.slice(0, 5).forEach(event => {
    console.log(`- ${event.title} at ${event.venue} on ${event.date}`);
  });
}

// Run the scraper
main().catch(console.error); 