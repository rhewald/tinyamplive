import { db } from "./db";
import { events, artists, venues, eventArtists } from "@shared/schema";
import { eq } from "drizzle-orm";

async function testEvents() {
  try {
    console.log("Testing event retrieval...");
    
    // Get all events without filters
    const allEvents = await db.select().from(events);
    console.log(`Total events in database: ${allEvents.length}`);
    
    if (allEvents.length > 0) {
      const event = allEvents[0];
      console.log(`Sample event: ${event.title} on ${event.date}`);
      
      // Get venue for this event
      const venue = await db.select().from(venues).where(eq(venues.id, event.venueId));
      console.log(`Venue: ${venue[0]?.name}`);
      
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
        .orderBy(eventArtists.order);
      
      console.log(`Artists for this event: ${eventArtistsResult.length}`);
      eventArtistsResult.forEach((ea, i) => {
        console.log(`  ${i + 1}. ${ea.artist.name} (${ea.isHeadliner ? 'Headliner' : 'Support'})`);
      });
    }
    
  } catch (error) {
    console.error("Error testing events:", error);
  }
}

testEvents().then(() => {
  console.log("Test completed");
  process.exit(0);
}).catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
}); 