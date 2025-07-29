import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TargetedIndependentScraper {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    try {
      this.browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
      });
      this.page = await this.browser.newPage();
      
      await this.page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
      
      console.log('Targeted Independent scraper initialized');
    } catch (error) {
      console.error('Error initializing scraper:', error);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async scrapeIndependentTargeted() {
    try {
      console.log('Scraping The Independent with targeted approach...');
      
      const events = [];
      
      // Try multiple approaches for The Independent
      const approaches = [
        {
          url: 'https://www.theindependentsf.com/',
          method: 'direct'
        },
        {
          url: 'https://www.theindependentsf.com/calendar',
          method: 'calendar'
        },
        {
          url: 'https://www.theindependentsf.com/events',
          method: 'events'
        }
      ];

      for (const approach of approaches) {
        try {
          console.log(`Trying ${approach.method} approach: ${approach.url}`);
          
          await this.page.goto(approach.url, { 
            waitUntil: 'domcontentloaded', 
            timeout: 10000 
          });
          
          // Wait a bit for any dynamic content
          await this.page.waitForTimeout(3000);
          
          const pageEvents = await this.page.evaluate((method) => {
            const events = [];
            const allText = document.body.textContent || '';
            
            console.log(`Scraping with ${method} method, text length: ${allText.length}`);
            
            // Look for specific patterns that indicate events
            const eventPatterns = [
              // Pattern 1: "Artist Name" + date
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(\w+\s+\d{1,2},?\s+20\d{2})/g,
              // Pattern 2: Date + "Artist Name"
              /(\w+\s+\d{1,2},?\s+20\d{2})\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
              // Pattern 3: "Artist Name at The Independent" + date
              /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+at\s+The\s+Independent\s+(\w+\s+\d{1,2},?\s+20\d{2})/g,
              // Pattern 4: Date + "at The Independent"
              /(\w+\s+\d{1,2},?\s+20\d{2})\s+at\s+The\s+Independent/g,
            ];
            
            for (const pattern of eventPatterns) {
              const matches = Array.from(allText.matchAll(pattern));
              
              for (const match of matches) {
                let artistName = '';
                let dateStr = '';
                
                if (match[1] && match[2]) {
                  // Check if first group looks like a date
                  if (match[1].match(/\w+\s+\d{1,2},?\s+20\d{2}/)) {
                    dateStr = match[1];
                    artistName = match[2];
                  } else {
                    artistName = match[1];
                    dateStr = match[2];
                  }
                } else if (match[1]) {
                  // Single group - try to determine if it's artist or date
                  if (match[1].match(/\w+\s+\d{1,2},?\s+20\d{2}/)) {
                    dateStr = match[1];
                  } else {
                    artistName = match[1];
                  }
                }
                
                if (dateStr && artistName) {
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
                      raw_text: allText.substring(Math.max(0, match.index - 100), match.index + 200)
                    });
                  }
                }
              }
            }
            
            // Also look for any text that contains "The Independent" and dates
            const independentPattern = /The\s+Independent.*?(\w+\s+\d{1,2},?\s+20\d{2})/g;
            const independentMatches = Array.from(allText.matchAll(independentPattern));
            
            for (const match of independentMatches) {
              const dateStr = match[1];
              const context = allText.substring(Math.max(0, match.index - 200), match.index + 200);
              
              // Look for artist names in the context
              const artistPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
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
                    !artistName.includes('The Independent') &&
                    !artistName.includes('Independent')) {
                  
                  events.push({
                    title: `${artistName} at The Independent`,
                    date: dateStr,
                    venue: 'The Independent',
                    venue_slug: 'the-independent',
                    raw_text: context
                  });
                }
              }
            }
            
            return events;
          }, approach.method);
          
          events.push(...pageEvents);
          console.log(`Found ${pageEvents.length} events with ${approach.method} approach`);
          
        } catch (error) {
          console.log(`Error with ${approach.method} approach:`, error.message);
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
      
      console.log(`Total unique events found for The Independent: ${uniqueEvents.length}`);
      return uniqueEvents;
      
    } catch (error) {
      console.error('Error scraping The Independent:', error);
      return [];
    }
  }

  async scrapeAllVenuesTargeted() {
    try {
      console.log('Starting targeted scraping...');
      
      const allEvents = [];
      
      // Scrape The Independent
      const independentEvents = await this.scrapeIndependentTargeted();
      allEvents.push(...independentEvents);
      
      console.log(`Total unique events found: ${allEvents.length}`);
      
      // Save to file
      const outputPath = path.join(__dirname, 'targeted_independent_events.json');
      fs.writeFileSync(outputPath, JSON.stringify(allEvents, null, 2));
      console.log(`Saved ${allEvents.length} events to ${outputPath}`);
      
      return allEvents;
      
    } catch (error) {
      console.error('Error in targeted scraping:', error);
      return [];
    }
  }
}

async function main() {
  const scraper = new TargetedIndependentScraper();
  
  try {
    await scraper.init();
    const events = await scraper.scrapeAllVenuesTargeted();
    
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