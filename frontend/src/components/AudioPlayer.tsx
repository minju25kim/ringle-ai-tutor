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
  const currentChunkRef = useRef(0);
  const audioChunksRef = useRef<string[]>([]);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const componentId = useRef(Math.random().toString(36).substr(2, 9));

  // Split text into chunks (OpenAI TTS has a limit of ~4000 characters)
  const splitTextIntoChunks = useCallback((text: string) => {
    const maxChunkSize = 3000; // Safe limit for OpenAI TTS
    const sentences = text.split(/[.!?]+\s/); // Split on sentence endings with space
    const chunks: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;
      
      // Add proper punctuation if missing (except for last sentence which might have it)
      const punctuatedSentence = sentence + (i < sentences.length - 1 ? '. ' : '');
      
      if ((currentChunk + punctuatedSentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = punctuatedSentence;
      } else {
        currentChunk += (currentChunk ? '' : '') + punctuatedSentence;
      }
    }
    
    if (currentChunk.trim()) {
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

    setIsLoading(true);
    try {
      // Split text into chunks if it's too long
      const chunks = splitTextIntoChunks(text);

      if (chunks.length === 1) {
        // Single chunk - normal flow
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: chunks[0], voice }),
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

        audioChunksRef.current = audioUrls;
        currentChunkRef.current = 0;
        
        // Function to play chunks sequentially
        const playNextChunk = () => {
          const chunkIndex = currentChunkRef.current;
          const urls = audioChunksRef.current;
          
          if (chunkIndex < urls.length) {
            const audio = new Audio(urls[chunkIndex]);
            audioRef.current = audio;
            
            audio.onended = () => {
              currentChunkRef.current++;
              if (currentChunkRef.current < urls.length) {
                // Play next chunk
                playNextChunk();
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
          }
        };
        
        // Start playing the first chunk
        playNextChunk();
        setIsPlaying(true);
      }
      
    } catch (error) {
      // Error generating audio
    } finally {
      setIsLoading(false);
    }
  }, [audioUrl, text, voice, isLoading, onEnded, splitTextIntoChunks]);

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