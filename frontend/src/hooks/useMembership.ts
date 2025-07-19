import { useState, useEffect, useCallback } from 'react';
import { getActiveMembership } from '@/services/membershipService';
import { Membership } from '@/types';

export const useMembership = (userId: string) => {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembership = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeMembership = await getActiveMembership(userId);
      setMembership(activeMembership);
    } catch (err) {
      setError('Failed to fetch membership');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]); // Dependency on userId

  useEffect(() => {
    if (userId) {
      fetchMembership();
    }
  }, [userId, fetchMembership]); // fetchMembership is now a dependency

  return { membership, loading, error, refetch: fetchMembership };
};