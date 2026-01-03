import React from 'react';
import Header from '@/components/Header';
import YouTubePlayer from '@/components/YouTubePlayer';
import AnnouncementPanel from '@/components/AnnouncementPanel';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen gradient-dark flex flex-col">
      <Header />
      
      <main className="flex-1 p-6 flex gap-6 overflow-hidden">
        {/* Left side - YouTube Player */}
        <div className="flex-1 flex flex-col animate-fade-in">
          <YouTubePlayer className="flex-1" />
        </div>

        {/* Right side - Announcement Panel */}
        <div className="w-96 flex flex-col animate-slide-in-right">
          <div className="flex-1 bg-card/50 backdrop-blur-sm rounded-2xl border border-border p-5 shadow-card overflow-hidden flex flex-col">
            <AnnouncementPanel />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
