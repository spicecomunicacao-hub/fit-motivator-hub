import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MurfVoice {
  id: string;
  name: string;
  description: string;
}

export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
}

// Portuguese voices from Murf.ai
export const MURF_VOICES: MurfVoice[] = [
  { id: 'pt-BR-leila', name: 'Leila', description: 'Feminina, brasileira, profissional' },
  { id: 'pt-BR-marcos', name: 'Marcos', description: 'Masculino, brasileiro, claro' },
  { id: 'pt-BR-rafaela', name: 'Rafaela', description: 'Feminina, brasileira, amigável' },
  { id: 'pt-BR-rodrigo', name: 'Rodrigo', description: 'Masculino, brasileiro, natural' },
];

// ElevenLabs voices as backup
export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Feminina, acolhedora e amigável' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Feminina, clara e profissional' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Feminina, suave e gentil' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Masculino, profissional' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Masculino, autoritário' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Masculino, voz grave' },
];

export type VoiceEngine = 'murf' | 'elevenlabs' | 'webspeech';

export interface SpeechSettings {
  voiceId: string;
  voiceName: string;
  volume: number;
  engine: VoiceEngine;
}

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SpeechSettings>({
    voiceId: MURF_VOICES[0].id,
    voiceName: MURF_VOICES[0].name,
    volume: 1,
    engine: 'murf', // Default to Murf.ai
  });
  const speechQueue = useRef<string[]>([]);
  const isProcessing = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudioFromBase64 = useCallback((base64Audio: string, volume: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        const audio = new Audio(audioUrl);
        audio.volume = volume;
        audioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          audioRef.current = null;
          resolve();
        };

        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsSpeaking(false);
          audioRef.current = null;
          reject(new Error('Failed to play audio'));
        };

        setIsSpeaking(true);
        audio.play().catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const speakWithMurf = useCallback(async (text: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('murf-tts', {
        body: { 
          text, 
          voiceId: settings.voiceId 
        },
      });

      if (error) {
        console.error('Error calling Murf TTS function:', error);
        throw error;
      }

      if (!data?.success || !data?.audioContent) {
        console.error('Murf response error:', data?.error);
        throw new Error(data?.error || 'Failed to generate audio');
      }

      await playAudioFromBase64(data.audioContent, settings.volume);
    } catch (error) {
      console.error('Murf TTS error:', error);
      // Fallback to ElevenLabs
      setIsLoading(false);
      return speakWithElevenLabs(text);
    } finally {
      setIsLoading(false);
    }
  }, [settings.voiceId, settings.volume, playAudioFromBase64]);

  const speakWithElevenLabs = useCallback(async (text: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Use first ElevenLabs voice as fallback
      const fallbackVoiceId = ELEVENLABS_VOICES[0].id;
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { 
          text, 
          voiceId: settings.engine === 'elevenlabs' ? settings.voiceId : fallbackVoiceId
        },
      });

      if (error) {
        console.error('Error calling ElevenLabs TTS function:', error);
        throw error;
      }

      if (!data?.success || !data?.audioContent) {
        console.error('ElevenLabs response error:', data?.error);
        throw new Error(data?.error || 'Failed to generate audio');
      }

      await playAudioFromBase64(data.audioContent, settings.volume);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      // Silently fallback to Web Speech API
      setIsLoading(false);
      return speakWithWebSpeech(text);
    } finally {
      setIsLoading(false);
    }
  }, [settings.voiceId, settings.volume, settings.engine, playAudioFromBase64]);

  const speakWithWebSpeech = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a Portuguese voice
      const voices = speechSynthesis.getVoices();
      const ptVoice = voices.find(v => v.lang.startsWith('pt') || v.lang.includes('BR'));
      if (ptVoice) {
        utterance.voice = ptVoice;
      }
      
      utterance.volume = settings.volume;
      utterance.rate = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      speechSynthesis.speak(utterance);
    });
  }, [settings.volume]);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || speechQueue.current.length === 0) return;

    isProcessing.current = true;
    const text = speechQueue.current.shift()!;

    try {
      if (settings.engine === 'murf') {
        await speakWithMurf(text);
      } else if (settings.engine === 'elevenlabs') {
        await speakWithElevenLabs(text);
      } else {
        await speakWithWebSpeech(text);
      }
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      isProcessing.current = false;
      // Process next item in queue
      if (speechQueue.current.length > 0) {
        processQueue();
      }
    }
  }, [settings.engine, speakWithMurf, speakWithElevenLabs, speakWithWebSpeech]);

  const speak = useCallback((text: string) => {
    speechQueue.current.push(text);
    processQueue();
  }, [processQueue]);

  const stop = useCallback(() => {
    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    // Stop Web Speech
    speechSynthesis.cancel();
    speechQueue.current = [];
    isProcessing.current = false;
    setIsSpeaking(false);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<SpeechSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Get voices based on current engine
  const getVoicesForEngine = useCallback(() => {
    if (settings.engine === 'murf') {
      return MURF_VOICES;
    } else if (settings.engine === 'elevenlabs') {
      return ELEVENLABS_VOICES;
    }
    return [];
  }, [settings.engine]);

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    murfVoices: MURF_VOICES,
    elevenLabsVoices: ELEVENLABS_VOICES,
    voices: getVoicesForEngine(),
    settings,
    updateSettings,
  };
};
