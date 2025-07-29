import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  preferences: jsonb("preferences").$type<{
    genres?: string[];
    venues?: string[];
    notifications?: boolean;
  }>(),
});

export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  neighborhood: text("neighborhood").notNull(),
  address: text("address").notNull(),
  capacity: integer("capacity").notNull(),
  venueType: text("venue_type").notNull(), // club, concert_hall, cafe, outdoor
  primaryGenres: text("primary_genres").array().notNull(),
  description: text("description"),
  website: text("website"),
  imageUrl: text("image_url"),
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    twitter?: string;
    facebook?: string;
  }>(),
  googlePlaceId: text("google_place_id"),
  googleRating: doublePrecision("google_rating"),
  googleReviewCount: integer("google_review_count"),
});

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  genre: text("genre").notNull(),
  location: text("location").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  monthlyListeners: integer("monthly_listeners").default(0),
  followers: integer("followers").default(0),
  spotifyId: text("spotify_id"),
  youtubeChannelId: text("youtube_channel_id"),
  socialLinks: jsonb("social_links").$type<{
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    bandcamp?: string;
    soundcloud?: string;
  }>(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  venueId: integer("venue_id").references(() => venues.id).notNull(),
  date: timestamp("date").notNull(),
  doors: timestamp("doors"),
  showTime: timestamp("show_time"),
  price: decimal("price", { precision: 8, scale: 2 }),
  ticketUrl: text("ticket_url"),
  description: text("description"),
  imageUrl: text("image_url"),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  tags: text("tags").array(),
  // Removed artistId - now using junction table
});

// Junction table for many-to-many relationship between events and artists
export const eventArtists = pgTable("event_artists", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  artistId: integer("artist_id").references(() => artists.id).notNull(),
  isHeadliner: boolean("is_headliner").default(false), // true for main act, false for opening acts
  order: integer("order").default(0), // Order of appearance (0 = headliner, 1+ = opening acts)
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
});

export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
});

export const insertEventArtistSchema = createInsertSchema(eventArtists).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venues.$inferSelect;

export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artists.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertEventArtist = z.infer<typeof insertEventArtistSchema>;
export type EventArtist = typeof eventArtists.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  // Add user relations if needed
}));

export const venuesRelations = relations(venues, ({ many }) => ({
  events: many(events),
}));

export const artistsRelations = relations(artists, ({ many }) => ({
  eventArtists: many(eventArtists),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  venue: one(venues, {
    fields: [events.venueId],
    references: [venues.id],
  }),
  eventArtists: many(eventArtists),
}));

export const eventArtistsRelations = relations(eventArtists, ({ one }) => ({
  event: one(events, {
    fields: [eventArtists.eventId],
    references: [events.id],
  }),
  artist: one(artists, {
    fields: [eventArtists.artistId],
    references: [artists.id],
  }),
}));

export type EventWithDetails = Event & {
  venue: Venue;
  artists: (Artist & { isHeadliner: boolean; order: number })[];
};
