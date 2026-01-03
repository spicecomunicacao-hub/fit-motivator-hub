import React, { useState } from 'react';
import { Play, Youtube, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface YouTubePlayerProps {
  className?: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ className }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const extractVideoId = (url: string): string | null => {
    // Handle various YouTube URL formats
    const videoPatterns = [
      /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
      /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/,
      /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    ];

    for (const pattern of videoPatterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    // Handle playlist URLs
    const playlistPattern = /[?&]list=([a-zA-Z0-9_-]+)/;
    const playlistMatch = url.match(playlistPattern);
    if (playlistMatch) return playlistMatch[1];

    return null;
  };

  const isPlaylist = (url: string): boolean => {
    return url.includes('list=') && !url.includes('watch?v=');
  };

  const getPlaylistId = (url: string): string | null => {
    const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const handleLoadVideo = () => {
    console.log('Loading video from URL:', videoUrl);
    
    // Check if it's a playlist-only URL
    if (isPlaylist(videoUrl)) {
      const playlistId = getPlaylistId(videoUrl);
      if (playlistId) {
        console.log('Playlist detected, ID:', playlistId);
        setIsLoading(true);
        setEmbedUrl(`https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1`);
        setTimeout(() => setIsLoading(false), 1500);
        return;
      }
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    console.log('Extracted video ID:', videoId);
    
    if (!videoId) {
      console.log('Could not extract video ID');
      return;
    }

    setIsLoading(true);

    // Check if the URL also contains a playlist
    const playlistId = getPlaylistId(videoUrl);
    if (playlistId) {
      console.log('Video with playlist, playlist ID:', playlistId);
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?list=${playlistId}&autoplay=1&rel=0`);
    } else {
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`);
    }

    console.log('Embed URL set');
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* URL Input */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Cole o link do YouTube (vídeo ou playlist)..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
            className="pl-10 bg-secondary/50 border-border focus:ring-primary"
          />
        </div>
        <Button 
          onClick={handleLoadVideo} 
          className="gradient-energy shadow-energy"
          disabled={!videoUrl.trim()}
        >
          <Play className="w-4 h-4 mr-2" />
          Carregar
        </Button>
      </div>

      {/* Player */}
      <div className="flex-1 rounded-xl overflow-hidden bg-black/50 shadow-card relative min-h-[400px]">
        {embedUrl ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <iframe
              key={embedUrl}
              src={embedUrl}
              className="w-full h-full absolute inset-0"
              style={{ border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="YouTube video player"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Youtube className="w-20 h-20 mb-4 text-primary/50" />
            <p className="text-lg font-medium">Cole um link do YouTube acima</p>
            <p className="text-sm mt-1">Suporta vídeos e playlists</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubePlayer;
