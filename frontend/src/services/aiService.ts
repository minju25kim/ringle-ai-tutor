import OpenAI from 'openai';
import { Message } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY, // This is an example, use environment variables
  dangerouslyAllowBrowser: true, // Allow usage in browser for client-side calls
});

export const transcribeAudio = async (audioBlob: Blob): Promise<string | null> => {
  try {
    const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type });
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
    });
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return null;
  }
};

export const getAiResponse = async (messages: Message[]): Promise<ReadableStream<Uint8Array> | null> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages.map(msg => ({ role: msg.sender === 'ai' ? 'assistant' : 'user', content: msg.text })),
      stream: true,
    });
    // The response is an AsyncIterable, convert it to a ReadableStream
    const encoder = new TextEncoder();
    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });
    return customStream;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return null;
  }
};

export const textToSpeech = async (text: string): Promise<string | null> => {
  try {
    const speechResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
    const blob = await speechResponse.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error converting text to speech:', error);
    return null;
  }
};