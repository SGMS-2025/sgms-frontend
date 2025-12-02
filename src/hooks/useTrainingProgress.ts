import { useState, useEffect, useCallback } from 'react';
import { trainingProgressApi } from '@/services/api/trainingProgressApi';
import type {
  TrainingProgress,
  TrainingProgressDisplay,
  TrainingProgressListParams,
  CreateTrainingProgressRequest,
  UpdateTrainingProgressRequest,
  TrainingProgressPhoto,
  TrainingProgressAggregated,
  UseTrainingProgressReturn,
  BackendPaginationResponse
} from '@/types/api/TrainingProgress';
import type { ApiResponse } from '@/types/api/Api';

// Transform function for aggregated response (flat structure)
const transformProgressToDisplay = (progress: TrainingProgressAggregated): TrainingProgressDisplay => ({
  id: progress._id,
  customerName: progress.customerName || 'Unknown',
  customerAvatar: progress.customerAvatar,
  trainerName: progress.trainerName || 'Unknown',
  date: (() => {
    if (!progress.trackingDate) return 'Invalid Date';
    const date = new Date(progress.trackingDate);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('vi-VN');
  })(),
  weight: progress.weight,
  height: progress.height,
  bmi: progress.bmi,
  bodyFatPercentage: progress.bodyFatPercentage,
  // Body Measurements
  chest: progress.chest,
  waist: progress.waist,
  hips: progress.hips,
  arms: progress.arms,
  thighs: progress.thighs,
  muscleMassPercentage: progress.muscleMassPercentage,
  bodyWaterPercentage: progress.bodyWaterPercentage,
  metabolicAge: progress.metabolicAge,
  strength: progress.strength,
  notes: progress.notes || '',
  photos: progress.photos || [],
  exercises: progress.exercises || [],
  exerciseCount: progress.exerciseCount || 0,
  photoCount: progress.photoCount || 0,
  selected: false
});

export const useTrainingProgress = (initialParams: TrainingProgressListParams = {}): UseTrainingProgressReturn => {
  // State for list
  const [progressList, setProgressList] = useState<TrainingProgressDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<BackendPaginationResponse | null>(null);
  const [params, setParams] = useState<TrainingProgressListParams>(initialParams);

  // Operation loading states
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Fetch list
  const fetchProgressList = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await trainingProgressApi.getTrainingProgressList(params);

    if (response.success) {
      const transformed = response.data.progressRecords.map(transformProgressToDisplay);
      setProgressList(transformed);
      setPagination(response.data.pagination);
    } else {
      setError(response.message || 'Failed to fetch training progress');
    }

    setLoading(false);
  }, [params]);

  // Refetch
  const refetch = useCallback(async () => {
    await fetchProgressList();
  }, [fetchProgressList]);

  // Go to page
  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  // ✅ OPTIMIZED: Create progress - don't refetch immediately
  const createProgress = useCallback(
    async (data: CreateTrainingProgressRequest) => {
      setCreateLoading(true);
      const response = await trainingProgressApi.createTrainingProgress(data);

      // ✅ Don't refetch here - let the caller decide when to refetch
      // This avoids unnecessary API calls when we still need to upload photos

      setCreateLoading(false);
      return response;
    },
    [] // No dependency on refetch
  );

  // Update progress
  const updateProgress = useCallback(
    async (progressId: string, data: UpdateTrainingProgressRequest) => {
      setUpdateLoading(true);
      const response = await trainingProgressApi.updateTrainingProgress(progressId, data);
      if (response.success) {
        await refetch();
      }
      setUpdateLoading(false);
      return response;
    },
    [refetch]
  );

  // Delete progress
  const deleteProgress = useCallback(
    async (progressId: string) => {
      setDeleteLoading(true);
      const response = await trainingProgressApi.deleteTrainingProgress(progressId);
      if (response.success) {
        await refetch();
      }
      setDeleteLoading(false);
      return response;
    },
    [refetch]
  );

  // Get customer stats
  const getCustomerStats = useCallback(async (customerId: string, statsParams?: { days?: number }) => {
    return await trainingProgressApi.getCustomerProgressStats(customerId, statsParams);
  }, []);

  // Get customer trend
  const getCustomerTrend = useCallback(async (customerId: string, days?: number) => {
    return await trainingProgressApi.getCustomerProgressTrend(customerId, days);
  }, []);

  // Add photos
  const addPhotos = useCallback(
    async (progressId: string, photos: TrainingProgressPhoto[]) => {
      setPhotoLoading(true);
      const response = await trainingProgressApi.addPhotosToProgress(progressId, photos);
      if (response.success) {
        await refetch();
      }
      setPhotoLoading(false);
      return response;
    },
    [refetch]
  );

  // ✅ OPTIMIZED: Upload photos - don't refetch immediately
  const uploadPhotos = useCallback(
    async (progressId: string, files: File[]) => {
      setPhotoLoading(true);

      try {
        const response = await trainingProgressApi.uploadPhotosToProgress(progressId, files);

        // ✅ Don't refetch here - let the caller decide
        // This prevents refetching the entire list just for photo upload

        setPhotoLoading(false);
        return response;
      } catch (error) {
        setPhotoLoading(false);

        // Return a failed response with proper ApiResponse type
        // Cast to ApiResponse<TrainingProgress> to match the expected return type
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Photo upload failed',
          data: {} as TrainingProgress,
          requestId: '',
          timestamp: new Date().toISOString(),
          meta: {
            statusCode: 500,
            severity: 'error'
          }
        } as ApiResponse<TrainingProgress>;
      }
    },
    [] // No dependency on refetch
  );

  // Remove photo
  const removePhoto = useCallback(
    async (progressId: string, photoIndex: number) => {
      setPhotoLoading(true);
      const response = await trainingProgressApi.removePhotoFromProgress(progressId, photoIndex);
      if (response.success) {
        await refetch();
      }
      setPhotoLoading(false);
      return response;
    },
    [refetch]
  );

  // Fetch on mount and when params change
  useEffect(() => {
    fetchProgressList();
  }, [fetchProgressList]);

  return {
    // List data
    progressList,
    loading,
    error,
    pagination,
    refetch,
    goToPage,

    // CRUD operations
    createProgress,
    updateProgress,
    deleteProgress,

    // Stats and Trend
    getCustomerStats,
    getCustomerTrend,

    // Photo operations
    addPhotos,
    uploadPhotos,
    removePhoto,

    // Operation states
    createLoading,
    updateLoading,
    deleteLoading,
    photoLoading
  };
};
