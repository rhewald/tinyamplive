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
  raw_text?: string;
}

function extractArtistsFromTitle(title: string, rawText?: string): string[] {
  const artists: string[] = [];
  
  // Clean up the title
  let cleanTitle = title.replace(/ at .*$/, '').trim();
  
  // If we have raw text, try to extract better artist names from it
  if (rawText) {
    // Look for patterns like "Artist Name genre" or "Artist Name [co-headlining]"
    const artistPatterns = [
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+\[co-headlining\]/g,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z][a-z\s]+$/gm,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+[A-Z][a-z\s]+(?=\s+at\s+Bottom)/g,
    ];
    
    for (const pattern of artistPatterns) {
      const matches = rawText.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const artistName = match.replace(/\[co-headlining\]/, '').trim();
          if (artistName.length > 2 && !artists.includes(artistName)) {
            artists.push(artistName);
          }
        });
      }
    }
  }
  
  // If no artists found with patterns, use the clean title
  if (artists.length === 0 && cleanTitle.length > 2) {
    // Split by common separators and take the first few meaningful parts
    const parts = cleanTitle.split(/[,\-\+]/).map(part => part.trim()).filter(part => part.length > 2);
    artists.push(...parts.slice(0, 3));
  }
  
  return artists.slice(0, 3); // Limit to 3 artists max
}

function parseDate(dateStr: string): Date | null {
  try {
    const cleanDate = dateStr.replace(/\n/g, ' ').trim();
    
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

async function importAggressiveEvents() {
  try {
    console.log("Importing aggressive events...");
    
    // Read aggressive events
    const scrapedEventsPath = path.join(__dirname, "../attached_assets/aggressive_scraped_events.json");
    const scrapedEvents: ScrapedEvent[] = JSON.parse(fs.readFileSync(scrapedEventsPath, "utf-8"));
    
    console.log(`Found ${scrapedEvents.length} scraped events`);
    
    // Get existing venues and artists
    const existingVenues = await db.select().from(venues);
    const existingArtists = await db.select().from(artists);
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const scrapedEvent of scrapedEvents) {
      try {
        // Parse date
        const eventDate = parseDate(scrapedEvent.date);
        if (!eventDate) {
          skippedCount++;
          continue;
        }
        
        // Skip events that are too far in the past or future
        const now = new Date();
        const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        
        if (eventDate < sixMonthsAgo || eventDate > oneYearFromNow) {
          skippedCount++;
          continue;
        }
        
        // Find venue
        const venue = existingVenues.find(v => v.slug === scrapedEvent.venue_slug);
        if (!venue) {
          console.log(`Venue not found: ${scrapedEvent.venue_slug}`);
          skippedCount++;
          continue;
        }
        
        // Extract artists from title
        const artistNames = extractArtistsFromTitle(scrapedEvent.title, scrapedEvent.raw_text);
        if (artistNames.length === 0) {
          skippedCount++;
          continue;
        }
        
        // Filter out obviously bad artist names
        const validArtistNames = artistNames.filter(name => 
          name.length > 2 && 
          name.length < 50 && 
          !name.includes('PM') && 
          !name.includes('doors') &&
          !name.includes('$') &&
          !name.includes('AND OVER') &&
          !name.includes('ALL AGES') &&
          !name.includes('advance') &&
          !name.includes('door') &&
          !name.includes('Tuesday') &&
          !name.includes('Wednesday') &&
          !name.includes('Thursday') &&
          !name.includes('Friday') &&
          !name.includes('Saturday') &&
          !name.includes('Sunday') &&
          !name.includes('Monday') &&
          !name.includes('July') &&
          !name.includes('August') &&
          !name.includes('September') &&
          !name.includes('October') &&
          !name.includes('November') &&
          !name.includes('December')
        );
        
        if (validArtistNames.length === 0) {
          skippedCount++;
          continue;
        }
        
        console.log(`Processing: ${scrapedEvent.title}`);
        console.log(`Artists: ${validArtistNames.join(', ')}`);
        
        // Create or find artists
        const artistIds: number[] = [];
        for (const artistName of validArtistNames) {
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
          title: scrapedEvent.title.substring(0, 200),
          slug: eventSlug,
          venueId: venue.id,
          date: eventDate,
          description: `Live music at ${scrapedEvent.venue}`,
          price: "15.00",
          isFeatured: false,
          isActive: true,
        }).returning();
        
        const eventId = newEvent[0].id;
        
        // Create event-artist relationships
        for (let i = 0; i < artistIds.length; i++) {
          await db.insert(eventArtists).values({
            eventId: eventId,
            artistId: artistIds[i],
            isHeadliner: i === 0,
            order: i,
          });
        }
        
        console.log(`Created event: ${scrapedEvent.title} with ${artistIds.length} artists`);
        importedCount++;
        
      } catch (error) {
        console.error(`Error processing event ${scrapedEvent.title}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`Successfully imported ${importedCount} events`);
    console.log(`Skipped ${skippedCount} events`);
    
  } catch (error) {
    console.error("Error importing aggressive events:", error);
  }
}

importAggressiveEvents().then(() => {
  console.log("Import completed");
  process.exit(0);
}).catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
}); 