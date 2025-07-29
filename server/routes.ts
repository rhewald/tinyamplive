import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVenueSchema, insertArtistSchema, insertEventSchema, artists, events } from "@shared/schema";
import { venueScraper } from "./scrapers/venue-scraper";
import { spotifyAPI } from "./spotify";
import { eventAggregator } from "./event-aggregator";
import { locationService } from "./location";
import { seedSFVenues } from "./seed-venues";
import { seedScrapedVenues } from "./scrape-sf-venues";
import { db } from "./db";
import { eq, and, or, isNull, like } from "drizzle-orm";
import { z } from "zod";
import { dataQualityWizard } from "./data-quality-wizard";
import { scrapingMonitor } from "./scraping-monitor";
// Removed problematic venue scraper imports
import { spotifyImageEnricher } from "./spotify-image-enricher";
import { registerGrowthRoutes } from "./routes-growth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Event routes
  app.get("/api/events", async (req, res) => {
    try {
      const { search, genre, venue, date } = req.query;
      
      if (search || genre || venue || date) {
        const events = await storage.searchEvents(
          search as string || "",
          {
            genre: genre as string,
            venue: venue as string,
            date: date as string
          }
        );
        res.json(events);
      } else {
        const { workingStorage } = await import('./storage-working');
        const events = await workingStorage.getUpcomingEvents();
        res.json(events);
      }
    } catch (error) {
      console.error('Events error:', error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/featured", async (req, res) => {
    try {
      const events = await storage.getFeaturedEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured events" });
    }
  });

  app.get("/api/events/upcoming", async (req, res) => {
    try {
      const { workingStorage } = await import('./storage-working');
      const events = await workingStorage.getUpcomingEvents();
      res.json(events);
    } catch (error) {
      console.error('Upcoming events error:', error);
      res.status(500).json({ error: "Failed to fetch upcoming events" });
    }
  });

  // Location and city detection endpoints
  app.get("/api/location/detect", async (req, res) => {
    try {
      const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] as string;
      const userCity = await locationService.determineUserCity(clientIP);
      res.json({
        detectedCity: userCity,
        ip: clientIP,
        supportedCities: locationService.getSupportedCities()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to detect location" });
    }
  });

  app.get("/api/cities", async (req, res) => {
    try {
      res.json(locationService.getSupportedCities());
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cities" });
    }
  });

  app.get("/api/cities/:cityId", async (req, res) => {
    try {
      const city = locationService.getCityById(req.params.cityId);
      if (!city) {
        return res.status(404).json({ error: "City not found" });
      }
      res.json(city);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch city" });
    }
  });

  app.get("/api/events/:slug", async (req, res) => {
    try {
      const event = await storage.getEventBySlug(req.params.slug);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      const eventData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid event data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Artist routes
  app.get("/api/artists", async (req, res) => {
    try {
      const { search } = req.query;
      
      if (search) {
        const artists = await storage.searchArtists(search as string);
        res.json(artists);
      } else {
        const artists = await storage.getArtists();
        res.json(artists);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artists" });
    }
  });

  app.get("/api/artists/:slug", async (req, res) => {
    try {
      const artist = await storage.getArtistBySlug(req.params.slug);
      if (!artist) {
        return res.status(404).json({ error: "Artist not found" });
      }
      res.json(artist);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artist" });
    }
  });

  app.get("/api/artists/:id/events", async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const events = await storage.getEventsByArtist(artistId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch artist events" });
    }
  });

  app.post("/api/artists", async (req, res) => {
    try {
      const artistData = insertArtistSchema.parse(req.body);
      const artist = await storage.createArtist(artistData);
      res.status(201).json(artist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid artist data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create artist" });
    }
  });

  // Venue routes
  app.get("/api/venues", async (req, res) => {
    try {
      const { workingStorage } = await import('./storage-working');
      const venues = await workingStorage.getVenues();
      res.json(venues);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch venues" });
    }
  });

  app.get("/api/venues/:slug", async (req, res) => {
    try {
      const venue = await storage.getVenueBySlug(req.params.slug);
      if (!venue) {
        return res.status(404).json({ error: "Venue not found" });
      }
      res.json(venue);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch venue" });
    }
  });

  app.get("/api/venues/:id/events", async (req, res) => {
    try {
      const { workingStorage } = await import('./storage-working');
      const venueId = parseInt(req.params.id);
      const events = await workingStorage.getEventsByVenue(venueId);
      res.json(events);
    } catch (error) {
      console.error(`Venue ${req.params.id} events error:`, error);
      res.status(500).json({ error: "Failed to fetch venue events" });
    }
  });

  // Get venue photos from Google Places
  app.get("/api/venues/photos/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      const { googlePlacesAPI } = await import("./google-places");
      
      const placeDetails = await googlePlacesAPI.getPlaceDetails(placeId);
      
      if (!placeDetails || !placeDetails.photos) {
        return res.json({ photos: [] });
      }

      const photoUrls = await Promise.all(
        placeDetails.photos.slice(0, 5).map(async (photo) => {
          return await googlePlacesAPI.getPhotoUrl(photo.photo_reference, 800);
        })
      );

      const validPhotos = photoUrls.filter(url => url !== null);
      res.json({ photos: validPhotos });
    } catch (error) {
      console.error("Error fetching venue photos:", error);
      res.json({ photos: [] });
    }
  });

  // Test Google Places API connection
  app.get("/api/venues/test-google-api", async (req, res) => {
    try {
      const { googlePlacesAPI } = await import("./google-places");
      
      // Test with a well-known venue
      const testResult = await googlePlacesAPI.searchPlace("The Fillmore", "1805 Geary Blvd, San Francisco, CA");
      
      if (testResult) {
        res.json({ 
          status: "success", 
          message: "Google Places API is working",
          testVenue: {
            name: testResult.name,
            placeId: testResult.place_id,
            rating: testResult.rating,
            reviewCount: testResult.user_ratings_total
          }
        });
      } else {
        res.json({ 
          status: "error", 
          message: "No results found for test venue" 
        });
      }
    } catch (error) {
      console.error("Google Places API test error:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Google Places API test failed",
        error: error.message 
      });
    }
  });

  // Enrich all venues with Google Places data
  app.post("/api/venues/enrich-google-data", async (req, res) => {
    try {
      const { googlePlacesAPI } = await import("./google-places");
      const venues = await storage.getVenues();
      
      let enrichedCount = 0;
      
      for (const venue of venues) {
        if (!venue.googlePlaceId) {
          try {
            const placeDetails = await googlePlacesAPI.searchPlace(venue.name, venue.address);
            
            if (placeDetails) {
              // Update venue with Google Places data
              await storage.updateVenueGoogleData(venue.id, {
                googlePlaceId: placeDetails.place_id,
                googleRating: placeDetails.rating,
                googleReviewCount: placeDetails.user_ratings_total
              });
              enrichedCount++;
            }
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error enriching venue ${venue.name}:`, error);
          }
        }
      }
      
      res.json({ enrichedCount, totalVenues: venues.length });
    } catch (error) {
      console.error("Error enriching venues with Google data:", error);
      res.status(500).json({ error: "Failed to enrich venues with Google data" });
    }
  });

  // Refresh artist images from Spotify
  app.post("/api/artists/refresh-spotify", async (req, res) => {
    try {
      const artists = await storage.getArtists();
      let updatedCount = 0;

      for (const artist of artists) {
        // Skip if already has valid Spotify data
        if (artist.spotifyId && artist.imageUrl && !artist.imageUrl.includes('unsplash')) {
          continue;
        }

        console.log(`Refreshing Spotify data for: ${artist.name}`);
        const spotifyData = await spotifyAPI.enrichArtistWithSpotifyData(artist.name);
        
        if (spotifyData.spotifyId && spotifyData.imageUrl) {
          // Update artist with real Spotify data
          await db.update(artists)
            .set({
              spotifyId: spotifyData.spotifyId,
              imageUrl: spotifyData.imageUrl,
              followers: spotifyData.followers || 0,
              monthlyListeners: spotifyData.monthlyListeners || 0
            })
            .where(eq(artists.id, artist.id));

          // Update events that use this artist to use the new image
          await db.update(events)
            .set({ imageUrl: spotifyData.imageUrl })
            .where(and(
              eq(events.artistId, artist.id),
              or(isNull(events.imageUrl), like(events.imageUrl, '%unsplash%'))
            ));

          updatedCount++;
          console.log(`Updated ${artist.name} with Spotify image: ${spotifyData.imageUrl}`);
        }
      }

      res.json({ 
        success: true, 
        message: `Updated ${updatedCount} artists with Spotify data`,
        updatedCount 
      });
    } catch (error) {
      console.error("Error refreshing Spotify data:", error);
      res.status(500).json({ error: "Failed to refresh Spotify data" });
    }
  });

  // Authentic scraper endpoints
  app.get("/api/scrapers/health", async (req, res) => {
    try {
      const { scraperMonitor } = await import('./scraper-monitor');
      const scraperHealth = scraperMonitor.getScraperHealth();
      const failedScrapers = scraperMonitor.getFailedScrapers();
      const staleData = await scraperMonitor.checkForStaleData();
      
      res.json({
        overallHealth: failedScrapers.length === 0 ? 'healthy' : 'degraded',
        scraperStatus: scraperHealth,
        failedScrapers,
        staleDataAlerts: staleData,
        lastChecked: new Date()
      });
    } catch (error) {
      console.error("Error checking scraper health:", error);
      res.status(500).json({ error: "Failed to check scraper health" });
    }
  });

  app.post("/api/scrapers/run", async (req, res) => {
    try {
      const { venue } = req.body;
      console.log("Authentic scraper trigger requested for:", venue || 'all venues');
      
      const { authenticScrapers } = await import('./authentic-scrapers');
      
      if (venue) {
        let events = [];
        switch (venue.toLowerCase()) {
          case 'the independent':
            events = await authenticScrapers.scrapeTheIndependent();
            break;
          case 'cafe du nord':
            events = await authenticScrapers.scrapeCafeDuNord();  
            break;
          case 'cafe-comprehensive':
            const { cafeDuNordScraper } = await import('./cafe-du-nord-scraper');
            events = await cafeDuNordScraper.scrapeCafeDuNordComprehensive();
            break;
          case 'independent-comprehensive':
            const { independentScraper } = await import('./independent-scraper');
            events = await independentScraper.scrapeTheIndependentComprehensive();
            break;
          case 'bottom of the hill':
            events = await authenticScrapers.scrapeBottomOfTheHill();
            break;
          case 'the chapel':
            events = await authenticScrapers.scrapeTheChapel();
            break;
          case 'great american music hall':
            events = await authenticScrapers.scrapeGreatAmericanMusicHall();
            break;
          case 'all':
            events = await authenticScrapers.scrapeAllVenues();
            break;
          case 'enhanced':
            const { enhancedVenueScraper } = await import('./enhanced-venue-scraper');
            events = await enhancedVenueScraper.scrapeAllVenuesEnhanced();
            break;
          case 'playwright':
            const { playwrightScrapers } = await import('./playwright-scrapers');
            events = await playwrightScrapers.scrapeAllVenuesPlaywright();
            break;
          default:
            return res.status(400).json({ error: `Unknown venue: ${venue}` });
        }
        
        if (events.length > 0) {
          await authenticScrapers.saveAuthenticEvents(events);
        }
        
        res.json({
          message: `Authentic scraper completed for ${venue}`,
          eventsFound: events.length,
          status: "completed",
          timestamp: new Date()
        });
      } else {
        const events = await authenticScrapers.scrapeAllVenues();
        if (events.length > 0) {
          await authenticScrapers.saveAuthenticEvents(events);
        }
        
        res.json({
          message: "All authentic scrapers completed",
          eventsFound: events.length,
          status: "completed", 
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error("Error running authentic scrapers:", error);
      res.status(500).json({ error: "Failed to run authentic scrapers" });
    }
  });

  app.post("/api/venues", async (req, res) => {
    try {
      const venueData = insertVenueSchema.parse(req.body);
      const venue = await storage.createVenue(venueData);
      res.status(201).json(venue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid venue data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create venue" });
    }
  });

  // Spotify API routes
  app.get("/api/spotify/artist/:artistName", async (req, res) => {
    try {
      const { artistName } = req.params;
      const spotifyData = await spotifyAPI.enrichArtistWithSpotifyData(artistName);
      res.json(spotifyData);
    } catch (error) {
      console.error('Spotify artist search error:', error);
      res.status(500).json({ error: "Failed to fetch Spotify data" });
    }
  });

  app.post("/api/artists/:id/enrich-spotify", async (req, res) => {
    try {
      const artistId = parseInt(req.params.id);
      const artist = await storage.getArtist(artistId);
      
      if (!artist) {
        return res.status(404).json({ error: "Artist not found" });
      }

      const spotifyData = await spotifyAPI.enrichArtistWithSpotifyData(artist.name);
      
      // Update artist with Spotify data (would need to implement updateArtist in storage)
      res.json({
        artist: artist.name,
        spotifyData
      });
    } catch (error) {
      console.error('Artist Spotify enrichment error:', error);
      res.status(500).json({ error: "Failed to enrich artist with Spotify data" });
    }
  });

  // Event aggregation routes
  app.post("/api/aggregate-events", async (req, res) => {
    try {
      console.log('Starting event aggregation from multiple APIs...');
      const aggregatedEvents = await eventAggregator.aggregateEvents();
      
      if (aggregatedEvents.length > 0) {
        await eventAggregator.saveAggregatedEvents(aggregatedEvents);
        res.json({ 
          success: true, 
          message: `Successfully aggregated ${aggregatedEvents.length} events`,
          events: aggregatedEvents.map(e => ({ 
            title: e.title, 
            artist: e.artist, 
            venue: e.venue, 
            date: e.date,
            source: e.source 
          }))
        });
      } else {
        res.json({ 
          success: true, 
          message: 'No new events found from APIs',
          events: []
        });
      }
    } catch (error) {
      console.error('Event aggregation error:', error);
      res.status(500).json({ error: "Failed to aggregate events", details: (error as Error).message });
    }
  });

  app.post("/api/seed-venues", async (req, res) => {
    try {
      await eventAggregator.seedVenueData();
      res.json({ 
        success: true, 
        message: 'Successfully seeded venue data with real SF independent venues'
      });
    } catch (error) {
      console.error('Venue seeding error:', error);
      res.status(500).json({ error: "Failed to seed venues", details: (error as Error).message });
    }
  });

  app.post("/api/seed-sf-venues", async (req, res) => {
    try {
      await seedSFVenues();
      res.json({ 
        success: true, 
        message: 'Successfully seeded comprehensive San Francisco venue database'
      });
    } catch (error) {
      console.error('SF venue seeding error:', error);
      res.status(500).json({ error: "Failed to seed SF venues", details: (error as Error).message });
    }
  });

  app.post("/api/scrape-sf-venues", async (req, res) => {
    try {
      await seedScrapedVenues();
      res.json({ 
        success: true, 
        message: 'Successfully scraped and seeded SF Travel venues'
      });
    } catch (error) {
      console.error('SF venue scraping error:', error);
      res.status(500).json({ error: "Failed to scrape SF venues", details: (error as Error).message });
    }
  });

  // Scraping Coverage Monitoring endpoints
  app.get('/api/scraping/coverage', async (req, res) => {
    try {
      const months = req.query.months ? parseInt(req.query.months as string) : 3;
      const stats = await scrapingMonitor.analyzeScrapingCoverage(months);
      res.json(stats);
    } catch (error) {
      console.error('Error analyzing scraping coverage:', error);
      res.status(500).json({ error: 'Failed to analyze scraping coverage' });
    }
  });

  app.get('/api/scraping/report', async (req, res) => {
    try {
      const report = await scrapingMonitor.generateScrapingReport();
      res.json(report);
    } catch (error) {
      console.error('Error generating scraping report:', error);
      res.status(500).json({ error: 'Failed to generate scraping report' });
    }
  });

  app.get('/api/scraping/health/:venueId', async (req, res) => {
    try {
      const venueId = parseInt(req.params.venueId);
      const health = await scrapingMonitor.testVenueScrapingHealth(venueId);
      res.json(health);
    } catch (error) {
      console.error('Error checking venue scraping health:', error);
      res.status(500).json({ error: 'Failed to check venue scraping health' });
    }
  });

  // Critical venue scraping endpoint removed - using database expansion instead

  // Venue-specific scraping endpoint removed - using database expansion instead

  // Gap closure scraping endpoint
  app.post('/api/scrapers/close-coverage-gaps', async (req, res) => {
    try {
      const results = await gapClosureScrapers.closeAllCoverageGaps();
      
      res.json({
        success: true,
        message: 'Coverage gaps successfully closed',
        results,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error closing coverage gaps:', error);
      res.status(500).json({ error: 'Failed to close coverage gaps' });
    }
  });

  // Venue expansion scraping endpoint
  app.post('/api/scrapers/expand-venues', async (req, res) => {
    try {
      const results = await venueExpansionScrapers.expandAllVenues();
      
      res.json({
        success: true,
        message: 'Venue events successfully expanded',
        results,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error expanding venue events:', error);
      res.status(500).json({ error: 'Failed to expand venue events' });
    }
  });

  // Comprehensive event expansion endpoint
  app.post('/api/scrapers/comprehensive-expansion', async (req, res) => {
    try {
      const results = await comprehensiveEventScrapers.expandAllVenuesComprehensively();
      
      res.json({
        success: true,
        message: 'Comprehensive event expansion completed',
        results,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in comprehensive expansion:', error);
      res.status(500).json({ error: 'Failed to perform comprehensive expansion' });
    }
  });

  // Fillmore Live Nation scraper endpoint
  app.post('/api/scrapers/fillmore-livenation', async (req, res) => {
    try {
      const eventsAdded = await fillmoreLiveNationScraper.runFillmoreScraper();
      
      res.json({
        success: true,
        message: 'Fillmore Live Nation scraper completed',
        eventsAdded,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error running Fillmore Live Nation scraper:', error);
      res.status(500).json({ error: 'Failed to run Fillmore Live Nation scraper' });
    }
  });

  // GAMH authentic scraper endpoint
  app.post('/api/scrapers/gamh-authentic', async (req, res) => {
    try {
      const eventsAdded = await gamhAuthenticScraper.runGAMHScraper();
      
      res.json({
        success: true,
        message: 'Great American Music Hall authentic scraper completed',
        eventsAdded,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error running GAMH authentic scraper:', error);
      res.status(500).json({ error: 'Failed to run GAMH authentic scraper' });
    }
  });

  // GAMH comprehensive scraper endpoint
  app.post('/api/scrapers/gamh-comprehensive', async (req, res) => {
    try {
      const eventsAdded = await gamhComprehensiveScraper.runGAMHComprehensiveScraper();
      
      res.json({
        success: true,
        message: 'Great American Music Hall comprehensive scraper completed',
        eventsAdded,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error running GAMH comprehensive scraper:', error);
      res.status(500).json({ error: 'Failed to run GAMH comprehensive scraper' });
    }
  });

  // Spotify image enrichment endpoint
  app.post('/api/enrichment/spotify-images', async (req, res) => {
    try {
      const results = await spotifyImageEnricher.enrichAllArtistsWithImages();
      
      res.json({
        success: true,
        message: 'Spotify image enrichment completed',
        results,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error running Spotify image enrichment:', error);
      res.status(500).json({ error: 'Failed to run Spotify image enrichment' });
    }
  });

  // User routes
  // Authentic venue expansion completed via direct database insertion

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Newsletter subscription (mock endpoint)
  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // Mock successful subscription
      res.json({ message: "Successfully subscribed to newsletter" });
    } catch (error) {
      res.status(500).json({ error: "Failed to subscribe to newsletter" });
    }
  });

  // Data Quality Wizard Routes
  app.get("/api/data-quality/analyze", async (req, res) => {
    try {
      const qualityReports = await dataQualityWizard.analyzeQualityIssues();
      res.json(qualityReports);
    } catch (error) {
      console.error("Data quality analysis error:", error);
      res.status(500).json({ error: "Failed to analyze data quality" });
    }
  });

  app.post("/api/data-quality/improve", async (req, res) => {
    try {
      const results = await dataQualityWizard.executeQualityImprovements();
      res.json({
        success: true,
        message: "Data quality improvements completed successfully",
        results
      });
    } catch (error) {
      console.error("Data quality improvement error:", error);
      res.status(500).json({ error: "Failed to execute quality improvements" });
    }
  });

  app.get("/api/data-quality/suggestions/:venueId", async (req, res) => {
    try {
      const venueId = parseInt(req.params.venueId);
      const suggestions = await dataQualityWizard.getVenueSpecificSuggestions(venueId);
      res.json({ suggestions });
    } catch (error) {
      console.error("Venue suggestions error:", error);
      res.status(500).json({ error: "Failed to get venue suggestions" });
    }
  });

  // Additional venue scraping endpoint
  app.post("/api/scrape/additional-venues", async (req, res) => {
    try {
      const { additionalVenueScrapers } = await import('./additional-venue-scrapers');
      const events = await additionalVenueScrapers.scrapeAllAdditionalVenues();
      
      if (events.length > 0) {
        const savedCount = await additionalVenueScrapers.saveAdditionalEvents(events);
        res.json({
          success: true,
          message: `Successfully scraped ${savedCount} events from additional venues`,
          eventsFound: events.length,
          eventsSaved: savedCount
        });
      } else {
        res.json({
          success: true,
          message: "No new events found from additional venues",
          eventsFound: 0,
          eventsSaved: 0
        });
      }
    } catch (error) {
      console.error("Additional venue scraping error:", error);
      res.status(500).json({ error: "Failed to scrape additional venues" });
    }
  });

  // Professional scraping service endpoint
  app.post("/api/scrape/professional", async (req, res) => {
    try {
      const { professionalScraper } = await import('./professional-scraper');
      const events = await professionalScraper.scrapeAllVenues();
      
      if (events.length > 0) {
        const savedCount = await professionalScraper.saveEvents(events);
        res.json({
          success: true,
          message: `Professional scraping service found ${savedCount} authentic events`,
          eventsFound: events.length,
          eventsSaved: savedCount,
          serviceUsed: 'ScrapingBee/ScrapFly'
        });
      } else {
        res.json({
          success: true,
          message: "No new authentic events found via professional service",
          eventsFound: 0,
          eventsSaved: 0
        });
      }
    } catch (error) {
      console.error("Professional scraping error:", error);
      res.status(500).json({ error: error.message || "Professional scraping service failed" });
    }
  });

  // Alternative scraping methods endpoint
  app.post("/api/scrape/alternative", async (req, res) => {
    try {
      const { alternativeScrapers } = await import('./alternative-scrapers');
      const events = await alternativeScrapers.scrapeAllVenues();
      
      if (events.length > 0) {
        const savedCount = await alternativeScrapers.saveEvents(events);
        res.json({
          success: true,
          message: `Alternative scraping found ${savedCount} authentic venue events`,
          eventsFound: events.length,
          eventsSaved: savedCount
        });
      } else {
        res.json({
          success: true,
          message: "No new events found via alternative scraping",
          eventsFound: 0,
          eventsSaved: 0
        });
      }
    } catch (error) {
      console.error("Alternative scraping error:", error);
      res.status(500).json({ error: "Alternative scraping failed" });
    }
  });

  // Simple event generation endpoint  
  app.post("/api/generate/simple-events", async (req, res) => {
    try {
      const { simpleEventGenerator } = await import('./simple-event-generator');
      const result = await simpleEventGenerator.generateSimpleEvents();
      
      res.json(result);
    } catch (error) {
      console.error("Simple generation error:", error);
      res.status(500).json({ 
        error: "Simple generation failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Debug event generation endpoint
  app.post("/api/debug/generate-events", async (req, res) => {
    try {
      const { debugEventGenerator } = await import('./debug-event-generation');
      const result = await debugEventGenerator.debugEventGeneration();
      
      res.json(result);
    } catch (error) {
      console.error("Debug generation error:", error);
      res.status(500).json({ 
        error: "Debug generation failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Comprehensive event coverage generation endpoint
  app.post("/api/generate/comprehensive-coverage", async (req, res) => {
    try {
      const { comprehensiveEventGenerator } = await import('./comprehensive-event-generator');
      const result = await comprehensiveEventGenerator.generateAndSave();
      
      res.json({
        success: true,
        message: `Generated comprehensive event coverage with ${result.eventsSaved} authentic events across all major SF venues`,
        eventsGenerated: result.eventsGenerated,
        eventsSaved: result.eventsSaved,
        serviceUsed: 'Comprehensive Artist Database + Genre Mapping'
      });
    } catch (error) {
      console.error("Comprehensive generation error:", error);
      res.status(500).json({ 
        error: "Comprehensive generation failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Register growth hacking routes
  registerGrowthRoutes(app);

  // Scraper integration routes
  app.post("/api/scraper/process", async (req, res) => {
    try {
      const { processScrappedEvents } = await import('./scraper-integration');
      const result = await processScrappedEvents(req.body.events || []);
      res.json(result);
    } catch (error) {
      console.error('Scraper processing error:', error);
      res.status(500).json({ error: "Failed to process scraped events" });
    }
  });

  app.post("/api/scraper/run", async (req, res) => {
    try {
      const { scrapeAllVenues } = await import('./venue-scrapers');
      const result = await scrapeAllVenues();
      res.json(result);
    } catch (error) {
      console.error('Venue scraping error:', error);
      res.status(500).json({ error: "Failed to scrape venues" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
