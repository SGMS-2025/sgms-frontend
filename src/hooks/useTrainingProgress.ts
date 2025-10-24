import { useState, useEffect, useCallback } from 'react';
import { trainingProgressApi } from '@/services/api/trainingProgressApi';
import type {
  TrainingProgress,
  TrainingProgressDisplay,
  TrainingProgressListParams,
  CreateTrainingProgressRequest,
  UpdateTrainingProgressRequest,
  TrainingProgressPhoto,
  UseTrainingProgressReturn,
  BackendPaginationResponse
} from '@/types/api/TrainingProgress';

// Transform function
const transformProgressToDisplay = (progress: TrainingProgress): TrainingProgressDisplay => ({
  id: progress._id,
  customerName: progress.customerId?.userId?.fullName || 'Unknown',
  customerAvatar: progress.customerId?.userId?.avatar?.url,
  trainerName: progress.trainerId?.fullName || 'Unknown',
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
  strength: progress.strength,
  notes: progress.notes || '',
  photos: progress.photos || [],
  exercises: progress.exercises || [],
  exerciseCount: progress.exercises?.length || 0,
  photoCount: progress.photos?.length || 0,
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

  // Create progress
  const createProgress = useCallback(
    async (data: CreateTrainingProgressRequest) => {
      setCreateLoading(true);
      const response = await trainingProgressApi.createTrainingProgress(data);
      if (response.success) {
        await refetch(); // Refresh list after creation
      }
      setCreateLoading(false);
      return response;
    },
    [refetch]
  );

  // Update progress
  const updateProgress = useCallback(
    async (progressId: string, data: UpdateTrainingProgressRequest) => {
      setUpdateLoading(true);
      const response = await trainingProgressApi.updateTrainingProgress(progressId, data);
      if (response.success) {
        await refetch(); // Refresh list after update
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
        await refetch(); // Refresh list after deletion
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

  // Upload photos
  const uploadPhotos = useCallback(
    async (progressId: string, files: File[]) => {
      setPhotoLoading(true);
      const response = await trainingProgressApi.uploadPhotosToProgress(progressId, files);
      if (response.success) {
        await refetch();
      } else {
        console.error('Photo upload failed:', response.message);
      }
      setPhotoLoading(false);
      return response;
    },
    [refetch]
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
