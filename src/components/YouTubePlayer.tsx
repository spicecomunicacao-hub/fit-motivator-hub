import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Youtube, Link2, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface YouTubePlayerProps {
  className?: string;
  volumeMultiplier?: number;
}

interface YTPlayer {
  destroy: () => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  playVideo: () => void;
  pauseVideo: () => void;
}

interface YTPlayerEvent {
  target: YTPlayer;
  data?: number;
}

interface YTPlayerOptions {
  videoId?: string;
  width?: string | number;
  height?: string | number;
  playerVars?: Record<string, unknown>;
  events?: {
    onReady?: (event: YTPlayerEvent) => void;
    onError?: (event: YTPlayerEvent) => void;
    onStateChange?: (event: YTPlayerEvent) => void;
  };
}

declare global {
  interface Window {
    YT: {
      Player: new (elementId: string, options: YTPlayerOptions) => YTPlayer;
      PlayerState: {
        PLAYING: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

const STORAGE_KEY = 'gym-youtube-url';

// Load URL from localStorage
const loadUrlFromStorage = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch (error) {
    console.error('Error loading URL from localStorage:', error);
    return '';
  }
};

// Save URL to localStorage
const saveUrlToStorage = (url: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, url);
  } catch (error) {
    console.error('Error saving URL to localStorage:', error);
  }
};

// Load YouTube IFrame API
const loadYouTubeAPI = (): Promise<void> => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api');
    if (existingScript) {
      // Script already loading, wait for it
      const checkReady = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkReady);
          resolve();
        }
      }, 100);
      return;
    }

    const tag = document.createElement('script');
    tag.id = 'youtube-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      resolve();
    };
  });
};

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ className, volumeMultiplier = 1 }) => {
  const [videoUrl, setVideoUrl] = useState(() => loadUrlFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [isVolumeDimmed, setIsVolumeDimmed] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const previousMultiplier = useRef(volumeMultiplier);
  const baseVolumeRef = useRef(100);

  // Save URL to localStorage when it changes
  useEffect(() => {
    saveUrlToStorage(videoUrl);
  }, [videoUrl]);

  // Control volume based on volumeMultiplier
  useEffect(() => {
    if (playerRef.current && isPlayerReady) {
      const newVolume = Math.round(baseVolumeRef.current * volumeMultiplier);
      console.log(`🔊 YouTube: Setting volume to ${newVolume}% (base: ${baseVolumeRef.current}, multiplier: ${volumeMultiplier})`);
      playerRef.current.setVolume(newVolume);
      
      // Update dimmed state
      if (volumeMultiplier < 1 && previousMultiplier.current === 1) {
        setIsVolumeDimmed(true);
      } else if (volumeMultiplier === 1 && previousMultiplier.current < 1) {
        setIsVolumeDimmed(false);
      }
      previousMultiplier.current = volumeMultiplier;
    }
  }, [volumeMultiplier, isPlayerReady]);

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

  const createPlayer = useCallback(async (videoId: string, playlistId?: string) => {
    await loadYouTubeAPI();

    // Destroy existing player
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
      setIsPlayerReady(false);
    }

    // Clear container
    if (playerContainerRef.current) {
      playerContainerRef.current.innerHTML = '<div id="youtube-player"></div>';
    }

    const playerVars: Record<string, unknown> = {
      autoplay: 1,
      rel: 0,
      enablejsapi: 1,
      origin: window.location.origin,
    };

    if (playlistId) {
      playerVars.list = playlistId;
      playerVars.listType = 'playlist';
    }

    playerRef.current = new window.YT.Player('youtube-player', {
      videoId: playlistId && !videoId ? undefined : videoId,
      width: '100%',
      height: '100%',
      playerVars,
      events: {
        onReady: (event) => {
          console.log('🎬 YouTube Player ready');
          setIsLoading(false);
          setIsPlayerReady(true);
          // Get current volume as base
          baseVolumeRef.current = event.target.getVolume();
          // Apply current multiplier
          const newVolume = Math.round(baseVolumeRef.current * volumeMultiplier);
          event.target.setVolume(newVolume);
        },
        onError: (event) => {
          console.error('YouTube Player error:', event.data);
          setIsLoading(false);
        },
        onStateChange: (event) => {
          // Update base volume when user changes it manually
          if (event.data === window.YT.PlayerState.PLAYING) {
            const currentVolume = event.target.getVolume();
            // Only update base if not currently ducking
            if (volumeMultiplier === 1) {
              baseVolumeRef.current = currentVolume;
            }
          }
        },
      },
    });
  }, [volumeMultiplier]);

  const handleLoadVideo = useCallback(() => {
    console.log('Loading video from URL:', videoUrl);
    setIsLoading(true);
    
    // Check if it's a playlist-only URL
    if (isPlaylist(videoUrl)) {
      const playlistId = getPlaylistId(videoUrl);
      if (playlistId) {
        console.log('Playlist detected, ID:', playlistId);
        createPlayer('', playlistId);
        return;
      }
    }

    // Extract video ID
    const videoId = extractVideoId(videoUrl);
    console.log('Extracted video ID:', videoId);
    
    if (!videoId) {
      console.log('Could not extract video ID');
      setIsLoading(false);
      return;
    }

    // Check if the URL also contains a playlist
    const playlistId = getPlaylistId(videoUrl);
    if (playlistId) {
      console.log('Video with playlist, playlist ID:', playlistId);
      createPlayer(videoId, playlistId);
    } else {
      createPlayer(videoId);
    }
  }, [videoUrl, createPlayer]);

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
        {playerRef.current || isLoading ? (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {/* Volume Dimmed Indicator */}
            {isVolumeDimmed && (
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-warning/90 text-warning-foreground px-3 py-2 rounded-lg animate-fade-in">
                <VolumeX className="w-4 h-4" />
                <span className="text-sm font-medium">Volume reduzido - Aviso em execução</span>
              </div>
            )}
            
            <div 
              ref={playerContainerRef}
              className={cn(
                "w-full h-full transition-opacity duration-300",
                isVolumeDimmed && "opacity-60"
              )}
            >
              <div id="youtube-player" />
            </div>
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
