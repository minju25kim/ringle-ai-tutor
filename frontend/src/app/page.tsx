
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
  const { currentUser } = useUserStore(); // Get currentUser from store
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
    <main className="flex min-h-screen flex-col items-center justify-between p-8 md:p-24 bg-gray-50 pt-24 md:pt-24">
      {/* Header */}
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Ringle AI Tutor
        </p>
      </div>

      {/* Gradient Background */}
      <div className="relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''_] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''_] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px]">
      </div>

      {/* Main Content */}
      <div className="mb-32 grid text-center lg:mb-0 lg:w-full lg:max-w-5xl lg:grid-cols-1 lg:text-left gap-8">
        <UserSwitcher />
        <MembershipInfo memberships={memberships} loading={loading} error={error} />

        {/* Membership Plans Section */}
        <div className="w-full bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Available Membership Plans ({currentUser.customer_type})</h2>
          {templates.length === 0 && (
            <p className="text-gray-600 text-center py-8">No membership plans available for this user type.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="bg-white border border-gray-200 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{template.name}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{template.description}</p>
                <div className="space-y-2 mb-6">
                  {template.price !== null && (
                    <p className="text-2xl font-bold text-blue-600">${template.price}</p>
                  )}
                  <p className="text-sm text-gray-500">Duration: {template.duration_days} days</p>
                  <p className="text-sm text-gray-500">
                    Conversations: {template.limits.conversation === null ? 'Unlimited' : template.limits.conversation}
                  </p>
                  <p className="text-sm text-gray-500">
                    Analysis: {template.limits.analysis === null ? 'Unlimited' : template.limits.analysis}
                  </p>
                </div>
                <button
                  onClick={() => handlePurchase(template.id)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={purchaseLoading || !currentUser.id}
                >
                  {purchaseLoading ? 'Purchasing...' : 'Purchase'}
                </button>
              </div>
            ))}
          </div>
          {purchaseError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-medium">Error: {purchaseError}</p>
            </div>
          )}
        </div>

        {/* Conversation Access Section */}
        <div className="w-full bg-white rounded-xl shadow-sm p-6">
          <div className="mb-6 p-6 rounded-xl border border-gray-200 bg-gray-50">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">Conversation Access</h3>
            {loading ? (
              <div className="flex items-center">
                <div className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-gray-600">Checking membership...</span>
              </div>
            ) : error ? (
              <div className="text-red-600">
                <span className="block font-medium">❌ Access Denied</span>
                <span className="text-sm">{error}</span>
              </div>
            ) : !memberships || memberships.length === 0 ? (
              <div className="text-yellow-600">
                <span className="block font-medium">⚠️ No Active Membership</span>
                <span className="text-sm">Purchase a membership to start conversations</span>
              </div>
            ) : (
              (() => {
                const hasConversationAccess = memberships.some(m => 
                  m.status === 'active' && 
                  (m.limits.conversation === null || m.usage.conversation < m.limits.conversation)
                );
                return (
                  <div className={hasConversationAccess ? "text-green-600" : "text-red-600"}>
                    <span className="block font-medium">
                      {hasConversationAccess ? "✅ Access Granted" : "❌ Usage Limit Reached"}
                    </span>
                    <span className="text-sm">
                      {hasConversationAccess 
                        ? "You can start a conversation" 
                        : "All conversation limits have been reached"}
                    </span>
                  </div>
                );
              })()
            )}
          </div>

          <button
            onClick={handleStartConversation}
            className={`w-full px-8 py-4 rounded-xl text-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
              loading || error !== null || !memberships || memberships.length === 0 ||
              !memberships.some(m => 
                m.status === 'active' && 
                (m.limits.conversation === null || m.usage.conversation < m.limits.conversation)
              )
                ? 'bg-gray-400 text-gray-700 cursor-not-allowed shadow-none transform-none'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
            }`}
            disabled={
              loading || error !== null || !memberships || memberships.length === 0 ||
              !memberships.some(m => 
                m.status === 'active' && 
                (m.limits.conversation === null || m.usage.conversation < m.limits.conversation)
              )
            }
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Checking...
              </div>
            ) : (
              'Start Conversation 🚀'
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
