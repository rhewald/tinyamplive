import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VenueImageCarouselProps {
  venueName: string;
  googlePlaceId?: string | null;
  fallbackImage?: string;
  className?: string;
}

interface GooglePlacePhoto {
  photo_reference: string;
  height: number;
  width: number;
}

export default function VenueImageCarousel({ 
  venueName, 
  googlePlaceId, 
  fallbackImage,
  className = "w-full h-32"
}: VenueImageCarouselProps) {
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenuePhotos = async () => {
      if (!googlePlaceId) {
        setPhotos(fallbackImage ? [fallbackImage] : []);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/venues/photos/${googlePlaceId}`);
        if (response.ok) {
          const data = await response.json();
          setPhotos(data.photos || (fallbackImage ? [fallbackImage] : []));
        } else {
          setPhotos(fallbackImage ? [fallbackImage] : []);
        }
      } catch (error) {
        console.error('Error fetching venue photos:', error);
        setPhotos(fallbackImage ? [fallbackImage] : []);
      } finally {
        setLoading(false);
      }
    };

    fetchVenuePhotos();
  }, [googlePlaceId, fallbackImage]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  if (loading) {
    return (
      <div className={`${className} bg-gray-800 animate-pulse rounded-lg`}>
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    // Use venue-appropriate stock images from Unsplash for venues without Google Places photos
    const venueStockImages = [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400", // concert venue
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400", // music venue interior
      "https://images.unsplash.com/photo-1501612780327-45045538702b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400", // stage lights
      "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400", // concert hall
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400", // music venue bar
      "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400", // concert stage
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400", // live music atmosphere
      "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"  // music venue ambiance
    ];
    
    const imageIndex = venueName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % venueStockImages.length;
    const selectedImage = venueStockImages[imageIndex];
    
    return (
      <div className={`relative ${className} overflow-hidden rounded-lg`}>
        <img
          src={selectedImage}
          alt={`${venueName} - Music Venue`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className} group overflow-hidden rounded-lg`}>
      <img
        src={photos[currentIndex]}
        alt={`${venueName} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      
      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevImage();
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextImage();
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {photos.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}