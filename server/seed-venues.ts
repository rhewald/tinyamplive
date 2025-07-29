import { storage } from "./storage";

const SF_VENUES = [
  {
    name: "The Fillmore",
    slug: "the-fillmore",
    address: "1805 Geary Boulevard",
    neighborhood: "Western Addition",
    capacity: 1150,
    venueType: "historic venue",
    primaryGenres: ["rock", "indie", "alternative", "hip hop"],
    description: "Historic music venue that has hosted legendary artists since 1912.",
    website: "https://www.thefillmore.com",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
  },
  {
    name: "Great American Music Hall",
    slug: "great-american-music-hall",
    address: "859 O'Farrell Street",
    neighborhood: "Tenderloin",
    capacity: 600,
    venueType: "music hall",
    primaryGenres: ["indie", "folk", "jazz", "electronic"],
    description: "Victorian-era music hall featuring intimate performances and ornate decor.",
    website: "https://www.gamh.com",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
  },
  {
    name: "The Warfield",
    slug: "the-warfield",
    address: "982 Market Street",
    neighborhood: "SoMa",
    capacity: 2300,
    venueType: "theater",
    primaryGenres: ["rock", "metal", "punk", "alternative"],
    description: "Historic theater venue in the heart of downtown San Francisco.",
    website: "https://www.thewarfield.com",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"
  },
  {
    name: "The Independent",
    slug: "the-independent",
    address: "628 Divisadero Street",
    neighborhood: "Western Addition",
    capacity: 500,
    venueType: "club",
    primaryGenres: ["indie", "alternative", "folk", "electronic"],
    description: "Intimate venue showcasing emerging and established indie artists.",
    website: "https://www.theindependentsf.com",
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400"
  },
  {
    name: "Café du Nord",
    slug: "cafe-du-nord",
    address: "2170 Market Street",
    neighborhood: "Castro",
    capacity: 300,
    venueType: "speakeasy",
    primaryGenres: ["indie", "folk", "jazz", "acoustic"],
    description: "Historic basement speakeasy turned intimate music venue.",
    website: "https://www.cafedunord.com",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
  },
  {
    name: "Bottom of the Hill",
    slug: "bottom-of-the-hill",
    address: "1233 17th Street",
    neighborhood: "Potrero Hill",
    capacity: 350,
    venueType: "club",
    primaryGenres: ["punk", "indie", "alternative", "garage"],
    description: "Legendary dive venue supporting underground and emerging artists.",
    website: "https://www.bottomofthehill.com",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
  },
  {
    name: "The Chapel",
    slug: "the-chapel",
    address: "777 Valencia Street",
    neighborhood: "Mission",
    capacity: 450,
    venueType: "chapel",
    primaryGenres: ["indie", "folk", "electronic", "world"],
    description: "Converted chapel featuring diverse musical acts and exceptional acoustics.",
    website: "https://www.thechapelsf.com",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"
  },
  {
    name: "Slim's",
    slug: "slims",
    address: "333 11th Street",
    neighborhood: "SoMa",
    capacity: 400,
    venueType: "club",
    primaryGenres: ["blues", "rock", "funk", "soul"],
    description: "Boz Scaggs' legendary venue featuring blues, rock, and soul music.",
    website: "https://www.slimssf.com",
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400"
  },
  {
    name: "The Regency Ballroom",
    slug: "the-regency-ballroom",
    address: "1300 Van Ness Avenue",
    neighborhood: "Civic Center",
    capacity: 2000,
    venueType: "ballroom",
    primaryGenres: ["electronic", "dance", "hip hop", "pop"],
    description: "Grand ballroom hosting major touring acts and dance events.",
    website: "https://www.theregencyballroom.com",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
  },
  {
    name: "The Rickshaw Stop",
    slug: "the-rickshaw-stop",
    address: "155 Fell Street",
    neighborhood: "Hayes Valley",
    capacity: 200,
    venueType: "club",
    primaryGenres: ["experimental", "electronic", "indie", "avant-garde"],
    description: "Eclectic venue showcasing experimental and underground music.",
    website: "https://www.rickshawstop.com",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
  },
  {
    name: "August Hall",
    slug: "august-hall",
    address: "420 Mason Street",
    neighborhood: "Union Square",
    capacity: 600,
    venueType: "hall",
    primaryGenres: ["electronic", "hip hop", "pop", "dance"],
    description: "Modern venue in the heart of downtown featuring contemporary acts.",
    website: "https://www.augusthallsf.com",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"
  },
  {
    name: "The Independent",
    slug: "the-independent-sf",
    address: "628 Divisadero Street",
    neighborhood: "Western Addition",
    capacity: 500,
    venueType: "club",
    primaryGenres: ["indie", "alternative", "folk", "electronic"],
    description: "Intimate venue showcasing emerging and established indie artists.",
    website: "https://www.theindependentsf.com",
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400"
  },
  {
    name: "Bimbo's 365 Club",
    slug: "bimbos-365-club",
    address: "1025 Columbus Avenue",
    neighborhood: "North Beach",
    capacity: 800,
    venueType: "club",
    primaryGenres: ["jazz", "swing", "indie", "alternative"],
    description: "Historic supper club with art deco styling and intimate atmosphere.",
    website: "https://www.bimbos365club.com",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
  },
  {
    name: "The Masonic",
    slug: "the-masonic",
    address: "1111 California Street",
    neighborhood: "Nob Hill",
    capacity: 3000,
    venueType: "auditorium",
    primaryGenres: ["rock", "pop", "alternative", "comedy"],
    description: "Historic Masonic auditorium hosting major touring acts.",
    website: "https://www.themasonic.com",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
  },
  {
    name: "DNA Lounge",
    slug: "dna-lounge",
    address: "375 11th Street",
    neighborhood: "SoMa",
    capacity: 400,
    venueType: "nightclub",
    primaryGenres: ["electronic", "goth", "industrial", "dance"],
    description: "Legendary alternative nightclub and music venue since 1985.",
    website: "https://www.dnalounge.com",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"
  },
  {
    name: "Thee Parkside",
    slug: "thee-parkside",
    address: "1600 17th Street",
    neighborhood: "Potrero Hill",
    capacity: 200,
    venueType: "bar",
    primaryGenres: ["indie", "punk", "garage", "alternative"],
    description: "Neighborhood bar and venue supporting local and touring bands.",
    website: "https://www.theeparkside.com",
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400"
  },
  {
    name: "The Knockout",
    slug: "the-knockout",
    address: "3223 Mission Street",
    neighborhood: "Mission",
    capacity: 150,
    venueType: "bar",
    primaryGenres: ["punk", "garage", "indie", "rockabilly"],
    description: "Dive bar with back room stage featuring punk and garage bands.",
    website: "https://www.theknockoutsf.com",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400"
  },
  {
    name: "El Rio",
    slug: "el-rio",
    address: "3158 Mission Street",
    neighborhood: "Mission",
    capacity: 300,
    venueType: "patio bar",
    primaryGenres: ["latin", "world", "indie", "electronic"],
    description: "Outdoor patio bar featuring diverse music and cultural events.",
    website: "https://www.elriosf.com",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"
  },
  {
    name: "The Make-Out Room",
    slug: "the-make-out-room",
    address: "3225 22nd Street",
    neighborhood: "Mission",
    capacity: 100,
    venueType: "bar",
    primaryGenres: ["indie", "folk", "experimental", "acoustic"],
    description: "Intimate neighborhood bar with eclectic live music programming.",
    website: "https://www.makeoutroom.com",
    imageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"
  },
  {
    name: "The Saloon",
    slug: "the-saloon",
    address: "1232 Grant Avenue",
    neighborhood: "North Beach",
    capacity: 80,
    venueType: "saloon",
    primaryGenres: ["blues", "jazz", "country", "folk"],
    description: "Historic Old West saloon featuring blues and country music.",
    website: "https://www.thesaloonsf.com",
    imageUrl: "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=400"
  }
];

export async function seedSFVenues() {
  console.log('Seeding San Francisco venues...');
  
  try {
    for (const venueData of SF_VENUES) {
      // Check if venue already exists
      const existingVenue = await storage.getVenueBySlug(venueData.slug);
      
      if (!existingVenue) {
        await storage.createVenue(venueData);
        console.log(`Created venue: ${venueData.name}`);
      } else {
        console.log(`Venue already exists: ${venueData.name}`);
      }
    }
    
    console.log(`Venue seeding completed. Total venues processed: ${SF_VENUES.length}`);
  } catch (error) {
    console.error('Error seeding venues:', error);
    throw error;
  }
}