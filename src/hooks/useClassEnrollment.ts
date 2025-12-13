import { useState, useCallback } from 'react';
import { classApi } from '@/services/api/classApi';
import type { EnrollmentResult } from '@/types/Class';
import { toast } from 'sonner';
interface UseClassEnrollmentOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const useClassEnrollment = (options: UseClassEnrollmentOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Enroll students to class (bulk)
   *
   * Handles both successful and failed enrollments,
   * showing appropriate notifications.
   */
  const enrollStudents = useCallback(
    async (classId: string, customerIds: string[]): Promise<EnrollmentResult | null> => {
      setLoading(true);
      setError(null);

      const result = await classApi.enrollStudents(classId, { customerIds });

      // Show warning for failed enrollments (keep this as it's informative)
      if (result.summary.failedCount > 0) {
        toast.warning(`${result.summary.failedCount} student(s) failed to enroll`);
      }

      // Call onSuccess callback (component will handle success toast)
      options.onSuccess?.();
      setLoading(false);
      return result;
    },
    [options]
  );

  /**
   * Remove student from class (soft delete)
   */
  const removeStudent = useCallback(
    async (classId: string, enrollmentId: string, reason?: string) => {
      setLoading(true);
      setError(null);

      const response = await classApi.removeStudent(classId, enrollmentId, reason);
      toast.success('Student removed from class');
      options.onSuccess?.();
      setLoading(false);
      return response;
    },
    [options]
  );

  /**
   * Activate student enrollment in class
   */
  const activateStudent = useCallback(
    async (classId: string, enrollmentId: string) => {
      setLoading(true);
      setError(null);

      const response = await classApi.activateStudent(classId, enrollmentId);
      toast.success('Student activated successfully');
      options.onSuccess?.();
      setLoading(false);
      return response;
    },
    [options]
  );

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    enrollStudents,
    removeStudent,
    activateStudent,
    loading,
    error,
    clearError
  };
};
