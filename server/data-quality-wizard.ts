import { db } from './db.js';
import { events, venues, artists } from '../shared/schema.js';
import { eq, sql, isNull, and, or, count } from 'drizzle-orm';
import { spotifyImageEnricher } from './spotify-image-enricher.js';

interface QualityIssue {
  type: 'duplicate' | 'missing_ticket_url' | 'missing_description' | 'missing_doors' | 'missing_artist_link' | 'missing_artist_image';
  severity: 'high' | 'medium' | 'low';
  count: number;
  description: string;
  fixable: boolean;
}

interface QualityReport {
  venueId: number;
  venueName: string;
  totalEvents: number;
  issues: QualityIssue[];
  qualityScore: number;
  recommendations: string[];
}

interface WizardResults {
  duplicatesRemoved: number;
  ticketUrlsFixed: number;
  descriptionsAdded: number;
  doorTimesSet: number;
  artistLinksCreated: number;
  artistImagesAdded: number;
  qualityScoreImprovement: number;
  venuesImproved: number;
}

export class DataQualityWizard {
  
  /**
   * Analyze data quality issues across all venues
   */
  async analyzeQualityIssues(): Promise<QualityReport[]> {
    const venueAnalysis = await db
      .select({
        venueId: venues.id,
        venueName: venues.name,
        totalEvents: sql<number>`COUNT(${events.id})`,
        missingTickets: sql<number>`COUNT(CASE WHEN ${events.ticketUrl} IS NULL OR ${events.ticketUrl} = '' THEN 1 END)`,
        missingDescriptions: sql<number>`COUNT(CASE WHEN ${events.description} IS NULL OR ${events.description} = '' THEN 1 END)`,
        missingDoors: sql<number>`COUNT(CASE WHEN ${events.doors} IS NULL THEN 1 END)`,
        missingArtists: sql<number>`COUNT(CASE WHEN ${events.artistId} IS NULL THEN 1 END)`
      })
      .from(venues)
      .leftJoin(events, eq(venues.id, events.venueId))
      .groupBy(venues.id, venues.name)
      .having(sql`COUNT(${events.id}) > 0`);

    // Check for duplicates
    const duplicateAnalysis = await db
      .select({
        venueId: events.venueId,
        duplicateCount: sql<number>`COUNT(*) - COUNT(DISTINCT (${events.title}, ${events.date}))`
      })
      .from(events)
      .groupBy(events.venueId)
      .having(sql`COUNT(*) - COUNT(DISTINCT (${events.title}, ${events.date})) > 0`);

    const duplicateMap = new Map(duplicateAnalysis.map(d => [d.venueId, d.duplicateCount]));

    return venueAnalysis.map(venue => {
      const issues: QualityIssue[] = [];
      
      // Check for duplicates
      const duplicates = duplicateMap.get(venue.venueId) || 0;
      if (duplicates > 0) {
        issues.push({
          type: 'duplicate',
          severity: 'high',
          count: duplicates,
          description: `${duplicates} duplicate events found`,
          fixable: true
        });
      }

      // Check missing ticket URLs
      if (venue.missingTickets > 0) {
        issues.push({
          type: 'missing_ticket_url',
          severity: 'high',
          count: venue.missingTickets,
          description: `${venue.missingTickets} events missing ticket URLs`,
          fixable: true
        });
      }

      // Check missing descriptions
      if (venue.missingDescriptions > 0) {
        issues.push({
          type: 'missing_description',
          severity: 'medium',
          count: venue.missingDescriptions,
          description: `${venue.missingDescriptions} events missing descriptions`,
          fixable: true
        });
      }

      // Check missing door times
      if (venue.missingDoors > 0) {
        issues.push({
          type: 'missing_doors',
          severity: 'medium',
          count: venue.missingDoors,
          description: `${venue.missingDoors} events missing door times`,
          fixable: true
        });
      }

      // Check missing artist links
      if (venue.missingArtists > 0) {
        issues.push({
          type: 'missing_artist_link',
          severity: 'low',
          count: venue.missingArtists,
          description: `${venue.missingArtists} events missing artist links`,
          fixable: true
        });
      }

      const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);
      const qualityScore = venue.totalEvents > 0 ? 
        Math.round((1 - totalIssues / (venue.totalEvents * 4)) * 100) : 0;

      const recommendations = this.generateRecommendations(issues, venue.venueName);

      return {
        venueId: venue.venueId,
        venueName: venue.venueName,
        totalEvents: venue.totalEvents,
        issues,
        qualityScore: Math.max(0, qualityScore),
        recommendations
      };
    });
  }

  /**
   * Generate venue-specific recommendations
   */
  private generateRecommendations(issues: QualityIssue[], venueName: string): string[] {
    const recommendations: string[] = [];
    
    if (issues.some(i => i.type === 'duplicate')) {
      recommendations.push('Remove duplicate events to prevent confusion');
    }
    
    if (issues.some(i => i.type === 'missing_ticket_url')) {
      recommendations.push(`Add venue-specific ticket URL pattern for ${venueName}`);
    }
    
    if (issues.some(i => i.type === 'missing_description')) {
      recommendations.push('Generate consistent event descriptions');
    }
    
    if (issues.some(i => i.type === 'missing_doors')) {
      recommendations.push('Set door times to 1 hour before show time');
    }

    return recommendations;
  }

  /**
   * Execute one-click quality improvements
   */
  async executeQualityImprovements(): Promise<WizardResults> {
    const results: WizardResults = {
      duplicatesRemoved: 0,
      ticketUrlsFixed: 0,
      descriptionsAdded: 0,
      doorTimesSet: 0,
      artistLinksCreated: 0,
      artistImagesAdded: 0,
      qualityScoreImprovement: 0,
      venuesImproved: 0
    };

    // Get initial quality scores
    const initialAnalysis = await this.analyzeQualityIssues();
    const initialAverageScore = initialAnalysis.reduce((sum, venue) => sum + venue.qualityScore, 0) / initialAnalysis.length;

    // Step 1: Remove duplicates
    const duplicateResult = await db.execute(sql`
      DELETE FROM events 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM events 
        GROUP BY title, venue_id, date
      )
    `);
    results.duplicatesRemoved = duplicateResult.rowCount || 0;

    // Step 2: Fix missing ticket URLs with venue-specific patterns
    const venueUrlPatterns = {
      'Bottom of the Hill': 'https://www.bottomofthehill.com/calendar.html',
      'Great American Music Hall': 'https://www.gamh.com/events/',
      'The Chapel': 'https://www.thechapelsf.com/calendar/',
      'The Fillmore': 'https://www.thefillmore.com/events/',
      'The Warfield': 'https://www.thewarfield.com/events/',
      'Bimbo\'s 365 Club': 'https://www.bimbos365club.com/events/',
      'The Rickshaw Stop': 'https://www.rickshawstop.com/events/',
      'DNA Lounge': 'https://www.dnalounge.com/calendar/',
      'Café du Nord': 'https://cafedunord.com/calendar/',
      'The Independent': 'https://www.theindependentsf.com/calendar/',
      'The Masonic': 'https://www.themasonic.com/events/'
    };

    for (const [venueName, baseUrl] of Object.entries(venueUrlPatterns)) {
      const venue = await db.select().from(venues).where(eq(venues.name, venueName)).limit(1);
      if (venue.length === 0) continue;

      const ticketResult = await db
        .update(events)
        .set({ 
          ticketUrl: sql`CASE 
            WHEN ${baseUrl.includes('/events/')} 
            THEN ${baseUrl} || LOWER(REPLACE(${events.title}, ' ', '-'))
            ELSE ${baseUrl}
          END`
        })
        .where(
          and(
            eq(events.venueId, venue[0].id),
            or(isNull(events.ticketUrl), eq(events.ticketUrl, ''))
          )
        );
      
      results.ticketUrlsFixed += ticketResult.rowCount || 0;
    }

    // Step 3: Add missing descriptions
    const descriptionResult = await db
      .update(events)
      .set({
        description: sql`${events.title} || ' live at ' || (SELECT name FROM venues WHERE venues.id = events.venue_id)`
      })
      .where(or(isNull(events.description), eq(events.description, '')));
    
    results.descriptionsAdded = descriptionResult.rowCount || 0;

    // Step 4: Set missing door times (1 hour before show)
    const doorsResult = await db
      .update(events)
      .set({
        doors: sql`${events.date} - INTERVAL '1 hour'`
      })
      .where(isNull(events.doors));
    
    results.doorTimesSet = doorsResult.rowCount || 0;

    // Step 5: Create missing artist records and link events
    const eventsWithoutArtists = await db
      .select({
        id: events.id,
        title: events.title,
        venueId: events.venueId
      })
      .from(events)
      .where(isNull(events.artistId));

    for (const event of eventsWithoutArtists) {
      // Check if artist already exists
      const existingArtist = await db
        .select()
        .from(artists)
        .where(eq(artists.name, event.title))
        .limit(1);

      let artistId: number;

      if (existingArtist.length === 0) {
        // Create new artist
        const [newArtist] = await db
          .insert(artists)
          .values({
            name: event.title,
            slug: event.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') + '-' + Date.now(),
            genre: 'Live Music',
            location: 'San Francisco, CA',
            description: `${event.title} performing in San Francisco`
          })
          .returning();
        
        artistId = newArtist.id;
        results.artistLinksCreated++;
      } else {
        artistId = existingArtist[0].id;
      }

      // Link event to artist
      await db
        .update(events)
        .set({ artistId })
        .where(eq(events.id, event.id));
    }

    // Calculate improvement
    const finalAnalysis = await this.analyzeQualityIssues();
    const finalAverageScore = finalAnalysis.reduce((sum, venue) => sum + venue.qualityScore, 0) / finalAnalysis.length;
    results.qualityScoreImprovement = Math.round(finalAverageScore - initialAverageScore);
    results.venuesImproved = finalAnalysis.filter(venue => venue.qualityScore > 90).length;

    return results;
  }

  /**
   * Get venue-specific quality improvement suggestions
   */
  async getVenueSpecificSuggestions(venueId: number): Promise<string[]> {
    const venue = await db.select().from(venues).where(eq(venues.id, venueId)).limit(1);
    if (venue.length === 0) return [];

    const venueName = venue[0].name;
    const suggestions: string[] = [];

    // Genre-specific suggestions based on successful patterns
    const genreSuggestions = {
      'The Fillmore': ['Indie Rock', 'Alternative Rock', 'Folk Rock'],
      'The Warfield': ['Rock', 'Grunge', 'Alternative Rock'],
      'Bimbo\'s 365 Club': ['Jazz', 'Jazz Fusion', 'Blues'],
      'DNA Lounge': ['Electronic', 'Dance', 'Techno'],
      'Café du Nord': ['Folk', 'Indie Folk', 'Acoustic'],
      'The Rickshaw Stop': ['Indie Rock', 'Shoegaze', 'Dream Pop'],
      'Bottom of the Hill': ['Punk', 'Indie Rock', 'Alternative'],
      'Great American Music Hall': ['Rock', 'Indie Rock', 'Folk'],
      'The Chapel': ['Indie Rock', 'Alternative', 'Folk']
    };

    if (genreSuggestions[venueName as keyof typeof genreSuggestions]) {
      const genres = genreSuggestions[venueName as keyof typeof genreSuggestions];
      suggestions.push(`Focus on ${genres.join(', ')} artists for ${venueName}`);
    }

    suggestions.push(`Use venue-specific ticket URL pattern for authentic links`);
    suggestions.push(`Set door times 1 hour before show time`);
    suggestions.push(`Ensure all events have complete artist information`);

    return suggestions;
  }
}

export const dataQualityWizard = new DataQualityWizard();