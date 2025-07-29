import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { SiSpotify, SiYoutube, SiInstagram, SiX, SiTiktok, SiBandcamp, SiSoundcloud } from "react-icons/si";
import type { Artist } from "@shared/schema";

interface ArtistCardProps {
  artist: Artist;
}

export default function ArtistCard({ artist }: ArtistCardProps) {
  return (
    <Link href={`/artists/${artist.slug}`}>
      <div className="bg-card-bg rounded-xl overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer group">
        <div className="relative">
          <img
            src={artist.imageUrl || "https://images.unsplash.com/photo-1516280440614-37939bbacd81?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"}
            alt={artist.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        
        <div className="p-6">
          <h4 className="text-xl font-bold mb-2 text-white group-hover:text-spotify-green transition-colors">
            {artist.name}
          </h4>
          
          <div className="flex items-center space-x-2 mb-3">
            <Badge className="bg-spotify-green text-black text-xs">
              {artist.genre}
            </Badge>
            <div className="flex items-center space-x-1 text-muted-text">
              <MapPin className="w-3 h-3" />
              <span className="text-xs">{artist.location}</span>
            </div>
          </div>

          {artist.description && (
            <p className="text-muted-text text-sm mb-4 line-clamp-2">
              {artist.description}
            </p>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {artist.spotifyId && (
                <SiSpotify className="w-4 h-4 text-spotify-green" />
              )}
              {artist.youtubeChannelId && (
                <SiYoutube className="w-4 h-4 text-red-500" />
              )}
              {artist.socialLinks?.instagram && (
                <SiInstagram className="w-4 h-4 text-pink-500" />
              )}
              {artist.socialLinks?.twitter && (
                <SiX className="w-4 h-4 text-blue-400" />
              )}
              {artist.socialLinks?.tiktok && (
                <SiTiktok className="w-4 h-4 text-white" />
              )}
              {artist.socialLinks?.bandcamp && (
                <SiBandcamp className="w-4 h-4 text-blue-400" />
              )}
              {artist.socialLinks?.soundcloud && (
                <SiSoundcloud className="w-4 h-4 text-orange-500" />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            {artist.monthlyListeners && (
              <div>
                <div className="text-lg font-bold text-spotify-green">
                  {artist.monthlyListeners > 1000 
                    ? `${(artist.monthlyListeners / 1000).toFixed(1)}K`
                    : artist.monthlyListeners.toLocaleString()
                  }
                </div>
                <div className="text-xs text-muted-text">Monthly Listeners</div>
              </div>
            )}
            {artist.followers && (
              <div>
                <div className="text-lg font-bold text-coral">
                  {artist.followers > 1000 
                    ? `${(artist.followers / 1000).toFixed(1)}K`
                    : artist.followers.toLocaleString()
                  }
                </div>
                <div className="text-xs text-muted-text">Followers</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
