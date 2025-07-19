import React from 'react';
import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const bubbleClasses = isUser
    ? 'bg-blue-500 text-white self-end rounded-br-none'
    : 'bg-gray-200 text-gray-800 self-start rounded-bl-none';

  const handlePlayAudio = () => {
    if (message.audioUrl) {
      const audio = new Audio(message.audioUrl);
      audio.play().catch(e => console.error("Error playing audio:", e));
    }
  };

  return (
    <div className={`max-w-[70%] p-3 rounded-lg shadow-md my-2 ${bubbleClasses}`}>
      <p>{message.text}</p>
      {message.audioUrl && (
        <button
          onClick={handlePlayAudio}
          className="mt-2 px-3 py-1 bg-gray-300 text-gray-800 rounded-full text-sm hover:bg-gray-400"
        >
          ▶ Play
        </button>
      )}
    </div>
  );
};

export default MessageBubble;