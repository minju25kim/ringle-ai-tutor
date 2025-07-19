import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import MicrophoneButton from './MicrophoneButton';
import AudioVisualizer from './AudioVisualizer';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useChat } from '@/hooks/useChat';
import { transcribeAudio } from '@/services/aiService';

interface ChatInterfaceProps {
  userId: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ userId }) => {
  const { messages, isAiTyping, sendUserMessage } = useChat();
  const { isRecording, audioBlob, audioStream, startRecording, stopRecording } = useAudioRecorder();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      const recordedBlob = await stopRecording();
      if (recordedBlob) {
        const userAudioUrl = URL.createObjectURL(recordedBlob);
        // Transcribe audio and send to AI
        const transcribedText = await transcribeAudio(recordedBlob);
        if (transcribedText) {
          sendUserMessage(transcribedText, userAudioUrl);
        } else {
          console.error('Failed to transcribe audio.');
        }
      }
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-2xl bg-white rounded-lg shadow-xl p-4">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 border-b border-gray-200">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isAiTyping && (
          <div className="self-start bg-gray-200 text-gray-800 p-3 rounded-lg rounded-bl-none shadow-md animate-pulse">
            AI is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex flex-col items-center p-4 space-y-4">
        {isRecording && <AudioVisualizer audioStream={audioStream} />}
        <MicrophoneButton
          isRecording={isRecording}
          onToggleRecording={handleToggleRecording}
          disabled={isAiTyping} // Disable microphone while AI is typing
        />
        <button
          onClick={handleToggleRecording}
          disabled={isRecording || isAiTyping} // Disable if already recording or AI is typing
          className={`px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-200
            ${isRecording || isAiTyping ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 text-white'}
          `}
        >
          {isRecording ? 'Stop Recording' : 'Answer Complete'}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface;