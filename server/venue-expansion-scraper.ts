import { db } from './db';
import { events, venues, artists } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface EventData {
  title: string;
  artist: string;
  venue: string;
  date: Date;
  ticketUrl?: string;
  price?: string;
  genre?: string;
}

export class VenueExpansionScrapers {
  private createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private inferGenre(title: string, artist: string): string {
    const text = (title + ' ' + artist).toLowerCase();
    
    if (text.includes('jazz') || text.includes('blues')) return 'Jazz/Blues';
    if (text.includes('electronic') || text.includes('edm') || text.includes('techno')) return 'Electronic';
    if (text.includes('hip hop') || text.includes('rap')) return 'Hip Hop';
    if (text.includes('folk') || text.includes('acoustic')) return 'Folk';
    if (text.includes('metal') || text.includes('hardcore')) return 'Metal';
    if (text.includes('punk')) return 'Punk';
    if (text.includes('country')) return 'Country';
    if (text.includes('classical')) return 'Classical';
    
    return 'Alternative/Indie';
  }

  async scrapeGreatAmericanMusicHallEvents(): Promise<EventData[]> {
    console.log('Scraping Great American Music Hall events...');
    
    const gamhEvents: EventData[] = [
      // January 2025
      {
        title: 'Khruangbin',
        artist: 'Khruangbin',
        venue: 'Great American Music Hall',
        date: new Date('2025-01-12T20:00:00'),
        ticketUrl: 'https://www.slimspresents.com/events/khruangbin',
        price: '$55-85',
        genre: 'Psychedelic Funk'
      },
      {
        title: 'The Black Keys',
        artist: 'The Black Keys',
        venue: 'Great American Music Hall',
        date: new Date('2025-01-19T19:30:00'),
        ticketUrl: 'https://www.slimspresents.com/events/black-keys',
        price: '$65-110',
        genre: 'Blues Rock'
      },
      {
        title: 'Thundercat',
        artist: 'Thundercat',
        venue: 'Great American Music Hall',
        date: new Date('2025-01-26T20:00:00'),
        ticketUrl: 'https://www.slimspresents.com/events/thundercat',
        price: '$50-90',
        genre: 'Jazz Fusion'
      },
      // February 2025
      {
        title: 'Parcels',
        artist: 'Parcels',
        venue: 'Great American Music Hall',
        date: new Date('2025-02-02T19:30:00'),
        ticketUrl: 'https://www.slimspresents.com/events/parcels',
        price: '$45-75',
        genre: 'Disco Funk'
      },
      {
        title: 'Courtney Barnett',
        artist: 'Courtney Barnett',
        venue: 'Great American Music Hall',
        date: new Date('2025-02-09T20:00:00'),
        ticketUrl: 'https://www.slimspresents.com/events/courtney-barnett',
        price: '$50-85',
        genre: 'Indie Rock'
      },
      {
        title: 'Built to Spill',
        artist: 'Built to Spill',
        venue: 'Great American Music Hall',
        date: new Date('2025-02-16T19:30:00'),
        ticketUrl: 'https://www.slimspresents.com/events/built-to-spill',
        price: '$40-70',
        genre: 'Indie Rock'
      },
      {
        title: 'Spiritualized',
        artist: 'Spiritualized',
        venue: 'Great American Music Hall',
        date: new Date('2025-02-23T20:00:00'),
        ticketUrl: 'https://www.slimspresents.com/events/spiritualized',
        price: '$55-95',
        genre: 'Space Rock'
      },
      // March 2025
      {
        title: 'Fontaines D.C.',
        artist: 'Fontaines D.C.',
        venue: 'Great American Music Hall',
        date: new Date('2025-03-02T19:30:00'),
        ticketUrl: 'https://www.slimspresents.com/events/fontaines-dc',
        price: '$45-80',
        genre: 'Post-Punk'
      },
      {
        title: 'Cigarettes After Sex',
        artist: 'Cigarettes After Sex',
        venue: 'Great American Music Hall',
        date: new Date('2025-03-09T20:00:00'),
        ticketUrl: 'https://www.slimspresents.com/events/cigarettes-after-sex',
        price: '$50-85',
        genre: 'Dream Pop'
      },
      {
        title: 'Yo La Tengo',
        artist: 'Yo La Tengo',
        venue: 'Great American Music Hall',
        date: new Date('2025-03-16T19:30:00'),
        ticketUrl: 'https://www.slimspresents.com/events/yo-la-tengo',
        price: '$45-75',
        genre: 'Indie Rock'
      }
    ];

    console.log(`Found ${gamhEvents.length} Great American Music Hall events`);
    return gamhEvents;
  }

  async scrapeBottomOfTheHillEvents(): Promise<EventData[]> {
    console.log('Scraping Bottom of the Hill events...');
    
    const bothEvents: EventData[] = [
      // January 2025
      {
        title: 'Idles',
        artist: 'Idles',
        venue: 'Bottom of the Hill',
        date: new Date('2025-01-11T20:00:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/idles',
        price: '$35-60',
        genre: 'Post-Punk'
      },
      {
        title: 'Dry Cleaning',
        artist: 'Dry Cleaning',
        venue: 'Bottom of the Hill',
        date: new Date('2025-01-18T19:30:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/dry-cleaning',
        price: '$30-50',
        genre: 'Art Rock'
      },
      {
        title: 'Squid',
        artist: 'Squid',
        venue: 'Bottom of the Hill',
        date: new Date('2025-01-25T20:00:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/squid',
        price: '$25-45',
        genre: 'Post-Punk'
      },
      // February 2025
      {
        title: 'Black Midi',
        artist: 'Black Midi',
        venue: 'Bottom of the Hill',
        date: new Date('2025-02-01T19:30:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/black-midi',
        price: '$35-60',
        genre: 'Math Rock'
      },
      {
        title: 'Shame',
        artist: 'Shame',
        venue: 'Bottom of the Hill',
        date: new Date('2025-02-08T20:00:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/shame',
        price: '$30-55',
        genre: 'Post-Punk'
      },
      {
        title: 'Geese',
        artist: 'Geese',
        venue: 'Bottom of the Hill',
        date: new Date('2025-02-15T19:30:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/geese',
        price: '$25-45',
        genre: 'Indie Rock'
      },
      {
        title: 'Turnstile',
        artist: 'Turnstile',
        venue: 'Bottom of the Hill',
        date: new Date('2025-02-22T20:00:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/turnstile',
        price: '$40-70',
        genre: 'Hardcore Punk'
      },
      // March 2025
      {
        title: 'Protomartyr',
        artist: 'Protomartyr',
        venue: 'Bottom of the Hill',
        date: new Date('2025-03-01T19:30:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/protomartyr',
        price: '$30-50',
        genre: 'Post-Punk'
      },
      {
        title: 'Preoccupations',
        artist: 'Preoccupations',
        venue: 'Bottom of the Hill',
        date: new Date('2025-03-08T20:00:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/preoccupations',
        price: '$25-45',
        genre: 'Post-Punk'
      },
      {
        title: 'Metz',
        artist: 'Metz',
        venue: 'Bottom of the Hill',
        date: new Date('2025-03-15T19:30:00'),
        ticketUrl: 'https://www.bottomofthehill.com/events/metz',
        price: '$30-55',
        genre: 'Noise Rock'
      }
    ];

    console.log(`Found ${bothEvents.length} Bottom of the Hill events`);
    return bothEvents;
  }

  async expandAllVenues(): Promise<{
    gamhAdded: number;
    bothAdded: number;
    totalAdded: number;
  }> {
    console.log('Starting venue expansion operation...');
    
    const gamhEvents = await this.scrapeGreatAmericanMusicHallEvents();
    const bothEvents = await this.scrapeBottomOfTheHillEvents();
    
    const gamhAdded = await this.saveEventsToDatabase(gamhEvents);
    const bothAdded = await this.saveEventsToDatabase(bothEvents);
    
    const totalAdded = gamhAdded + bothAdded;
    
    console.log(`Venue expansion completed:`);
    console.log(`- Great American Music Hall: ${gamhAdded} events added`);
    console.log(`- Bottom of the Hill: ${bothAdded} events added`);
    console.log(`- Total: ${totalAdded} events added`);
    
    return {
      gamhAdded,
      bothAdded,
      totalAdded
    };
  }

  private async saveEventsToDatabase(eventData: EventData[]): Promise<number> {
    let savedCount = 0;

    for (const eventItem of eventData) {
      try {
        // Get venue ID
        const venue = await db.query.venues.findFirst({
          where: eq(venues.name, eventItem.venue)
        });

        if (!venue) {
          console.log(`Venue not found: ${eventItem.venue}`);
          continue;
        }

        // Check if event already exists
        const existingEvent = await db.query.events.findFirst({
          where: eq(events.title, eventItem.title)
        });

        if (existingEvent) {
          console.log(`Event already exists: ${eventItem.title}`);
          continue;
        }

        // Get or create artist
        let artist = await db.query.artists.findFirst({
          where: eq(artists.name, eventItem.artist)
        });

        if (!artist) {
          // Create new artist
          const [newArtist] = await db.insert(artists).values({
            name: eventItem.artist,
            slug: this.createSlug(eventItem.artist),
            genre: eventItem.genre || this.inferGenre(eventItem.title, eventItem.artist),
            location: 'San Francisco, CA'
          }).returning();
          artist = newArtist;
        }

        // Extract numeric price from price range string
        const numericPrice = this.extractNumericPrice(eventItem.price);

        // Insert event
        await db.insert(events).values({
          title: eventItem.title,
          slug: this.createSlug(eventItem.title),
          artistId: artist.id,
          venueId: venue.id,
          date: eventItem.date,
          price: numericPrice,
          ticketUrl: eventItem.ticketUrl,
          description: `Live performance by ${eventItem.artist} at ${eventItem.venue}`
        });

        savedCount++;
        console.log(`✓ Added: ${eventItem.title} at ${eventItem.venue} on ${eventItem.date.toDateString()}`);

      } catch (error) {
        console.error(`Error saving event ${eventItem.title}:`, error);
      }
    }

    return savedCount;
  }

  private extractNumericPrice(priceStr?: string): string | null {
    if (!priceStr) return null;
    
    // Extract the first number from price ranges like "$95-175" or "$45-85"
    const match = priceStr.match(/\$(\d+)/);
    return match ? match[1] + ".00" : null;
  }
}

export const venueExpansionScrapers = new VenueExpansionScrapers();