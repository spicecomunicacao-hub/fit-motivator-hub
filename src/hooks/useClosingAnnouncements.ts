import { useState, useEffect, useCallback, useRef } from 'react';

export interface ClosingAnnouncement {
  id: string;
  time: string; // HH:MM format
  minutesUntilClose: number;
}

const CLOSING_TIME = '22:00';

const CLOSING_ANNOUNCEMENTS: ClosingAnnouncement[] = [
  { id: 'closing-30', time: '21:30', minutesUntilClose: 30 },
  { id: 'closing-15', time: '21:45', minutesUntilClose: 15 },
  { id: 'closing-0', time: '22:00', minutesUntilClose: 0 },
];

const generateMessage = (minutesUntilClose: number): string => {
  if (minutesUntilClose === 0) {
    return 'Atenção alunos, a academia está encerrando suas atividades por hoje. Agradecemos a presença de todos e desejamos uma ótima noite!';
  }
  return `Atenção, a academia encerrará suas atividades em ${minutesUntilClose} minutos. Por favor, prepare-se para finalizar seus treinos e guarde os pesos e aparelhos utilizados. Obrigado.`;
};

export const useClosingAnnouncements = (
  onAnnounce: (message: string) => void
) => {
  const [enabled, setEnabled] = useState(true);
  const [lastTriggered, setLastTriggered] = useState<Record<string, string>>({});
  const [nextAnnouncement, setNextAnnouncement] = useState<ClosingAnnouncement | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getTodayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  };

  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };

  const getTimeForToday = (timeStr: string): Date => {
    const now = new Date();
    const { hours, minutes } = parseTime(timeStr);
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
  };

  const findNextAnnouncement = useCallback((): ClosingAnnouncement | null => {
    const now = new Date();
    const todayKey = getTodayKey();

    for (const announcement of CLOSING_ANNOUNCEMENTS) {
      const announcementTime = getTimeForToday(announcement.time);
      const alreadyTriggered = lastTriggered[announcement.id] === todayKey;

      if (now < announcementTime && !alreadyTriggered) {
        return announcement;
      }
    }

    return null;
  }, [lastTriggered]);

  const calculateTimeUntil = useCallback((announcement: ClosingAnnouncement): string => {
    const now = new Date();
    const announcementTime = getTimeForToday(announcement.time);
    const diff = announcementTime.getTime() - now.getTime();

    if (diff <= 0) return '0:00';

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const checkAndTrigger = useCallback(() => {
    if (!enabled) return;

    const now = new Date();
    const todayKey = getTodayKey();

    for (const announcement of CLOSING_ANNOUNCEMENTS) {
      const announcementTime = getTimeForToday(announcement.time);
      const alreadyTriggered = lastTriggered[announcement.id] === todayKey;

      // Check if it's time to trigger (within 1 second window)
      const timeDiff = Math.abs(now.getTime() - announcementTime.getTime());
      if (timeDiff < 1000 && !alreadyTriggered) {
        // Trigger the announcement
        const message = generateMessage(announcement.minutesUntilClose);
        
        // Speak the message (ducking is handled by useSpeech)
        onAnnounce(message);
        
        // Mark as triggered for today
        setLastTriggered(prev => ({
          ...prev,
          [announcement.id]: todayKey,
        }));
      }
    }

    // Update next announcement info
    const next = findNextAnnouncement();
    setNextAnnouncement(next);
    if (next) {
      setTimeUntilNext(calculateTimeUntil(next));
    } else {
      setTimeUntilNext(null);
    }
  }, [enabled, lastTriggered, onAnnounce, findNextAnnouncement, calculateTimeUntil]);

  useEffect(() => {
    // Check every second
    intervalRef.current = setInterval(checkAndTrigger, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkAndTrigger]);

  // Reset triggered state at midnight
  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        setLastTriggered({});
      }
    };

    const midnightInterval = setInterval(checkMidnight, 60000);
    return () => clearInterval(midnightInterval);
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  const triggerManually = useCallback((announcementId: string) => {
    const announcement = CLOSING_ANNOUNCEMENTS.find(a => a.id === announcementId);
    if (announcement) {
      const message = generateMessage(announcement.minutesUntilClose);
      // Ducking is handled by useSpeech
      onAnnounce(message);
    }
  }, [onAnnounce]);

  return {
    enabled,
    toggleEnabled,
    announcements: CLOSING_ANNOUNCEMENTS,
    lastTriggered,
    nextAnnouncement,
    timeUntilNext,
    closingTime: CLOSING_TIME,
    triggerManually,
  };
};
