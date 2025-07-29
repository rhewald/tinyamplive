import { Buffer } from 'buffer';

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  followers: {
    total: number;
  };
  images: Array<{
    url: string;
    height: number;
    width: number;
  }>;
  external_urls: {
    spotify: string;
  };
}

interface SpotifySearchResult {
  artists: {
    items: SpotifyArtist[];
  };
}

class SpotifyAPI {
  private token: SpotifyToken | null = null;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID!;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Spotify credentials not found');
    }
  }

  private async getAccessToken(): Promise<string> {
    // Check if current token is still valid
    if (this.token && Date.now() < this.token.expires_at) {
      return this.token.access_token;
    }

    // Get new token
    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const tokenData = await response.json() as Omit<SpotifyToken, 'expires_at'>;
    
    this.token = {
      ...tokenData,
      expires_at: Date.now() + (tokenData.expires_in * 1000) - 60000 // 1min buffer
    };

    return this.token.access_token;
  }

  async searchArtist(artistName: string): Promise<SpotifyArtist | null> {
    try {
      const token = await this.getAccessToken();
      
      // First try exact match with quotes
      let response = await fetch(
        `https://api.spotify.com/v1/search?q="${encodeURIComponent(artistName)}"&type=artist&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Spotify search failed: ${response.status}`);
        return null;
      }

      let data = await response.json() as SpotifySearchResult;
      let artists = data.artists.items;

      // If no exact match found, try without quotes but filter strictly
      if (artists.length === 0) {
        response = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=20`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          data = await response.json() as SpotifySearchResult;
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
      console.error('Spotify search error:', error);
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

  async getArtistById(spotifyId: string): Promise<SpotifyArtist | null> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `https://api.spotify.com/v1/artists/${spotifyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Spotify artist fetch failed: ${response.status}`);
        return null;
      }

      return await response.json() as SpotifyArtist;
    } catch (error) {
      console.error('Spotify artist fetch error:', error);
      return null;
    }
  }

  async enrichArtistWithSpotifyData(artistName: string) {
    const spotifyArtist = await this.searchArtist(artistName);
    
    if (!spotifyArtist) {
      return {
        spotifyId: null,
        followers: null,
        monthlyListeners: null,
        imageUrl: null,
        genres: []
      };
    }

    return {
      spotifyId: spotifyArtist.id,
      followers: spotifyArtist.followers.total,
      monthlyListeners: null, // Would need additional API call for monthly listeners
      imageUrl: spotifyArtist.images[0]?.url || null,
      genres: spotifyArtist.genres
    };
  }
}

export const spotifyAPI = new SpotifyAPI();