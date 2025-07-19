import { useState, useEffect, useRef } from 'react';
import { Message } from '@/types';
import { getAiResponse, textToSpeech } from '@/services/aiService';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messageIdCounter = useRef(0);

  useEffect(() => {
    // AI starts the conversation
    const aiInitialMessage = {
      id: `msg-${messageIdCounter.current++}`,
      text: 'Hello! What would you like to talk about today?',
      sender: 'ai',
    };
    setMessages([aiInitialMessage]);
  }, []);

  const addMessage = (text: string, sender: 'user' | 'ai', audioUrl?: string) => {
    const newMessage: Message = {
      id: `msg-${messageIdCounter.current++}`,
      text,
      sender,
      audioUrl,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const sendUserMessage = async (userMessageText: string, userAudioUrl?: string) => {
    addMessage(userMessageText, 'user', userAudioUrl);
    setIsAiTyping(true);

    const conversationHistory = [
      ...messages.map(msg => ({ sender: msg.sender, text: msg.text })),
      { sender: 'user', text: userMessageText } // Include the latest user message
    ];

    try {
      const stream = await getAiResponse(conversationHistory.map(msg => ({ id: '', ...msg })));
      if (stream) {
        const reader = stream.getReader();
        let aiResponseText = '';
        let done = false;

        // Add a placeholder for AI's response
        const aiPlaceholderMessage: Message = {
          id: `msg-${messageIdCounter.current++}`,
          text: '',
          sender: 'ai',
        };
        setMessages((prevMessages) => [...prevMessages, aiPlaceholderMessage]);

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const decoded = new TextDecoder().decode(value);
            aiResponseText += decoded;
            // Update the last AI message with streamed content
            setMessages((prevMessages) =>
              prevMessages.map((msg) =>
                msg.id === aiPlaceholderMessage.id ? { ...msg, text: aiResponseText } : msg
              )
            );
          }
        }
        // Once streaming is complete, generate audio for the full AI response
        const aiAudioUrl = await textToSpeech(aiResponseText);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === aiPlaceholderMessage.id ? { ...msg, audioUrl: aiAudioUrl } : msg
          )
        );

      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      addMessage('Sorry, I am having trouble responding right now.', 'ai');
    } finally {
      setIsAiTyping(false);
    }
  };

  return {
    messages,
    isAiTyping,
    addMessage,
    sendUserMessage,
  };
};