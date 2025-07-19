import React, { useState, useRef, useEffect, useCallback } from 'react';

interface AudioPlayerProps {
  text?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  className?: string;
  autoPlay?: boolean;
  audioUrl?: string;
  isUserMessage?: boolean;
  onEnded?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  text,
  voice = 'alloy',
  className = '',
  autoPlay = false,
  audioUrl: initialAudioUrl,
  isUserMessage = false,
  onEnded,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [audioChunks, setAudioChunks] = useState<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Split text into chunks (OpenAI TTS has a limit of ~4000 characters)
  const splitTextIntoChunks = useCallback((text: string) => {
    const maxChunkSize = 3000; // Safe limit for OpenAI TTS
    const sentences = text.split('. ');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }, []);

  const generateAudio = useCallback(async () => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    if (!text) return;

    // Prevent multiple simultaneous audio generations
    if (isLoading) {
      return;
    }

    console.log('AudioPlayer generating audio for text:', {
      text: text,
      textLength: text.length,
      sentences: text.split('.').length,
      voice: voice
    });

    setIsLoading(true);
    try {
      // Split text into chunks if it's too long
      const chunks = splitTextIntoChunks(text);
      console.log('Text chunks:', chunks);

      if (chunks.length === 1) {
        // Single chunk - normal flow
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text, voice }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate audio');
        }

        const audioBlob = await response.blob();
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Create audio element and play
        const audio = new Audio(url);
        audioRef.current = audio;
        
        // Set up audio event listeners
        audio.onended = () => {
          setIsPlaying(false);
          onEnded?.();
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
        };

        audio.play();
        setIsPlaying(true);
      } else {
        // Multiple chunks - generate all audio URLs first
        const audioUrls: string[] = [];
        
        for (const chunk of chunks) {
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: chunk, voice }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate audio for chunk');
          }

          const audioBlob = await response.blob();
          const url = URL.createObjectURL(audioBlob);
          audioUrls.push(url);
        }

        setAudioChunks(audioUrls);
        setCurrentChunk(0);
        
        // Play first chunk
        const audio = new Audio(audioUrls[0]);
        audioRef.current = audio;
        
        audio.onended = () => {
          if (currentChunk < audioUrls.length - 1) {
            // Play next chunk
            setCurrentChunk(prev => prev + 1);
            const nextAudio = new Audio(audioUrls[currentChunk + 1]);
            audioRef.current = nextAudio;
            nextAudio.onended = audio.onended;
            nextAudio.play();
          } else {
            // All chunks played
            setIsPlaying(false);
            onEnded?.();
          }
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoading(false);
        };

        audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error generating audio:', error);
    } finally {
      setIsLoading(false);
    }
  }, [audioUrl, text, voice, isLoading, onEnded, splitTextIntoChunks, currentChunk]);

  useEffect(() => {
    if (initialAudioUrl) {
      const audio = new Audio(initialAudioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsPlaying(false);
        onEnded?.();
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };
    }
  }, [initialAudioUrl, onEnded]);

  // Cleanup effect to prevent multiple plays
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (autoPlay && text && !isUserMessage && !audioUrl && !isPlaying) {
      // Add a small delay to ensure component is fully mounted and prevent multiple plays
      const timer = setTimeout(() => {
        generateAudio();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [autoPlay, text, isUserMessage, audioUrl, generateAudio, isPlaying]);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      generateAudio();
    }
  };

  return (
    <button
      onClick={handlePlayPause}
      disabled={isLoading}
      className={`p-2 rounded-full transition-all duration-200 ${
        isPlaying
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      title={isPlaying ? 'Stop' : (isUserMessage ? 'Play recording' : 'Play AI voice')}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : isPlaying ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}; 