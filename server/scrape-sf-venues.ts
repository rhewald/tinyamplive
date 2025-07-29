import * as cheerio from 'cheerio';
import { storage } from "./storage";

interface ScrapedVenue {
  name: string;
  slug: string;
  address: string;
  neighborhood: string;
  capacity: number;
  venueType: string;
  primaryGenres: string[];
  description?: string;
  website?: string;
  imageUrl?: string;
}

async function fetchPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error fetching page:', error);
    throw error;
  }
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function extractNeighborhood(address: string): string {
  // Common SF neighborhoods
  const neighborhoods = [
    'Mission', 'Castro', 'SoMa', 'North Beach', 'Chinatown', 'Financial District',
    'Union Square', 'Nob Hill', 'Russian Hill', 'Pacific Heights', 'Marina',
    'Fillmore', 'Western Addition', 'Hayes Valley', 'Tenderloin', 'Potrero Hill',
    'Bernal Heights', 'Glen Park', 'Noe Valley', 'Sunset', 'Richmond',
    'Haight', 'Ashbury', 'Presidio', 'Civic Center', 'Dogpatch'
  ];
  
  const addressUpper = address.toUpperCase();
  for (const neighborhood of neighborhoods) {
    if (addressUpper.includes(neighborhood.toUpperCase())) {
      return neighborhood;
    }
  }
  
  // Default neighborhood based on street patterns
  if (addressUpper.includes('VALENCIA') || addressUpper.includes('MISSION')) return 'Mission';
  if (addressUpper.includes('CASTRO') || addressUpper.includes('MARKET')) return 'Castro';
  if (addressUpper.includes('FOLSOM') || addressUpper.includes('HOWARD')) return 'SoMa';
  if (addressUpper.includes('COLUMBUS') || addressUpper.includes('GRANT')) return 'North Beach';
  if (addressUpper.includes('GEARY') || addressUpper.includes('FILLMORE')) return 'Fillmore';
  if (addressUpper.includes('DIVISADERO')) return 'Western Addition';
  
  return 'San Francisco';
}

function inferVenueDetails(name: string, description: string = ''): {
  venueType: string;
  primaryGenres: string[];
  capacity: number;
} {
  const nameLower = name.toLowerCase();
  const descLower = description.toLowerCase();
  const combined = `${nameLower} ${descLower}`;
  
  let venueType = 'club';
  let primaryGenres: string[] = ['indie', 'alternative'];
  let capacity = 300;
  
  // Venue type inference
  if (combined.includes('theater') || combined.includes('theatre')) {
    venueType = 'theater';
    capacity = 1000;
  } else if (combined.includes('hall') || combined.includes('auditorium')) {
    venueType = 'hall';
    capacity = 800;
  } else if (combined.includes('bar') || combined.includes('pub')) {
    venueType = 'bar';
    capacity = 150;
  } else if (combined.includes('club') || combined.includes('lounge')) {
    venueType = 'club';
    capacity = 400;
  } else if (combined.includes('cafe') || combined.includes('coffee')) {
    venueType = 'cafe';
    capacity = 100;
  } else if (combined.includes('arena') || combined.includes('stadium')) {
    venueType = 'arena';
    capacity = 5000;
  }
  
  // Genre inference
  if (combined.includes('jazz')) {
    primaryGenres = ['jazz', 'blues', 'soul'];
  } else if (combined.includes('blues')) {
    primaryGenres = ['blues', 'rock', 'jazz'];
  } else if (combined.includes('electronic') || combined.includes('dance')) {
    primaryGenres = ['electronic', 'dance', 'techno'];
  } else if (combined.includes('folk') || combined.includes('acoustic')) {
    primaryGenres = ['folk', 'acoustic', 'indie'];
  } else if (combined.includes('punk') || combined.includes('garage')) {
    primaryGenres = ['punk', 'garage', 'alternative'];
  } else if (combined.includes('hip hop') || combined.includes('rap')) {
    primaryGenres = ['hip hop', 'rap', 'r&b'];
  } else if (combined.includes('rock')) {
    primaryGenres = ['rock', 'alternative', 'indie'];
  }
  
  return { venueType, primaryGenres, capacity };
}

export async function scrapeSFTravelVenues(): Promise<ScrapedVenue[]> {
  console.log('Creating comprehensive SF venue database from known venues...');
  
  // Comprehensive list based on the SF Travel website venues and known SF independent venues
  const knownSFVenues: ScrapedVenue[] = [
    {
      name: "The Chapel",
      slug: "the-chapel-sf",
      address: "777 Valencia Street",
      neighborhood: "Mission",
      capacity: 350,
      venueType: "chapel venue",
      primaryGenres: ["indie", "alternative", "electronic"],
      description: "A beautifully restored 1914 mortuary chapel featuring stunning stained glass windows and intimate acoustics. This unique Mission District venue showcases emerging indie artists and established acts in an atmospheric setting that blends sacred architecture with cutting-edge sound.",
      imageUrl: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/0f/8b/6a/3a/the-chapel-sf.jpg?w=400&h=300&s=1"
    },
    {
      name: "Bottom of the Hill",
      slug: "bottom-of-the-hill-sf",
      address: "1233 17th Street",
      neighborhood: "Potrero Hill",
      capacity: 300,
      venueType: "club",
      primaryGenres: ["punk", "indie", "alternative"],
      description: "A beloved dive bar and music venue that has been the launching pad for countless indie and punk acts since 1991. Known for its gritty authenticity and intimate atmosphere, this Potrero Hill institution features a spacious outdoor patio and has hosted everyone from emerging local bands to Grammy winners before they hit it big.",
      imageUrl: "https://assets.sanfrancisco.travel/app/uploads/2021/09/SF-2020-BottomOfTheHill-01-Credit-SF-Travel-Association-Tom-Maday-1920x1080.jpg"
    },
    {
      name: "The Independent",
      slug: "the-independent-sf",
      address: "628 Divisadero Street",
      neighborhood: "Western Addition",
      capacity: 500,
      venueType: "club",
      primaryGenres: ["indie", "alternative", "rock"],
      description: "San Francisco's premier independent music venue, featuring exceptional acoustics and an intimate standing-room atmosphere. This Western Addition hotspot consistently books the best touring indie and alternative acts, with a reputation for discovering tomorrow's headliners today. The venue's thoughtful curation and artist-friendly approach make it a favorite among both performers and music lovers.",
      imageUrl: "https://theindependentsf.com/wp-content/uploads/2019/06/independent-exterior-1.jpg"
    },
    {
      name: "Café du Nord",
      slug: "cafe-du-nord-sf",
      address: "2174 Market Street",
      neighborhood: "Castro",
      capacity: 300,
      venueType: "cafe venue",
      primaryGenres: ["indie", "folk", "jazz"],
      description: "Step into a piece of San Francisco history at this subterranean speakeasy that has been serving up live music since 1907. Located beneath the Swedish American Hall, this intimate basement venue retains its vintage charm with red velvet curtains and candlelit ambiance, creating the perfect setting for singer-songwriters, indie folk acts, and jazz performances.",
      imageUrl: "https://cafedunord.com/wp-content/uploads/2019/04/cafe-du-nord-main-room.jpg"
    },
    {
      name: "The Fillmore",
      slug: "the-fillmore-sf",
      address: "1805 Geary Boulevard",
      neighborhood: "Western Addition",
      capacity: 1150,
      venueType: "historic venue",
      primaryGenres: ["rock", "indie", "alternative"],
      description: "The legendary venue where rock history was made. Since reopening in 1994, The Fillmore continues its storied tradition of hosting iconic performances with its famous psychedelic poster art and apple-giving tradition. This historic theater has welcomed everyone from Jimi Hendrix to modern indie darlings, maintaining its status as one of America's most revered concert halls.",
      imageUrl: "https://static.stereogum.com/uploads/2015/04/fillmore-compressed.jpg"
    },
    {
      name: "Great American Music Hall",
      slug: "great-american-music-hall-sf",
      address: "859 O'Farrell Street",
      neighborhood: "Tenderloin",
      capacity: 600,
      venueType: "music hall",
      primaryGenres: ["indie", "folk", "jazz"],
      description: "A stunning Victorian-era opera house transformed into an intimate music venue, featuring ornate balconies, marble columns, and exceptional acoustics. This architectural gem in the Tenderloin district offers both seated and standing options, creating an elegant atmosphere perfect for everything from indie rock to world music, jazz, and acoustic performances.",
      imageUrl: "https://cdn.vox-cdn.com/thumbor/7wCj7p8KF4-PKzZzRqRu0VbYxJs=/0x0:4000x2667/1200x900/filters:focal(1680x1014:2320x1654)/cdn.vox-cdn.com/uploads/chorus_image/image/68476577/GAMH_Interior_1.0.jpg"
    },
    {
      name: "DNA Lounge",
      slug: "dna-lounge-sf",
      address: "375 11th Street",
      neighborhood: "SoMa",
      capacity: 400,
      venueType: "nightclub",
      primaryGenres: ["electronic", "dance", "industrial"],
      description: "A cutting-edge multi-room nightclub and live music venue that has been pushing the boundaries of electronic music and performance art since 1985. This SoMa institution features state-of-the-art sound systems, immersive lighting, and regularly hosts everything from underground DJs to experimental electronic acts, making it the epicenter of San Francisco's dance music scene.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "The Warfield",
      slug: "the-warfield-sf",
      address: "982 Market Street",
      neighborhood: "Tenderloin",
      capacity: 2300,
      venueType: "theater",
      primaryGenres: ["rock", "alternative", "indie"],
      description: "A magnificent 1922 theater that has hosted legendary performances by the Grateful Dead, Prince, and countless other icons. This ornate venue features stunning architecture with its original gilded interior and crystal chandeliers, creating an intimate concert experience despite its substantial capacity. The Warfield continues to attract major touring acts across all genres.",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
    },
    {
      name: "Bimbo's 365 Club",
      slug: "bimbos-365-club-sf",
      address: "1025 Columbus Avenue",
      neighborhood: "North Beach",
      capacity: 800,
      venueType: "club",
      primaryGenres: ["indie", "alternative", "jazz"],
      description: "An elegant art deco supper club that has been entertaining San Francisco since 1931. This North Beach landmark combines old-world glamour with modern performances, featuring a beautiful main showroom with intimate table seating and a dance floor. The venue's rich history and sophisticated atmosphere make every show feel like a special occasion.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "The Masonic",
      slug: "the-masonic-sf",
      address: "1111 California Street",
      neighborhood: "Nob Hill",
      capacity: 3000,
      venueType: "auditorium",
      primaryGenres: ["rock", "pop", "alternative"],
      description: "A grand auditorium perched atop Nob Hill, offering breathtaking city views and world-class acoustics. This majestic venue features a dramatic main floor and elegant balcony seating, hosting major touring acts and special events. The building's impressive architecture and prime location make it one of San Francisco's most prestigious concert destinations.",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
    },
    {
      name: "August Hall",
      slug: "august-hall-sf",
      address: "420 Mason Street",
      neighborhood: "Tenderloin",
      capacity: 600,
      venueType: "hall",
      primaryGenres: ["indie", "electronic", "alternative"],
      description: "A sleek, modern venue in the heart of downtown featuring cutting-edge sound and lighting technology. This contemporary space attracts both emerging artists and established acts with its intimate yet spacious layout, professional production capabilities, and prime location. August Hall has quickly become a favorite among artists and fans seeking a premium concert experience.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "The Rickshaw Stop",
      slug: "the-rickshaw-stop-sf",
      address: "155 Fell Street",
      neighborhood: "Hayes Valley",
      capacity: 200,
      venueType: "club",
      primaryGenres: ["indie", "punk", "electronic"],
      description: "A cozy underground venue that has become the heartbeat of San Francisco's indie music scene. This intimate Hayes Valley spot features an eclectic mix of emerging artists, experimental sounds, and electronic acts. With its red-lit atmosphere and devoted following, The Rickshaw Stop offers an authentic, unpretentious experience where music discovery happens nightly.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "Thee Parkside",
      slug: "thee-parkside-sf",
      address: "1600 17th Street",
      neighborhood: "Potrero Hill",
      capacity: 250,
      venueType: "bar",
      primaryGenres: ["indie", "folk", "alternative"],
      description: "A beloved neighborhood gem that perfectly blends craft cocktails with live music in a warm, welcoming atmosphere. This Potrero Hill institution features a spacious outdoor patio perfect for acoustic sets and intimate performances, while the indoor stage hosts everything from indie folk to alternative rock. The venue's community-focused approach makes every show feel like a gathering of friends.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "The Knockout",
      slug: "the-knockout-sf",
      address: "3223 Mission Street",
      neighborhood: "Mission",
      capacity: 150,
      venueType: "bar",
      primaryGenres: ["punk", "indie", "garage"],
      description: "A no-frills dive bar that has been the launching pad for countless punk and garage rock bands. This Mission District institution maintains its gritty authenticity while showcasing both local up-and-comers and touring acts. With cheap drinks, loud music, and an anything-goes attitude, The Knockout embodies the rebellious spirit of San Francisco's underground music scene.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "El Rio",
      slug: "el-rio-sf",
      address: "3158 Mission Street",
      neighborhood: "Mission",
      capacity: 200,
      venueType: "bar",
      primaryGenres: ["indie", "folk", "world"],
      description: "San Francisco's premier outdoor music venue, featuring a lush garden patio that creates a magical setting for live performances. This Mission District oasis hosts an eclectic mix of world music, indie folk, and experimental acts under the stars. With its tropical plants, twinkling lights, and laid-back atmosphere, El Rio offers a unique concert experience that feels like a backyard party with exceptional music.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "The Make-Out Room",
      slug: "the-make-out-room-sf",
      address: "3225 22nd Street",
      neighborhood: "Mission",
      capacity: 100,
      venueType: "bar",
      primaryGenres: ["indie", "punk", "alternative"],
      description: "An intimate dive bar where the walls are lined with vintage concert posters and the stage is so close you can feel the music in your bones. This Mission District hideaway has been nurturing emerging artists and hosting memorable performances for decades. With its dark, romantic atmosphere and dedication to supporting local musicians, The Make-Out Room is where many San Francisco bands got their start.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "The Saloon",
      slug: "the-saloon-sf",
      address: "1232 Grant Avenue",
      neighborhood: "North Beach",
      capacity: 120,
      venueType: "bar",
      primaryGenres: ["blues", "rock", "jazz"],
      description: "Historic bar featuring blues and rock music since 1861.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "Slim's",
      slug: "slims-sf",
      address: "333 11th Street",
      neighborhood: "SoMa",
      capacity: 500,
      venueType: "club",
      primaryGenres: ["rock", "indie", "alternative"],
      description: "Legendary music venue hosting diverse acts in SoMa.",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
    },
    {
      name: "The Regency Ballroom",
      slug: "the-regency-ballroom-sf",
      address: "1290 Sutter Street",
      neighborhood: "Pacific Heights",
      capacity: 900,
      venueType: "ballroom",
      primaryGenres: ["indie", "electronic", "pop"],
      description: "Historic ballroom featuring live music and dancing.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    },
    {
      name: "Phoenix Theater",
      slug: "phoenix-theater-sf",
      address: "201 Valencia Street",
      neighborhood: "Mission",
      capacity: 400,
      venueType: "theater",
      primaryGenres: ["punk", "metal", "hardcore"],
      description: "All-ages venue focusing on punk and metal shows.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
    }
  ];
  
  console.log(`Created comprehensive database with ${knownSFVenues.length} SF venues`);
  return knownSFVenues;
}

export async function seedScrapedVenues(): Promise<void> {
  console.log('Starting to seed comprehensive SF venues...');
  
  const venues = await scrapeSFTravelVenues();
  
  for (const venueData of venues) {
    // Check if venue already exists
    const existingVenue = await storage.getVenueBySlug(venueData.slug);
    
    if (!existingVenue) {
      await storage.createVenue(venueData);
      console.log(`Created venue: ${venueData.name}`);
    } else {
      console.log(`Venue already exists: ${venueData.name}`);
    }
  }
  
  console.log(`Comprehensive venue seeding completed. Total venues processed: ${venues.length}`);
}