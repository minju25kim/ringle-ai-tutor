'use client';

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import ErrorToast from '@/components/ErrorToast';
import { useUserStore } from '@/hooks/useUser';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createApiRequest, isOnline, waitForOnline } from '@/utils/networkUtils';
import { nanoid } from 'nanoid';

// Memoized message component for better performance
const MessageItem = memo(function MessageItem({ message, playingAiMessageId, handleAiAudioEnded }: { 
  message: { id: string; role: string; content?: string; parts: Array<{ type: string; text: string }>; createdAt?: Date; data?: { audioUrl?: string } }; 
  playingAiMessageId: string | null; 
  handleAiAudioEnded: () => void; 
}) {
  return (
  <div className="flex items-start space-x-3" data-message-id={message.id}>
    {/* Avatar */}
    <div className="flex-shrink-0">
      {message.role === 'user' ? (
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      ) : (
        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>

    {/* Message content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center space-x-2 mb-1">
        <span className="text-sm font-medium text-gray-900">
          {message.role === 'user' ? 'You' : 'AI Tutor'}
        </span>
        <span className="text-xs text-gray-500">
          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'now'}
        </span>
      </div>
      
      <div className={`inline-block px-4 py-3 rounded-2xl max-w-lg ${
        message.role === 'user' 
          ? 'bg-blue-600 text-white' 
          : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
      }`}>
        <div className="whitespace-pre-wrap">
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <span key={`${message.id}-${i}`}>{part.text}</span>;
              default:
                return null;
            }
          })}
        </div>
      </div>
      
      {/* Audio controls */}
      <div className="flex items-center mt-2 space-x-2">
        {message.role === 'user' && message.data?.audioUrl && (
          <AudioPlayer 
            audioUrl={message.data.audioUrl}
            isUserMessage={true}
            className="text-blue-600 hover:text-blue-800"
          />
        )}

        {message.role === 'assistant' && (
          <AudioPlayer 
            text={(() => {
              const fullText = message.content || message.parts.map((part) => part.type === 'text' ? part.text : '').join('');
              console.log('📝 Text extraction for AudioPlayer:', {
                messageId: message.id,
                source: message.content ? 'message.content' : 'message.parts',
                extractedText: fullText,
                textLength: fullText.length,
                firstPart: fullText.substring(0, 100),
                lastPart: fullText.substring(Math.max(0, fullText.length - 100)),
                wordCount: fullText.split(' ').length
              });
              
              // Verify the text makes sense and is complete
              if (fullText.length < 10) {
                console.warn('⚠️ Extracted text seems too short:', fullText);
              }
              if (!fullText.trim().endsWith('.') && !fullText.trim().endsWith('!') && !fullText.trim().endsWith('?')) {
                console.warn('⚠️ Extracted text might be incomplete (no ending punctuation):', fullText.slice(-50));
              }
              
              return fullText;
            })()} 
            voice="nova"
            className="text-gray-600 hover:text-gray-800"
            isUserMessage={false}
            autoPlay={message.id === playingAiMessageId}
            onEnded={handleAiAudioEnded}
          />
        )}
      </div>
    </div>
  </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.playingAiMessageId === nextProps.playingAiMessageId
  );
});

export default function Chat() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const { errors, removeError, handleApiError, handleNetworkError } = useErrorHandler();
  const [membershipValidated, setMembershipValidated] = useState(false);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [membershipError, setMembershipError] = useState<string | null>(null);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);
  const [lastAiMessageId, setLastAiMessageId] = useState<string>('');
  const [playingAiMessageId, setPlayingAiMessageId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, append, isLoading } = useChat({
    initialMessages: [
      {
        id: 'welcome-message',
        role: 'assistant',
        content: "Hello! I'm your English practice helper. I'm here to help you improve your speaking skills through conversation. What would you like to talk about today?",
      },
    ],
  });

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check membership before allowing chat access
  useEffect(() => {
    const checkMembership = async () => {
      if (!currentUser?.id) {
        setMembershipError('No user selected');
        setMembershipLoading(false);
        return;
      }

      if (!isOnline()) {
        handleNetworkError(() => checkMembership());
        setMembershipError('No internet connection');
        setMembershipLoading(false);
        return;
      }

      try {
        console.log('Checking membership for user:', currentUser.id);
        
        const response = await createApiRequest('/api/usage/check', {
          method: 'POST',
          body: JSON.stringify({
            user_id: currentUser.id,
            feature_type: 'conversation'
          }),
        });

        const data = await response.json();
        console.log('Membership check response:', data);

        if (data.can_use) {
          // Membership is valid, now start the conversation and deduct usage
          console.log('Membership validated, starting conversation...');
          
          try {
            const startResponse = await createApiRequest('/api/usage/start-conversation', {
              method: 'POST',
              body: JSON.stringify({
                user_id: currentUser.id,
                feature_type: 'conversation'
              }),
            });

            const startData = await startResponse.json();
            console.log('Start conversation response:', startData);

            setMembershipValidated(true);
            setMembershipError(null);
            console.log('Conversation started successfully, usage deducted');
          } catch (startError: unknown) {
            handleApiError(startError as Error, 'Starting conversation', () => checkMembership());
            setMembershipError('Failed to start conversation');
          }
        } else {
          setMembershipError(data.reason || 'No valid membership for conversations');
        }
      } catch (error: unknown) {
        handleApiError(error as Error, 'Checking membership', () => checkMembership());
        setMembershipError('Failed to validate membership');
      } finally {
        setMembershipLoading(false);
      }
    };

    checkMembership();
  }, [currentUser?.id, handleApiError, handleNetworkError]);

  const handleRecordingComplete = async (audioBlob: Blob, hasVoice: boolean) => {
    console.log('Recording completed. Has voice:', hasVoice, 'Blob size:', audioBlob.size);
    
    // If no voice detected but we have a reasonable blob size, try anyway
    if (!hasVoice && audioBlob.size < 5000) {
      console.log('No voice detected and blob too small, skipping transcription');
      console.warn('Voice detection: No clear voice detected in recording');
      return;
    }

    if (audioBlob.size < 500) { // Very small file check
      console.log('Audio blob too small, skipping transcription');
      handleApiError(
        { message: 'Recording too short. Please record a longer message.' },
        'Audio validation'
      );
      return;
    }

    // Log voice detection result but proceed with transcription
    if (!hasVoice) {
      console.log('Voice detection failed but attempting transcription due to blob size:', audioBlob.size);
    }

    if (!isOnline()) {
      handleNetworkError(() => handleRecordingComplete(audioBlob, hasVoice));
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');
    const audioUrl = URL.createObjectURL(audioBlob);

    const transcribeWithRetry = async () => {
      try {
        // Wait for connection if offline
        if (!isOnline()) {
          await waitForOnline();
        }

        const response = await createApiRequest('/api/transcribe', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        const transcribedText = result.text;

        if (!transcribedText || transcribedText.trim().length < 3) {
          console.log('Transcription too short or empty:', transcribedText);
          handleApiError(
            { message: 'Could not understand the audio. Please speak more clearly.' },
            'Transcription validation'
          );
          return;
        }

        append({
          id: nanoid(),
          role: 'user',
          content: transcribedText,
          createdAt: new Date(),
          data: { audioUrl },
        });

        // Audio URL is stored in message data
      } catch (error: unknown) {
        handleApiError(error as Error, 'Transcribing audio', transcribeWithRetry);
      }
    };

    transcribeWithRetry();
  };

  // Auto-play welcome message when user enters chat
  useEffect(() => {
    if (!hasPlayedWelcome && messages.length > 0) {
      const welcomeMessage = messages.find(m => m.id === 'welcome-message');
      if (welcomeMessage) {
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

  // Optimized auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  }, []);

  useEffect(() => {
    // Only scroll if messages exist and there's a new message
    if (messages.length > 0) {
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(scrollToBottom);
    }
  }, [messages.length, scrollToBottom]);

  // Memoized audio end handler
  const handleAiAudioEnded = useCallback(() => {
    setPlayingAiMessageId(null);
  }, []);

  // Memoized error handler to prevent unnecessary re-renders
  const handleRetryError = useCallback((error: { retry?: () => void; id: string }) => {
    if (error.retry) {
      error.retry();
    }
    removeError(error.id);
  }, [removeError]);

  // Show loading state while checking membership
  if (membershipLoading) {
    return (
      <div className="flex flex-col h-screen max-w-2xl mx-auto items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Checking membership...</h2>
          <p className="text-gray-600">Please wait while we verify your access</p>
        </div>
      </div>
    );
  }


  // Show error state if membership validation failed
  if (membershipError || !membershipValidated) {
    return (
      <div className="flex flex-col h-screen max-w-2xl mx-auto items-center justify-center bg-gray-50 p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-200 max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Access Denied</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            {membershipError || 'You need an active membership to access the chat.'}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 font-medium"
            >
              Go to Home
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ErrorToast 
        errors={errors} 
        onDismiss={removeError} 
        onRetry={handleRetryError}
      />
      
      {/* Offline indicator */}
      {isOffline && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg text-sm z-50 animate-pulse">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.5 4.5a.5.5 0 11-1 0 .5.5 0 011 0z" clipRule="evenodd" />
            </svg>
            <span>You&apos;re offline</span>
          </div>
        </div>
      )}
    
      <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI English Tutor</h1>
              <p className="text-sm text-gray-500">Practice your English conversation skills</p>
            </div>
          </div>
        </div>

        {/* Chat messages container - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message) => (
          <MessageItem 
            key={message.id}
            message={message}
            playingAiMessageId={playingAiMessageId}
            handleAiAudioEnded={handleAiAudioEnded}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <div className="h-4 bg-gray-300 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 max-w-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
        </div>

        {/* Recording div - fixed at bottom */}
        <div className="bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} disabled={!!playingAiMessageId || isLoading || isOffline} />
        </div>
      </div>
    </>
  );
}