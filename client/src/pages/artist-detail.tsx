import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import EventCard from "@/components/event-card";
import SpotifyPlayer from "@/components/spotify-player";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ExternalLink, Music, Calendar } from "lucide-react";
import { SiSpotify, SiYoutube, SiInstagram, SiX, SiTiktok, SiBandcamp, SiSoundcloud } from "react-icons/si";
import type { Artist, EventWithDetails } from "@shared/schema";

export default function ArtistDetail() {
  const { slug } = useParams<{ slug: string }>();

  const { data: artist, isLoading: artistLoading, error: artistError } = useQuery<Artist>({
    queryKey: [`/api/artists/${slug}`],
    enabled: !!slug,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<EventWithDetails[]>({
    queryKey: [`/api/artists/${artist?.id}/events`],
    enabled: !!artist?.id,
  });

  if (artistLoading) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="w-full h-64 bg-gray-700 rounded-xl mb-6"></div>
                <div className="h-8 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-2/3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-8 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (artistError || !artist) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Header />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Artist Not Found</h1>
            <p className="text-muted-text mb-6">The artist you're looking for doesn't exist or has been removed.</p>
            <Link href="/artists">
              <Button>Browse All Artists</Button>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Artist Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Artist Image */}
              <div className="w-full h-64 rounded-xl overflow-hidden mb-6">
                <img
                  src={artist.imageUrl || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=600"}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Basic Info */}
              <div className="bg-card-bg rounded-lg p-6 mb-6">
                <h1 className="text-2xl font-bold text-white mb-2">{artist.name}</h1>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-spotify-green text-black">{artist.genre}</Badge>
                  <div className="flex items-center space-x-1 text-muted-text">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{artist.location}</span>
                  </div>
                </div>

                {artist.description && (
                  <p className="text-muted-text text-sm mb-4">{artist.description}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {artist.monthlyListeners && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-spotify-green">
                        {artist.monthlyListeners.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-text">Monthly Listeners</div>
                    </div>
                  )}
                  {artist.followers && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-coral">
                        {artist.followers.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-text">Followers</div>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {artist.socialLinks && (
                  <div className="flex items-center justify-center space-x-4">
                    {artist.spotifyId && (
                      <a
                        href={`https://open.spotify.com/artist/${artist.spotifyId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-spotify-green hover:text-green-400 text-2xl"
                      >
                        <SiSpotify />
                      </a>
                    )}
                    {artist.youtubeChannelId && (
                      <a
                        href={`https://youtube.com/channel/${artist.youtubeChannelId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-400 text-2xl"
                      >
                        <SiYoutube />
                      </a>
                    )}
                    {artist.socialLinks.instagram && (
                      <a
                        href={`https://instagram.com/${artist.socialLinks.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-500 hover:text-pink-400 text-2xl"
                      >
                        <SiInstagram />
                      </a>
                    )}
                    {artist.socialLinks.twitter && (
                      <a
                        href={`https://twitter.com/${artist.socialLinks.twitter.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-2xl"
                      >
                        <SiX />
                      </a>
                    )}
                    {artist.socialLinks.tiktok && (
                      <a
                        href={`https://tiktok.com/${artist.socialLinks.tiktok.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-gray-300 text-2xl"
                      >
                        <SiTiktok />
                      </a>
                    )}
                    {artist.socialLinks.bandcamp && (
                      <a
                        href={`https://${artist.socialLinks.bandcamp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-2xl"
                      >
                        <SiBandcamp />
                      </a>
                    )}
                    {artist.socialLinks.soundcloud && (
                      <a
                        href={`https://soundcloud.com/${artist.socialLinks.soundcloud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-500 hover:text-orange-400 text-2xl"
                      >
                        <SiSoundcloud />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Spotify Player */}
              <div className="mb-6">
                <SpotifyPlayer 
                  artistName={artist.name} 
                  spotifyId={artist.spotifyId || undefined} 
                />
              </div>

              {/* Next Performance */}
              {upcomingEvents.length > 0 && (
                <div className="bg-card-bg rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Next Performance
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Link href={`/venues/${upcomingEvents[0].venue.slug}`}>
                        <p className="font-medium text-white hover:text-spotify-green cursor-pointer">
                          {upcomingEvents[0].venue.name}
                        </p>
                      </Link>
                      <p className="text-sm text-muted-text">
                        {new Date(upcomingEvents[0].date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })} • {new Date(upcomingEvents[0].date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                    <Link href={`/events/${upcomingEvents[0].slug}`}>
                      <Button className="w-full bg-spotify-green hover:bg-green-600 text-black">
                        Get Tickets
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Upcoming Shows</h2>
                {upcomingEvents.length > 3 && (
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
                  <Music className="w-12 h-12 text-muted-text mx-auto mb-4" />
                  <p className="text-muted-text text-lg">No upcoming shows scheduled</p>
                  <p className="text-muted-text mt-2">Check back soon for new dates!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingEvents.slice(0, 4).map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </div>

            {/* Music Section Placeholder */}
            <div className="bg-card-bg rounded-lg p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Music</h2>
              <div className="text-center py-8">
                <Music className="w-16 h-16 text-muted-text mx-auto mb-4" />
                <p className="text-muted-text text-lg mb-2">Music integration coming soon</p>
                <p className="text-muted-text mb-4">
                  Connect with Spotify and YouTube APIs to show top songs and videos
                </p>
                {artist.spotifyId && (
                  <Button asChild variant="outline">
                    <a
                      href={`https://open.spotify.com/artist/${artist.spotifyId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Listen on Spotify
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
