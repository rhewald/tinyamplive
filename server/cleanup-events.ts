import { db } from "./db";
import { events, artists, eventArtists } from "@shared/schema";
import { eq, like, or } from "drizzle-orm";

async function cleanupEvents() {
  try {
    console.log("Cleaning up poor quality events...");
    
    // Find events with poor artist names
    const poorArtistNames = [
      'Previously', 'Wednesday July', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
      'Monday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
      'October', 'November', 'December', 'PM', 'doors', 'music', 'advance', 'door', 'over', 'ages',
      'indie', 'pop', 'rock', 'punk', 'folk', 'surf', 'emo', 'shoegaze', 'post', 'metal', 'psychedelic',
      'garage', 'alternative', 'americana', 'country', 'jazz', 'swing', 'blues', 'stoner', 'synthwave'
    ];
    
    // Get all events with their artists
    const allEvents = await db.select({
      eventId: events.id,
      eventTitle: events.title,
      artistId: eventArtists.artistId,
      artistName: artists.name,
    })
    .from(events)
    .leftJoin(eventArtists, eq(events.id, eventArtists.eventId))
    .leftJoin(artists, eq(eventArtists.artistId, artists.id));
    
    let deletedCount = 0;
    let updatedCount = 0;
    
    // Group events by event ID
    const eventGroups = new Map();
    allEvents.forEach(row => {
      if (!eventGroups.has(row.eventId)) {
        eventGroups.set(row.eventId, {
          eventId: row.eventId,
          eventTitle: row.eventTitle,
          artists: []
        });
      }
      if (row.artistName) {
        eventGroups.get(row.eventId).artists.push(row.artistName);
      }
    });
    
    // Process each event
    for (const [eventId, eventData] of eventGroups) {
      const hasPoorArtists = eventData.artists.some(artist => 
        poorArtistNames.some(poor => artist.toLowerCase().includes(poor.toLowerCase()))
      );
      
      const hasShortArtists = eventData.artists.some(artist => artist.length < 3);
      
      const hasGenericArtists = eventData.artists.some(artist => 
        artist.toLowerCase().includes('at bottom') || 
        artist.toLowerCase().includes('at the independent') ||
        artist.toLowerCase().includes('at cafe')
      );
      
      if (hasPoorArtists || hasShortArtists || hasGenericArtists) {
        console.log(`Deleting poor quality event: ${eventData.eventTitle} (artists: ${eventData.artists.join(', ')})`);
        
        // Delete event-artist relationships
        await db.delete(eventArtists).where(eq(eventArtists.eventId, eventId));
        
        // Delete the event
        await db.delete(events).where(eq(events.id, eventId));
        
        deletedCount++;
      }
    }
    
    // Also delete orphaned artists
    const orphanedArtists = await db.select()
      .from(artists)
      .where(
        or(
          ...poorArtistNames.map(name => like(artists.name, `%${name}%`))
        )
      );
    
    for (const artist of orphanedArtists) {
      console.log(`Deleting poor quality artist: ${artist.name}`);
      await db.delete(artists).where(eq(artists.id, artist.id));
    }
    
    console.log(`Deleted ${deletedCount} poor quality events`);
    console.log(`Deleted ${orphanedArtists.length} poor quality artists`);
    
    // Check final counts
    const finalEvents = await db.select().from(events);
    const finalArtists = await db.select().from(artists);
    const finalRelationships = await db.select().from(eventArtists);
    
    console.log(`Final counts:`);
    console.log(`- Events: ${finalEvents.length}`);
    console.log(`- Artists: ${finalArtists.length}`);
    console.log(`- Event-Artist relationships: ${finalRelationships.length}`);
    
  } catch (error) {
    console.error("Error cleaning up events:", error);
  }
}

cleanupEvents().then(() => {
  console.log("Cleanup completed");
  process.exit(0);
}).catch((error) => {
  console.error("Cleanup failed:", error);
  process.exit(1);
}); 