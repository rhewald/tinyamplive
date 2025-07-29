import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users } from "lucide-react";
import type { Venue, EventWithDetails } from "@shared/schema";
import GoogleReviewsRating from "@/components/google-reviews-rating";
import VenueImageCarousel from "@/components/venue-image-carousel";
import rickshawImage from "@assets/rickshaw_1750105909144.jpg";
import cafeduNordImage from "@assets/cafedunord_1750105939510.jpg";

interface VenueCardProps {
  venue: Venue;
}

export default function VenueCard({ venue }: VenueCardProps) {
  const { data: events = [] } = useQuery<EventWithDetails[]>({
    queryKey: [`/api/venues/${venue.id}/events`],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const upcomingEvents = events.filter(event => new Date(event.date) > new Date());
  const thisWeekEvents = upcomingEvents.filter(event => {
    const eventDate = new Date(event.date);
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    return eventDate <= oneWeekFromNow;
  });

  return (
    <Link href={`/venues/${venue.slug}`}>
      <div className="bg-card-bg rounded-xl overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer group">
        <div className="relative">
          <VenueImageCarousel 
            venueName={venue.name}
            googlePlaceId={venue.googlePlaceId}
            fallbackImage={venue.name === 'The Rickshaw Stop' ? rickshawImage : 
                           venue.name === 'Café du Nord' ? cafeduNordImage : 
                           venue.imageUrl || undefined}
            className="w-full h-32"
          />
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-black/70 text-white text-xs capitalize">
              {venue.venueType.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        <div className="p-4">
          <h4 className="font-bold mb-1 text-white group-hover:text-spotify-green transition-colors">
            {venue.name}
          </h4>
          
          <div className="flex items-center space-x-1 mb-2">
            <MapPin className="w-3 h-3 text-muted-text" />
            <p className="text-muted-text text-sm">{venue.address}</p>
          </div>
          
          <div className="flex items-center space-x-4 mb-3 text-xs text-muted-text">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>Capacity: {venue.capacity}</span>
            </div>
          </div>

          {(venue.googleRating || venue.googleReviewCount) && (
            <div className="mb-3">
              <GoogleReviewsRating 
                rating={venue.googleRating} 
                reviewCount={venue.googleReviewCount}
                size="sm"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-1 mb-3">
            {venue.primaryGenres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs text-muted-text border-gray-600">
                {genre}
              </Badge>
            ))}
            {venue.primaryGenres.length > 2 && (
              <Badge variant="outline" className="text-xs text-muted-text border-gray-600">
                +{venue.primaryGenres.length - 2}
              </Badge>
            )}
          </div>

          <div className="text-xs">
            {thisWeekEvents.length > 0 ? (
              <span className="text-coral font-medium">
                {thisWeekEvents.length} show{thisWeekEvents.length !== 1 ? 's' : ''} this week
              </span>
            ) : upcomingEvents.length > 0 ? (
              <span className="text-spotify-green font-medium">
                {upcomingEvents.length} upcoming show{upcomingEvents.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-muted-text">No upcoming shows</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
