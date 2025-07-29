import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SpotifyEmbed from "@/components/spotify-embed";
import { EventQuickActions } from "@/components/event-quick-actions";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { EventWithDetails } from "@shared/schema";

export default function Events() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);

  // Parse URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search') || '';
    const genreParam = urlParams.get('genre') || '';
    const venueParam = urlParams.get('venue') || '';
    const dateParam = urlParams.get('date') || '';
    
    setSearch(searchParam);
    setGenre(genreParam);
    setVenue(venueParam);
    setDate(dateParam);
  }, [location]);

  const { data: events = [], isLoading } = useQuery<EventWithDetails[]>({
    queryKey: ['/api/events', { search, genre, venue, date }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (genre && genre !== 'all-genres') params.append('genre', genre);
      if (venue && venue !== 'all-venues') params.append('venue', venue);
      if (date && date !== 'all-dates') params.append('date', date);
      
      const response = await fetch(`/api/events?${params}`);
      if (!response.ok) throw new Error('Failed to fetch events');
      return response.json();
    }
  });

  return (
    <div className="min-h-screen bg-dark-bg">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">All Events</h1>
          <p className="text-muted-text">Discover amazing live music happening in San Francisco</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-card-bg rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-text h-4 w-4" />
              <Input
                placeholder="Search events, artists..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-dark-bg border-gray-600 text-white"
              />
            </div>
            
            <Select value={date} onValueChange={setDate}>
              <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-dates">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="next-week">Next Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Date</SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Picker - only show when custom is selected */}
            {date === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-dark-bg border-gray-600 text-white hover:bg-gray-700"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDate ? format(customDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customDate}
                    onSelect={(date) => {
                      setCustomDate(date);
                      if (date) {
                        setDate(format(date, "yyyy-MM-dd"));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}

            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-genres">All Genres</SelectItem>
                <SelectItem value="Indie Rock">Indie Rock</SelectItem>
                <SelectItem value="Electronic">Electronic</SelectItem>
                <SelectItem value="Folk">Folk</SelectItem>
                <SelectItem value="Indie Folk">Indie Folk</SelectItem>
              </SelectContent>
            </Select>

            <Select value={venue} onValueChange={setVenue}>
              <SelectTrigger className="bg-dark-bg border-gray-600 text-white">
                <SelectValue placeholder="Venue" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] overflow-y-auto">
                <SelectItem value="all-venues">All Venues</SelectItem>
                <SelectItem value="the-independent-sf">The Independent</SelectItem>
                <SelectItem value="the-chapel-sf">The Chapel</SelectItem>
                <SelectItem value="cafe-du-nord-sf">Cafe du Nord</SelectItem>
                <SelectItem value="bottom-of-the-hill-sf">Bottom of the Hill</SelectItem>
                <SelectItem value="great-american-music-hall-sf">Great American Music Hall</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 text-sm text-muted-text">
            {events.length} events found
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card-bg rounded-xl p-6 animate-pulse">
                <div className="w-full h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-text text-lg">No events found matching your criteria.</p>
            <p className="text-muted-text mt-2">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-card-bg rounded-xl overflow-hidden hover:bg-gray-700 transition-colors group">
                <Link href={`/events/${event.slug}`}>
                  <div className="relative">
                    {(event.imageUrl || event.artist.imageUrl) ? (
                      <img
                        src={event.imageUrl || event.artist.imageUrl || ""}
                        alt={event.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                        <div className="text-center text-gray-400">
                          <div className="text-4xl mb-2">🎵</div>
                          <p className="text-sm font-medium">{event.artist.name}</p>
                          <p className="text-xs text-gray-500">{event.venue.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
                
                <div className="p-6">
                  <Link href={`/events/${event.slug}`}>
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-spotify-green transition-colors cursor-pointer">
                        {event.title}
                      </h3>
                      <p className="text-gray-300 font-medium mb-1">{event.artist.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                        <span>{event.venue.name}</span>
                        <span>•</span>
                        <span>{new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      {event.description && (
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </Link>
                  
                  {/* Spotify Player */}
                  <div 
                    className="mt-4 pt-3 border-t border-gray-700"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    {event.artist.spotifyId && (
                      <SpotifyEmbed
                        artistName={event.artist.name}
                        spotifyId={event.artist.spotifyId || undefined}
                        className="w-full"
                      />
                    )}
                  </div>
                  
                  {/* Enhanced Event Actions */}
                  <div 
                    className="mt-4 border-t border-gray-700 pt-4"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <EventQuickActions 
                      eventId={event.id}
                      eventTitle={event.title}
                      eventDate={typeof event.date === 'string' ? event.date : event.date.toISOString()}
                      venueUrl={event.ticketUrl || undefined}
                    />
                  </div>

                  {event.ticketUrl && (
                    <div className="mt-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(event.ticketUrl || '', '_blank', 'noopener,noreferrer');
                        }}
                        className="w-full bg-coral hover:bg-coral/90 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-coral/25"
                      >
                        🎫 Get Tickets
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
