import { storage } from './storage';

// Simple test to generate a few events with proper error logging
export async function debugEventGeneration() {
  try {
    console.log('=== Starting Debug Event Generation ===');
    
    // Get venues
    const venues = await storage.getVenues();
    console.log(`Found ${venues.length} venues`);
    
    // Get artists
    const artists = await storage.getArtists();
    console.log(`Found ${artists.length} artists`);
    
    if (venues.length === 0 || artists.length === 0) {
      console.log('No venues or artists found');
      return { success: false, message: 'No venues or artists available' };
    }
    
    // Create test events
    const testEvents = [];
    const venue = venues[0]; // Use first venue
    const testArtists = artists.slice(0, 5); // Use first 5 artists
    
    for (let i = 0; i < testArtists.length; i++) {
      const artist = testArtists[i];
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i + 1);
      
      try {
        const event = await storage.createEvent({
          title: `${artist.name} Live`,
          slug: `${artist.slug}-live-${Date.now()}-${i}`,
          date: futureDate,
          artistId: artist.id,
          venueId: venue.id,
          ticketUrl: null,
          isFeatured: false,
          isActive: true,
          tags: [artist.genre || 'music']
        });
        
        testEvents.push(event);
        console.log(`Created event: ${event.title} (ID: ${event.id})`);
      } catch (error) {
        console.error(`Error creating event for ${artist.name}:`, error);
      }
    }
    
    console.log(`Successfully created ${testEvents.length} test events`);
    
    // Test retrieving events
    try {
      const upcomingEvents = await storage.getUpcomingEvents();
      console.log(`Retrieved ${upcomingEvents.length} upcoming events`);
      
      if (upcomingEvents.length > 0) {
        console.log('Sample event:', {
          id: upcomingEvents[0].id,
          title: upcomingEvents[0].title,
          artist: upcomingEvents[0].artist?.name,
          venue: upcomingEvents[0].venue?.name
        });
      }
    } catch (error) {
      console.error('Error retrieving events:', error);
    }
    
    return {
      success: true,
      eventsCreated: testEvents.length,
      message: 'Debug generation completed'
    };
    
  } catch (error) {
    console.error('Debug generation failed:', error);
    return {
      success: false,
      message: `Debug generation failed: ${error.message}`
    };
  }
}

export const debugEventGenerator = { debugEventGeneration };