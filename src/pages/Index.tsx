import React, { useState, useCallback } from 'react';
import Header from '@/components/Header';
import YouTubePlayer from '@/components/YouTubePlayer';
import AnnouncementPanel from '@/components/AnnouncementPanel';

const Index: React.FC = () => {
  const [mediaVolume, setMediaVolume] = useState(1);

  const handleMediaVolumeChange = useCallback((volume: number) => {
    setMediaVolume(volume);
  }, []);

  return (
    <div className="min-h-screen gradient-dark flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 flex gap-6 overflow-hidden">
        {/* Left side - YouTube Player */}
        <div className="flex-1 flex flex-col animate-fade-in">
          <YouTubePlayer className="flex-1" volumeMultiplier={mediaVolume} />
        </div>

        {/* Right side - Announcement Panel */}
        <div className="w-96 flex flex-col animate-slide-in-right">
          <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-2xl border border-border p-5 shadow-card overflow-hidden flex flex-col">
            <AnnouncementPanel onMediaVolumeChange={handleMediaVolumeChange} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
