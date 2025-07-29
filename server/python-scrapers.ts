import { exec } from 'child_process';
import { promisify } from 'util';
import { scraperMonitor } from './scraper-monitor';

const execAsync = promisify(exec);

interface ScrapedEvent {
  artist: string;
  date: string;
  time?: string;
  venue: string;
  link?: string;
}

export class PythonScrapers {
  private async runPythonScript(scriptPath: string, venueName: string): Promise<ScrapedEvent[]> {
    try {
      console.log(`Running Python scraper for ${venueName}...`);
      
      // Check if python3 is available
      try {
        await execAsync('which python3');
      } catch {
        console.log(`Python3 not available, falling back to Node.js scraper for ${venueName}`);
        return [];
      }
      
      const { stdout, stderr } = await execAsync(`cd attached_assets && timeout 30s /home/runner/workspace/.pythonlibs/bin/python3 ${scriptPath}`, {
        timeout: 35000
      });
      
      if (stderr && !stderr.includes('warning')) {
        console.warn(`Python scraper stderr for ${venueName}:`, stderr);
        return [];
      }
      
      // Try to extract JSON from stdout
      const lines = stdout.split('\n');
      let jsonData = '';
      let inJsonBlock = false;
      
      for (const line of lines) {
        if (line.trim().startsWith('[') || line.trim().startsWith('{')) {
          inJsonBlock = true;
        }
        if (inJsonBlock) {
          jsonData += line + '\n';
        }
        if (line.trim().endsWith('}') || line.trim().endsWith(']')) {
          break;
        }
      }
      
      if (jsonData.trim()) {
        const events = JSON.parse(jsonData.trim());
        return Array.isArray(events) ? events : [events];
      }
      
      return [];
    } catch (error) {
      console.error(`Python scraper error for ${venueName}:`, error);
      return [];
    }
  }

  async scrapeBottomOfTheHill(): Promise<ScrapedEvent[]> {
    const venueName = 'Bottom of the Hill';
    try {
      // Use simple scraper as fallback
      const events = await this.runPythonScript('simple_scrapers.py bottom', venueName);
      
      // Filter out calendar artifacts (days of week)
      const validEvents = events.filter(event => 
        !['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(event.artist)
      );
      
      const status = validEvents.length > 0 ? 'success' : 'no_events';
      await scraperMonitor.recordScraperRun(venueName, status, validEvents.length);
      
      console.log(`Found ${validEvents.length} events at ${venueName} via Python scraper`);
      return validEvents;
    } catch (error) {
      await scraperMonitor.recordScraperRun(venueName, 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      console.error(`Error running Python scraper for ${venueName}:`, error);
      return [];
    }
  }

  async scrapeTheChapel(): Promise<ScrapedEvent[]> {
    const venueName = 'The Chapel';
    try {
      const events = await this.runPythonScript('scrape_chapel_1750111325552.py', venueName);
      
      const status = events.length > 0 ? 'success' : 'no_events';
      await scraperMonitor.recordScraperRun(venueName, status, events.length);
      
      console.log(`Found ${events.length} events at ${venueName} via Python scraper`);
      return events;
    } catch (error) {
      await scraperMonitor.recordScraperRun(venueName, 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      console.error(`Error running Python scraper for ${venueName}:`, error);
      return [];
    }
  }

  async scrapeGreatAmericanMusicHall(): Promise<ScrapedEvent[]> {
    const venueName = 'Great American Music Hall';
    try {
      const events = await this.runPythonScript('scrape_gamh_1750111350561.py', venueName);
      
      const status = events.length > 0 ? 'success' : 'no_events';
      await scraperMonitor.recordScraperRun(venueName, status, events.length);
      
      console.log(`Found ${events.length} events at ${venueName} via Python scraper`);
      return events;
    } catch (error) {
      await scraperMonitor.recordScraperRun(venueName, 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      console.error(`Error running Python scraper for ${venueName}:`, error);
      return [];
    }
  }

  async scrapeTheIndependent(): Promise<ScrapedEvent[]> {
    const venueName = 'The Independent';
    try {
      const events = await this.runPythonScript('scrape_independent_1750111371800.py', venueName);
      
      const status = events.length > 0 ? 'success' : 'no_events';
      await scraperMonitor.recordScraperRun(venueName, status, events.length);
      
      console.log(`Found ${events.length} events at ${venueName} via Python scraper`);
      return events;
    } catch (error) {
      await scraperMonitor.recordScraperRun(venueName, 'error', 0, error instanceof Error ? error.message : 'Unknown error');
      console.error(`Error running Python scraper for ${venueName}:`, error);
      return [];
    }
  }

  async scrapeAllVenues(): Promise<ScrapedEvent[]> {
    console.log('Running all Python venue scrapers...');
    
    const scrapers = [
      this.scrapeTheIndependent(),
      this.scrapeBottomOfTheHill(),
      this.scrapeTheChapel(),
      this.scrapeGreatAmericanMusicHall()
    ];

    const results = await Promise.allSettled(scrapers);
    const allEvents: ScrapedEvent[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allEvents.push(...result.value);
      } else {
        console.error(`Python scraper ${index} failed:`, result.reason);
      }
    });

    console.log(`Total events from all Python scrapers: ${allEvents.length}`);
    return allEvents;
  }
}

export const pythonScrapers = new PythonScrapers();