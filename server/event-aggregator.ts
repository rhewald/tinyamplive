import { spotifyAPI } from './spotify';
import { db } from './db';
import { venues, artists, events } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface EventSource {
  id: string;
  title: string;
  artist: string;
  venue: string;
  date: Date;
  description?: string;
  ticketUrl?: string;
  imageUrl?: string;
  genre?: string;
  doors?: Date;
  showTime?: Date;
  source: 'eventbrite' | 'bandsintown' | 'songkick' | 'manual';
}

// Comprehensive SF Independent Music Venues
const SF_VENUES = [
  // Intimate/Small Venues (Under 300 capacity)
  {
    name: 'The Knockout',
    address: '3223 Mission St, San Francisco, CA 94110',
    neighborhood: 'Mission',
    capacity: 200,
    website: 'https://www.theknockoutsf.com',
    venueType: 'Bar/Club',
    primaryGenres: ['Punk', 'Indie Rock', 'Alternative'],
    description: 'Dive bar known for punk and indie shows with a legendary back room venue'
  },
  {
    name: 'The Make-Out Room',
    address: '3225 22nd St, San Francisco, CA 94110',
    neighborhood: 'Mission',
    capacity: 150,
    website: 'https://www.makeoutroom.com',
    venueType: 'Bar/Club',
    primaryGenres: ['Indie Rock', 'Folk', 'Alternative'],
    description: 'Intimate venue featuring emerging and touring indie acts'
  },
  {
    name: 'Cafe du Nord',
    address: '2174 Market St, San Francisco, CA 94114',
    neighborhood: 'Castro',
    capacity: 250,
    website: 'https://www.cafedunord.com',
    venueType: 'Music Venue',
    primaryGenres: ['Jazz', 'Indie Rock', 'Electronic'],
    description: 'Historic basement venue with excellent acoustics'
  },
  {
    name: 'The Hotel Utah Saloon',
    address: '500 4th St, San Francisco, CA 94107',
    neighborhood: 'SOMA',
    capacity: 200,
    website: 'https://www.hotelutahsaloon.com',
    venueType: 'Bar/Venue',
    primaryGenres: ['Alt-Country', 'Indie Rock', 'Americana'],
    description: 'Historic saloon with a reputation for showcasing songwriter talent'
  },
  {
    name: 'Rickshaw Stop',
    address: '155 Fell St, San Francisco, CA 94102',
    neighborhood: 'Hayes Valley',
    capacity: 300,
    website: 'https://www.rickshawstop.com',
    venueType: 'Music Venue',
    primaryGenres: ['Indie Rock', 'Electronic', 'Hip-Hop'],
    description: 'All-ages venue known for diverse indie and electronic acts'
  },

  // Medium Venues (300-700 capacity)
  {
    name: 'Bottom of the Hill',
    address: '1233 17th St, San Francisco, CA 94107',
    neighborhood: 'Potrero Hill',
    capacity: 400,
    website: 'https://www.bottomofthehill.com',
    venueType: 'Music Venue',
    primaryGenres: ['Indie Rock', 'Punk', 'Alternative'],
    description: 'Legendary venue for indie and alternative rock with outdoor patio'
  },
  {
    name: 'The Independent',
    address: '628 Divisadero St, San Francisco, CA 94117',
    neighborhood: 'NOPA',
    capacity: 500,
    website: 'https://www.theindependentsf.com',
    venueType: 'Music Venue',
    primaryGenres: ['Indie Rock', 'Alternative', 'Electronic'],
    description: 'Premier independent venue for touring and local acts'
  },
  {
    name: 'The Chapel',
    address: '777 Valencia St, San Francisco, CA 94110',
    neighborhood: 'Mission',
    capacity: 500,
    website: 'https://www.thechapelsf.com',
    venueType: 'Music Venue',
    primaryGenres: ['Indie Rock', 'Folk', 'Electronic'],
    description: 'Beautiful converted chapel with excellent sound and atmosphere'
  },
  {
    name: 'Great American Music Hall',
    address: '859 O\'Farrell St, San Francisco, CA 94109',
    neighborhood: 'Tenderloin',
    capacity: 470,
    website: 'https://www.gamh.com',
    venueType: 'Music Hall',
    primaryGenres: ['Indie Rock', 'Folk', 'Jazz'],
    description: 'Historic ornate venue with balcony seating and rich musical history'
  },
  {
    name: 'August Hall',
    address: '420 Mason St, San Francisco, CA 94102',
    neighborhood: 'Union Square',
    capacity: 600,
    website: 'https://www.august-hall.com',
    venueType: 'Music Venue',
    primaryGenres: ['Electronic', 'Hip-Hop', 'Indie Rock'],
    description: 'Modern venue with state-of-the-art sound system'
  },

  // Larger Independent Venues
  {
    name: 'The Fillmore',
    address: '1805 Geary Blvd, San Francisco, CA 94115',
    neighborhood: 'Fillmore',
    capacity: 1315,
    website: 'https://www.thefillmore.com',
    venueType: 'Historic Theatre',
    primaryGenres: ['Rock', 'Indie Rock', 'Electronic'],
    description: 'Legendary psychedelic-era venue with iconic poster art'
  },
  {
    name: 'The Warfield',
    address: '982 Market St, San Francisco, CA 94102',
    neighborhood: 'Tenderloin',
    capacity: 2300,
    website: 'https://www.thewarfieldtheatre.com',
    venueType: 'Theatre',
    primaryGenres: ['Rock', 'Indie Rock', 'Alternative'],
    description: 'Historic theatre venue for established touring acts'
  },

  // Specialty/Alternative Venues
  {
    name: 'The Starline Social Club',
    address: '2236 Martin Luther King Jr Way, Oakland, CA 94612',
    neighborhood: 'Oakland',
    capacity: 400,
    website: 'https://www.starlinesocialclub.com',
    venueType: 'Music Venue',
    primaryGenres: ['Indie Rock', 'Electronic', 'Hip-Hop'],
    description: 'Oakland venue popular with SF indie scene'
  },
  {
    name: 'The New Parish',
    address: '579 18th St, Oakland, CA 94612',
    neighborhood: 'Oakland',
    capacity: 300,
    website: 'https://www.thenewparish.com',
    venueType: 'Music Venue',
    primaryGenres: ['Hip-Hop', 'Electronic', 'Indie Rock'],
    description: 'Oakland venue that draws SF indie music fans'
  },
  {
    name: 'Slim\'s',
    address: '333 11th St, San Francisco, CA 94103',
    neighborhood: 'SOMA',
    capacity: 400,
    website: 'https://www.slimspresents.com',
    venueType: 'Music Venue',
    primaryGenres: ['Blues', 'Rock', 'Indie Rock'],
    description: 'Historic venue owned by Boz Scaggs, known for blues and rock'
  },
  {
    name: 'The DNA Lounge',
    address: '375 11th St, San Francisco, CA 94103',
    neighborhood: 'SOMA',
    capacity: 300,
    website: 'https://www.dnalounge.com',
    venueType: 'Nightclub/Venue',
    primaryGenres: ['Electronic', 'Industrial', 'Alternative'],
    description: 'Long-running venue for electronic and alternative music'
  },
  {
    name: 'Bimbo\'s 365 Club',
    address: '1025 Columbus Ave, San Francisco, CA 94133',
    neighborhood: 'North Beach',
    capacity: 800,
    website: 'https://www.bimbos365club.com',
    venueType: 'Supper Club',
    primaryGenres: ['Jazz', 'Swing', 'Indie Rock'],
    description: 'Historic Art Deco venue with dinner and dancing'
  },

  // Bars with Regular Live Music
  {
    name: 'The Elbo Room',
    address: '647 Valencia St, San Francisco, CA 94110',
    neighborhood: 'Mission',
    capacity: 150,
    website: 'https://www.elbo.com',
    venueType: 'Bar/Club',
    primaryGenres: ['Indie Rock', 'Electronic', 'Hip-Hop'],
    description: 'Two-level bar with upstairs live music venue'
  },
  {
    name: 'Thee Parkside',
    address: '1600 17th St, San Francisco, CA 94107',
    neighborhood: 'Potrero Hill',
    capacity: 200,
    website: 'https://www.theeparkside.com',
    venueType: 'Bar/Venue',
    primaryGenres: ['Indie Rock', 'Punk', 'Alternative'],
    description: 'Neighborhood bar with regular indie and punk shows'
  },
  {
    name: 'The Residence',
    address: '718 14th St, San Francisco, CA 94114',
    neighborhood: 'Castro',
    capacity: 100,
    website: 'https://www.theresidencesf.com',
    venueType: 'Bar/Lounge',
    primaryGenres: ['Electronic', 'Indie Pop', 'DJ Sets'],
    description: 'Intimate venue for electronic and indie acts'
  },
  {
    name: 'The Attic',
    address: '3336 24th St, San Francisco, CA 94110',
    neighborhood: 'Mission',
    capacity: 120,
    website: null,
    venueType: 'Bar/Venue',
    primaryGenres: ['Folk', 'Indie Rock', 'Acoustic'],
    description: 'Cozy upstairs venue for acoustic and folk shows'
  },

  // Record Stores with Live Music
  {
    name: 'Amoeba Music',
    address: '1855 Haight St, San Francisco, CA 94117',
    neighborhood: 'Haight-Ashbury',
    capacity: 100,
    website: 'https://www.amoeba.com',
    venueType: 'Record Store',
    primaryGenres: ['All Genres', 'In-Store Performances'],
    description: 'Iconic record store with regular in-store performances'
  },
  {
    name: 'Fingerprints Music',
    address: '3160 16th St, San Francisco, CA 94103',
    neighborhood: 'Mission',
    capacity: 50,
    website: 'https://www.fingerprintsmusic.com',
    venueType: 'Record Store',
    primaryGenres: ['Indie Rock', 'Electronic', 'Experimental'],
    description: 'Independent record store with intimate live performances'
  }
];

class EventAggregator {
  
  // Eventbrite API - searches for music events in SF
  async fetchEventbriteEvents(): Promise<EventSource[]> {
    // Note: Eventbrite requires API keys, would need EVENTBRITE_OAUTH_TOKEN
    const events: EventSource[] = [];
    
    try {
      // Example search for music events in San Francisco
      const response = await fetch(
        'https://www.eventbriteapi.com/v3/events/search/?location.address=San Francisco, CA&categories=103&expand=venue',
        {
          headers: {
            'Authorization': `Bearer ${process.env.EVENTBRITE_OAUTH_TOKEN || ''}`,
          },
        }
      );

      if (!response.ok) {
        console.log('Eventbrite API unavailable - would need API token');
        return [];
      }

      const data = await response.json();
      
      for (const event of data.events || []) {
        if (event.venue && this.isIndependentVenue(event.venue.name)) {
          events.push({
            id: event.id,
            title: event.name.text,
            artist: this.extractArtistFromTitle(event.name.text),
            venue: event.venue.name,
            date: new Date(event.start.utc),
            description: event.description?.text,
            ticketUrl: event.url,
            imageUrl: event.logo?.url,
            source: 'eventbrite'
          });
        }
      }
    } catch (error) {
      console.log('Eventbrite API error:', error.message);
    }

    return events;
  }

  // Bandsintown API - focuses on independent music
  async fetchBandsintownEvents(): Promise<EventSource[]> {
    const events: EventSource[] = [];
    
    try {
      // Search for events at known independent venues
      for (const venue of SF_VENUES) {
        if (!venue.bandsintownId) continue;
        
        const response = await fetch(
          `https://rest.bandsintown.com/venues/${venue.bandsintownId}/events?app_id=tinyamp&date=upcoming`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const venueEvents = await response.json();
          
          for (const event of venueEvents) {
            events.push({
              id: event.id,
              title: event.title || `${event.lineup.join(', ')} at ${venue.name}`,
              artist: event.lineup[0],
              venue: venue.name,
              date: new Date(event.datetime),
              description: event.description,
              ticketUrl: event.offers?.[0]?.url,
              imageUrl: event.artist?.image_url,
              source: 'bandsintown'
            });
          }
        }
      }
    } catch (error) {
      console.log('Bandsintown API error:', error.message);
    }

    return events;
  }

  // Songkick API - good for indie music discovery
  async fetchSongkickEvents(): Promise<EventSource[]> {
    const events: EventSource[] = [];
    
    try {
      // Note: Songkick API requires API key
      const response = await fetch(
        `https://api.songkick.com/api/3.0/metro_areas/26330/calendar.json?apikey=${process.env.SONGKICK_API_KEY || ''}&per_page=50`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.log('Songkick API unavailable - would need API key');
        return [];
      }

      const data = await response.json();
      
      for (const event of data.resultsPage?.results?.event || []) {
        const venueName = event.venue?.displayName;
        if (this.isIndependentVenue(venueName)) {
          events.push({
            id: event.id.toString(),
            title: event.displayName,
            artist: event.performance?.[0]?.artist?.displayName || 'Unknown Artist',
            venue: venueName,
            date: new Date(event.start.date),
            ticketUrl: event.uri,
            source: 'songkick'
          });
        }
      }
    } catch (error) {
      console.log('Songkick API error:', error.message);
    }

    return events;
  }

  // Check if venue is an independent venue vs mainstream/corporate
  private isIndependentVenue(venueName: string): boolean {
    if (!venueName) return false;
    
    const independentVenues = SF_VENUES.map(v => v.name.toLowerCase());
    const corporateVenues = [
      'oracle park', 'chase center', 'davies symphony hall', 
      'war memorial opera house', 'masonic', 'warfield',
      'regency ballroom', 'august hall'
    ];
    
    const venue = venueName.toLowerCase();
    
    // Check if it's in our independent venues list
    if (independentVenues.some(iv => venue.includes(iv.toLowerCase()))) {
      return true;
    }
    
    // Exclude corporate venues
    if (corporateVenues.some(cv => venue.includes(cv))) {
      return false;
    }
    
    // Include smaller venues with certain keywords
    const indieKeywords = ['cafe', 'bar', 'club', 'lounge', 'gallery', 'studio', 'basement'];
    return indieKeywords.some(keyword => venue.includes(keyword));
  }

  private extractArtistFromTitle(title: string): string {
    // Clean up common event title patterns
    return title
      .replace(/\s+(live|concert|show|tour)\s*$/i, '')
      .replace(/\s+at\s+.+$/i, '')
      .replace(/^\s*(concert|show|live):\s*/i, '')
      .trim();
  }

  // Aggregate events from all sources
  async aggregateEvents(): Promise<EventSource[]> {
    console.log('Starting event aggregation from multiple sources...');
    
    const [eventbriteEvents, bandsintownEvents, songkickEvents] = await Promise.allSettled([
      this.fetchEventbriteEvents(),
      this.fetchBandsintownEvents(),
      this.fetchSongkickEvents()
    ]);

    const allEvents: EventSource[] = [];
    
    if (eventbriteEvents.status === 'fulfilled') {
      allEvents.push(...eventbriteEvents.value);
    }
    
    if (bandsintownEvents.status === 'fulfilled') {
      allEvents.push(...bandsintownEvents.value);
    }
    
    if (songkickEvents.status === 'fulfilled') {
      allEvents.push(...songkickEvents.value);
    }

    // Remove duplicates based on artist + venue + date
    const uniqueEvents = this.deduplicateEvents(allEvents);
    
    console.log(`Aggregated ${uniqueEvents.length} unique events from ${allEvents.length} total`);
    return uniqueEvents;
  }

  private deduplicateEvents(events: EventSource[]): EventSource[] {
    const seen = new Set<string>();
    return events.filter(event => {
      const key = `${event.artist}-${event.venue}-${event.date.toDateString()}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Save aggregated events to database with Spotify enrichment
  async saveAggregatedEvents(events: EventSource[]): Promise<void> {
    console.log('Saving aggregated events to database...');

    for (const event of events) {
      try {
        // Find or create venue
        let venue = await db.select().from(venues).where(eq(venues.name, event.venue)).limit(1);
        if (venue.length === 0) {
          const venueInfo = SF_VENUES.find(v => v.name === event.venue);
          const [newVenue] = await db.insert(venues).values({
            name: event.venue,
            slug: event.venue.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            neighborhood: venueInfo?.neighborhood || 'Unknown',
            address: venueInfo?.address || 'San Francisco, CA',
            capacity: venueInfo?.capacity || 0,
            venueType: venueInfo?.venueType || 'Music Venue',
            primaryGenres: venueInfo?.primaryGenres || [event.genre || 'Alternative'],
            website: venueInfo?.website || null,
            description: venueInfo?.description || null
          }).returning();
          venue = [newVenue];
        }

        // Find or create artist with comprehensive image enrichment
        let artist = await db.select().from(artists).where(eq(artists.name, event.artist)).limit(1);
        if (artist.length === 0) {
          console.log(`Enriching ${event.artist} with Spotify data...`);
          const spotifyData = await spotifyAPI.enrichArtistWithSpotifyData(event.artist);
          
          // Use Spotify image as primary source
          let artistImageUrl = spotifyData.imageUrl;
          
          // If no Spotify image, try Last.fm as fallback (when API key is available)
          if (!artistImageUrl) {
            console.log(`No Spotify image for ${event.artist}, trying alternative sources...`);
            // Note: Last.fm integration would require API key
            // For now, prioritize Spotify as the primary authentic source
          }
          
          const [newArtist] = await db.insert(artists).values({
            name: event.artist,
            slug: event.artist.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            genre: event.genre || spotifyData.genres[0] || 'Alternative',
            location: 'San Francisco Bay Area',
            spotifyId: spotifyData.spotifyId,
            followers: spotifyData.followers,
            imageUrl: artistImageUrl
          }).returning();
          artist = [newArtist];
        }

        // Create event with fallback image strategy
        const eventSlug = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${event.date.toISOString().split('T')[0]}`;
        
        // Determine best image source: event image -> artist image -> null
        const eventImageUrl = event.imageUrl || artist[0].imageUrl || null;
        
        // Check if event already exists
        const existingEvent = await db.select().from(events).where(eq(events.slug, eventSlug)).limit(1);
        if (existingEvent.length === 0) {
          await db.insert(events).values({
            title: event.title,
            slug: eventSlug,
            artistId: artist[0].id,
            venueId: venue[0].id,
            date: event.date,
            doors: event.doors,
            showTime: event.showTime,
            description: event.description,
            ticketUrl: event.ticketUrl,
            imageUrl: eventImageUrl,
            isActive: true,
            isFeatured: false,
            openingActs: []
          });
          console.log(`Created event: ${event.title} with image: ${eventImageUrl ? 'Yes' : 'No'}`);
        }

      } catch (error) {
        console.error(`Error saving event "${event.title}":`, error);
      }
    }

    console.log('Finished saving aggregated events');
  }

  // Create seed data with real venue information
  async seedVenueData(): Promise<void> {
    console.log('Seeding comprehensive SF independent venue data...');
    
    for (const venueInfo of SF_VENUES) {
      try {
        const existingVenue = await db.select().from(venues).where(eq(venues.name, venueInfo.name)).limit(1);
        
        if (existingVenue.length === 0) {
          await db.insert(venues).values({
            name: venueInfo.name,
            slug: venueInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            neighborhood: venueInfo.neighborhood,
            address: venueInfo.address,
            capacity: venueInfo.capacity,
            venueType: venueInfo.venueType,
            primaryGenres: venueInfo.primaryGenres,
            website: venueInfo.website,
            description: venueInfo.description
          });
          console.log(`Created venue: ${venueInfo.name} (${venueInfo.venueType}, ${venueInfo.capacity} capacity)`);
        } else {
          console.log(`Venue already exists: ${venueInfo.name}`);
        }
      } catch (error) {
        console.error(`Error creating venue ${venueInfo.name}:`, error);
      }
    }
    
    console.log(`Finished seeding ${SF_VENUES.length} SF independent venues`);
  }
}

export const eventAggregator = new EventAggregator();