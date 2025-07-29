import { db } from "./db";
import { users, venues, artists, events, eventArtists, type User, type Venue, type Artist, type Event, type EventArtist, type InsertUser, type InsertVenue, type InsertArtist, type InsertEvent, type InsertEventArtist, type EventWithDetails } from "@shared/schema";
import { eq, like, and, or, gte, lte, desc, asc } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Venues
  getVenues(): Promise<Venue[]>;
  getVenue(id: number): Promise<Venue | undefined>;
  getVenueBySlug(slug: string): Promise<Venue | undefined>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenueGoogleData(id: number, data: { googlePlaceId: string; googleRating: number; googleReviewCount: number }): Promise<void>;

  // Artists
  getArtists(): Promise<Artist[]>;
  getArtist(id: number): Promise<Artist | undefined>;
  getArtistBySlug(slug: string): Promise<Artist | undefined>;
  searchArtists(query: string): Promise<Artist[]>;
  createArtist(artist: InsertArtist): Promise<Artist>;

  // Events
  getEvents(): Promise<EventWithDetails[]>;
  getEvent(id: number): Promise<EventWithDetails | undefined>;
  getEventBySlug(slug: string): Promise<EventWithDetails | undefined>;
  getEventsByArtist(artistId: number): Promise<EventWithDetails[]>;
  getEventsByVenue(venueId: number): Promise<EventWithDetails[]>;
  getFeaturedEvents(): Promise<EventWithDetails[]>;
  getUpcomingEvents(): Promise<EventWithDetails[]>;
  searchEvents(query: string, filters?: {
    genre?: string;
    venue?: string;
    date?: string;
  }): Promise<EventWithDetails[]>;
  createEvent(event: InsertEvent, artists: { artistId: number; isHeadliner: boolean; order: number }[]): Promise<Event>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getVenues(): Promise<Venue[]> {
    return db.select().from(venues);
  }

  async getVenue(id: number): Promise<Venue | undefined> {
    const result = await db.select().from(venues).where(eq(venues.id, id));
    return result[0];
  }

  async getVenueBySlug(slug: string): Promise<Venue | undefined> {
    const result = await db.select().from(venues).where(eq(venues.slug, slug));
    return result[0];
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const result = await db.insert(venues).values(insertVenue).returning();
    return result[0];
  }

  async updateVenueGoogleData(id: number, data: { googlePlaceId: string; googleRating: number; googleReviewCount: number }): Promise<void> {
    await db.update(venues).set({
      googlePlaceId: data.googlePlaceId,
      googleRating: data.googleRating,
      googleReviewCount: data.googleReviewCount
    }).where(eq(venues.id, id));
  }

  async getArtists(): Promise<Artist[]> {
    return db.select().from(artists);
  }

  async getArtist(id: number): Promise<Artist | undefined> {
    const result = await db.select().from(artists).where(eq(artists.id, id));
    return result[0];
  }

  async getArtistBySlug(slug: string): Promise<Artist | undefined> {
    const result = await db.select().from(artists).where(eq(artists.slug, slug));
    return result[0];
  }

  async searchArtists(query: string): Promise<Artist[]> {
    return db.select().from(artists).where(like(artists.name, `%${query}%`));
  }

  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    const result = await db.insert(artists).values(insertArtist).returning();
    return result[0];
  }

  async getEvents(): Promise<EventWithDetails[]> {
    const result = await db
      .select({
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
        tags: events.tags,
        venue: venues,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(eq(events.isActive, true))
      .orderBy(desc(events.date));

    // Get artists for each event
    const eventsWithArtists = await Promise.all(
      result.map(async (event) => {
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

        return {
          ...event,
          artists: eventArtistsResult.map((ea) => ({
            ...ea.artist,
            isHeadliner: ea.isHeadliner,
            order: ea.order,
          })),
        };
      })
    );

    return eventsWithArtists;
  }

  async getEvent(id: number): Promise<EventWithDetails | undefined> {
    const result = await db
      .select({
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
        tags: events.tags,
        venue: venues,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(eq(events.id, id));

    if (!result[0]) return undefined;

    const event = result[0];
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

    return {
      ...event,
      artists: eventArtistsResult.map((ea) => ({
        ...ea.artist,
        isHeadliner: ea.isHeadliner,
        order: ea.order,
      })),
    };
  }

  async getEventBySlug(slug: string): Promise<EventWithDetails | undefined> {
    const result = await db
      .select({
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
        tags: events.tags,
        venue: venues,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(eq(events.slug, slug));

    if (!result[0]) return undefined;

    const event = result[0];
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

    return {
      ...event,
      artists: eventArtistsResult.map((ea) => ({
        ...ea.artist,
        isHeadliner: ea.isHeadliner,
        order: ea.order,
      })),
    };
  }

  async getEventsByArtist(artistId: number): Promise<EventWithDetails[]> {
    const result = await db
      .select({
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
        tags: events.tags,
        venue: venues,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .innerJoin(eventArtists, eq(events.id, eventArtists.eventId))
      .where(and(
        eq(eventArtists.artistId, artistId),
        eq(events.isActive, true)
      ))
      .orderBy(desc(events.date));

    // Get artists for each event
    const eventsWithArtists = await Promise.all(
      result.map(async (event) => {
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

        return {
          ...event,
          artists: eventArtistsResult.map((ea) => ({
            ...ea.artist,
            isHeadliner: ea.isHeadliner,
            order: ea.order,
          })),
        };
      })
    );

    return eventsWithArtists;
  }

  async getEventsByVenue(venueId: number): Promise<EventWithDetails[]> {
    const result = await db
      .select({
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
        tags: events.tags,
        venue: venues,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(and(
        eq(events.venueId, venueId),
        eq(events.isActive, true)
      ))
      .orderBy(desc(events.date));

    // Get artists for each event
    const eventsWithArtists = await Promise.all(
      result.map(async (event) => {
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

        return {
          ...event,
          artists: eventArtistsResult.map((ea) => ({
            ...ea.artist,
            isHeadliner: ea.isHeadliner,
            order: ea.order,
          })),
        };
      })
    );

    return eventsWithArtists;
  }

  async getFeaturedEvents(): Promise<EventWithDetails[]> {
    const result = await db
      .select({
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
        tags: events.tags,
        venue: venues,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(and(
        eq(events.isFeatured, true),
        eq(events.isActive, true)
      ))
      .orderBy(desc(events.date));

    // Get artists for each event
    const eventsWithArtists = await Promise.all(
      result.map(async (event) => {
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

        return {
          ...event,
          artists: eventArtistsResult.map((ea) => ({
            ...ea.artist,
            isHeadliner: ea.isHeadliner,
            order: ea.order,
          })),
        };
      })
    );

    return eventsWithArtists;
  }

  async getUpcomingEvents(): Promise<EventWithDetails[]> {
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);

    const result = await db
      .select({
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
        tags: events.tags,
        venue: venues,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(and(
        gte(events.date, now),
        lte(events.date, threeMonthsFromNow),
        eq(events.isActive, true)
      ))
      .orderBy(asc(events.date));

    // Get artists for each event
    const eventsWithArtists = await Promise.all(
      result.map(async (event) => {
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

        return {
          ...event,
          artists: eventArtistsResult.map((ea) => ({
            ...ea.artist,
            isHeadliner: ea.isHeadliner,
            order: ea.order,
          })),
        };
      })
    );

    return eventsWithArtists;
  }

  async searchEvents(query: string, filters?: {
    genre?: string;
    venue?: string;
    date?: string;
  }): Promise<EventWithDetails[]> {
    let whereConditions = [eq(events.isActive, true)];

    if (query) {
      whereConditions.push(like(events.title, `%${query}%`));
    }

    if (filters?.venue) {
      whereConditions.push(eq(venues.slug, filters.venue));
    }

    if (filters?.date) {
      whereConditions.push(eq(events.date, new Date(filters.date)));
    }

    const result = await db
      .select({
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
        tags: events.tags,
        venue: venues,
      })
      .from(events)
      .leftJoin(venues, eq(events.venueId, venues.id))
      .where(and(...whereConditions))
      .orderBy(desc(events.date));

    // Get artists for each event
    const eventsWithArtists = await Promise.all(
      result.map(async (event) => {
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

        return {
          ...event,
          artists: eventArtistsResult.map((ea) => ({
            ...ea.artist,
            isHeadliner: ea.isHeadliner,
            order: ea.order,
          })),
        };
      })
    );

    return eventsWithArtists;
  }

  async createEvent(insertEvent: InsertEvent, artists: { artistId: number; isHeadliner: boolean; order: number }[]): Promise<Event> {
    // Create the event first
    const eventResult = await db.insert(events).values(insertEvent).returning();
    const event = eventResult[0];

    // Create event-artist relationships
    const eventArtistInserts = artists.map(artist => ({
      eventId: event.id,
      artistId: artist.artistId,
      isHeadliner: artist.isHeadliner,
      order: artist.order,
    }));

    await db.insert(eventArtists).values(eventArtistInserts);

    return event;
  }
} 