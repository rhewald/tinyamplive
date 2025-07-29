import { db } from "./db";
import { users, venues, artists, events, type User, type Venue, type Artist, type Event, type InsertUser, type InsertVenue, type InsertArtist, type InsertEvent, type EventWithDetails } from "@shared/schema";
import { eq, like, and, or, gte, lte, desc, asc } from "drizzle-orm";

export class FixedDatabaseStorage {
  // Simple working methods without complex joins that cause TypeScript issues

  async getUpcomingEvents(): Promise<any[]> {
    const now = new Date();
    
    try {
      const result = await db.select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        date: events.date,
        description: events.description,
        imageUrl: events.imageUrl,
        artistId: events.artistId,
        venueId: events.venueId,
        openingActs: events.openingActs,
        doors: events.doors,
        showTime: events.showTime,
        price: events.price,
        ticketUrl: events.ticketUrl,
        isFeatured: events.isFeatured,
        isActive: events.isActive,
        tags: events.tags
      })
      .from(events)
      .where(and(gte(events.date, now), eq(events.isActive, true)))
      .orderBy(asc(events.date));

      // Manually populate artist and venue data
      const enrichedEvents = [];
      for (const event of result) {
        let artist = null;
        let venue = null;

        if (event.artistId) {
          const artistResult = await db.select().from(artists).where(eq(artists.id, event.artistId));
          artist = artistResult[0] || null;
        }

        if (event.venueId) {
          const venueResult = await db.select().from(venues).where(eq(venues.id, event.venueId));
          venue = venueResult[0] || null;
        }

        enrichedEvents.push({
          ...event,
          artist,
          venue
        });
      }

      console.log(`Found ${enrichedEvents.length} upcoming events`);
      return enrichedEvents;
    } catch (error) {
      console.error('Error fetching upcoming events:', error);
      throw error;
    }
  }

  async getEventsByVenue(venueId: number): Promise<any[]> {
    const now = new Date();
    
    try {
      const result = await db.select({
        id: events.id,
        title: events.title,
        slug: events.slug,
        date: events.date,
        description: events.description,
        imageUrl: events.imageUrl,
        artistId: events.artistId,
        venueId: events.venueId,
        openingActs: events.openingActs,
        doors: events.doors,
        showTime: events.showTime,
        price: events.price,
        ticketUrl: events.ticketUrl,
        isFeatured: events.isFeatured,
        isActive: events.isActive,
        tags: events.tags
      })
      .from(events)
      .where(and(eq(events.venueId, venueId), gte(events.date, now), eq(events.isActive, true)))
      .orderBy(asc(events.date));

      // Manually populate artist and venue data
      const enrichedEvents = [];
      for (const event of result) {
        let artist = null;
        let venue = null;

        if (event.artistId) {
          const artistResult = await db.select().from(artists).where(eq(artists.id, event.artistId));
          artist = artistResult[0] || null;
        }

        if (event.venueId) {
          const venueResult = await db.select().from(venues).where(eq(venues.id, event.venueId));
          venue = venueResult[0] || null;
        }

        enrichedEvents.push({
          ...event,
          artist,
          venue
        });
      }

      console.log(`Found ${enrichedEvents.length} events for venue ${venueId}`);
      return enrichedEvents;
    } catch (error) {
      console.error(`Error fetching events for venue ${venueId}:`, error);
      throw error;
    }
  }
}

export const fixedStorage = new FixedDatabaseStorage();