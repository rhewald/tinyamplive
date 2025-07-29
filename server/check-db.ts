import { db } from "./db";
import { events, artists, venues, eventArtists } from "@shared/schema";

async function checkDatabase() {
  try {
    console.log("Checking database contents...");
    
    const eventsCount = await db.select().from(events);
    const artistsCount = await db.select().from(artists);
    const venuesCount = await db.select().from(venues);
    const eventArtistsCount = await db.select().from(eventArtists);
    
    console.log(`Events: ${eventsCount.length}`);
    console.log(`Artists: ${artistsCount.length}`);
    console.log(`Venues: ${venuesCount.length}`);
    console.log(`Event-Artist relationships: ${eventArtistsCount.length}`);
    
    if (eventsCount.length > 0) {
      console.log("\nSample events:");
      eventsCount.slice(0, 3).forEach(event => {
        console.log(`- ${event.title} (${event.date})`);
      });
    }
    
  } catch (error) {
    console.error("Error checking database:", error);
  }
}

checkDatabase().then(() => {
  console.log("Check completed");
  process.exit(0);
}).catch((error) => {
  console.error("Check failed:", error);
  process.exit(1);
}); 