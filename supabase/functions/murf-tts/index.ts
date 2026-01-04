import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId } = await req.json();

    if (!text) {
      console.error('Missing text parameter');
      return new Response(
        JSON.stringify({ success: false, error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const MURF_API_KEY = Deno.env.get('MURF_API_KEY');
    if (!MURF_API_KEY) {
      console.error('MURF_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Murf API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const selectedVoiceId = voiceId || 'en-US-natalie';

    console.log(`Generating speech with Murf.ai - Voice: ${selectedVoiceId}, Locale: pt-BR, Text length: ${text.length}`);

    const response = await fetch('https://api.murf.ai/v1/speech/generate', {
      method: 'POST',
      headers: {
        'api-key': MURF_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voiceId: selectedVoiceId,
        locale: 'pt-BR',
        format: 'MP3',
        encodeAsBase64: true,
        modelVersion: 'GEN2',
        channelType: 'MONO',
        sampleRate: 48000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Murf API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Murf API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    if (!data.encodedAudio) {
      console.error('No audio content in Murf response:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.warning || 'Failed to generate audio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully generated audio - Duration: ${data.audioLengthInSeconds}s`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioContent: data.encodedAudio,
        duration: data.audioLengthInSeconds,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in murf-tts function:', errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
