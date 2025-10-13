import { useState, useEffect, useCallback } from 'react';
import { classApi } from '@/services/api/classApi';
import type { Class, ClassListParams, CreateClassRequest, UpdateClassRequest } from '@/types/api/Class';
import type { UseDataReturn, UseCreateReturn, UseUpdateReturn, UseDeleteReturn } from '@/types/hooks/HookTypes';

export interface UseClassResult
  extends UseDataReturn<Class>,
    UseCreateReturn<Class, CreateClassRequest>,
    UseUpdateReturn<Class, UpdateClassRequest>,
    UseDeleteReturn {
  fetchClasses: () => Promise<void>;
}

export const useClass = (params?: ClassListParams): UseClassResult => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await classApi.getClasses(params);
    setClasses(response.data.classes);
    setLoading(false);
  }, [params]);

  const createClass = useCallback(async (data: CreateClassRequest): Promise<Class> => {
    setLoading(true);
    setError(null);

    const response = await classApi.createClass(data);
    setClasses((prev) => [response.data, ...prev]);
    setLoading(false);
    return response.data;
  }, []);

  const updateClass = useCallback(async (id: string, data: UpdateClassRequest): Promise<Class> => {
    setLoading(true);
    setError(null);

    const response = await classApi.updateClass(id, data);
    setClasses((prev) => prev.map((cls) => (cls._id === id ? response.data : cls)));
    setLoading(false);
    return response.data;
  }, []);

  const deleteClass = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);

    await classApi.deleteClass(id);
    setClasses((prev) => prev.filter((cls) => cls._id !== id));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return {
    data: classes,
    loading,
    error,
    refetch: fetchClasses,
    create: createClass,
    update: updateClass,
    delete: deleteClass,
    fetchClasses
  };
};
