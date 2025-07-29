import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users, Clock } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import SpotifyEmbed from '@/components/spotify-embed';

interface Artist {
  id: number;
  name: string;
  slug: string;
  genre: string;
  imageUrl?: string;
  spotifyId?: string;
}

interface Venue {
  id: number;
  name: string;
  slug: string;
  neighborhood: string;
  capacity: number;
}

interface EventWithDetails {
  id: number;
  title: string;
  slug: string;
  date: string;
  doors?: string;
  showTime?: string;
  description?: string;
  ticketUrl?: string;
  imageUrl?: string;
  artist: Artist;
  venue: Venue;
  openingActsDetails?: Artist[];
}

export default function UpcomingEvents() {
  const { data: events, isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['upcoming-events'],
    queryFn: async () => {
      const response = await fetch('/api/events/upcoming');
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming events');
      }
      return response.json();
    },
  });

  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEE, MMM d');
    } catch {
      return 'Date TBD';
    }
  };

  const formatEventTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Upcoming Concerts in San Francisco</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!events || events.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Upcoming Concerts in San Francisco</h2>
          <p className="text-gray-600 text-lg">
            No upcoming concerts found. Check back soon for new shows!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Upcoming Concerts in San Francisco</h2>
          <p className="text-gray-600 text-lg">
            Discover independent music events happening in the city
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Link key={event.id} href={`/events/${event.slug}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img 
                    src={event.imageUrl || event.artist.imageUrl || '/api/placeholder/400/250'} 
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-gray-600 font-medium">{event.artist.name}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {event.artist.genre}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>
                        {event.doors && `Doors ${formatEventTime(event.doors)}`}
                        {event.showTime && ` • Show ${formatEventTime(event.showTime)}`}
                        {!event.doors && !event.showTime && formatEventTime(event.date)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin size={16} />
                      <span>{event.venue.name} • {event.venue.neighborhood}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>Capacity: {event.venue.capacity}</span>
                    </div>
                  </div>
                  
                  {event.description && (
                    <p className="text-gray-600 text-sm mt-3 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  
                  {event.openingActsDetails && event.openingActsDetails.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">Opening Acts:</p>
                      <div className="flex flex-wrap gap-1">
                        {event.openingActsDetails.map((act) => (
                          <Badge key={act.id} variant="outline" className="text-xs">
                            {act.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Spotify Player */}
                  <div 
                    className="mt-4 pt-3 border-t border-gray-200"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <SpotifyEmbed
                      artistName={event.artist.name}
                      spotifyId={event.artist.spotifyId}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link href="/events">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
              View All Events
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}