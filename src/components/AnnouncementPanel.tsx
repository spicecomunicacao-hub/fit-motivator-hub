import React, { useState, useCallback } from 'react';
import { Volume2, VolumeX, Play, Square, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import TimerCard from './TimerCard';
import TimerEditDialog from './TimerEditDialog';
import ClosingAnnouncementsCard from './ClosingAnnouncementsCard';
import { useSpeech } from '@/hooks/useSpeech';
import { useAnnouncementTimers, TimerConfig } from '@/hooks/useAnnouncementTimers';
import { useClosingAnnouncements } from '@/hooks/useClosingAnnouncements';

interface AnnouncementPanelProps {
  onMediaVolumeChange?: (volume: number) => void;
}

const AnnouncementPanel: React.FC<AnnouncementPanelProps> = ({ onMediaVolumeChange }) => {
  const { speak, stop, isSpeaking, voices, settings, updateSettings } = useSpeech();
  const [editingTimer, setEditingTimer] = useState<TimerConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState<{ message: string; timer?: TimerConfig; isClosing?: boolean } | null>(null);

  const handleAnnounce = (message: string, timer: TimerConfig) => {
    setLastAnnouncement({ message, timer });
    speak(message);
  };

  const handleClosingAnnounce = useCallback((message: string) => {
    setLastAnnouncement({ message, isClosing: true });
    speak(message);
  }, [speak]);

  const handleAnnouncementStart = useCallback(() => {
    // Reduce media volume during announcement
    onMediaVolumeChange?.(0.2);
  }, [onMediaVolumeChange]);

  const handleAnnouncementEnd = useCallback(() => {
    // Restore media volume after announcement
    onMediaVolumeChange?.(1);
  }, [onMediaVolumeChange]);

  const {
    timers,
    isRunning,
    start,
    stop: stopTimers,
    updateTimer,
    triggerNow,
    getTimeUntilNext,
  } = useAnnouncementTimers(handleAnnounce);

  const {
    enabled: closingEnabled,
    toggleEnabled: toggleClosingEnabled,
    announcements: closingAnnouncements,
    lastTriggered: closingLastTriggered,
    nextAnnouncement: closingNextAnnouncement,
    timeUntilNext: closingTimeUntilNext,
    closingTime,
    triggerManually: triggerClosingManually,
  } = useClosingAnnouncements(handleClosingAnnounce, handleAnnouncementStart, handleAnnouncementEnd);

  const ptVoices = voices.filter(v => v.lang.startsWith('pt'));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-display text-gradient">PAINEL DE AVISOS</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Voice Settings */}
      {showSettings && (
        <div className="mb-4 p-4 rounded-xl bg-secondary/50 border border-border space-y-4 animate-fade-in">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Voz
            </label>
            <Select
              value={settings.voice?.name || ''}
              onValueChange={(name) => {
                const voice = voices.find(v => v.name === name);
                if (voice) updateSettings({ voice });
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione uma voz" />
              </SelectTrigger>
              <SelectContent>
                {(ptVoices.length > 0 ? ptVoices : voices).map((voice) => (
                  <SelectItem key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Velocidade: {settings.rate.toFixed(1)}x
              </label>
              <Slider
                value={[settings.rate]}
                onValueChange={([rate]) => updateSettings({ rate })}
                min={0.5}
                max={2}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Volume: {Math.round(settings.volume * 100)}%
              </label>
              <Slider
                value={[settings.volume]}
                onValueChange={([volume]) => updateSettings({ volume })}
                min={0}
                max={1}
                step={0.1}
              />
            </div>
          </div>
        </div>
      )}

      {/* Master Control */}
      <div className="mb-4">
        <Button
          onClick={isRunning ? stopTimers : start}
          className={cn(
            'w-full h-14 text-lg font-semibold transition-all',
            isRunning 
              ? 'bg-destructive hover:bg-destructive/90' 
              : 'gradient-energy shadow-energy glow-energy'
          )}
        >
          {isRunning ? (
            <>
              <Square className="w-5 h-5 mr-2" />
              Parar Automático
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Iniciar Avisos Automáticos
            </>
          )}
        </Button>
      </div>

      {/* Speaking Indicator */}
      {isSpeaking && (
        <div className={cn(
          "mb-4 p-3 rounded-lg flex items-center gap-3 animate-scale-in",
          lastAnnouncement?.isClosing 
            ? "bg-warning/10 border border-warning/30" 
            : "bg-primary/10 border border-primary/30"
        )}>
          <div className="relative">
            <Volume2 className={cn(
              "w-6 h-6 animate-pulse",
              lastAnnouncement?.isClosing ? "text-warning" : "text-primary"
            )} />
            <div className={cn(
              "absolute -inset-1 rounded-full animate-ping",
              lastAnnouncement?.isClosing ? "bg-warning/20" : "bg-primary/20"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm font-medium truncate",
              lastAnnouncement?.isClosing ? "text-warning" : "text-primary"
            )}>
              {lastAnnouncement?.isClosing ? '🚨 Aviso de Fechamento' : `${lastAnnouncement?.timer?.icon} ${lastAnnouncement?.timer?.name}`}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {lastAnnouncement?.message}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={stop}>
            <VolumeX className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Closing Announcements - Priority Section */}
      <div className="mb-4">
        <ClosingAnnouncementsCard
          enabled={closingEnabled}
          onToggle={toggleClosingEnabled}
          announcements={closingAnnouncements}
          lastTriggered={closingLastTriggered}
          nextAnnouncement={closingNextAnnouncement}
          timeUntilNext={closingTimeUntilNext}
          closingTime={closingTime}
          onTriggerManually={triggerClosingManually}
        />
      </div>

      {/* Timer Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {timers.map((timer) => (
          <TimerCard
            key={timer.id}
            timer={timer}
            timeUntilNext={getTimeUntilNext(timer.id)}
            isRunning={isRunning}
            onToggle={(enabled) => updateTimer(timer.id, { enabled })}
            onTriggerNow={() => triggerNow(timer.id)}
            onEdit={() => setEditingTimer(timer)}
          />
        ))}
      </div>

      {/* Edit Dialog */}
      {editingTimer && (
        <TimerEditDialog
          timer={editingTimer}
          open={!!editingTimer}
          onClose={() => setEditingTimer(null)}
          onSave={(updates) => {
            updateTimer(editingTimer.id, updates);
            setEditingTimer(null);
          }}
        />
      )}
    </div>
  );
};

export default AnnouncementPanel;
