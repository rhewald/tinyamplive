import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, DollarSign, ExternalLink, Ticket } from "lucide-react";
import { SiSpotify, SiYoutube, SiInstagram, SiX, SiTiktok, SiBandcamp, SiSoundcloud } from "react-icons/si";
import SpotifyEmbed from "@/components/spotify-embed";
import type { EventWithDetails } from "@shared/schema";

interface EventCardProps {
  event: EventWithDetails;
}

export default function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date);
  const isToday = eventDate.toDateString() === new Date().toDateString();
  const isTomorrow = eventDate.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString();
  


  return (
    <Link href={`/events/${event.slug}`}>
      <div className="bg-card-bg rounded-xl overflow-hidden hover:bg-card-hover transition-all duration-300 cursor-pointer group border border-gray-800 hover:border-gray-600 shadow-lg hover:shadow-xl">
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
          <div className="absolute top-3 left-3">
            {isToday && (
              <Badge className="bg-coral text-white">TONIGHT</Badge>
            )}
            {isTomorrow && (
              <Badge className="bg-spotify-green text-black">TOMORROW</Badge>
            )}
            {!isToday && !isTomorrow && (
              <Badge className="bg-gray-600 text-white">
                {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Badge>
            )}
          </div>
          {event.price && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                ${event.price}
              </Badge>
            </div>
          )}
        </div>
        
        <div className="p-6">
          <h4 className="text-xl font-bold mb-2 text-white group-hover:text-coral transition-colors duration-300">
            {event.artist.name}
          </h4>
          
          {event.openingActsDetails && event.openingActsDetails.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-muted-text mb-1">Opening Acts</p>
              <div className="flex flex-wrap gap-1">
                {event.openingActsDetails.map((act, index) => (
                  <Badge key={act.id} variant="outline" className="text-xs bg-gray-800 text-gray-300 border-gray-600">
                    {act.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-text" />
            <p className="text-muted-text text-sm">{event.venue.name}</p>
          </div>
          
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="w-4 h-4 text-muted-text" />
            <p className="text-muted-text text-sm">
              {eventDate.toLocaleDateString('en-US', { weekday: 'short' })} • {eventDate.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {event.artist.spotifyId && (
                <SiSpotify className="w-4 h-4 text-spotify-green" />
              )}
              {event.artist.youtubeChannelId && (
                <SiYoutube className="w-4 h-4 text-red-500" />
              )}
              {event.artist.socialLinks?.instagram && (
                <SiInstagram className="w-4 h-4 text-pink-500" />
              )}
              {event.artist.socialLinks?.twitter && (
                <SiX className="w-4 h-4 text-blue-400" />
              )}
              {event.artist.socialLinks?.tiktok && (
                <SiTiktok className="w-4 h-4 text-white" />
              )}
              {event.artist.socialLinks?.bandcamp && (
                <SiBandcamp className="w-4 h-4 text-blue-400" />
              )}
              {event.artist.socialLinks?.soundcloud && (
                <SiSoundcloud className="w-4 h-4 text-orange-500" />
              )}
            </div>
            
            {event.artist.monthlyListeners && (
              <span className="text-xs text-muted-text">
                {event.artist.monthlyListeners.toLocaleString()} monthly listeners
              </span>
            )}
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {event.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs text-muted-text border-gray-600">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Spotify Player */}
          <div 
            className="mt-4 pt-4 border-t border-gray-700"
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

          {event.ticketUrl && (
            <div className="mt-4">
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const url = event.ticketUrl;
                  if (url) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
                className="w-full bg-coral hover:bg-coral/90 text-white font-medium"
                size="sm"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Buy Tickets
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
