import { db } from "./db";
import { events, artists, venues, eventArtists } from "@shared/schema";
import { eq } from "drizzle-orm";

async function createCurrentEvents() {
  try {
    console.log("Creating current events for testing...");
    
    // Get existing venues and artists
    const existingVenues = await db.select().from(venues);
    const existingArtists = await db.select().from(artists);
    
    if (existingVenues.length === 0 || existingArtists.length === 0) {
      console.log("No venues or artists found. Please run the import script first.");
      return;
    }
    
    // Create some events with current dates
    const currentDate = new Date();
    const futureDates = [
      new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
      new Date(currentDate.getTime() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
    ];
    
    const testEvents = [
      {
        title: "Local Showcase",
        artists: ["The Black Keys", "Local Support"],
        date: futureDates[0],
        venueId: existingVenues[0].id,
        description: "A great local show",
        price: 25.00,
        isFeatured: true
      },
      {
        title: "Indie Night",
        artists: ["Phoenix", "Local Natives"],
        date: futureDates[1],
        venueId: existingVenues[1].id,
        description: "Indie rock night",
        price: 30.00,
        isFeatured: false
      },
      {
        title: "Acoustic Evening",
        artists: ["Tame Impala"],
        date: futureDates[2],
        venueId: existingVenues[2].id,
        description: "Intimate acoustic performance",
        price: 40.00,
        isFeatured: true
      }
    ];
    
    for (const eventData of testEvents) {
      console.log(`Creating event: ${eventData.title}`);
      
      // Create event
      const eventSlug = eventData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newEvent = await db.insert(events).values({
        title: eventData.title,
        slug: eventSlug,
        venueId: eventData.venueId,
        date: eventData.date,
        description: eventData.description,
        price: eventData.price.toString(),
        isFeatured: eventData.isFeatured,
        isActive: true,
      }).returning();
      
      const eventId = newEvent[0].id;
      
      // Create event-artist relationships
      for (let i = 0; i < eventData.artists.length; i++) {
        const artistName = eventData.artists[i];
        const existingArtist = existingArtists.find(a => a.name === artistName);
        
        if (existingArtist) {
          await db.insert(eventArtists).values({
            eventId: eventId,
            artistId: existingArtist.id,
            isHeadliner: i === 0,
            order: i,
          });
        }
      }
      
      console.log(`Created event: ${eventData.title} with ${eventData.artists.length} artists`);
    }
    
    console.log("Current events created successfully!");
    
  } catch (error) {
    console.error("Error creating current events:", error);
  }
}

createCurrentEvents().then(() => {
  console.log("Script completed");
  process.exit(0);
}).catch((error) => {
  console.error("Script failed:", error);
  process.exit(1);
}); 