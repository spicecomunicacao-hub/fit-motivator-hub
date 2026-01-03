import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Portuguese-friendly voices from ElevenLabs
const VOICE_OPTIONS = {
  'matilda': 'XrExE9yKIg1WjnnlVkGX', // Female, warm and friendly
  'george': 'JBFqnCBsd6RMkjVDRZzb', // Male, professional
  'sarah': 'EXAVITQu4vr4xnSDxMaL', // Female, clear
  'brian': 'nPczCjzI2devNBz1zQrb', // Male, authoritative
  'lily': 'pFZP5JQG7iQjIQuC4Bku', // Female, soft
  'daniel': 'onwK4e9ZLuTAKqWW03F9', // Male, deep
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, voiceName } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured');
      throw new Error('ElevenLabs API key is not configured');
    }

    if (!text) {
      throw new Error('Text is required');
    }

    // Use provided voiceId, or lookup by name, or default to Matilda
    let selectedVoiceId = voiceId;
    if (!selectedVoiceId && voiceName) {
      selectedVoiceId = VOICE_OPTIONS[voiceName.toLowerCase() as keyof typeof VOICE_OPTIONS];
    }
    if (!selectedVoiceId) {
      selectedVoiceId = VOICE_OPTIONS.matilda; // Default voice
    }

    console.log(`Generating TTS for text: "${text.substring(0, 50)}..." with voice: ${selectedVoiceId}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.4,
            use_speaker_boost: true,
            speed: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`Audio generated successfully, size: ${audioBuffer.byteLength} bytes`);

    // Encode to base64 for easier client handling
    const base64Audio = base64Encode(audioBuffer);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        success: true 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in elevenlabs-tts function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
