import { useState, useEffect, useCallback } from 'react';
import { getUserActiveMemberships } from '@/services/membershipService';
import { Membership } from '@/types';

export const useMembership = (userId: string) => {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMemberships = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const activeMemberships = await getUserActiveMemberships(userId);
      setMemberships(activeMemberships);
    } catch (err) {
      setError('Failed to fetch memberships');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchMemberships();
    }
  }, [userId, fetchMemberships]);

  return { memberships, loading, error, refetch: fetchMemberships };
};