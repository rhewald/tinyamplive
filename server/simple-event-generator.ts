import { storage } from './storage';

export async function generateSimpleEvents() {
  try {
    console.log('=== Starting Simple Event Generation ===');
    
    const artists = await storage.getArtists();
    const venues = await storage.getVenues();
    
    console.log(`Found ${artists.length} artists, ${venues.length} venues`);
    
    if (artists.length === 0 || venues.length === 0) {
      return { success: false, message: 'No artists or venues found' };
    }
    
    const eventsToCreate = [];
    let eventCount = 0;
    
    // Create 50 diverse events spread across next 60 days
    for (let i = 0; i < 50 && eventCount < 50; i++) {
      const artist = artists[Math.floor(Math.random() * artists.length)];
      const venue = venues[Math.floor(Math.random() * venues.length)];
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 60) + 1);
      
      const eventData = {
        title: `${artist.name} Live`,
        slug: `${artist.slug}-${venue.slug}-${Date.now()}-${i}`,
        date: futureDate,
        artistId: artist.id,
        venueId: venue.id,
        ticketUrl: null,
        isFeatured: Math.random() > 0.8, // 20% featured
        isActive: true,
        tags: [artist.genre || 'music'],
        description: `${artist.name} performing live at ${venue.name}`,
        doors: null,
        showTime: null,
        price: null,
        imageUrl: null,
        openingActs: null
      };
      
      eventsToCreate.push(eventData);
      eventCount++;
    }
    
    console.log(`Creating ${eventsToCreate.length} events...`);
    
    // Create events in batch
    let created = 0;
    for (const eventData of eventsToCreate) {
      try {
        await storage.createEvent(eventData);
        created++;
      } catch (error) {
        console.error(`Failed to create event: ${eventData.title}`, error);
      }
    }
    
    console.log(`Successfully created ${created} events`);
    
    // Verify by fetching
    const upcomingEvents = await storage.getUpcomingEvents();
    console.log(`Verification: ${upcomingEvents.length} upcoming events in database`);
    
    return {
      success: true,
      eventsCreated: created,
      totalUpcoming: upcomingEvents.length,
      message: `Successfully created ${created} events with proper artist/venue links`
    };
    
  } catch (error) {
    console.error('Simple event generation failed:', error);
    return {
      success: false,
      message: `Generation failed: ${error.message}`
    };
  }
}

export const simpleEventGenerator = { generateSimpleEvents };