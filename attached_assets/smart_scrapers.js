import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SmartEventScraper {
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

  async scrapeBottomOfHillSmart() {
    try {
      console.log('Scraping Bottom of the Hill with smart approach...');
      await this.page.goto('https://www.bottomofthehill.com/calendar.html', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(3000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        
        // Get all table rows and look for structured event data
        const rows = document.querySelectorAll('tr');
        
        rows.forEach((row) => {
          const text = row.textContent;
          
          // Look for date patterns
          const dateMatch = text.match(/(\w+\s+\d{1,2},?\s+20\d{2})/);
          
          if (dateMatch) {
            const dateStr = dateMatch[1].replace(',', '');
            const remainingText = text.replace(dateStr, '').trim();
            
            // Split into lines and look for artist patterns
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
                  cleanLine.length > 100 ||
                  cleanLine.match(/^\d+:\d+/) ||
                  cleanLine.includes('advance') ||
                  cleanLine.includes('door')) {
                continue;
              }
              
              // Look for proper artist names (capitalized words, not day names)
              const artistMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
              if (artistMatch && artistMatch[1].length > 2) {
                const artistName = artistMatch[1];
                
                // Filter out day names and generic terms
                const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                const genericTerms = ['indie', 'pop', 'rock', 'punk', 'folk', 'surf', 'emo', 'shoegaze', 'post', 'metal', 'psychedelic', 'garage', 'alternative', 'americana', 'country', 'jazz', 'swing', 'blues', 'stoner', 'synthwave'];
                
                if (!dayNames.includes(artistName) && 
                    !monthNames.includes(artistName) &&
                    !genericTerms.some(term => artistName.toLowerCase().includes(term))) {
                  
                  events.push({
                    title: `${artistName} at Bottom of the Hill`,
                    date: dateStr,
                    venue: 'Bottom of the Hill',
                    venue_slug: 'bottom-of-the-hill',
                    raw_text: cleanLine.substring(0, 100)
                  });
                }
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

  async scrapeIndependentSmart() {
    try {
      console.log('Scraping The Independent with smart approach...');
      await this.page.goto('https://www.theindependentsf.com/', { waitUntil: 'networkidle' });
      
      await this.page.waitForTimeout(3000);
      
      const events = await this.page.evaluate(() => {
        const events = [];
        
        // Look for event elements with specific selectors
        const eventSelectors = [
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
        
        for (const selector of eventSelectors) {
          const elements = document.querySelectorAll(selector);
          
          elements.forEach((element) => {
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
                
                // Look for artist names in the element
                const artistElements = element.querySelectorAll('h1, h2, h3, h4, h5, a, strong, b');
                
                for (const artistElement of artistElements) {
                  const artistText = artistElement.textContent.trim();
                  
                  if (artistText.length > 3 && artistText.length < 80) {
                    // Filter out generic terms
                    const genericTerms = ['indie', 'pop', 'rock', 'punk', 'folk', 'surf', 'emo', 'shoegaze', 'post', 'metal', 'psychedelic', 'garage', 'alternative', 'americana', 'country', 'jazz', 'swing', 'blues', 'stoner', 'synthwave'];
                    
                    if (!genericTerms.some(term => artistText.toLowerCase().includes(term))) {
                      events.push({
                        title: `${artistText} at The Independent`,
                        date: dateStr,
                        venue: 'The Independent',
                        venue_slug: 'the-independent',
                        raw_text: text.substring(0, 100)
                      });
                    }
                  }
                }
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

  async scrapeCafeDuNordSmart() {
    try {
      console.log('Scraping Café du Nord with smart approach...');
      await this.page.goto('https://www.cafedunord.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      
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
            const contextStart = Math.max(0, match.index - 150);
            const contextEnd = Math.min(allText.length, match.index + 150);
            const context = allText.substring(contextStart, contextEnd);
            
            // Extract potential artist names from context
            const lines = context.split('\n').filter(line => line.trim().length > 0);
            
            for (const line of lines) {
              const cleanLine = line.trim();
              
              if (cleanLine.length > 3 && cleanLine.length < 80 && 
                  !cleanLine.includes('PM') && !cleanLine.includes('doors') &&
                  !cleanLine.includes('$') && !cleanLine.includes('Café du Nord')) {
                
                // Look for proper artist names
                const artistMatch = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
                if (artistMatch && artistMatch[1].length > 2) {
                  const artistName = artistMatch[1];
                  
                  // Filter out day names and generic terms
                  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                  const genericTerms = ['indie', 'pop', 'rock', 'punk', 'folk', 'surf', 'emo', 'shoegaze', 'post', 'metal', 'psychedelic', 'garage', 'alternative', 'americana', 'country', 'jazz', 'swing', 'blues', 'stoner', 'synthwave'];
                  
                  if (!dayNames.includes(artistName) && 
                      !genericTerms.some(term => artistName.toLowerCase().includes(term))) {
                    
                    events.push({
                      title: `${artistName} at Café du Nord`,
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

  async scrapeAllVenuesSmart() {
    try {
      await this.init();
      
      const allEvents = [];
      
      // Scrape each venue with smart approach
      const bthEvents = await this.scrapeBottomOfHillSmart();
      allEvents.push(...bthEvents);
      
      await this.page.waitForTimeout(2000);
      
      const independentEvents = await this.scrapeIndependentSmart();
      allEvents.push(...independentEvents);
      
      await this.page.waitForTimeout(2000);
      
      const cafeEvents = await this.scrapeCafeDuNordSmart();
      allEvents.push(...cafeEvents);
      
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
      const outputPath = path.join(__dirname, 'smart_scraped_events.json');
      fs.writeFileSync(outputPath, JSON.stringify(uniqueEvents, null, 2));
      console.log(`Events saved to ${outputPath}`);
      
      return uniqueEvents;
      
    } catch (error) {
      console.error('Error in smart scraping:', error);
      return [];
    } finally {
      await this.close();
    }
  }
}

// Run the smart scraper
async function main() {
  const scraper = new SmartEventScraper();
  const events = await scraper.scrapeAllVenuesSmart();
  
  console.log('\nSample events:');
  events.slice(0, 20).forEach(event => {
    console.log(`- ${event.title} at ${event.venue} on ${event.date}`);
  });
  
  console.log(`\nTotal events found: ${events.length}`);
}

main().catch(console.error); 