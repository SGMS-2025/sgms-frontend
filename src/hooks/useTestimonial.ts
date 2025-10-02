import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { testimonialApi } from '@/services/api/testimonialApi';
import type {
  Testimonial,
  TestimonialStats,
  TestimonialDisplay,
  TestimonialQueryParams,
  UseTestimonialListReturn,
  UpdateTestimonialRequest,
  CreateTestimonialRequest
} from '@/types/api/Testimonial';
import { toast } from 'sonner';

const transformTestimonialToDisplay = (testimonial: Testimonial): TestimonialDisplay => ({
  id: testimonial._id,
  title: testimonial.title,
  content: testimonial.content,
  status: testimonial.status,
  createdAt: testimonial.createdAt,
  images: testimonial.images || [],
  imagesCount: testimonial.images?.length || 0,
  createdBy:
    typeof testimonial.create_by === 'string'
      ? testimonial.create_by
      : testimonial.create_by?.fullName || testimonial.create_by?.email || 'Unknown',
  branches: Array.isArray(testimonial.branch_id)
    ? testimonial.branch_id.map((branch) => (typeof branch === 'string' ? branch : branch._id))
    : []
});

export const useTestimonialList = (initialParams: TestimonialQueryParams = {}): UseTestimonialListReturn => {
  const [testimonialList, setTestimonialList] = useState<TestimonialDisplay[]>([]);
  const [stats, setStats] = useState<TestimonialStats>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<UseTestimonialListReturn['pagination']>(null);
  const [params, setParams] = useState<TestimonialQueryParams>(initialParams);

  const fetchTestimonialList = useCallback(async () => {
    setLoading(true);
    setError(null);

    const requestParams = {
      limit: 10,
      ...params
    };

    const testimonialResponse = await testimonialApi.getTestimonials(requestParams);

    // Handle testimonial list response
    if (testimonialResponse.success) {
      const transformedTestimonials = testimonialResponse.data.map(transformTestimonialToDisplay);
      setTestimonialList(transformedTestimonials);

      // Set pagination info
      setPagination({
        currentPage: testimonialResponse.pagination.page,
        itemsPerPage: testimonialResponse.pagination.limit,
        totalItems: testimonialResponse.pagination.total,
        totalPages: testimonialResponse.pagination.totalPages,
        hasNextPage: testimonialResponse.pagination.hasNext,
        hasPrevPage: testimonialResponse.pagination.hasPrev
      });
    } else {
      setError('Failed to fetch testimonials');
    }

    setLoading(false);
  }, [params]);

  const fetchStats = useCallback(async () => {
    const statsResponse = await testimonialApi.getTestimonialStats();
    if (statsResponse.success) {
      setStats(statsResponse.data);
    }
  }, []);

  useEffect(() => {
    fetchTestimonialList();
  }, [fetchTestimonialList]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(() => {
    return fetchTestimonialList();
  }, [fetchTestimonialList]);

  const goToPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  return {
    testimonialList,
    stats,
    loading,
    error,
    pagination,
    refetch,
    refetchStats: fetchStats,
    goToPage
  };
};

export const useTestimonialDetails = (testimonialId: string | null) => {
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTestimonialDetails = useCallback(async () => {
    if (!testimonialId) {
      setTestimonial(null);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await testimonialApi.getTestimonialById(testimonialId);

    if (response.success) {
      setTestimonial(response.data);
    } else {
      setError('Failed to fetch testimonial details');
    }

    setLoading(false);
  }, [testimonialId]);

  useEffect(() => {
    fetchTestimonialDetails();
  }, [fetchTestimonialDetails]);

  const refetch = useCallback(() => {
    return fetchTestimonialDetails();
  }, [fetchTestimonialDetails]);

  return {
    testimonial,
    loading,
    error,
    refetch
  };
};

export const useCreateTestimonial = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTestimonial = useCallback(
    async (data: CreateTestimonialRequest) => {
      setLoading(true);
      setError(null);

      const response = await testimonialApi.createTestimonial(data);

      if (response.success) {
        toast.success(t('testimonial_form.create_success'));
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = t('testimonial_form.create_failed');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    createTestimonial,
    loading,
    error,
    resetError
  };
};

export const useUpdateTestimonial = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTestimonial = useCallback(
    async (id: string, data: UpdateTestimonialRequest) => {
      setLoading(true);
      setError(null);

      const response = await testimonialApi.updateTestimonial(id, data);

      if (response.success) {
        toast.success(t('testimonial_modal.update_success'));
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = t('testimonial_modal.update_failed');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateTestimonial,
    loading,
    error,
    resetError
  };
};

export const useUpdateTestimonialStatus = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTestimonialStatus = useCallback(
    async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
      setLoading(true);
      setError(null);

      const response = await testimonialApi.updateTestimonialStatus(id, { status });

      if (response.success) {
        toast.success(t('testimonial_modal.status_update_success'));
        setLoading(false);
        return response.data;
      } else {
        const errorMessage = t('testimonial_modal.status_update_failed');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return null;
      }
    },
    [t]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateTestimonialStatus,
    loading,
    error,
    resetError
  };
};

export const useDeleteTestimonial = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteTestimonial = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);

      const response = await testimonialApi.deleteTestimonial(id);

      if (response.success) {
        toast.success(t('testimonial_modal.delete_success'));
        setLoading(false);
        return true;
      } else {
        const errorMessage = t('testimonial_modal.delete_failed');
        setError(errorMessage);
        toast.error(errorMessage);
        setLoading(false);
        return false;
      }
    },
    [t]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    deleteTestimonial,
    loading,
    error,
    resetError
  };
};
