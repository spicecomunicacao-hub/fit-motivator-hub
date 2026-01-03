import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Play, Square, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import TimerCard from './TimerCard';
import TimerEditDialog from './TimerEditDialog';
import { useSpeech } from '@/hooks/useSpeech';
import { useAnnouncementTimers, TimerConfig } from '@/hooks/useAnnouncementTimers';

const AnnouncementPanel: React.FC = () => {
  const { speak, stop, isSpeaking, voices, settings, updateSettings } = useSpeech();
  const [editingTimer, setEditingTimer] = useState<TimerConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [lastAnnouncement, setLastAnnouncement] = useState<{ message: string; timer: TimerConfig } | null>(null);

  const handleAnnounce = (message: string, timer: TimerConfig) => {
    setLastAnnouncement({ message, timer });
    speak(message);
  };

  const {
    timers,
    isRunning,
    start,
    stop: stopTimers,
    updateTimer,
    triggerNow,
    getTimeUntilNext,
  } = useAnnouncementTimers(handleAnnounce);

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
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center gap-3 animate-scale-in">
          <div className="relative">
            <Volume2 className="w-6 h-6 text-primary animate-pulse" />
            <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">
              {lastAnnouncement?.timer.icon} {lastAnnouncement?.timer.name}
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
