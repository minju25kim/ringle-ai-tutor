
import React from 'react';
import { Membership } from '@/types';

interface MembershipInfoProps {
  memberships: Membership[];
  loading: boolean;
  error: string | null;
}

const MembershipInfo: React.FC<MembershipInfoProps> = ({ memberships, loading, error }) => {
  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow">Loading membership info...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg shadow">Error: {error}</div>;
  }

  if (memberships.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-yellow-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-yellow-800">No Active Memberships</h3>
            <p className="text-yellow-700">Purchase a membership below to start using AI Tutor features.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-4">Your Active Memberships</h2>
      {memberships.map((membership) => {
        const isExpired = new Date(membership.expires_at) < new Date();
        const conversationProgress = membership.limits.conversation 
          ? (membership.usage.conversation / membership.limits.conversation) * 100
          : 0;
        const analysisProgress = membership.limits.analysis 
          ? (membership.usage.analysis / membership.limits.analysis) * 100
          : 0;
        
        return (
          <div key={membership.id} className={`p-4 rounded-lg shadow border-l-4 ${
            membership.status === 'active' && !isExpired 
              ? 'bg-white border-l-green-500' 
              : 'bg-gray-50 border-l-red-500'
          }`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-semibold">{membership.name || membership.template_id}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                membership.status === 'active' && !isExpired
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {membership.status === 'active' && !isExpired ? 'Active' : isExpired ? 'Expired' : membership.status}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Customer Type</p>
                <p className="font-medium">{membership.customer_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Expires</p>
                <p className={`font-medium ${
                  isExpired ? 'text-red-600' : 'text-gray-800'
                }`}>
                  {new Date(membership.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-md font-semibold">Usage Status</h4>
              
              {/* Conversation Usage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Conversations</span>
                  <span className="text-sm text-gray-600">
                    {membership.usage.conversation} / {membership.limits.conversation === null ? '∞' : membership.limits.conversation}
                  </span>
                </div>
                {membership.limits.conversation && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        conversationProgress >= 100 ? 'bg-red-500' : 
                        conversationProgress >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(conversationProgress, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* Analysis Usage */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Analysis</span>
                  <span className="text-sm text-gray-600">
                    {membership.usage.analysis} / {membership.limits.analysis === null ? '∞' : membership.limits.analysis}
                  </span>
                </div>
                {membership.limits.analysis && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        analysisProgress >= 100 ? 'bg-red-500' : 
                        analysisProgress >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(analysisProgress, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MembershipInfo;
