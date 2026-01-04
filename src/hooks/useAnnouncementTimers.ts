import { useState, useEffect, useCallback, useRef } from 'react';

export interface TimerConfig {
  id: string;
  name: string;
  intervalMinutes: number;
  messages: string[];
  enabled: boolean;
  icon: string;
  color: string;
}

export interface TimerState {
  id: string;
  nextTrigger: Date;
  lastTriggered: Date | null;
  messageIndex: number;
}

const STORAGE_KEY = 'gym-announcement-timers';

const DEFAULT_TIMERS: TimerConfig[] = [
  {
    id: 'announcements',
    name: 'Avisos',
    intervalMinutes: 30,
    messages: [
      'Atenção atletas! Lembrem-se de se hidratar durante o treino.',
      'Aviso importante: mantenha sua toalha sempre com você.',
      'Lembre-se de guardar os equipamentos após o uso.',
      'Atenção: respeite o limite de tempo nos aparelhos.',
    ],
    enabled: true,
    icon: '📢',
    color: 'primary',
  },
  {
    id: 'ads',
    name: 'Propagandas',
    intervalMinutes: 10,
    messages: [
      'Conheça nossos planos especiais com desconto! Fale com a recepção.',
      'Aulas de spinning e funcional com vagas abertas. Inscreva-se já!',
      'Traga um amigo e ganhe 30 dias grátis!',
      'Suplementos com preço especial na nossa loja.',
    ],
    enabled: true,
    icon: '🎯',
    color: 'accent',
  },
  {
    id: 'motivation',
    name: 'Motivação',
    intervalMinutes: 20,
    messages: [
      'Você está indo muito bem! Continue assim!',
      'Cada repetição te deixa mais forte. Não desista!',
      'O único treino ruim é o que você não faz. Parabéns por estar aqui!',
      'Sua dedicação de hoje é o resultado de amanhã!',
      'Força, foco e determinação! Você consegue!',
    ],
    enabled: true,
    icon: '💪',
    color: 'success',
  },
];

// Load timers from localStorage
const loadTimersFromStorage = (): TimerConfig[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading timers from localStorage:', error);
  }
  return DEFAULT_TIMERS;
};

// Save timers to localStorage
const saveTimersToStorage = (timers: TimerConfig[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
  } catch (error) {
    console.error('Error saving timers to localStorage:', error);
  }
};

export const useAnnouncementTimers = (onAnnounce: (message: string, timerConfig: TimerConfig) => void) => {
  const [timers, setTimers] = useState<TimerConfig[]>(() => loadTimersFromStorage());
  const [timerStates, setTimerStates] = useState<TimerState[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save timers to localStorage whenever they change
  useEffect(() => {
    saveTimersToStorage(timers);
  }, [timers]);

  // Initialize timer states
  useEffect(() => {
    const now = new Date();
    const initialStates = timers.map(timer => ({
      id: timer.id,
      nextTrigger: new Date(now.getTime() + timer.intervalMinutes * 60 * 1000),
      lastTriggered: null,
      messageIndex: 0,
    }));
    setTimerStates(initialStates);
  }, []);

  const checkTimers = useCallback(() => {
    const now = new Date();

    setTimerStates(prevStates => {
      const newStates = [...prevStates];

      timers.forEach((timer, index) => {
        if (!timer.enabled || !isRunning) return;

        const state = newStates[index];
        if (!state) return;

        if (now >= state.nextTrigger) {
          // Get next message
          const message = timer.messages[state.messageIndex];
          onAnnounce(message, timer);

          // Update state
          newStates[index] = {
            ...state,
            lastTriggered: now,
            nextTrigger: new Date(now.getTime() + timer.intervalMinutes * 60 * 1000),
            messageIndex: (state.messageIndex + 1) % timer.messages.length,
          };
        }
      });

      return newStates;
    });
  }, [timers, isRunning, onAnnounce]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(checkTimers, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, checkTimers]);

  const start = useCallback(() => {
    const now = new Date();
    setTimerStates(prev => prev.map((state, index) => ({
      ...state,
      nextTrigger: new Date(now.getTime() + timers[index].intervalMinutes * 60 * 1000),
    })));
    setIsRunning(true);
  }, [timers]);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const updateTimer = useCallback((id: string, updates: Partial<TimerConfig>) => {
    setTimers(prev => prev.map(timer => 
      timer.id === id ? { ...timer, ...updates } : timer
    ));
  }, []);

  const triggerNow = useCallback((id: string) => {
    const timer = timers.find(t => t.id === id);
    const state = timerStates.find(s => s.id === id);
    
    if (timer && state) {
      const message = timer.messages[state.messageIndex];
      onAnnounce(message, timer);
      
      setTimerStates(prev => prev.map(s => 
        s.id === id ? {
          ...s,
          lastTriggered: new Date(),
          nextTrigger: new Date(Date.now() + timer.intervalMinutes * 60 * 1000),
          messageIndex: (s.messageIndex + 1) % timer.messages.length,
        } : s
      ));
    }
  }, [timers, timerStates, onAnnounce]);

  const getTimeUntilNext = useCallback((id: string) => {
    const state = timerStates.find(s => s.id === id);
    if (!state || !isRunning) return null;

    const now = new Date();
    const diff = state.nextTrigger.getTime() - now.getTime();
    
    if (diff <= 0) return '0:00';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [timerStates, isRunning]);

  return {
    timers,
    timerStates,
    isRunning,
    start,
    stop,
    updateTimer,
    triggerNow,
    getTimeUntilNext,
  };
};
