
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/hooks/useUser';
import { useMembership } from '@/hooks/useMembership';
import UserSwitcher from '@/components/UserSwitcher';
import MembershipInfo from '@/components/MembershipInfo';
import { getMembershipTemplates, purchaseMembership } from '@/services/membershipService';
import { MembershipTemplate } from '@/types';

export default function Home() {
  const router = useRouter();
  const { currentUser, setUserId } = useUserStore(); // Get currentUser from store
  const { memberships, loading, error, refetch } = useMembership(currentUser.id); // Pass currentUser.id and get refetch
  const [templates, setTemplates] = useState<MembershipTemplate[]>([]);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Pass currentUser.customer_type to filter templates
        const fetchedTemplates = await getMembershipTemplates(currentUser.customer_type);
        setTemplates(fetchedTemplates);
      } catch (err) {
        console.error('Failed to fetch templates:', err);
      }
    };
    fetchTemplates();
  }, [currentUser.customer_type]); // Re-fetch when customer_type changes

  const handleStartConversation = () => {
    router.push('/chat');
  };

  const handlePurchase = async (templateId: string) => {
    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      const newMembership = await purchaseMembership(currentUser.id, templateId); // Use currentUser.id
      if (newMembership) {
        alert(`Successfully purchased ${newMembership.template_id} for ${currentUser.name}!`);
        refetch(); // Re-fetch membership to update UI
      } else {
        setPurchaseError('Failed to purchase membership.');
      }
      console.log('newMembership', newMembership);
    } catch (err: any) {
      setPurchaseError(err.message || 'An error occurred during purchase.');
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Ringle AI Tutor
        </p>
      </div>

      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''_] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''_] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px]">
        {/* Your existing content */}
      </div>

      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-1 lg:text-left gap-8">
        <UserSwitcher />
        <MembershipInfo memberships={memberships} loading={loading} error={error} />

        <div className="w-full">
          <h2 className="text-xl font-bold mb-4">Available Membership Plans ({currentUser.customer_type})</h2>
          {templates.length === 0 && <p>No membership plans available for this user type.</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <div key={template.id} className="border p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold">{template.name}</h3>
                <p className="text-gray-600">{template.description}</p>
                {template.price !== null && <p className="font-bold mt-2">Price: ${template.price}</p>}
                <p>Duration: {template.duration_days} days</p>
                <p>Conversations: {template.limits.conversation === null ? 'Unlimited' : template.limits.conversation}</p>
                <p>Analysis: {template.limits.analysis === null ? 'Unlimited' : template.limits.analysis}</p>
                <button
                  onClick={() => handlePurchase(template.id)}
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  disabled={purchaseLoading || !currentUser.id}
                >
                  {purchaseLoading ? 'Purchasing...' : 'Purchase'}
                </button>
              </div>
            ))}
          </div>
          {purchaseError && <p className="text-red-500 mt-2">Error: {purchaseError}</p>}
        </div>

        <button
          onClick={handleStartConversation}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
          disabled={loading || error !== null || !memberships} // Disable if loading, error, or no membership
        >
          Start Conversation
        </button>
      </div>
    </main>
  );
}
