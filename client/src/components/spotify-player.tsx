import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, ExternalLink } from 'lucide-react';

interface SpotifyPlayerProps {
  artistName: string;
  spotifyId?: string | null;
  className?: string;
}

export default function SpotifyPlayer({ artistName, spotifyId, className = "" }: SpotifyPlayerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging
  console.log('SpotifyPlayer rendered for:', artistName, 'Spotify ID:', spotifyId);

  // If no Spotify ID, try to generate one from artist name
  const generateSpotifyUrl = (name: string) => {
    // Clean up artist name for Spotify embed
    const cleanName = name.replace(/[^\w\s]/g, '').replace(/\s+/g, '%20');
    return `https://open.spotify.com/embed/search/${cleanName}?utm_source=generator&theme=0`;
  };

  const spotifyEmbedUrl = spotifyId 
    ? `https://open.spotify.com/embed/artist/${spotifyId}?utm_source=generator&theme=0`
    : generateSpotifyUrl(artistName);

  const spotifyWebUrl = spotifyId
    ? `https://open.spotify.com/artist/${spotifyId}`
    : `https://open.spotify.com/search/${encodeURIComponent(artistName)}`;

  const togglePlayer = () => {
    console.log('Toggle player clicked for:', artistName);
    if (!isVisible) {
      setIsLoading(true);
    }
    setIsVisible(!isVisible);
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`spotify-player ${className}`} style={{ border: '1px solid red', padding: '8px' }}>
      <div className="text-xs text-red-500 mb-1">DEBUG: SpotifyPlayer for {artistName}</div>
      <div className="flex items-center gap-2 mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={togglePlayer}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white border-gray-600"
        >
          {isVisible ? (
            <>
              <Pause className="h-4 w-4" />
              Hide Player
            </>
          ) : (
            <>
              <Play className="h-4 w-4 text-green-500" />
              Listen on Spotify
            </>
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="flex items-center gap-1"
        >
          <a 
            href={spotifyWebUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-700"
          >
            <ExternalLink className="h-3 w-3" />
            Open Spotify
          </a>
        </Button>
      </div>

      {isVisible && (
        <Card className="p-3 bg-black/5 dark:bg-white/5">
          {isLoading && (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          )}
          
          <iframe
            src={spotifyEmbedUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            onLoad={handleIframeLoad}
            className={`rounded ${isLoading ? 'hidden' : 'block'}`}
          />
        </Card>
      )}
    </div>
  );
}