interface GooglePlaceDetails {
  place_id: string;
  name: string;
  rating: number;
  user_ratings_total: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GooglePlacesSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    rating?: number;
    user_ratings_total?: number;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

interface GooglePlaceDetailsResponse {
  result: GooglePlaceDetails;
  status: string;
}

class GooglePlacesAPI {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google Places API key not found. Venue ratings will not be available.');
    } else {
      console.log(`Google Places API key loaded: ${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`);
    }
  }

  async searchPlace(venueName: string, address?: string): Promise<GooglePlaceDetails | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const query = `${venueName}${address ? ` ${address}` : ''} San Francisco`;
      const searchUrl = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      console.log(`Google Places API request for ${venueName}: ${searchUrl.replace(this.apiKey, 'API_KEY_HIDDEN')}`);
      
      const response = await fetch(searchUrl);
      const data: GooglePlacesSearchResponse = await response.json();
      
      console.log(`Google Places API response status: ${data.status}`);
      
      if (data.status === 'REQUEST_DENIED') {
        console.error('Google Places API: REQUEST_DENIED - Invalid API key or API not enabled');
        throw new Error('Google Places API authentication failed - invalid API key');
      }
      
      if (data.status === 'INVALID_REQUEST') {
        console.error('Google Places API: INVALID_REQUEST - Missing required parameters');
        throw new Error('Google Places API request invalid');
      }

      if (data.status === 'OK' && data.results.length > 0) {
        const place = data.results[0];
        console.log(`Found place: ${place.name} (ID: ${place.place_id})`);
        return await this.getPlaceDetails(place.place_id);
      }
      
      console.log(`No results found for query: ${query}`);
      return null;
    } catch (error) {
      console.error(`Error searching for place ${venueName}:`, error);
      throw error;
    }
  }

  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const detailsUrl = `${this.baseUrl}/details/json?place_id=${placeId}&fields=place_id,name,rating,user_ratings_total,photos,formatted_address,geometry&key=${this.apiKey}`;
      
      const response = await fetch(detailsUrl);
      const data: GooglePlaceDetailsResponse = await response.json();

      if (data.status === 'OK') {
        return data.result;
      }

      return null;
    } catch (error) {
      console.error(`Error fetching place details for ${placeId}:`, error);
      return null;
    }
  }

  async getPhotoUrl(photoReference: string, maxWidth: number = 400): Promise<string | null> {
    if (!this.apiKey) {
      return null;
    }

    return `${this.baseUrl}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }

  async enrichVenueWithGoogleData(venueName: string, address: string) {
    const placeDetails = await this.searchPlace(venueName, address);
    
    if (!placeDetails) {
      return {
        googlePlaceId: null,
        googleRating: null,
        googleReviewCount: null,
        googlePhotos: []
      };
    }

    const photoUrls = [];
    if (placeDetails.photos && placeDetails.photos.length > 0) {
      for (const photo of placeDetails.photos.slice(0, 3)) {
        const photoUrl = await this.getPhotoUrl(photo.photo_reference, 800);
        if (photoUrl) {
          photoUrls.push(photoUrl);
        }
      }
    }

    return {
      googlePlaceId: placeDetails.place_id,
      googleRating: placeDetails.rating || null,
      googleReviewCount: placeDetails.user_ratings_total || null,
      googlePhotos: photoUrls
    };
  }
}

export const googlePlacesAPI = new GooglePlacesAPI();