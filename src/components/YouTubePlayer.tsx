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
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/playlist\?list=([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const isPlaylist = (url: string): boolean => {
    return url.includes('playlist?list=') || url.includes('&list=');
  };

  const handleLoadVideo = () => {
    const id = extractVideoId(videoUrl);
    if (!id) return;

    setIsLoading(true);

    if (isPlaylist(videoUrl)) {
      setEmbedUrl(`https://www.youtube.com/embed/videoseries?list=${id}&autoplay=1`);
    } else {
      setEmbedUrl(`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`);
    }

    setTimeout(() => setIsLoading(false), 1000);
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
          disabled={!videoUrl}
        >
          <Play className="w-4 h-4 mr-2" />
          Carregar
        </Button>
      </div>

      {/* Player */}
      <div className="flex-1 rounded-xl overflow-hidden bg-black/50 shadow-card relative">
        {embedUrl ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
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
