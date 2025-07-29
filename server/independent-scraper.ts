import { spawn } from 'child_process';

interface IndependentEvent {
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

interface ScrapedEventData {
  artist: string;
  date: string;
  time?: string;
  venue: string;
  link?: string;
}

export class IndependentScraper {
  private async runPlaywrightScript(): Promise<ScrapedEventData[]> {
    return new Promise((resolve, reject) => {
      const pythonScript = `
from playwright.sync_api import sync_playwright
import json
from datetime import datetime

def normalize_date(date_str):
    """Normalize date string to YYYY-MM-DD format"""
    if not date_str:
        return datetime.now().strftime('%Y-%m-%d')
    
    try:
        # Handle various date formats from The Independent
        date_str = date_str.strip()
        
        # Common formats: "Dec 15", "December 15", "12/15/2024"
        import re
        
        # Pattern for "Month Day" format
        month_day_pattern = r'([A-Za-z]+)\\s+(\\d{1,2})'
        match = re.search(month_day_pattern, date_str)
        
        if match:
            month_name = match.group(1).lower()
            day = int(match.group(2))
            
            month_names = {
                'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
                'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6,
                'jul': 7, 'july': 7, 'aug': 8, 'august': 8, 'sep': 9, 'september': 9,
                'oct': 10, 'october': 10, 'nov': 11, 'november': 11, 'dec': 12, 'december': 12
            }
            
            month = month_names.get(month_name, 1)
            year = datetime.now().year
            
            # If the date has passed this year, assume next year
            event_date = datetime(year, month, day)
            if event_date < datetime.now():
                year += 1
                event_date = datetime(year, month, day)
            
            return event_date.strftime('%Y-%m-%d')
        
        # Try direct parsing
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
    
    import re
    time_pattern = r'(\\d{1,2}:\\d{2}\\s*(?:AM|PM|am|pm)?)'
    match = re.search(time_pattern, time_str)
    
    return match.group(1) if match else None

def scrape_independent_events():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        try:
            print("⏳ Loading The Independent page...")
            page.goto("https://www.theindependentsf.com/", timeout=60000)

            try:
                # Handle popup
                popup = page.query_selector("div#om-mnuwxyw8zcuetb2b-holder .om-close")
                if popup:
                    popup.click()
                    print("✅ Closed popup.")
                else:
                    print("ℹ️ No popup found or already closed.")
            except:
                print("⚠️ Popup close failed (non-blocking).")

            print("⏳ Waiting for event content to load...")
            page.wait_for_selector("div.tw-event-item", timeout=30000)
            event_blocks = page.query_selector_all("div.tw-event-item")
            print(f"✅ Found {len(event_blocks)} events at The Independent")

            events = []

            for block in event_blocks:
                try:
                    # Extract event details using the working selectors
                    artist_el = block.query_selector("div.tw-name > a")
                    date_el = block.query_selector("span.tw-event-date")
                    time_el = block.query_selector("span.tw-event-time-complete")
                    link_el = artist_el
                    
                    # Extract image if available
                    img_el = block.query_selector("img")

                    artist = artist_el.inner_text().strip() if artist_el else None
                    short_date = date_el.inner_text().strip() if date_el else None
                    raw_time = time_el.inner_text().strip() if time_el else None
                    link = link_el.get_attribute("href") if link_el else None
                    image_url = img_el.get_attribute("src") if img_el else None

                    if link and not link.startswith("http"):
                        link = "https://www.theindependentsf.com" + link
                    
                    if image_url and not image_url.startswith("http"):
                        image_url = "https://www.theindependentsf.com" + image_url

                    date = normalize_date(short_date)
                    time = normalize_time(raw_time)

                    if artist and date:
                        events.append({
                            "artist": artist,
                            "date": date,
                            "time": time,
                            "venue": "The Independent",
                            "link": link,
                            "image_url": image_url
                        })
                    else:
                        print(f"⚠️ Skipping incomplete event: artist={artist}, date={short_date}")
                        
                except Exception as e:
                    print(f"⚠️ Error processing event block: {e}")
                    continue

            print(f"🎸 Successfully scraped {len(events)} events from The Independent")
            print(json.dumps(events))
            browser.close()
            return events
            
        except Exception as e:
            print(f"❌ Error scraping The Independent: {e}")
            browser.close()
            return []

if __name__ == "__main__":
    scrape_independent_events()
`;

      const python = spawn('python3', ['-c', pythonScript], {
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
          console.error('Playwright scraper error:', error);
          resolve([]);
          return;
        }

        try {
          // Extract events JSON from the output
          const lines = output.split('\n');
          const eventsLine = lines.find(line => 
            line.trim().startsWith('[') && line.includes('artist')
          );
          
          if (eventsLine) {
            const events = JSON.parse(eventsLine.trim());
            resolve(events);
          } else {
            console.log('No events JSON found in output');
            resolve([]);
          }
        } catch (parseError) {
          console.error('Failed to parse Playwright output:', parseError);
          resolve([]);
        }
      });
    });
  }

  private normalizeDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    
    try {
      const cleanDate = dateStr.replace(/[^\w\s\-\/,]/g, '').trim();
      const parsed = new Date(cleanDate);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      return new Date();
    } catch (error) {
      return new Date();
    }
  }

  private extractArtistName(title: string): string | null {
    if (!title) return null;
    
    const cleaned = title
      .replace(/^(Live|Concert|Show):\s*/i, '')
      .replace(/\s*-\s*(Live|Concert|Show)$/i, '')
      .trim();
    
    return cleaned || title;
  }

  private inferGenre(title: string, artist: string): string {
    const text = `${title} ${artist}`.toLowerCase();
    
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

  async scrapeTheIndependentComprehensive(): Promise<IndependentEvent[]> {
    console.log('🎯 Comprehensive scraping The Independent with Playwright...');
    
    try {
      const scrapedEvents = await this.runPlaywrightScript();
      console.log(`🎸 Found ${scrapedEvents.length} events at The Independent via Playwright`);
      
      const events: IndependentEvent[] = scrapedEvents.map(event => ({
        title: event.artist,
        artist: this.extractArtistName(event.artist) || event.artist,
        venue: 'The Independent',
        date: this.normalizeDate(event.date),
        ticketUrl: event.link || undefined,
        imageUrl: (event as any).image_url || undefined,
        genre: this.inferGenre(event.artist, event.artist)
      }));

      return events;
    } catch (error) {
      console.error('Error scraping The Independent with Playwright:', error);
      return [];
    }
  }
}

export const independentScraper = new IndependentScraper();