import { db } from "./db";
import { users, venues, artists, events } from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding database...");

  // Clear existing data
  await db.delete(events);
  await db.delete(artists);
  await db.delete(venues);
  await db.delete(users);

  // Seed venues
  const venueData = [
    {
      slug: "the-independent",
      name: "The Independent",
      neighborhood: "The Fillmore",
      address: "628 Divisadero St, San Francisco, CA 94117",
      capacity: 500,
      venueType: "Music Venue",
      primaryGenres: ["Indie Rock", "Alternative", "Electronic"],
      description: "Intimate venue in the heart of The Fillmore district, known for showcasing emerging indie artists.",
      website: "https://www.theindependentsf.com",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800",
      socialLinks: {
        instagram: "theindependentsf",
        twitter: "theindependentsf",
        facebook: "theindependentsf"
      }
    },
    {
      slug: "the-fillmore",
      name: "The Fillmore",
      neighborhood: "The Fillmore",
      address: "1805 Geary Blvd, San Francisco, CA 94115",
      capacity: 1150,
      venueType: "Historic Theater",
      primaryGenres: ["Rock", "Blues", "Jazz", "Indie"],
      description: "Historic venue that has hosted legendary performances since 1912.",
      website: "https://www.thefillmore.com",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800",
      socialLinks: {
        instagram: "thefillmore",
        twitter: "thefillmore",
        facebook: "thefillmore"
      }
    },
    {
      slug: "cafe-du-nord",
      name: "Cafe du Nord",
      neighborhood: "Castro",
      address: "2174 Market St, San Francisco, CA 94114",
      capacity: 300,
      venueType: "Basement Club",
      primaryGenres: ["Folk", "Indie Folk", "Acoustic"],
      description: "Intimate basement venue perfect for acoustic performances and intimate shows.",
      website: "https://www.cafedunord.com",
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800",
      socialLinks: {
        instagram: "cafedunordsf",
        twitter: "cafedunordsf",
        facebook: "cafedunordsf"
      }
    },
    {
      slug: "1015-folsom",
      name: "1015 Folsom",
      neighborhood: "SOMA",
      address: "1015 Folsom St, San Francisco, CA 94103",
      capacity: 800,
      venueType: "Nightclub",
      primaryGenres: ["Electronic", "House", "Techno"],
      description: "Multi-level nightclub featuring electronic music and dance events.",
      website: "https://www.1015.com",
      imageUrl: "https://images.unsplash.com/photo-1571266028243-d220c2ccb949?w=800",
      socialLinks: {
        instagram: "1015folsom",
        twitter: "1015folsom",
        facebook: "1015folsom"
      }
    }
  ];

  const insertedVenues = await db.insert(venues).values(venueData).returning();
  console.log(`Inserted ${insertedVenues.length} venues`);

  // Seed artists
  const artistData = [
    {
      slug: "echo-rivers",
      name: "Echo Rivers",
      genre: "Indie Folk",
      location: "San Francisco, CA",
      description: "Dreamy indie folk with ethereal vocals and intricate guitar work.",
      imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
      monthlyListeners: 12500,
      followers: 8200,
      spotifyId: "echo_rivers_sf",
      youtubeChannelId: "UCechoriverssf",
      socialLinks: {
        instagram: "echoriverssf",
        twitter: "echoriverssf",
        tiktok: "echoriverssf",
        bandcamp: "echoriverssf",
        soundcloud: "echoriverssf"
      }
    },
    {
      slug: "neon-cascade",
      name: "Neon Cascade",
      genre: "Electronic",
      location: "Oakland, CA",
      description: "Experimental electronic artist pushing the boundaries of sound design.",
      imageUrl: "https://images.unsplash.com/photo-1571266028243-d220c2ccb949?w=400",
      monthlyListeners: 25600,
      followers: 15400,
      spotifyId: "neon_cascade_oak",
      youtubeChannelId: "UCneoncascadeoak",
      socialLinks: {
        instagram: "neoncascadeoak",
        twitter: "neoncascadeoak",
        tiktok: "neoncascadeoak",
        bandcamp: "neoncascadeoak",
        soundcloud: "neoncascadeoak"
      }
    },
    {
      slug: "wild-oak",
      name: "Wild Oak",
      genre: "Folk",
      location: "Berkeley, CA",
      description: "Acoustic folk duo with harmonious vocals and storytelling lyrics.",
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400",
      monthlyListeners: 8900,
      followers: 5600,
      spotifyId: "wild_oak_berkeley",
      youtubeChannelId: "UCwildoakberkeley",
      socialLinks: {
        instagram: "wildoakberkeley",
        twitter: "wildoakberkeley",
        tiktok: "wildoakberkeley",
        bandcamp: "wildoakberkeley",
        soundcloud: "wildoakberkeley"
      }
    },
    {
      slug: "luna-moth",
      name: "Luna Moth",
      genre: "Indie Rock",
      location: "San Francisco, CA",
      description: "Atmospheric indie rock with cinematic soundscapes and powerful vocals.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400",
      monthlyListeners: 18700,
      followers: 12300,
      spotifyId: "luna_moth_sf",
      youtubeChannelId: "UClunamothsf",
      socialLinks: {
        instagram: "lunamothsf",
        twitter: "lunamothsf",
        tiktok: "lunamothsf",
        bandcamp: "lunamothsf",
        soundcloud: "lunamothsf"
      }
    }
  ];

  const insertedArtists = await db.insert(artists).values(artistData).returning();
  console.log(`Inserted ${insertedArtists.length} artists`);

  // Seed events
  const eventData = [
    {
      slug: "luna-moth-live",
      title: "Luna Moth Live",
      date: new Date("2024-12-20T20:00:00"),
      artistId: insertedArtists.find(a => a.slug === "luna-moth")!.id,
      venueId: insertedVenues.find(v => v.slug === "the-independent")!.id,
      openingActs: [insertedArtists.find(a => a.slug === "wild-oak")!.id],
      description: "An intimate evening of atmospheric indie rock with Luna Moth's signature cinematic sound.",
      imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600",
      doors: new Date("2024-12-20T19:00:00"),
      showTime: new Date("2024-12-20T20:30:00"),
      ticketUrl: "https://tickets.example.com/luna-moth",
      isActive: true,
      isFeatured: true,
      tags: ["indie rock", "atmospheric", "live music"]
    },
    {
      slug: "neon-cascade-electronic-experience",
      title: "Neon Cascade Electronic Experience",
      date: new Date("2024-12-22T22:00:00"),
      artistId: insertedArtists.find(a => a.slug === "neon-cascade")!.id,
      venueId: insertedVenues.find(v => v.slug === "1015-folsom")!.id,
      openingActs: [],
      description: "A mind-bending electronic journey through experimental soundscapes.",
      imageUrl: "https://images.unsplash.com/photo-1571266028243-d220c2ccb949?w=600",
      doors: new Date("2024-12-22T21:00:00"),
      showTime: new Date("2024-12-22T22:30:00"),
      ticketUrl: "https://tickets.example.com/neon-cascade",
      isActive: true,
      isFeatured: true,
      tags: ["electronic", "experimental", "dance"]
    },
    {
      slug: "wild-oak-acoustic-sessions",
      title: "Wild Oak Acoustic Sessions",
      date: new Date("2024-12-18T19:30:00"),
      artistId: insertedArtists.find(a => a.slug === "wild-oak")!.id,
      venueId: insertedVenues.find(v => v.slug === "cafe-du-nord")!.id,
      openingActs: [],
      description: "Intimate acoustic performance featuring new songs and fan favorites.",
      imageUrl: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600",
      doors: new Date("2024-12-18T19:00:00"),
      showTime: new Date("2024-12-18T20:00:00"),
      ticketUrl: "https://tickets.example.com/wild-oak",
      isActive: true,
      isFeatured: false,
      tags: ["folk", "acoustic", "intimate"]
    }
  ];

  const insertedEvents = await db.insert(events).values(eventData).returning();
  console.log(`Inserted ${insertedEvents.length} events`);

  console.log("Database seeded successfully!");
}

// Run if this file is executed directly
seedDatabase().catch(console.error);