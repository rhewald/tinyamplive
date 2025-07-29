import { db } from "./db";
import { events, artists, venues, eventArtists } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScrapedEvent {
  title: string;
  date: string;
  venue: string;
  venue_slug: string;
}

function extractArtistsFromTitle(title: string): string[] {
  // Extract artist names from the event title
  const artists: string[] = [];
  
  // Common patterns for artist names
  const patterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\[co-headlining\]/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z][a-z\s]+$/gm,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z][a-z\s]+(?=\s+at\s+Bottom)/g,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z][a-z\s]+(?=\s+[A-Z][a-z\s]+$)/g,
  ];
  
  for (const pattern of patterns) {
    const matches = title.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const artistName = match.replace(/\[co-headlining\]/, '').trim();
        if (artistName.length > 2 && !artists.includes(artistName)) {
          artists.push(artistName);
        }
      });
    }
  }
  
  // If no artists found with patterns, try to extract from the beginning
  if (artists.length === 0) {
    const lines = title.split('\n');
    for (const line of lines) {
      const cleanLine = line.trim();
      if (cleanLine.length > 3 && cleanLine.length < 50 && !cleanLine.includes('PM') && !cleanLine.includes('doors')) {
        artists.push(cleanLine);
        break;
      }
    }
  }
  
  return artists.slice(0, 3); // Limit to 3 artists max
}

function parseDate(dateStr: string): Date | null {
  try {
    // Handle various date formats
    const cleanDate = dateStr.replace(/\n/g, ' ').trim();
    
    // Try different date patterns
    const patterns = [
      /(\w+)\s+(\d{1,2})\s+(\d{4})/, // "July 29 2025"
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // "3/27/2025"
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/, // "July 29, 2025"
    ];
    
    for (const pattern of patterns) {
      const match = cleanDate.match(pattern);
      if (match) {
        const month = match[1];
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);
        
        const monthMap: { [key: string]: number } = {
          'january': 0, 'jan': 0,
          'february': 1, 'feb': 1,
          'march': 2, 'mar': 2,
          'april': 3, 'apr': 3,
          'may': 4,
          'june': 5, 'jun': 5,
          'july': 6, 'jul': 6,
          'august': 7, 'aug': 7,
          'september': 8, 'sep': 8,
          'october': 9, 'oct': 9,
          'november': 10, 'nov': 10,
          'december': 11, 'dec': 11,
        };
        
        const monthIndex = monthMap[month.toLowerCase()];
        if (monthIndex !== undefined) {
          return new Date(year, monthIndex, day);
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', dateStr, error);
    return null;
  }
}

async function importScrapedEvents() {
  try {
    console.log("Importing scraped events...");
    
    // Read scraped events
    const scrapedEventsPath = path.join(__dirname, "../attached_assets/scraped_events_enhanced.json");
    const scrapedEvents: ScrapedEvent[] = JSON.parse(fs.readFileSync(scrapedEventsPath, "utf-8"));
    
    console.log(`Found ${scrapedEvents.length} scraped events`);
    
    // Get existing venues and artists
    const existingVenues = await db.select().from(venues);
    const existingArtists = await db.select().from(artists);
    
    let importedCount = 0;
    
    for (const scrapedEvent of scrapedEvents) {
      try {
        // Parse date
        const eventDate = parseDate(scrapedEvent.date);
        if (!eventDate) {
          console.log(`Skipping event with invalid date: ${scrapedEvent.title}`);
          continue;
        }
        
        // Find venue
        const venue = existingVenues.find(v => v.slug === scrapedEvent.venue_slug);
        if (!venue) {
          console.log(`Venue not found: ${scrapedEvent.venue_slug}`);
          continue;
        }
        
        // Extract artists from title
        const artistNames = extractArtistsFromTitle(scrapedEvent.title);
        if (artistNames.length === 0) {
          console.log(`No artists found in: ${scrapedEvent.title}`);
          continue;
        }
        
        console.log(`Processing: ${scrapedEvent.title}`);
        console.log(`Artists: ${artistNames.join(', ')}`);
        
        // Create or find artists
        const artistIds: number[] = [];
        for (const artistName of artistNames) {
          let artistId: number;
          
          // Check if artist exists
          const existingArtist = existingArtists.find(a => 
            a.name.toLowerCase() === artistName.toLowerCase()
          );
          
          if (existingArtist) {
            artistId = existingArtist.id;
          } else {
            // Create new artist
            const newArtist = await db.insert(artists).values({
              name: artistName,
              slug: artistName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
              genre: 'indie',
              location: 'San Francisco',
              description: `${artistName} - Live performance`,
            }).returning();
            artistId = newArtist[0].id;
          }
          
          artistIds.push(artistId);
        }
        
        // Create event
        const eventSlug = scrapedEvent.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50);
        const newEvent = await db.insert(events).values({
          title: scrapedEvent.title.substring(0, 200), // Limit title length
          slug: eventSlug,
          venueId: venue.id,
          date: eventDate,
          description: `Live music at ${scrapedEvent.venue}`,
          price: "15.00", // Default price
          isFeatured: false,
          isActive: true,
        }).returning();
        
        const eventId = newEvent[0].id;
        
        // Create event-artist relationships
        for (let i = 0; i < artistIds.length; i++) {
          await db.insert(eventArtists).values({
            eventId: eventId,
            artistId: artistIds[i],
            isHeadliner: i === 0, // First artist is headliner
            order: i,
          });
        }
        
        console.log(`Created event: ${scrapedEvent.title} with ${artistIds.length} artists`);
        importedCount++;
        
      } catch (error) {
        console.error(`Error processing event ${scrapedEvent.title}:`, error);
      }
    }
    
    console.log(`Successfully imported ${importedCount} events`);
    
  } catch (error) {
    console.error("Error importing scraped events:", error);
  }
}

importScrapedEvents().then(() => {
  console.log("Import completed");
  process.exit(0);
}).catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
}); 