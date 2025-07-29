import 'dotenv/config';
import { AutomatedEventScraper } from './automated-scraper';

async function testAutomatedScraper() {
  console.log('Testing automated scraper...');
  
  const scraper = new AutomatedEventScraper();
  
  try {
    // Initialize the scraper first
    await scraper.init();
    
    // Run a single scraping cycle
    await scraper.runScrapingCycle();
    console.log('Scraping cycle completed successfully');
  } catch (error) {
    console.error('Error during scraping cycle:', error);
  } finally {
    await scraper.cleanup();
  }
}

testAutomatedScraper().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
}); 