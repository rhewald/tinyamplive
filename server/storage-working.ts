import { db } from "./db";
import { users, venues, artists, events, eventArtists } from "@shared/schema";
import { eq, like, and, or, gte, lte, desc, asc } from "drizzle-orm";

export class WorkingDatabaseStorage {
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
        venueId: events.venueId,
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

      const enrichedEvents = [];
      for (const event of result) {
        // Get venue
        const venueResult = await db.select().from(venues).where(eq(venues.id, event.venueId));
        const venue = venueResult[0] || null;

        // Get artists for this event
        const eventArtistsResult2 = await db
          .select({
            artist: artists,
            isHeadliner: eventArtists.isHeadliner,
            order: eventArtists.order,
          })
          .from(eventArtists)
          .leftJoin(artists, eq(eventArtists.artistId, artists.id))
          .where(eq(eventArtists.eventId, event.id))
          .orderBy(asc(eventArtists.order));

        const eventArtistsList2 = eventArtistsResult2.map((ea) => ({
          ...ea.artist,
          isHeadliner: ea.isHeadliner,
          order: ea.order,
        }));

        enrichedEvents.push({
          ...event,
          venue,
          artists: eventArtistsList2
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
        venueId: events.venueId,
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

      const enrichedEvents = [];
      for (const event of result) {
        // Get venue
        const venueResult = await db.select().from(venues).where(eq(venues.id, event.venueId));
        const venue = venueResult[0] || null;

        // Get artists for this event
        const eventArtistsResult = await db
          .select({
            artist: artists,
            isHeadliner: eventArtists.isHeadliner,
            order: eventArtists.order,
          })
          .from(eventArtists)
          .leftJoin(artists, eq(eventArtists.artistId, artists.id))
          .where(eq(eventArtists.eventId, event.id))
          .orderBy(asc(eventArtists.order));

        const artists = eventArtistsResult.map((ea) => ({
          ...ea.artist,
          isHeadliner: ea.isHeadliner,
          order: ea.order,
        }));

        enrichedEvents.push({
          ...event,
          venue,
          artists
        });
      }

      return enrichedEvents;
    } catch (error) {
      console.error('Error fetching events by venue:', error);
      throw error;
    }
  }

  async getVenues(): Promise<any[]> {
    try {
      const venuesList = await db.select().from(venues);
      return venuesList;
    } catch (error) {
      console.error('Error fetching venues:', error);
      throw error;
    }
  }
}

export const workingStorage = new WorkingDatabaseStorage();