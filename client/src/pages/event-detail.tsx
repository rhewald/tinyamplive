import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, ExternalLink, Music, Users, DollarSign } from "lucide-react";
import { SiSpotify, SiYoutube, SiInstagram, SiX, SiTiktok } from "react-icons/si";
import AffiliateLinks from "@/components/monetization/affiliate-links";
import DonationSupport from "@/components/monetization/donation-support";
import type { EventWithDetails } from "@shared/schema";

export default function EventDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: event, isLoading, error } = useQuery<EventWithDetails>({
    queryKey: [`/api/events/${slug}`],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="w-full h-64 bg-gray-700 rounded-xl mb-8"></div>
            <div className="h-8 bg-gray-700 rounded mb-4"></div>
            <div className="h-6 bg-gray-700 rounded mb-6 w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Event Not Found</h1>
            <p className="text-muted-text mb-6">The event you're looking for doesn't exist or has been removed.</p>
            <Link href="/events">
              <Button>Browse All Events</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Image */}
        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden mb-8">
          <img
            src={event.imageUrl || event.artist.imageUrl || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4">
            {isToday && <Badge className="bg-coral text-white mb-2">TONIGHT</Badge>}
            {isTomorrow && <Badge className="bg-spotify-green text-black mb-2">TOMORROW</Badge>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-white mb-4">{event.title}</h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <Link href={`/artists/${event.artist.slug}`}>
                <Badge variant="outline" className="text-spotify-green border-spotify-green hover:bg-spotify-green hover:text-black cursor-pointer">
                  <Music className="w-3 h-3 mr-1" />
                  {event.artist.name}
                </Badge>
              </Link>
              <Badge variant="outline" className="text-muted-text">
                {event.artist.genre}
              </Badge>
            </div>

            {/* Event Details */}
            <div className="bg-card-bg rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-spotify-green" />
                  <div>
                    <p className="text-white font-medium">
                      {eventDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-spotify-green" />
                  <div>
                    <p className="text-white font-medium">
                      {eventDate.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                    {event.doors && (
                      <p className="text-muted-text text-sm">
                        Doors: {new Date(event.doors).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-spotify-green" />
                  <div>
                    <Link href={`/venues/${event.venue.slug}`}>
                      <p className="text-white font-medium hover:text-spotify-green cursor-pointer">
                        {event.venue.name}
                      </p>
                    </Link>
                    <p className="text-muted-text text-sm">{event.venue.neighborhood}</p>
                  </div>
                </div>

                {event.price && (
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-spotify-green" />
                    <div>
                      <p className="text-white font-medium">${event.price}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-card-bg rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">About This Event</h2>
                <p className="text-muted-text leading-relaxed">{event.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Button */}
            {event.ticketUrl && (
              <div className="bg-card-bg rounded-lg p-6">
                <Button asChild className="w-full bg-spotify-green hover:bg-green-600 text-black">
                  <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                    Get Tickets
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            )}

            {/* Artist Info */}
            <div className="bg-card-bg rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">About the Artist</h3>
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={event.artist.imageUrl || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100"}
                  alt={event.artist.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <Link href={`/artists/${event.artist.slug}`}>
                    <h4 className="text-white font-medium hover:text-spotify-green cursor-pointer">
                      {event.artist.name}
                    </h4>
                  </Link>
                  <p className="text-muted-text text-sm">{event.artist.location}</p>
                </div>
              </div>
              
              {event.artist.description && (
                <p className="text-muted-text text-sm mb-4">{event.artist.description}</p>
              )}

              {/* Artist Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {event.artist.monthlyListeners && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-spotify-green">
                      {event.artist.monthlyListeners.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-text">Monthly Listeners</div>
                  </div>
                )}
                {event.artist.followers && (
                  <div className="text-center">
                    <div className="text-lg font-bold text-coral">
                      {event.artist.followers.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-text">Followers</div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {event.artist.socialLinks && (
                <div className="flex items-center space-x-3">
                  {event.artist.socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${event.artist.socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-400"
                    >
                      <SiInstagram className="w-5 h-5" />
                    </a>
                  )}
                  {event.artist.socialLinks.twitter && (
                    <a
                      href={`https://twitter.com/${event.artist.socialLinks.twitter.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <SiX className="w-5 h-5" />
                    </a>
                  )}
                  {event.artist.socialLinks.tiktok && (
                    <a
                      href={`https://tiktok.com/${event.artist.socialLinks.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-gray-300"
                    >
                      <SiTiktok className="w-5 h-5" />
                    </a>
                  )}
                  {event.artist.spotifyId && (
                    <a
                      href={`https://open.spotify.com/artist/${event.artist.spotifyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-spotify-green hover:text-green-400"
                    >
                      <SiSpotify className="w-5 h-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Venue Info */}
            <div className="bg-card-bg rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Venue Information</h3>
              <div className="space-y-3">
                <div>
                  <Link href={`/venues/${event.venue.slug}`}>
                    <h4 className="text-white font-medium hover:text-spotify-green cursor-pointer">
                      {event.venue.name}
                    </h4>
                  </Link>
                  <p className="text-muted-text text-sm">{event.venue.address}</p>
                </div>
                
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-muted-text" />
                    <span className="text-muted-text">Capacity: {event.venue.capacity}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {event.venue.primaryGenres.map((genre) => (
                    <Badge key={genre} variant="outline" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Monetization: Affiliate Links */}
            <AffiliateLinks 
              venue={{
                name: event.venue.name,
                website: event.venue.website,
              }}
              event={{
                title: event.title,
                ticketUrl: event.ticketUrl,
                venueAffiliateCode: event.venue.slug
              }}
            />

            {/* Monetization: Donation Support */}
            <DonationSupport 
              context="venue"
              entityName={event.venue.name}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
