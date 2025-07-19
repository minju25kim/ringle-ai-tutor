
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/hooks/useUser';
import { checkFeatureUsage, updateFeatureUsage } from '@/services/membershipService';
import ChatInterface from '@/components/ChatInterface';

export default function ChatPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  const [canChat, setCanChat] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAndDecrementUsage = async () => {
      if (!currentUser.id) {
        setError('No user selected. Please go back to the home page.');
        setLoading(false);
        return;
      }

      try {
        // 1. Check feature usage
        const usageCheck = await checkFeatureUsage(currentUser.id, 'conversation');
        if (!usageCheck.can_use) {
          setCanChat(false);
          setError(usageCheck.reason || 'You cannot start a conversation.');
          return;
        }

        // 2. Decrement usage if allowed
        const usageUpdate = await updateFeatureUsage(currentUser.id, 'conversation');
        if (!usageUpdate) {
          setError('Failed to decrement conversation usage. Please try again.');
          setCanChat(false);
          return;
        }

        setCanChat(true);
      } catch (err) {
        console.error('Error during chat usage check/update:', err);
        setError('An unexpected error occurred. Please try again.');
        setCanChat(false);
      } finally {
        setLoading(false);
      }
    };

    checkAndDecrementUsage();
  }, [currentUser.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-red-700">
        <p className="text-lg font-bold">Error: {error}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (canChat === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-red-700">
        <p className="text-lg font-bold">{error}</p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">AI Tutor Conversation</h1>
      {canChat && <ChatInterface userId={currentUser.id} />}
    </div>
  );
}
