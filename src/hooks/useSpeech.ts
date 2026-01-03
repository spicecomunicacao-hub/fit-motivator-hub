import { useState, useCallback, useRef, useEffect } from 'react';

export interface SpeechSettings {
  voice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
}

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [settings, setSettings] = useState<SpeechSettings>({
    voice: null,
    rate: 1,
    pitch: 1,
    volume: 1,
  });
  const speechQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      // Try to find a Portuguese voice
      const ptVoice = availableVoices.find(v => 
        v.lang.startsWith('pt') || v.lang.includes('BR')
      );
      
      if (ptVoice && !settings.voice) {
        setSettings(prev => ({ ...prev, voice: ptVoice }));
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const processQueue = useCallback(() => {
    if (isProcessing.current || speechQueue.current.length === 0) return;

    isProcessing.current = true;
    const text = speechQueue.current.shift()!;

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (settings.voice) {
      utterance.voice = settings.voice;
    }
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      isProcessing.current = false;
      processQueue();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      isProcessing.current = false;
      processQueue();
    };

    speechSynthesis.speak(utterance);
  }, [settings]);

  const speak = useCallback((text: string) => {
    speechQueue.current.push(text);
    processQueue();
  }, [processQueue]);

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    speechQueue.current = [];
    isProcessing.current = false;
    setIsSpeaking(false);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    voices,
    settings,
    updateSettings,
  };
};
