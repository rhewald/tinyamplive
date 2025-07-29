interface LastFmArtist {
  name: string;
  url: string;
  image: Array<{
    '#text': string;
    size: 'small' | 'medium' | 'large' | 'extralarge' | 'mega';
  }>;
  bio?: {
    summary: string;
    content: string;
  };
  tags?: {
    tag: Array<{
      name: string;
      count: number;
      url: string;
    }>;
  };
}

interface LastFmSearchResponse {
  results: {
    artistmatches: {
      artist: LastFmArtist[];
    };
  };
}

interface LastFmArtistInfoResponse {
  artist: LastFmArtist;
}

class LastFmAPI {
  private apiKey: string = 'YOUR_LASTFM_API_KEY_HERE'; // Free API key needed
  private baseUrl = 'https://ws.audioscrobbler.com/2.0/';

  async searchArtist(artistName: string): Promise<LastFmArtist | null> {
    try {
      const searchUrl = `${this.baseUrl}?method=artist.search&artist=${encodeURIComponent(artistName)}&api_key=${this.apiKey}&format=json&limit=1`;
      
      const response = await fetch(searchUrl);
      if (!response.ok) {
        console.error(`Last.fm search failed: ${response.status}`);
        return null;
      }

      const data: LastFmSearchResponse = await response.json();
      
      if (data.results?.artistmatches?.artist?.length > 0) {
        return data.results.artistmatches.artist[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error searching Last.fm:', error);
      return null;
    }
  }

  async getArtistInfo(artistName: string): Promise<LastFmArtist | null> {
    try {
      const infoUrl = `${this.baseUrl}?method=artist.getinfo&artist=${encodeURIComponent(artistName)}&api_key=${this.apiKey}&format=json`;
      
      const response = await fetch(infoUrl);
      if (!response.ok) {
        console.error(`Last.fm artist info failed: ${response.status}`);
        return null;
      }

      const data: LastFmArtistInfoResponse = await response.json();
      return data.artist || null;
    } catch (error) {
      console.error('Error fetching Last.fm artist info:', error);
      return null;
    }
  }

  async getArtistImage(artistName: string): Promise<string | null> {
    try {
      const artist = await this.getArtistInfo(artistName);
      if (!artist?.image) return null;

      // Get the largest available image
      const images = artist.image.filter(img => img['#text'] && img['#text'].trim() !== '');
      if (images.length === 0) return null;

      // Prefer larger sizes
      const sizeOrder = ['mega', 'extralarge', 'large', 'medium', 'small'];
      for (const size of sizeOrder) {
        const image = images.find(img => img.size === size);
        if (image) return image['#text'];
      }

      // Return any available image
      return images[0]['#text'];
    } catch (error) {
      console.error('Error getting Last.fm artist image:', error);
      return null;
    }
  }

  async enrichArtistWithLastFmData(artistName: string) {
    try {
      const artist = await this.getArtistInfo(artistName);
      if (!artist) return null;

      const imageUrl = artist.image?.find(img => 
        img.size === 'extralarge' || img.size === 'large'
      )?.['#text'] || null;

      const genres = artist.tags?.tag?.slice(0, 3).map(tag => tag.name) || [];

      return {
        name: artist.name,
        imageUrl,
        bio: artist.bio?.summary || null,
        genres,
        lastFmUrl: artist.url
      };
    } catch (error) {
      console.error('Error enriching artist with Last.fm data:', error);
      return null;
    }
  }
}

export const lastFmAPI = new LastFmAPI();