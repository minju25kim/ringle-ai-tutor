import { NextRequest } from 'next/server';
import OpenAI from 'openai';

// Simple in-memory rate limiting (for production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
  return `transcribe:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 15; // Max 15 transcriptions per minute per IP
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // New window or expired window
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (current.count >= maxRequests) {
    return { allowed: false, resetTime: current.resetTime };
  }
  
  current.count++;
  rateLimitMap.set(key, current);
  return { allowed: true };
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting check
    const rateLimitKey = getRateLimitKey(req);
    const rateLimit = checkRateLimit(rateLimitKey);
    
    if (!rateLimit.allowed) {
      const resetTimeSeconds = Math.ceil((rateLimit.resetTime! - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded',
          resetIn: resetTimeSeconds 
        }), 
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': resetTimeSeconds.toString()
          }
        }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return new Response('Audio file is required', { status: 400 });
    }

    // Check file size (max 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return new Response('Audio file too large (max 25MB)', { status: 400 });
    }

    // Check file duration by size (rough estimate: 1MB = ~1 minute)
    if (audioFile.size < 1000) { // Less than 1KB
      return new Response('Audio file too small', { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY 
    
    // If no OpenAI API key, return mock transcription for development
    if (!openaiApiKey) {
      console.warn('OpenAI API key not configured, using mock transcription');
      const mockResponses = [
        "Hello, this is a test transcription.",
        "I am practicing my English speaking skills.",
        "This is a mock response for development purposes.",
        "The weather is nice today.",
        "I would like to improve my conversation skills.",
        "Thank you for helping me practice English."
      ];
      const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
      return new Response(JSON.stringify({ 
        text: randomResponse,
        mock: true 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
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
      language: 'en', // Force English language detection
      prompt: 'This is an English conversation for language learning.', // Give context hint
    });
    
    return new Response(JSON.stringify({ text: transcription.text }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Transcription error:', error);
    
    // Provide more specific error messages
    if (error?.status === 401) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API authentication failed. Please check your API key.' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (error?.status === 429) {
      return new Response(JSON.stringify({ 
        error: 'OpenAI API rate limit exceeded. Please try again later.' 
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      error: error?.message || 'Failed to transcribe audio',
      details: error?.status ? `HTTP ${error.status}` : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 
