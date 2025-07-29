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
  createEvent(event: InsertEvent): Promise<Event>;
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
    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    
    // Get upcoming events first (next 3 months)
    const upcomingEvents = await db.select({
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
      tags: events.tags,
      artist: artists,
      venue: venues
    })
    .from(events)
    .innerJoin(artists, eq(events.artistId, artists.id))
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(and(
      gte(events.date, now),
      lte(events.date, threeMonthsFromNow),
      eq(events.isActive, true)
    ))
    .orderBy(events.date);

    // Get other events (past and distant future)
    const otherEvents = await db.select({
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
      tags: events.tags,
      artist: artists,
      venue: venues
    })
    .from(events)
    .innerJoin(artists, eq(events.artistId, artists.id))
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(and(
      or(
        lte(events.date, now),
        gte(events.date, threeMonthsFromNow)
      ),
      eq(events.isActive, true)
    ))
    .orderBy(desc(events.date));

    // Combine: upcoming events first, then other events
    return [...upcomingEvents, ...otherEvents];
  }

  async getEvent(id: number): Promise<EventWithDetails | undefined> {
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
      tags: events.tags,
      artist: artists,
      venue: venues
    })
    .from(events)
    .innerJoin(artists, eq(events.artistId, artists.id))
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(eq(events.id, id));

    return result[0];
  }

  async getEventBySlug(slug: string): Promise<EventWithDetails | undefined> {
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
      tags: events.tags,
      artist: artists,
      venue: venues
    })
    .from(events)
    .innerJoin(artists, eq(events.artistId, artists.id))
    .innerJoin(venues, eq(events.venueId, venues.id))
    .where(eq(events.slug, slug));

    return result[0];
  }

  async getEventsByArtist(artistId: number): Promise<EventWithDetails[]> {
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
      tags: events.tags,
      artist: artists,
      venue: venues
    })
    .from(events)
    .leftJoin(artists, eq(events.artistId, artists.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(eq(events.artistId, artistId))
    .orderBy(desc(events.date));

    return result;
  }

  async getEventsByVenue(venueId: number): Promise<EventWithDetails[]> {
    const now = new Date();
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
      tags: events.tags,
      artist: artists,
      venue: venues
    })
    .from(events)
    .leftJoin(artists, eq(events.artistId, artists.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(eq(events.venueId, venueId), gte(events.date, now), eq(events.isActive, true)))
    .orderBy(asc(events.date));

    console.log(`Found ${result.length} events for venue ${venueId}`);
    return result;
  }

  async getFeaturedEvents(): Promise<EventWithDetails[]> {
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
      tags: events.tags,
      artist: artists,
      venue: venues
    })
    .from(events)
    .leftJoin(artists, eq(events.artistId, artists.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(eq(events.isFeatured, true), eq(events.isActive, true)))
    .orderBy(desc(events.date));

    return result;
  }

  async getUpcomingEvents(): Promise<EventWithDetails[]> {
    const now = new Date();
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
      tags: events.tags,
      artist: artists,
      venue: venues
    })
    .from(events)
    .leftJoin(artists, eq(events.artistId, artists.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(gte(events.date, now), eq(events.isActive, true)))
    .orderBy(asc(events.date));

    console.log(`Found ${result.length} upcoming events`);
    return result;
  }

  async searchEvents(query: string, filters?: {
    genre?: string;
    venue?: string;
    date?: string;
  }): Promise<EventWithDetails[]> {
    let whereConditions = [eq(events.isActive, true)];
    
    if (query) {
      whereConditions.push(
        or(
          like(events.title, `%${query}%`),
          like(artists.name, `%${query}%`)
        )!
      );
    }

    if (filters?.genre) {
      whereConditions.push(like(artists.genre, `%${filters.genre}%`));
    }

    if (filters?.venue) {
      // Check if it's a venue ID (numeric) or venue slug/name
      if (/^\d+$/.test(filters.venue)) {
        whereConditions.push(eq(venues.id, parseInt(filters.venue)));
      } else {
        // Try matching by slug first, then name
        whereConditions.push(
          or(
            eq(venues.slug, filters.venue),
            like(venues.name, `%${filters.venue}%`)
          )!
        );
      }
    }

    if (filters?.date) {
      const today = new Date();
      const endDate = new Date();
      
      switch (filters.date) {
        case 'today':
          endDate.setDate(today.getDate() + 1);
          break;
        case 'week':
          endDate.setDate(today.getDate() + 7);
          break;
        case 'month':
          endDate.setMonth(today.getMonth() + 1);
          break;
      }
      
      if (filters.date !== 'all') {
        whereConditions.push(
          and(
            gte(events.date, today),
            lte(events.date, endDate)
          )!
        );
      }
    }

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
      tags: events.tags,
      artist: artists,
      venue: venues
    })
    .from(events)
    .leftJoin(artists, eq(events.artistId, artists.id))
    .leftJoin(venues, eq(events.venueId, venues.id))
    .where(and(...whereConditions))
    .orderBy(desc(events.date));

    return result;
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const result = await db.insert(events).values(insertEvent).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();