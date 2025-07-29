import { db } from './db';
import { venues, events } from '../shared/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

interface ScrapingStats {
  venueId: number;
  venueName: string;
  slug: string;
  website: string | null;
  expectedEvents: number;
  actualEvents: number;
  coveragePercentage: number;
  lastSuccessfulScrape: Date | null;
  scrapingErrors: string[];
  isActive: boolean;
}

interface VenueExpectation {
  venueId: number;
  expectedEventsPerMonth: number;
  primaryScrapingMethod: string;
  lastKnownWorkingDate: Date | null;
}

export class ScrapingMonitor {
  // Expected events per month for major SF venues based on historical data
  private venueExpectations: VenueExpectation[] = [
    { venueId: 29, expectedEventsPerMonth: 20, primaryScrapingMethod: 'playwright', lastKnownWorkingDate: null },
    { venueId: 28, expectedEventsPerMonth: 15, primaryScrapingMethod: 'playwright', lastKnownWorkingDate: null },
    { venueId: 47, expectedEventsPerMonth: 18, primaryScrapingMethod: 'playwright', lastKnownWorkingDate: null },
    { venueId: 46, expectedEventsPerMonth: 12, primaryScrapingMethod: 'playwright', lastKnownWorkingDate: null },
    { venueId: 32, expectedEventsPerMonth: 8, primaryScrapingMethod: 'playwright', lastKnownWorkingDate: null },
  ];

  async analyzeScrapingCoverage(months: number = 3): Promise<ScrapingStats[]> {
    const stats: ScrapingStats[] = [];
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);

    for (const expectation of this.venueExpectations) {
      const venue = await db.query.venues.findFirst({
        where: eq(venues.id, expectation.venueId)
      });

      if (!venue) continue;

      const actualEvents = await db.query.events.findMany({
        where: and(
          eq(events.venueId, expectation.venueId),
          gte(events.date, cutoffDate)
        )
      });

      const expectedTotal = expectation.expectedEventsPerMonth * months;
      const actualTotal = actualEvents.length;
      const coverage = actualTotal > 0 ? Math.min((actualTotal / expectedTotal) * 100, 100) : 0;

      // Check for recent events to determine if venue is active
      const recentEvents = actualEvents.filter(e => 
        new Date(e.date).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000)
      );

      const lastEvent = actualEvents.length > 0 
        ? actualEvents.reduce((latest, event) => 
            new Date(event.date) > new Date(latest.date) ? event : latest
          )
        : null;

      stats.push({
        venueId: expectation.venueId,
        venueName: venue.name,
        slug: venue.slug,
        website: venue.website,
        expectedEvents: expectedTotal,
        actualEvents: actualTotal,
        coveragePercentage: Math.round(coverage),
        lastSuccessfulScrape: lastEvent ? new Date(lastEvent.date) : null,
        scrapingErrors: await this.getRecentScrapingErrors(expectation.venueId),
        isActive: recentEvents.length > 0
      });
    }

    return stats.sort((a, b) => a.coveragePercentage - b.coveragePercentage);
  }

  private async getRecentScrapingErrors(venueId: number): Promise<string[]> {
    // This would typically come from a scraping log table
    // For now, we'll infer errors based on low coverage
    const errors: string[] = [];
    
    // Check if venue has very low event count
    const eventCount = await db.select({ count: sql<number>`count(*)` })
      .from(events)
      .where(eq(events.venueId, venueId));

    if (eventCount[0]?.count < 5) {
      errors.push('Very low event count suggests scraping issues');
    }

    // Check for gaps in event dates
    const recentEvents = await db.query.events.findMany({
      where: eq(events.venueId, venueId),
      orderBy: events.date,
      limit: 10
    });

    if (recentEvents.length > 1) {
      const gaps = this.findDateGaps(recentEvents.map(e => new Date(e.date)));
      if (gaps.length > 0) {
        errors.push(`${gaps.length} significant date gaps detected`);
      }
    }

    return errors;
  }

  private findDateGaps(dates: Date[]): { start: Date; end: Date; days: number }[] {
    const gaps: { start: Date; end: Date; days: number }[] = [];
    
    for (let i = 1; i < dates.length; i++) {
      const daysBetween = Math.floor(
        (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysBetween > 14) { // Gap of more than 2 weeks
        gaps.push({
          start: dates[i-1],
          end: dates[i],
          days: daysBetween
        });
      }
    }
    
    return gaps;
  }

  async generateScrapingReport(): Promise<{
    overallCoverage: number;
    totalMissedEvents: number;
    criticalVenues: string[];
    recommendations: string[];
  }> {
    const stats = await this.analyzeScrapingCoverage();
    
    const totalExpected = stats.reduce((sum, stat) => sum + stat.expectedEvents, 0);
    const totalActual = stats.reduce((sum, stat) => sum + stat.actualEvents, 0);
    const overallCoverage = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 0;
    const totalMissed = Math.max(0, totalExpected - totalActual);

    const criticalVenues = stats
      .filter(stat => stat.coveragePercentage < 50)
      .map(stat => stat.venueName);

    const recommendations: string[] = [];
    
    if (overallCoverage < 70) {
      recommendations.push('Overall scraping coverage is critically low - immediate attention required');
    }
    
    if (criticalVenues.length > 0) {
      recommendations.push(`${criticalVenues.length} venues have <50% coverage: ${criticalVenues.join(', ')}`);
    }

    const inactiveVenues = stats.filter(stat => !stat.isActive);
    if (inactiveVenues.length > 0) {
      recommendations.push(`${inactiveVenues.length} venues appear inactive - verify scraping status`);
    }

    stats.forEach(stat => {
      if (stat.scrapingErrors.length > 0) {
        recommendations.push(`${stat.venueName}: ${stat.scrapingErrors.join(', ')}`);
      }
    });

    return {
      overallCoverage,
      totalMissedEvents: totalMissed,
      criticalVenues,
      recommendations
    };
  }

  async testVenueScrapingHealth(venueId: number): Promise<{
    isHealthy: boolean;
    issues: string[];
    lastEventDate: Date | null;
    suggestedActions: string[];
  }> {
    const stats = await this.analyzeScrapingCoverage();
    const venueStat = stats.find(s => s.venueId === venueId);
    
    if (!venueStat) {
      return {
        isHealthy: false,
        issues: ['Venue not found in monitoring system'],
        lastEventDate: null,
        suggestedActions: ['Add venue to scraping monitor']
      };
    }

    const issues: string[] = [];
    const suggestedActions: string[] = [];

    if (venueStat.coveragePercentage < 30) {
      issues.push('Extremely low event coverage');
      suggestedActions.push('Investigate scraping method and website changes');
    }

    if (!venueStat.isActive) {
      issues.push('No recent events detected');
      suggestedActions.push('Verify venue is still operating and check website structure');
    }

    if (venueStat.scrapingErrors.length > 0) {
      issues.push(...venueStat.scrapingErrors);
      suggestedActions.push('Review scraping logs and fix identified issues');
    }

    const daysSinceLastEvent = venueStat.lastSuccessfulScrape 
      ? Math.floor((Date.now() - venueStat.lastSuccessfulScrape.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    if (daysSinceLastEvent !== null && daysSinceLastEvent > 30) {
      issues.push(`No events scraped in ${daysSinceLastEvent} days`);
      suggestedActions.push('Run manual scraping test and update scraping logic');
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      lastEventDate: venueStat.lastSuccessfulScrape,
      suggestedActions
    };
  }
}

export const scrapingMonitor = new ScrapingMonitor();