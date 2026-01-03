import React, { useEffect, useState } from 'react';
import { Play, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { TimerConfig } from '@/hooks/useAnnouncementTimers';

interface TimerCardProps {
  timer: TimerConfig;
  timeUntilNext: string | null;
  isRunning: boolean;
  onToggle: (enabled: boolean) => void;
  onTriggerNow: () => void;
  onEdit: () => void;
}

const TimerCard: React.FC<TimerCardProps> = ({
  timer,
  timeUntilNext,
  isRunning,
  onToggle,
  onTriggerNow,
  onEdit,
}) => {
  const [displayTime, setDisplayTime] = useState(timeUntilNext);

  useEffect(() => {
    setDisplayTime(timeUntilNext);
  }, [timeUntilNext]);

  const colorClasses = {
    primary: 'border-primary/30 bg-primary/5',
    accent: 'border-accent/30 bg-accent/5',
    success: 'border-success/30 bg-success/5',
  };

  const iconBgClasses = {
    primary: 'bg-primary/20 text-primary',
    accent: 'bg-accent/20 text-accent',
    success: 'bg-success/20 text-success',
  };

  return (
    <div 
      className={cn(
        'rounded-xl border-2 p-4 transition-all duration-300 gradient-card',
        timer.enabled ? colorClasses[timer.color as keyof typeof colorClasses] : 'border-border/30 opacity-60',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center text-xl',
            iconBgClasses[timer.color as keyof typeof iconBgClasses]
          )}>
            {timer.icon}
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{timer.name}</h3>
            <p className="text-sm text-muted-foreground">
              A cada {timer.intervalMinutes} minutos
            </p>
          </div>
        </div>
        <Switch 
          checked={timer.enabled} 
          onCheckedChange={onToggle}
        />
      </div>

      {timer.enabled && isRunning && displayTime && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Próximo em:</span>
          <span className="font-mono font-semibold text-foreground">{displayTime}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onTriggerNow}
          disabled={!timer.enabled}
          className="flex-1"
        >
          <Play className="w-3 h-3 mr-1" />
          Testar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="px-3"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default TimerCard;
