import { db } from './db';
import { artists, events } from '../shared/schema';
import { eq, isNull, or } from 'drizzle-orm';

interface SpotifyArtist {
  id: string;
  name: string;
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  followers: {
    total: number;
  };
  genres: string[];
  popularity: number;
  external_urls: {
    spotify: string;
  };
}

interface SpotifySearchResponse {
  artists: {
    items: SpotifyArtist[];
  };
}

export class SpotifyImageEnricher {
  private clientId = process.env.SPOTIFY_CLIENT_ID;
  private clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  private accessToken: string | null = null;
  private tokenExpires: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpires) {
      return this.accessToken;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify credentials not configured');
    }

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Failed to get Spotify access token: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpires = Date.now() + (data.expires_in * 1000) - 60000; // Subtract 1 minute for safety

    return this.accessToken;
  }

  private async searchArtist(artistName: string): Promise<SpotifyArtist | null> {
    try {
      const token = await this.getAccessToken();
      
      // First try exact match with quotes
      let response = await fetch(`https://api.spotify.com/v1/search?q="${encodeURIComponent(artistName)}"&type=artist&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error(`Spotify API error for ${artistName}: ${response.statusText}`);
        return null;
      }

      let data: SpotifySearchResponse = await response.json();
      let artists = data.artists.items;

      // If no exact match found, try without quotes but filter strictly  
      if (artists.length === 0) {
        response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=20`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          data = await response.json();
          artists = data.artists.items;
        }
      }

      // Find exact name match (case insensitive)
      const exactMatch = artists.find(artist => 
        artist.name.toLowerCase() === artistName.toLowerCase()
      );

      if (exactMatch) {
        console.log(`✓ Found exact Spotify match for "${artistName}": "${exactMatch.name}"`);
        return exactMatch;
      }

      // If no exact match, only use very similar matches (90%+ similarity)
      for (const artist of artists) {
        const similarity = this.calculateSimilarity(
          artist.name.toLowerCase(),
          artistName.toLowerCase()
        );
        
        if (similarity > 0.90) {
          console.log(`✓ Found similar Spotify match for "${artistName}": "${artist.name}" (${Math.round(similarity * 100)}% match)`);
          return artist;
        }
      }

      console.log(`No sufficiently similar Spotify match found for: ${artistName}`);
      return null;
    } catch (error) {
      console.error(`Error searching for artist ${artistName}:`, error);
      return null;
    }
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(null));

    for (let i = 0; i <= len1; i++) matrix[0][i] = i;
    for (let j = 0; j <= len2; j++) matrix[j][0] = j;

    for (let j = 1; j <= len2; j++) {
      for (let i = 1; i <= len1; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    const distance = matrix[len2][len1];
    return 1 - distance / Math.max(len1, len2);
  }

  async enrichArtistWithSpotifyData(artistId: number, artistName: string): Promise<boolean> {
    try {
      const spotifyArtist = await this.searchArtist(artistName);
      
      if (!spotifyArtist) {
        return false;
      }

      const imageUrl = spotifyArtist.images.length > 0 ? spotifyArtist.images[0].url : null;
      const genre = spotifyArtist.genres.length > 0 ? spotifyArtist.genres[0] : null;

      await db.update(artists)
        .set({
          imageUrl: imageUrl || undefined,
          spotifyId: spotifyArtist.id,
          followers: spotifyArtist.followers.total,
          genre: genre || undefined
        })
        .where(eq(artists.id, artistId));

      console.log(`✓ Enriched ${artistName} with Spotify data: ${imageUrl ? 'image added' : 'no image'}`);
      return true;
    } catch (error) {
      console.error(`Error enriching artist ${artistName}:`, error);
      return false;
    }
  }

  async enrichAllArtistsWithImages(): Promise<{
    processed: number;
    enriched: number;
    failed: number;
  }> {
    console.log('Starting Spotify image enrichment for all artists...');
    
    // Get all artists without images
    const artistsWithoutImages = await db.query.artists.findMany({
      where: or(
        isNull(artists.imageUrl),
        eq(artists.imageUrl, '')
      )
    });

    console.log(`Found ${artistsWithoutImages.length} artists without images`);

    let processed = 0;
    let enriched = 0;
    let failed = 0;

    for (const artist of artistsWithoutImages) {
      try {
        const success = await this.enrichArtistWithSpotifyData(artist.id, artist.name);
        
        if (success) {
          enriched++;
        } else {
          failed++;
        }

        processed++;

        // Rate limiting - Spotify allows 100 requests per minute
        if (processed % 50 === 0) {
          console.log(`Progress: ${processed}/${artistsWithoutImages.length} artists processed`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay every 50 requests
        }

      } catch (error) {
        console.error(`Failed to process artist ${artist.name}:`, error);
        failed++;
        processed++;
      }
    }

    console.log(`Spotify enrichment completed: ${enriched} enriched, ${failed} failed, ${processed} total processed`);
    
    return {
      processed,
      enriched, 
      failed
    };
  }

  async enrichNewArtist(artistName: string): Promise<string | null> {
    try {
      const spotifyArtist = await this.searchArtist(artistName);
      
      if (!spotifyArtist || spotifyArtist.images.length === 0) {
        return null;
      }

      return spotifyArtist.images[0].url;
    } catch (error) {
      console.error(`Error fetching image for new artist ${artistName}:`, error);
      return null;
    }
  }
}

export const spotifyImageEnricher = new SpotifyImageEnricher();