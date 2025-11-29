import { useState, useEffect } from 'react';
import { classApi } from '@/services/api/classApi';

interface UseCustomerClassScheduleParams {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

interface UseCustomerClassScheduleResult {
  data: Record<string, unknown> | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useCustomerClassSchedule = (
  params: UseCustomerClassScheduleParams = {}
): UseCustomerClassScheduleResult => {
  const { startDate, endDate, enabled = true } = params;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    const response = await classApi.getMyClassSchedule({
      startDate,
      endDate
    });
    // API returns array directly
    setData(response);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, enabled]);

  const refetch = async () => {
    await fetchData();
  };

  return { data, isLoading, error, refetch };
};
