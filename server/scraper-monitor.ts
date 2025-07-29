import { storage } from "./storage";

interface ScraperStatus {
  venue: string;
  lastRun: Date;
  status: 'success' | 'failed' | 'no_events' | 'error';
  eventsFound: number;
  errorMessage?: string;
  lastSuccessfulRun?: Date;
}

class ScraperMonitor {
  private statusMap: Map<string, ScraperStatus> = new Map();

  async recordScraperRun(venue: string, status: 'success' | 'failed' | 'no_events' | 'error', eventsFound: number = 0, errorMessage?: string) {
    const now = new Date();
    const currentStatus = this.statusMap.get(venue);
    
    const scraperStatus: ScraperStatus = {
      venue,
      lastRun: now,
      status,
      eventsFound,
      errorMessage,
      lastSuccessfulRun: status === 'success' ? now : currentStatus?.lastSuccessfulRun
    };

    this.statusMap.set(venue, scraperStatus);
    
    // Log critical issues
    if (status === 'failed' || status === 'error') {
      console.error(`🚨 SCRAPER ALERT: ${venue} scraper ${status}`, {
        errorMessage,
        lastSuccessfulRun: scraperStatus.lastSuccessfulRun,
        daysSinceSuccess: scraperStatus.lastSuccessfulRun ? 
          Math.floor((now.getTime() - scraperStatus.lastSuccessfulRun.getTime()) / (1000 * 60 * 60 * 24)) : 
          'never'
      });
    }
    
    if (status === 'no_events') {
      console.warn(`⚠️  SCRAPER WARNING: ${venue} returned 0 events - website may have changed`);
    }
    
    if (status === 'success') {
      console.log(`✅ SCRAPER SUCCESS: ${venue} found ${eventsFound} authentic events`);
    }
  }

  getScraperHealth(): ScraperStatus[] {
    return Array.from(this.statusMap.values());
  }

  getFailedScrapers(): ScraperStatus[] {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return Array.from(this.statusMap.values()).filter(status => 
      status.status === 'failed' || 
      status.status === 'error' || 
      (status.lastRun < oneDayAgo && status.status !== 'success')
    );
  }

  async checkForStaleData(): Promise<{ venue: string; daysSinceUpdate: number }[]> {
    const venues = await storage.getVenues();
    const staleVenues = [];
    const now = new Date();
    
    for (const venue of venues) {
      const events = await storage.getEventsByVenue(venue.id);
      if (events.length === 0) {
        staleVenues.push({
          venue: venue.name,
          daysSinceUpdate: Infinity
        });
        continue;
      }
      
      const mostRecentEvent = events.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      const daysSinceUpdate = Math.floor((now.getTime() - mostRecentEvent.date.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate > 7) {
        staleVenues.push({
          venue: venue.name,
          daysSinceUpdate
        });
      }
    }
    
    return staleVenues;
  }
}

export const scraperMonitor = new ScraperMonitor();