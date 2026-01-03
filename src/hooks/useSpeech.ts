import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ElevenLabsVoice {
  id: string;
  name: string;
  description: string;
}

export const ELEVENLABS_VOICES: ElevenLabsVoice[] = [
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda', description: 'Feminina, acolhedora e amigável' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', description: 'Feminina, clara e profissional' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily', description: 'Feminina, suave e gentil' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Masculino, profissional' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', description: 'Masculino, autoritário' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', description: 'Masculino, voz grave' },
];

export interface SpeechSettings {
  voiceId: string;
  voiceName: string;
  volume: number;
  useElevenLabs: boolean;
}

export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SpeechSettings>({
    voiceId: ELEVENLABS_VOICES[0].id,
    voiceName: ELEVENLABS_VOICES[0].name,
    volume: 1,
    useElevenLabs: true,
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

  const speakWithElevenLabs = useCallback(async (text: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { 
          text, 
          voiceId: settings.voiceId 
        },
      });

      if (error) {
        console.error('Error calling TTS function:', error);
        throw error;
      }

      if (!data?.success || !data?.audioContent) {
        throw new Error(data?.error || 'Failed to generate audio');
      }

      await playAudioFromBase64(data.audioContent, settings.volume);
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      toast.error('Erro ao gerar áudio. Tentando voz alternativa...');
      // Fallback to Web Speech API
      speakWithWebSpeech(text);
    } finally {
      setIsLoading(false);
    }
  }, [settings.voiceId, settings.volume, playAudioFromBase64]);

  const speakWithWebSpeech = useCallback((text: string) => {
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
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, [settings.volume]);

  const processQueue = useCallback(async () => {
    if (isProcessing.current || speechQueue.current.length === 0) return;

    isProcessing.current = true;
    const text = speechQueue.current.shift()!;

    try {
      if (settings.useElevenLabs) {
        await speakWithElevenLabs(text);
      } else {
        speakWithWebSpeech(text);
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
  }, [settings.useElevenLabs, speakWithElevenLabs, speakWithWebSpeech]);

  const speak = useCallback((text: string) => {
    speechQueue.current.push(text);
    processQueue();
  }, [processQueue]);

  const stop = useCallback(() => {
    // Stop ElevenLabs audio
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

  return {
    speak,
    stop,
    isSpeaking,
    isLoading,
    voices: ELEVENLABS_VOICES,
    settings,
    updateSettings,
  };
};
