import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import EventCard from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, Users, Calendar, Globe } from "lucide-react";
import { SiInstagram, SiX, SiFacebook } from "react-icons/si";
import type { Venue, EventWithDetails } from "@shared/schema";
import GoogleReviewsRating from "@/components/google-reviews-rating";
import VenueImageCarousel from "@/components/venue-image-carousel";
import rickshawImage from "@assets/rickshaw_1750105909144.jpg";
import cafeduNordImage from "@assets/cafedunord_1750105939510.jpg";

export default function VenueDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: venue, isLoading: venueLoading, error: venueError } = useQuery<Venue>({
    queryKey: [`/api/venues/${slug}`],
    enabled: !!slug,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<EventWithDetails[]>({
    queryKey: [`/api/venues/${venue?.id}/events`],
    enabled: !!venue?.id,
  });

  if (venueLoading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="w-full h-64 bg-gray-700 rounded-xl mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="h-8 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="lg:col-span-1">
                <div className="h-6 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (venueError || !venue) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Venue Not Found</h1>
            <p className="text-muted-text mb-6">The venue you're looking for doesn't exist or has been removed.</p>
            <Link href="/venues">
              <Button>Browse All Venues</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const upcomingEvents = events.filter(event => new Date(event.date) > new Date());

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Venue Image Carousel */}
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-8">
          <VenueImageCarousel 
            venueName={venue.name}
            googlePlaceId={venue.googlePlaceId}
            fallbackImage={venue.name === 'The Rickshaw Stop' ? rickshawImage : 
                           venue.name === 'Café du Nord' ? cafeduNordImage : 
                           venue.imageUrl || undefined}
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 z-10">
            <h1 className="text-4xl font-bold text-white mb-2">{venue.name}</h1>
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-1 text-white">
                <MapPin className="w-4 h-4" />
                <span>{venue.neighborhood}</span>
              </div>
              <Badge className="bg-spotify-green text-black">
                {venue.venueType.replace('_', ' ')}
              </Badge>
            </div>
            {(venue.googleRating || venue.googleReviewCount) && (
              <div className="bg-black/40 rounded-lg px-3 py-2 inline-block">
                <GoogleReviewsRating 
                  rating={venue.googleRating} 
                  reviewCount={venue.googleReviewCount}
                  size="lg"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Venue Description */}
            <div className="bg-card-bg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">About {venue.name}</h2>
              {venue.description ? (
                <p className="text-muted-text leading-relaxed">{venue.description}</p>
              ) : (
                <p className="text-muted-text leading-relaxed">
                  {venue.name} is a premier {venue.venueType.replace('_', ' ')} venue in {venue.neighborhood}, 
                  hosting amazing {venue.primaryGenres.join(', ').toLowerCase()} performances.
                </p>
              )}
            </div>

            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <Calendar className="w-6 h-6 mr-2" />
                  Upcoming Events
                </h2>
                {upcomingEvents.length > 4 && (
                  <Link href="/events">
                    <Button variant="outline">View All</Button>
                  </Link>
                )}
              </div>

              {eventsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-card-bg rounded-xl p-6 animate-pulse">
                      <div className="w-full h-32 bg-gray-700 rounded-lg mb-4"></div>
                      <div className="h-6 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
                      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="bg-card-bg rounded-lg p-8 text-center">
                  <Calendar className="w-12 h-12 text-muted-text mx-auto mb-4" />
                  <p className="text-muted-text text-lg">No upcoming events scheduled</p>
                  <p className="text-muted-text mt-2">Check back soon for new shows!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingEvents.slice(0, 4).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Google Maps */}
            <div className="bg-card-bg rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
              <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                <iframe
                  src={venue.googlePlaceId 
                    ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyB9BlL7kuDRa5NiBfh0Hvt1xi9uYaiRbaE&q=place_id:${venue.googlePlaceId}&zoom=15`
                    : `https://www.google.com/maps/embed/v1/place?key=AIzaSyB9BlL7kuDRa5NiBfh0Hvt1xi9uYaiRbaE&q=${encodeURIComponent(venue.address + ', San Francisco, CA')}&zoom=15`
                  }
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="rounded-lg"
                />
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-spotify-green" />
                <div>
                  <p className="text-white font-medium">{venue.address}</p>
                  <p className="text-muted-text text-sm">{venue.neighborhood}, San Francisco</p>
                </div>
              </div>
            </div>

            {/* Venue Details */}
            <div className="bg-card-bg rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Venue Details</h3>
              <div className="space-y-3">
                
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-spotify-green" />
                  <div>
                    <p className="text-white font-medium">Capacity: {venue.capacity}</p>
                  </div>
                </div>

                {venue.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-spotify-green" />
                    <div>
                      <a
                        href={venue.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-spotify-green hover:text-green-400 font-medium"
                      >
                        Visit Website
                        <ExternalLink className="w-4 h-4 ml-1 inline" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Genres */}
            <div className="bg-card-bg rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Music Genres</h3>
              <div className="flex flex-wrap gap-2">
                {venue.primaryGenres.map((genre) => (
                  <Badge key={genre} variant="outline" className="text-spotify-green border-spotify-green">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Social Links */}
            {venue.socialLinks && Object.keys(venue.socialLinks).length > 0 && (
              <div className="bg-card-bg rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
                <div className="flex items-center space-x-4">
                  {venue.socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${venue.socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-400 text-2xl"
                    >
                      <SiInstagram />
                    </a>
                  )}
                  {venue.socialLinks.twitter && (
                    <a
                      href={`https://twitter.com/${venue.socialLinks.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-2xl"
                    >
                      <SiX />
                    </a>
                  )}
                  {venue.socialLinks.facebook && (
                    <a
                      href={`https://facebook.com/${venue.socialLinks.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-500 text-2xl"
                    >
                      <SiFacebook />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-card-bg rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-text">Upcoming Events</span>
                  <span className="text-coral font-semibold">{upcomingEvents.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-text">Venue Type</span>
                  <span className="text-white font-medium capitalize">
                    {venue.venueType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-text">Location</span>
                  <span className="text-white font-medium">{venue.neighborhood}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
