import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'alloy' } = await req.json();
    
    console.log('TTS API received text:', text);
    console.log('TTS API received voice:', voice);
    
    if (!text) {
      return new Response('Text is required', { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!openaiApiKey) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI TTS API error:', error);
      return new Response(`TTS failed: ${response.statusText}`, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return new Response('Internal server error', { status: 500 });
  }
} 