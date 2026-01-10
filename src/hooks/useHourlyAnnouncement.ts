import { useState, useEffect, useCallback, useRef } from 'react';

interface HourlyAnnouncementSettings {
  enabled: boolean;
}

const STORAGE_KEY = 'sport-fitness-hourly-announcement';

const loadSettingsFromStorage = (): HourlyAnnouncementSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Error loading hourly announcement settings:', error);
  }
  return { enabled: false };
};

const saveSettingsToStorage = (settings: HourlyAnnouncementSettings) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving hourly announcement settings:', error);
  }
};

export const useHourlyAnnouncement = (onAnnounce: (message: string) => void) => {
  const [enabled, setEnabled] = useState<boolean>(() => loadSettingsFromStorage().enabled);
  const lastAnnouncedHourRef = useRef<number | null>(null);
  const onAnnounceRef = useRef(onAnnounce);

  // Keep callback ref updated
  useEffect(() => {
    onAnnounceRef.current = onAnnounce;
  }, [onAnnounce]);

  // Save settings when they change
  useEffect(() => {
    saveSettingsToStorage({ enabled });
  }, [enabled]);

  // Check for hourly announcement
  useEffect(() => {
    if (!enabled) return;

    const checkHour = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Only announce at the exact hour (minute 0)
      if (currentMinute === 0 && lastAnnouncedHourRef.current !== currentHour) {
        lastAnnouncedHourRef.current = currentHour;
        
        // Format the time announcement in Portuguese
        const formattedHour = currentHour === 0 ? 'meia noite' :
                             currentHour === 12 ? 'meio dia' :
                             currentHour === 1 ? 'uma hora' :
                             currentHour === 2 ? 'duas horas' :
                             currentHour === 3 ? 'três horas' :
                             currentHour === 4 ? 'quatro horas' :
                             currentHour === 5 ? 'cinco horas' :
                             currentHour === 6 ? 'seis horas' :
                             currentHour === 7 ? 'sete horas' :
                             currentHour === 8 ? 'oito horas' :
                             currentHour === 9 ? 'nove horas' :
                             currentHour === 10 ? 'dez horas' :
                             currentHour === 11 ? 'onze horas' :
                             currentHour === 13 ? 'treze horas' :
                             currentHour === 14 ? 'quatorze horas' :
                             currentHour === 15 ? 'quinze horas' :
                             currentHour === 16 ? 'dezesseis horas' :
                             currentHour === 17 ? 'dezessete horas' :
                             currentHour === 18 ? 'dezoito horas' :
                             currentHour === 19 ? 'dezenove horas' :
                             currentHour === 20 ? 'vinte horas' :
                             currentHour === 21 ? 'vinte e uma horas' :
                             currentHour === 22 ? 'vinte e duas horas' :
                             currentHour === 23 ? 'vinte e três horas' : '';
        
        const message = `São ${formattedHour}`;
        console.log('🕐 Hourly announcement:', message);
        onAnnounceRef.current(message);
      }
    };

    // Check immediately
    checkHour();

    // Check every 30 seconds to catch the exact minute
    const interval = setInterval(checkHour, 30000);

    return () => clearInterval(interval);
  }, [enabled]);

  const toggleEnabled = useCallback(() => {
    setEnabled(prev => !prev);
  }, []);

  const testAnnouncement = useCallback(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const formattedHour = currentHour === 0 ? 'meia noite' :
                         currentHour === 12 ? 'meio dia' :
                         `${currentHour} horas`;
    
    const formattedMinute = currentMinute === 0 ? '' :
                           currentMinute === 1 ? ' e um minuto' :
                           ` e ${currentMinute} minutos`;
    
    const message = `São ${formattedHour}${formattedMinute}`;
    onAnnounceRef.current(message);
  }, []);

  return {
    enabled,
    toggleEnabled,
    testAnnouncement,
  };
};
