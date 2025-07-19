
import React from 'react';
import { Membership } from '@/types';

interface MembershipInfoProps {
  membership: Membership | null;
  loading: boolean;
  error: string | null;
}

const MembershipInfo: React.FC<MembershipInfoProps> = ({ membership, loading, error }) => {
  if (loading) {
    return <div className="p-4 bg-white rounded-lg shadow">Loading membership info...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg shadow">Error: {error}</div>;
  }

  if (!membership) {
    return <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg shadow">No active membership found for this user.</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-2">Your Active Membership</h2>
      <p><strong>ID:</strong> {membership.id}</p>
      <p><strong>Status:</strong> {membership.status}</p>
      <p><strong>Expires:</strong> {new Date(membership.expires_at).toLocaleDateString()}</p>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Usage Limits:</h3>
        <p><strong>Conversations:</strong> {membership.usage.conversation} / {membership.limits.conversation === null ? 'Unlimited' : membership.limits.conversation}</p>
        <p><strong>Analysis:</strong> {membership.usage.analysis} / {membership.limits.analysis === null ? 'Unlimited' : membership.limits.analysis}</p>
      </div>
    </div>
  );
};

export default MembershipInfo;
