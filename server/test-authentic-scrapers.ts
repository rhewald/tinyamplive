import { authenticScrapers } from './authentic-scrapers';
import { scraperMonitor } from './scraper-monitor';

async function testAuthenticScrapers() {
  console.log('🔍 Testing authentic venue scrapers...');
  
  try {
    // Test individual venue scrapers
    console.log('\n--- Testing Cafe du Nord ---');
    const cafeDuNordEvents = await authenticScrapers.scrapeCafeDuNord();
    console.log(`Found ${cafeDuNordEvents.length} authentic events at Cafe du Nord`);
    
    console.log('\n--- Testing The Independent ---');
    const independentEvents = await authenticScrapers.scrapeTheIndependent();
    console.log(`Found ${independentEvents.length} authentic events at The Independent`);
    
    console.log('\n--- Testing Bottom of the Hill ---');
    const bottomHillEvents = await authenticScrapers.scrapeBottomOfTheHill();
    console.log(`Found ${bottomHillEvents.length} authentic events at Bottom of the Hill`);
    
    // Test all venues scraper
    console.log('\n--- Testing All Venues ---');
    const allEvents = await authenticScrapers.scrapeAllVenues();
    console.log(`Total authentic events found: ${allEvents.length}`);
    
    // Display sample events if found
    if (allEvents.length > 0) {
      console.log('\n--- Sample Authentic Events ---');
      allEvents.slice(0, 3).forEach((event, index) => {
        console.log(`${index + 1}. ${event.title}`);
        console.log(`   Artist: ${event.artist}`);
        console.log(`   Venue: ${event.venue}`);
        console.log(`   Date: ${event.date.toDateString()}`);
        console.log(`   Genre: ${event.genre || 'Unknown'}`);
        if (event.ticketUrl) console.log(`   Tickets: ${event.ticketUrl}`);
        console.log('');
      });
    }
    
    // Show scraper health
    console.log('\n--- Scraper Health Status ---');
    const health = scraperMonitor.getScraperHealth();
    health.forEach(status => {
      console.log(`${status.venue}: ${status.status} (${status.eventsFound} events)`);
      if (status.errorMessage) {
        console.log(`  Error: ${status.errorMessage}`);
      }
    });
    
    const failedScrapers = scraperMonitor.getFailedScrapers();
    if (failedScrapers.length > 0) {
      console.log('\n⚠️ FAILED SCRAPERS:');
      failedScrapers.forEach(scraper => {
        console.log(`- ${scraper.venue}: ${scraper.status}`);
        if (scraper.errorMessage) {
          console.log(`  ${scraper.errorMessage}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error testing authentic scrapers:', error);
  }
}

// Run the test
testAuthenticScrapers().then(() => {
  console.log('\n✅ Authentic scraper testing completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Authentic scraper testing failed:', error);
  process.exit(1);
});

export { testAuthenticScrapers };