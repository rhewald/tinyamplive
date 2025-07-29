import { venueScraper } from './scrapers/venue-scraper';

async function testScraper() {
  console.log('Testing venue scraper...');
  
  try {
    // Test scraping The Independent
    console.log('\n--- Testing The Independent ---');
    const independentEvents = await venueScraper.scrapeTheIndependent();
    console.log(`Found ${independentEvents.length} events`);
    independentEvents.slice(0, 3).forEach(event => {
      console.log(`- ${event.title} on ${event.date.toDateString()}`);
    });

    // Test scraping Bottom of the Hill (simpler HTML structure)
    console.log('\n--- Testing Bottom of the Hill ---');
    const bottomEvents = await venueScraper.scrapeBottomOfTheHill();
    console.log(`Found ${bottomEvents.length} events`);
    bottomEvents.slice(0, 3).forEach(event => {
      console.log(`- ${event.title} on ${event.date.toDateString()}`);
    });

    // Test all venues
    console.log('\n--- Testing All Venues ---');
    const allEvents = await venueScraper.scrapeAllVenues();
    console.log(`Total events found: ${allEvents.length}`);
    
    // Group by venue
    const byVenue = allEvents.reduce((acc, event) => {
      acc[event.venue] = (acc[event.venue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\nEvents by venue:');
    Object.entries(byVenue).forEach(([venue, count]) => {
      console.log(`- ${venue}: ${count} events`);
    });

  } catch (error) {
    console.error('Scraper test failed:', error);
  }
}

testScraper();