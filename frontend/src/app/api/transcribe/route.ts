import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return new Response('Audio file is required', { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (!openaiApiKey) {
      return new Response('OpenAI API key not configured', { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: audioFile.type }), 'audio.webm');
    form.append('model', 'whisper-1');

    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], 'audio.webm', { type: audioFile.type }),
      model: 'whisper-1',
    });
    
    return new Response(JSON.stringify({ text: transcription.text }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Transcription error:', error);
    return new Response('Failed to transcribe audio', { status: 500 });
  }
} 
