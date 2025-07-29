import 'dotenv/config';
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

function extractArtistsFromTitle(title: string): string[] {
  const cleanTitle = title.replace(/ at .*$/, '').trim();
  return [cleanTitle];
}

function parseDate(dateStr: string): Date | null {
  try {
    const cleanDate = dateStr.replace(/\n/g, ' ').trim();
    
    const patterns = [
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\w+)\s+(\d{1,2})\s+(\d{4})/,
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/,
    ];
    
    for (const pattern of patterns) {
      const match = cleanDate.match(pattern);
      if (match) {
        const month = match[1];
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);
        
        const monthMap: { [key: string]: number } = {
          'january': 0, 'jan': 0, 'february': 1, 'feb': 1, 'march': 2, 'mar': 2,
          'april': 3, 'apr': 3, 'may': 4, 'june': 5, 'jun': 5, 'july': 6, 'jul': 6,
          'august': 7, 'aug': 7, 'september': 8, 'sep': 8, 'october': 9, 'oct': 9,
          'november': 10, 'nov': 10, 'december': 11, 'dec': 11,
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

function isValidArtistName(name: string): boolean {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const genericTerms = ['indie', 'pop', 'rock', 'punk', 'folk', 'surf', 'emo', 'shoegaze', 'post', 'metal', 'psychedelic', 'garage', 'alternative', 'americana', 'country', 'jazz', 'swing', 'blues', 'stoner', 'synthwave', 'style', 'music', 'doors', 'advance', 'door', 'over', 'ages', 'pm', 'am'];
  
  const cleanName = name.trim();
  
  if (cleanName.length < 3 || cleanName.length > 50) return false;
  if (dayNames.includes(cleanName) || monthNames.includes(cleanName)) return false;
  if (genericTerms.some(term => cleanName.toLowerCase().includes(term))) return false;
  if (cleanName.match(/^\d{1,2}:\d{2}/)) return false;
  if (cleanName.match(/^\$\d+/)) return false;
  if (cleanName.includes('AND OVER') || cleanName.includes('ALL AGES')) return false;
  if (cleanName.toLowerCase().includes('bottom of the hill') || 
      cleanName.toLowerCase().includes('the independent') ||
      cleanName.toLowerCase().includes('café du nord') ||
      cleanName.toLowerCase().includes('cafe du nord')) return false;
  if (!cleanName.match(/^[A-Z][a-zA-Z\s]+$/)) return false;
  
  return true;
}

async function importTargetedIndependentEvents() {
  try {
    console.log("Importing targeted Independent events...");
    
    // Read the scraped events file
    const filePath = path.join(__dirname, '../attached_assets/targeted_independent_events.json');
    if (!fs.existsSync(filePath)) {
      console.error('Targeted Independent events file not found. Please run the targeted scraper first.');
      return;
    }
    
    const scrapedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`Found ${scrapedData.length} scraped events`);
    
    // Get existing venues and artists
    const existingVenues = await db.select().from(venues);
    const existingArtists = await db.select().from(artists);
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const eventData of scrapedData) {
      try {
        const eventDate = parseDate(eventData.date);
        if (!eventDate) {
          console.log(`Skipping event with invalid date: ${eventData.title}`);
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
        const venue = existingVenues.find(v => v.slug === eventData.venue_slug);
        if (!venue) {
          console.log(`Venue not found: ${eventData.venue_slug}`);
          skippedCount++;
          continue;
        }
        
        // Extract artists from title
        const artistNames = extractArtistsFromTitle(eventData.title);
        if (artistNames.length === 0) {
          console.log(`No valid artists found for: ${eventData.title}`);
          skippedCount++;
          continue;
        }
        
        // Filter valid artist names
        const validArtistNames = artistNames.filter(name => isValidArtistName(name));
        if (validArtistNames.length === 0) {
          console.log(`No valid artist names for: ${eventData.title}`);
          skippedCount++;
          continue;
        }
        
        // Check for existing event with same title and date
        const existingEvents = await db.select()
          .from(events)
          .where(
            eq(events.title, eventData.title)
          );
        
        if (existingEvents.length > 0) {
          console.log(`Skipping duplicate event: ${eventData.title}`);
          skippedCount++;
          continue;
        }
        
        // Create or find artists
        const artistIds: number[] = [];
        
        for (const artistName of validArtistNames) {
          let artistId: number;
          
          const existingArtist = existingArtists.find(a => 
            a.name.toLowerCase() === artistName.toLowerCase()
          );
          
          if (existingArtist) {
            artistId = existingArtist.id;
          } else {
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
        
        // Create event with unique slug
        const eventSlug = eventData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').substring(0, 50) + '-' + Date.now();
        const newEvent = await db.insert(events).values({
          title: eventData.title.substring(0, 200),
          slug: eventSlug,
          venueId: venue.id,
          date: eventDate,
          description: `Live music at ${eventData.venue}`,
          price: "25.00",
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
        
        console.log(`Created event: ${eventData.title} with ${artistIds.length} artists`);
        importedCount++;
        
      } catch (error) {
        console.error(`Error importing event ${eventData.title}:`, error);
        skippedCount++;
      }
    }
    
    console.log(`Import completed:`);
    console.log(`- Imported: ${importedCount} events`);
    console.log(`- Skipped: ${skippedCount} events`);
    
    // Check final counts
    const finalEvents = await db.select().from(events);
    const finalArtists = await db.select().from(artists);
    const finalRelationships = await db.select().from(eventArtists);
    
    console.log(`Final database counts:`);
    console.log(`- Events: ${finalEvents.length}`);
    console.log(`- Artists: ${finalArtists.length}`);
    console.log(`- Event-Artist relationships: ${finalRelationships.length}`);
    
  } catch (error) {
    console.error("Error importing targeted Independent events:", error);
  }
}

importTargetedIndependentEvents().then(() => {
  console.log("Import completed");
  process.exit(0);
}).catch((error) => {
  console.error("Import failed:", error);
  process.exit(1);
}); 