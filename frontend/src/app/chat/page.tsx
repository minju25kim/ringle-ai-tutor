'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { nanoid } from 'nanoid';

export default function Chat() {
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);
  const [lastAiMessageId, setLastAiMessageId] = useState<string>('');
  const [playingAiMessageId, setPlayingAiMessageId] = useState<string | null>(null);
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);

  const { messages, append, isLoading } = useChat({
    initialMessages: [
      {
        id: 'welcome-message',
        role: 'assistant',
        content: "Hello! I'm your English practice helper. I'm here to help you improve your speaking skills through conversation. What would you like to talk about today? ",
      },
    ],
  });

  const handleRecordingComplete = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    const audioUrl = URL.createObjectURL(audioBlob);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('handleRecordingComplete: API response error', errorText);
      return;
    }

    const result = await response.json();
    const transcribedText = result.text;

    append({
      id: nanoid(),
      role: 'user',
      content: transcribedText,
      createdAt: new Date(),
      data: { audioUrl },
    });

    setUserAudioUrl(audioUrl);
  };

  // Auto-play welcome message when user enters chat
  useEffect(() => {
    if (!hasPlayedWelcome && messages.length > 0) {
      const welcomeMessage = messages.find(m => m.id === 'welcome-message');
      if (welcomeMessage) {
        // Set flag to indicate welcome has been played
        setHasPlayedWelcome(true);
      }
    }
  }, [messages, hasPlayedWelcome]);

  // Track AI message IDs for potential future use and trigger AI audio playback
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      
      if (latestMessage.role === 'assistant' && latestMessage.id !== lastAiMessageId) {
        setLastAiMessageId(latestMessage.id);
        // Only set playing ID if we're not already playing something and this is a new message
        if (!playingAiMessageId) {
          setPlayingAiMessageId(latestMessage.id);
        }
      }
    }
  }, [messages, lastAiMessageId, playingAiMessageId]);

  // Clear playing state when AI finishes speaking
  const handleAiAudioEnded = () => {
    setPlayingAiMessageId(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto">
      {/* Chat messages container - scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pb-16">
        {messages.map(message => (
          <div key={message.id} className="whitespace-pre-wrap mb-4" data-message-id={message.id}>
            <div className={`p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-500 text-white ml-auto' 
                : 'bg-gray-200 text-gray-800'
            } max-w-[80%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return <div key={`${message.id}-${i}`}>{part.text}</div>;
                    }
                  })}
                </div>
                
                {message.role === 'user' && (message.data as any)?.audioUrl && (
                  <AudioPlayer 
                    audioUrl={(message.data as any).audioUrl}
                    isUserMessage={true}
                    className="flex-shrink-0 audio-player-button"
                  />
                )}

                {message.role === 'assistant' && (
                  // Use AudioPlayer for AI messages only
                  <AudioPlayer 
                    text={(() => {
                      const fullText = message.content || message.parts.map(part => part.type === 'text' ? part.text : '').join('');
                      console.log('AI message text for TTS:', {
                        id: message.id,
                        content: message.content,
                        parts: message.parts,
                        fullText: fullText,
                        textLength: fullText.length,
                        sentences: fullText.split('.').length
                      });
                      return fullText;
                    })()}
                    voice="nova"
                    className="flex-shrink-0 audio-player-button"
                    isUserMessage={false}
                    autoPlay={message.id === playingAiMessageId}
                    onEnded={handleAiAudioEnded}
                  />
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-center mt-8">
          {isLoading && (
            <div className="text-center text-gray-500">
              <div className="inline-block w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              AI is thinking...
            </div>
          )}
        </div>
      </div>

      {/* Recording div - fixed at bottom */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-2 bg-white border-t border-gray-200">
        <VoiceRecorder onRecordingComplete={handleRecordingComplete} disabled={!!playingAiMessageId || isLoading} />
      </div>
    </div>
  );
}