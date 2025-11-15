import { useState, useCallback } from 'react';
import { classApi } from '@/services/api/classApi';
import type { EnrollmentResult } from '@/types/Class';
import { toast } from 'sonner';

/**
 * ============================================
 * useClassEnrollment Hook
 * ============================================
 *
 * Handles student enrollment operations:
 * - Bulk enroll students
 * - Remove students from class
 *
 * Features:
 * - Loading state management
 * - Success/error notifications
 * - Callback support for custom handling
 */

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
   * showing appropriate notifications
   */
  const enrollStudents = useCallback(
    async (classId: string, customerIds: string[]): Promise<EnrollmentResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await classApi.enrollStudents(classId, { customerIds });

        // Show success notification
        if (result.summary.successCount > 0) {
          toast.success(`${result.summary.successCount} student(s) enrolled successfully`);
        }

        // Show warning for failed enrollments
        if (result.summary.failedCount > 0) {
          toast.warning(`${result.summary.failedCount} student(s) failed to enroll`);
        }

        options.onSuccess?.();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to enroll students';
        setError(message);
        toast.error(message);
        options.onError?.(err instanceof Error ? err : new Error(message));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  /**
   * Remove student from class (soft delete)
   *
   * Marks enrollment as inactive with optional reason
   */
  const removeStudent = useCallback(
    async (classId: string, enrollmentId: string, reason?: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await classApi.removeStudent(classId, enrollmentId, reason);
        toast.success('Student removed from class');
        options.onSuccess?.();
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove student';
        setError(message);
        toast.error(message);
        options.onError?.(err instanceof Error ? err : new Error(message));
        throw err;
      } finally {
        setLoading(false);
      }
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
    loading,
    error,
    clearError
  };
};
