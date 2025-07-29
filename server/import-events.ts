import { db } from "./db";
import { events, artists, venues, eventArtists } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SampleEvent {
  title: string;
  artists: string[];
  date: string;
  venue: string;
  venue_slug: string;
  description: string;
  price: number;
  ticket_url: string;
  is_featured: boolean;
}

async function importEvents() {
  try {
    console.log("Starting event import...");

    // Read sample events data
    const eventsDataPath = path.join(__dirname, "../attached_assets/sample_events.json");
    const eventsData: SampleEvent[] = JSON.parse(fs.readFileSync(eventsDataPath, "utf-8"));

    console.log(`Found ${eventsData.length} events to import`);

    // First, ensure venues exist
    const venueSlugs = Array.from(new Set(eventsData.map(e => e.venue_slug)));
    const existingVenues = await db.select().from(venues);
    const existingVenueSlugs = existingVenues.map(v => v.slug);

    // Create missing venues
    for (const slug of venueSlugs) {
      if (!existingVenueSlugs.includes(slug)) {
        const eventData = eventsData.find(e => e.venue_slug === slug);
        if (eventData) {
          await db.insert(venues).values({
            name: eventData.venue,
            slug: slug,
            neighborhood: "San Francisco",
            address: "San Francisco, CA",
            capacity: 500,
            venueType: "club",
            primaryGenres: ["indie", "rock", "alternative"],
            description: `${eventData.venue} - Independent music venue in San Francisco`,
            website: `https://www.${slug.replace(/-/g, '')}.com`,
          });
          console.log(`Created venue: ${eventData.venue}`);
        }
      }
    }

    // Get all venues for reference
    const allVenues = await db.select().from(venues);
    const venueMap = new Map(allVenues.map(v => [v.slug, v]));

    // Process each event
    for (const eventData of eventsData) {
      console.log(`Processing event: ${eventData.title}`);

      // Create or find artists
      const artistIds: number[] = [];
      for (const artistName of eventData.artists) {
        // Check if artist exists
        const existingArtist = await db.select().from(artists).where(eq(artists.name, artistName));
        
        let artistId: number;
        if (existingArtist.length > 0) {
          artistId = existingArtist[0].id;
        } else {
          // Create new artist
          const artistSlug = artistName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const newArtist = await db.insert(artists).values({
            name: artistName,
            slug: artistSlug,
            genre: "indie",
            location: "San Francisco",
            description: `${artistName} - Independent artist`,
          }).returning();
          artistId = newArtist[0].id;
          console.log(`Created artist: ${artistName}`);
        }
        artistIds.push(artistId);
      }

      // Create event
      const eventSlug = eventData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const venue = venueMap.get(eventData.venue_slug);
      
      if (!venue) {
        console.error(`Venue not found: ${eventData.venue_slug}`);
        continue;
      }

      const newEvent = await db.insert(events).values({
        title: eventData.title,
        slug: eventSlug,
        venueId: venue.id,
        date: new Date(eventData.date),
        description: eventData.description,
        price: eventData.price.toString(),
        ticketUrl: eventData.ticket_url,
        isFeatured: eventData.is_featured,
        isActive: true,
      }).returning();

      const eventId = newEvent[0].id;

      // Create event-artist relationships
      for (let i = 0; i < artistIds.length; i++) {
        await db.insert(eventArtists).values({
          eventId: eventId,
          artistId: artistIds[i],
          isHeadliner: i === 0, // First artist is headliner
          order: i,
        });
      }

      console.log(`Created event: ${eventData.title} with ${artistIds.length} artists`);
    }

    console.log("Event import completed successfully!");

    // Verify the data
    const totalEvents = await db.select().from(events);
    const totalArtists = await db.select().from(artists);
    const totalEventArtists = await db.select().from(eventArtists);

    console.log(`Database now contains:`);
    console.log(`- ${totalEvents.length} events`);
    console.log(`- ${totalArtists.length} artists`);
    console.log(`- ${totalEventArtists.length} event-artist relationships`);

  } catch (error) {
    console.error("Error importing events:", error);
  }
}

// Run the import
importEvents().then(() => {
  console.log("Import script finished");
  process.exit(0);
}).catch((error) => {
  console.error("Import script failed:", error);
  process.exit(1);
}); 