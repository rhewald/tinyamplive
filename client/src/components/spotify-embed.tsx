import { useState, useEffect } from 'react';

interface SpotifyEmbedProps {
  artistName: string;
  spotifyId?: string;
  className?: string;
}

export default function SpotifyEmbed({ artistName, spotifyId, className = "" }: SpotifyEmbedProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (spotifyId && isExpanded) {
      // Use Spotify's embed URL for artist
      setEmbedUrl(`https://open.spotify.com/embed/artist/${spotifyId}?utm_source=generator&theme=0`);
    }
  }, [spotifyId, isExpanded]);

  const handleTogglePlayer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`spotify-embed ${className}`}>
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">Listen to {artistName}</div>
        <button 
          className="flex items-center gap-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-full transition-colors"
          onClick={handleTogglePlayer}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          {isExpanded ? 'Hide Player' : 'Play on Spotify'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-3 rounded-lg overflow-hidden">
          {embedUrl ? (
            <iframe 
              src={embedUrl}
              width="100%" 
              height="352" 
              frameBorder="0" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              className="rounded-lg"
            />
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p className="text-gray-600">Spotify player not available for this artist</p>
              <button 
                className="mt-2 text-green-600 hover:text-green-700 underline"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const searchUrl = `https://open.spotify.com/search/${encodeURIComponent(artistName)}`;
                  window.open(searchUrl, '_blank', 'noopener,noreferrer');
                }}
              >
                Search on Spotify
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}