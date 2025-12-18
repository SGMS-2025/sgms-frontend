import { useState, useEffect } from 'react';
import { serviceContractApi, type SchedulingCapacity } from '@/services/api/serviceContractApi';

/**
 * Hook to fetch and manage PT contract scheduling capacity
 * Returns available slots for creating new PT schedules
 */
export function useSchedulingCapacity(contractId?: string) {
  const [capacity, setCapacity] = useState<SchedulingCapacity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contractId) {
      fetchCapacity();
    } else {
      // Reset state if no contractId
      setCapacity(null);
      setError(null);
    }
  }, [contractId]);

  const fetchCapacity = async () => {
    if (!contractId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await serviceContractApi.getSchedulingCapacity(contractId);
      setCapacity(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch scheduling capacity';
      setError(errorMessage);
      console.error('Failed to fetch scheduling capacity:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    capacity,
    loading,
    error,
    refetch: fetchCapacity
  };
}
