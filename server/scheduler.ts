import { AutomatedEventScraper } from './automated-scraper';

class ScrapingScheduler {
  private scraper: AutomatedEventScraper;
  private isRunning = false;

  constructor() {
    this.scraper = new AutomatedEventScraper();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting scraping scheduler...');

    try {
      await this.scraper.startAutomation();
    } catch (error) {
      console.error('Error starting scheduler:', error);
      this.isRunning = false;
    }
  }

  async stop(): Promise<void> {
    console.log('Stopping scraping scheduler...');
    await this.scraper.cleanup();
    this.isRunning = false;
  }
}

// Export for use in main server
export { ScrapingScheduler };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scheduler = new ScrapingScheduler();
  
  scheduler.start().catch(console.error);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down scheduler...');
    await scheduler.stop();
    process.exit(0);
  });
} 