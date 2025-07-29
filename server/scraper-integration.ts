import { db } from "./db";
import { events, artists, venues } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ScrapedEvent {
  artist: string;
  date: string;
  time?: string;
  venue: string;
  link?: string;
  description?: string;
}

/**
 * Process scraped events and insert them into the database
 */
export async function processScrappedEvents(scrapedEvents: ScrapedEvent[]) {
  console.log(`Processing ${scrapedEvents.length} scraped events...`);
  
  let inserted = 0;
  let skipped = 0;
  
  for (const scrapedEvent of scrapedEvents) {
    try {
      // Find or create venue
      const venueResults = await db.select().from(venues).where(eq(venues.name, scrapedEvent.venue));
      let venue = venueResults[0];
      
      if (!venue) {
        console.log(`Creating new venue: ${scrapedEvent.venue}`);
        const newVenues = await db.insert(venues).values([{
          name: scrapedEvent.venue,
          slug: scrapedEvent.venue.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          neighborhood: "San Francisco", // Default
          address: "",
          capacity: 300, // Default
          venueType: "club",
          primaryGenres: ["indie"],
          description: `Live music venue in San Francisco`
        }]).returning();
        venue = newVenues[0];
      }
      
      // Find or create artist
      const artistResults = await db.select().from(artists).where(eq(artists.name, scrapedEvent.artist));
      let artist = artistResults[0];
      
      if (!artist) {
        console.log(`Creating new artist: ${scrapedEvent.artist}`);
        const newArtists = await db.insert(artists).values([{
          name: scrapedEvent.artist,
          slug: scrapedEvent.artist.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          genre: "indie", // Default
          location: "San Francisco, CA",
          description: `${scrapedEvent.artist} performing live`
        }]).returning();
        artist = newArtists[0];
      }
      
      // Create event
      const eventDate = new Date(scrapedEvent.date + (scrapedEvent.time ? ` ${scrapedEvent.time}` : ' 20:00:00'));
      
      // Check if event already exists (using title and date for uniqueness)
      const eventTitle = `${scrapedEvent.artist} Live`;
      const existingEvents = await db.select({
        id: events.id,
        title: events.title
      }).from(events).where(
        eq(events.title, eventTitle)
      );
      
      if (existingEvents.length === 0) {
        await db.insert(events).values([{
          title: `${scrapedEvent.artist} Live`,
          slug: `${scrapedEvent.artist.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-live`,
          date: eventDate,
          description: scrapedEvent.description || `${scrapedEvent.artist} performing live at ${scrapedEvent.venue}`,
          artistId: artist.id,
          venueId: venue.id,
          ticketUrl: scrapedEvent.link,
          isFeatured: false,
          isActive: true,
          tags: ["live", "scraped"]
        }]);
        inserted++;
        console.log(`✓ Inserted event: ${scrapedEvent.artist} at ${scrapedEvent.venue}`);
      } else {
        skipped++;
        console.log(`- Skipped duplicate event: ${scrapedEvent.artist} at ${scrapedEvent.venue}`);
      }
      
    } catch (error) {
      console.error(`Error processing event ${scrapedEvent.artist}:`, error);
      skipped++;
    }
  }
  
  console.log(`✅ Processing complete. Inserted: ${inserted}, Skipped: ${skipped}`);
  return { inserted, skipped };
}