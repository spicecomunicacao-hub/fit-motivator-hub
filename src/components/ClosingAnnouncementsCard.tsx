import React from 'react';
import { Clock, Bell, BellOff, Play, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ClosingAnnouncement } from '@/hooks/useClosingAnnouncements';

interface ClosingAnnouncementsCardProps {
  enabled: boolean;
  onToggle: () => void;
  announcements: ClosingAnnouncement[];
  lastTriggered: Record<string, string>;
  nextAnnouncement: ClosingAnnouncement | null;
  timeUntilNext: string | null;
  closingTime: string;
  onTriggerManually: (id: string) => void;
}

const ClosingAnnouncementsCard: React.FC<ClosingAnnouncementsCardProps> = ({
  enabled,
  onToggle,
  announcements,
  lastTriggered,
  nextAnnouncement,
  timeUntilNext,
  closingTime,
  onTriggerManually,
}) => {
  const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  };

  const todayKey = getTodayKey();

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-sm flex items-center gap-1">
              Avisos de Fechamento
              <Lock className="w-3 h-3 text-muted-foreground" />
            </h3>
            <p className="text-xs text-muted-foreground">
              Encerramento às {closingTime}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-warning"
        />
      </div>

      {/* Status */}
      {enabled && nextAnnouncement && timeUntilNext && (
        <div className="flex items-center gap-2 text-xs bg-warning/10 rounded-lg px-3 py-2">
          <Bell className="w-3 h-3 text-warning animate-pulse" />
          <span>
            Próximo às <strong>{nextAnnouncement.time}</strong> em{' '}
            <strong className="text-warning">{timeUntilNext}</strong>
          </span>
        </div>
      )}

      {enabled && !nextAnnouncement && (
        <div className="flex items-center gap-2 text-xs bg-success/10 rounded-lg px-3 py-2 text-success">
          <Bell className="w-3 h-3" />
          <span>Todos os avisos de hoje já foram executados</span>
        </div>
      )}

      {!enabled && (
        <div className="flex items-center gap-2 text-xs bg-muted rounded-lg px-3 py-2 text-muted-foreground">
          <BellOff className="w-3 h-3" />
          <span>Avisos de fechamento desativados</span>
        </div>
      )}

      {/* Announcement Times */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Horários Programados
        </p>
        <div className="grid grid-cols-3 gap-2">
          {announcements.map((announcement) => {
            const wasTriggered = lastTriggered[announcement.id] === todayKey;
            
            return (
              <div
                key={announcement.id}
                className={cn(
                  'rounded-lg p-2 text-center border transition-all',
                  wasTriggered
                    ? 'bg-success/10 border-success/30 text-success'
                    : nextAnnouncement?.id === announcement.id
                    ? 'bg-warning/10 border-warning/30 text-warning'
                    : 'bg-secondary/50 border-border text-muted-foreground'
                )}
              >
                <p className="text-sm font-bold">{announcement.time}</p>
                <p className="text-[10px]">
                  {announcement.minutesUntilClose} min
                </p>
                {wasTriggered && (
                  <p className="text-[9px] mt-1">✓ Executado</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Test Buttons */}
      <div className="pt-2 border-t border-border/50">
        <p className="text-xs text-muted-foreground mb-2">Testar avisos:</p>
        <div className="flex gap-2">
          {announcements.map((announcement) => (
            <Button
              key={announcement.id}
              size="sm"
              variant="outline"
              className="flex-1 text-xs h-7"
              onClick={() => onTriggerManually(announcement.id)}
            >
              <Play className="w-3 h-3 mr-1" />
              {announcement.time}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClosingAnnouncementsCard;
