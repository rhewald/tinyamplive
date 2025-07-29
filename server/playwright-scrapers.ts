import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';

interface ScrapedEvent {
  artist: string;
  date: string;
  time?: string;
  venue: string;
  link?: string;
}

interface PlaywrightEvent {
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

export class PlaywrightScrapers {
  private async runPythonScript(scriptContent: string): Promise<ScrapedEvent[]> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['-c', scriptContent], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', error);
          resolve([]);
          return;
        }

        try {
          // Extract events from the output
          const lines = output.split('\n');
          const eventsLine = lines.find(line => line.trim().startsWith('[') && line.includes('artist'));
          
          if (eventsLine) {
            // Parse the events array from Python output
            const events = JSON.parse(eventsLine.trim());
            resolve(events);
          } else {
            resolve([]);
          }
        } catch (parseError) {
          console.error('Failed to parse Python output:', parseError);
          resolve([]);
        }
      });
    });
  }

  private normalizeDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    
    try {
      // Handle various date formats from scraped data
      const cleanDate = dateStr.replace(/[^\w\s\-\/,]/g, '').trim();
      
      // Try parsing different formats
      const parsed = new Date(cleanDate);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      
      // Fallback to current date if parsing fails
      return new Date();
    } catch (error) {
      return new Date();
    }
  }

  private extractArtistName(title: string): string | null {
    if (!title) return null;
    
    // Remove common prefixes and suffixes
    const cleaned = title
      .replace(/^(Live|Concert|Show):\s*/i, '')
      .replace(/\s*-\s*(Live|Concert|Show)$/i, '')
      .trim();
    
    return cleaned || title;
  }

  private inferGenre(title: string, artist: string): string {
    const text = `${title} ${artist}`.toLowerCase();
    
    if (text.includes('jazz') || text.includes('blues')) return 'Jazz/Blues';
    if (text.includes('rock') || text.includes('punk') || text.includes('metal')) return 'Rock';
    if (text.includes('electronic') || text.includes('dj') || text.includes('techno')) return 'Electronic';
    if (text.includes('folk') || text.includes('acoustic')) return 'Folk';
    if (text.includes('hip hop') || text.includes('rap')) return 'Hip Hop';
    if (text.includes('country')) return 'Country';
    if (text.includes('classical')) return 'Classical';
    
    return 'Alternative';
  }

  async scrapeTheIndependentPlaywright(): Promise<PlaywrightEvent[]> {
    console.log('🎯 Scraping The Independent with Playwright...');
    
    const pythonScript = `
from playwright.sync_api import sync_playwright
import json
from datetime import datetime

def normalize_date(date_str):
    """Normalize date string to YYYY-MM-DD format"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    
    try:
        # Handle various date formats
        date_str = date_str.strip()
        
        # Try direct parsing first
        parsed = datetime.strptime(date_str, '%m/%d/%Y')
        return parsed.strftime('%Y-%m-%d')
    except:
        try:
            # Try other common formats
            for fmt in ['%B %d, %Y', '%b %d, %Y', '%m-%d-%Y', '%Y-%m-%d']:
                try:
                    parsed = datetime.strptime(date_str, fmt)
                    return parsed.strftime('%Y-%m-%d')
                except:
                    continue
        except:
            pass
    
    # Fallback to current date
    return datetime.now().strftime('%Y-%m-%d')

def normalize_time(time_str):
    """Extract and normalize time information"""
    if not time_str:
        return None
    
    # Extract time patterns
    import re
    time_pattern = r'(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)'
    match = re.search(time_pattern, time_str)
    
    return match.group(1) if match else None

def scrape_independent_events():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            print("⏳ Loading page...")
            page.goto("https://www.theindependentsf.com/", timeout=60000)

            try:
                popup = page.query_selector("div#om-mnuwxyw8zcuetb2b-holder .om-close")
                if popup:
                    popup.click()
                    print("✅ Closed popup.")
            except:
                print("⚠️ Popup close failed (non-blocking).")

            print("⏳ Waiting for content to load...")
            page.wait_for_selector("div.tw-event-item", timeout=30000)
            event_blocks = page.query_selector_all("div.tw-event-item")
            print(f"✅ Found {len(event_blocks)} events")

            events = []

            for block in event_blocks:
                artist_el = block.query_selector("div.tw-name > a")
                date_el = block.query_selector("span.tw-event-date")
                time_el = block.query_selector("span.tw-event-time-complete")
                link_el = artist_el

                artist = artist_el.inner_text().strip() if artist_el else None
                short_date = date_el.inner_text().strip() if date_el else None
                raw_time = time_el.inner_text().strip() if time_el else None
                link = link_el.get_attribute("href") if link_el else None

                if link and not link.startswith("http"):
                    link = "https://www.theindependentsf.com" + link

                date = normalize_date(short_date)
                time = normalize_time(raw_time)

                if artist and date:
                    events.append({
                        "artist": artist,
                        "date": date,
                        "time": time,
                        "venue": "The Independent",
                        "link": link
                    })

            print(json.dumps(events))
            browser.close()
            return events
            
        except Exception as e:
            print(f"Error: {e}")
            browser.close()
            return []

if __name__ == "__main__":
    scrape_independent_events()
`;

    try {
      const scrapedEvents = await this.runPythonScript(pythonScript);
      console.log(`🎸 Found ${scrapedEvents.length} events at The Independent via Playwright`);
      
      const events: PlaywrightEvent[] = scrapedEvents.map(event => ({
        title: event.artist,
        artist: this.extractArtistName(event.artist) || event.artist,
        venue: 'The Independent',
        date: this.normalizeDate(event.date),
        ticketUrl: event.link || undefined,
        genre: this.inferGenre(event.artist, event.artist)
      }));

      return events;
    } catch (error) {
      console.error('Error scraping The Independent with Playwright:', error);
      return [];
    }
  }

  async scrapeAllVenuesPlaywright(): Promise<PlaywrightEvent[]> {
    console.log('🎯 Running Playwright scrapers for all venues...');
    
    const allEvents: PlaywrightEvent[] = [];
    
    // Scrape The Independent
    const independentEvents = await this.scrapeTheIndependentPlaywright();
    allEvents.push(...independentEvents);
    
    console.log(`📊 Total Playwright events found: ${allEvents.length}`);
    return allEvents;
  }
}

export const playwrightScrapers = new PlaywrightScrapers();