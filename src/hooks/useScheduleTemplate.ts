import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { scheduleTemplateApi } from '@/services/api/scheduleTemplateApi';
import { socketService } from '@/services/socket/socketService';
import { handleAsyncOperationWithOptions } from '@/utils/errorHandler';
import type {
  ScheduleTemplate,
  ScheduleTemplateListParams,
  CreateScheduleTemplateRequest,
  UpdateScheduleTemplateRequest,
  AutoGenerateSettings,
  ScheduleTemplateStats
} from '@/types/api/ScheduleTemplate';

export const useScheduleTemplate = () => {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  const socket = socketService.getSocket();

  // Fetch templates with filters
  const fetchTemplates = useCallback(async (params: ScheduleTemplateListParams = {}) => {
    setLoading(true);
    setError(null);

    const response = await scheduleTemplateApi.getScheduleTemplates(params);
    setTemplates(response.data);
    setPagination(response.pagination);
    setLoading(false);
  }, []);

  // Create template
  const createTemplate = useCallback(async (data: CreateScheduleTemplateRequest) => {
    setLoading(true);
    setError(null);

    const result = await handleAsyncOperationWithOptions(
      async () => {
        const response = await scheduleTemplateApi.createScheduleTemplate(data);
        setTemplates((prev) => [response.data, ...prev]);
        return { success: true, data: response.data };
      },
      {
        showSuccess: true,
        showError: true,
        successMessage: t('schedule_templates.create_success'),
        errorMessage: t('schedule_templates.create_error')
      }
    );

    setLoading(false);
    return result;
  }, []);

  // Update template
  const updateTemplate = useCallback(async (id: string, data: UpdateScheduleTemplateRequest) => {
    setLoading(true);
    setError(null);

    const result = await handleAsyncOperationWithOptions(
      async () => {
        const response = await scheduleTemplateApi.updateScheduleTemplate(id, data);
        setTemplates((prev) => prev.map((template) => (template._id === id ? response.data : template)));
        return { success: true, data: response.data };
      },
      {
        showSuccess: true,
        showError: true,
        successMessage: t('schedule_templates.update_success'),
        errorMessage: t('schedule_templates.update_error')
      }
    );

    setLoading(false);
    return result;
  }, []);

  // Delete template
  const deleteTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await handleAsyncOperationWithOptions(
      async () => {
        const response = await scheduleTemplateApi.deleteScheduleTemplate(id);

        setTemplates((prev) => {
          const filtered = prev.filter((template) => template._id !== id);
          return filtered;
        });
        return { success: true, data: response.data };
      },
      {
        showSuccess: true,
        showError: true,
        successMessage: t('schedule_templates.delete_success'),
        errorMessage: t('schedule_templates.delete_error')
      }
    );

    setLoading(false);
    return result;
  }, []);

  // Activate template
  const activateTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await handleAsyncOperationWithOptions(
      async () => {
        const response = await scheduleTemplateApi.activateScheduleTemplate(id);
        setTemplates((prev) => prev.map((template) => (template._id === id ? response.data : template)));
        return { success: true, data: response.data };
      },
      {
        showSuccess: true,
        showError: true,
        successMessage: t('schedule_templates.activate_success'),
        errorMessage: t('schedule_templates.activate_error')
      }
    );

    setLoading(false);
    return result;
  }, []);

  // Deactivate template
  const deactivateTemplate = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await handleAsyncOperationWithOptions(
      async () => {
        const response = await scheduleTemplateApi.deactivateScheduleTemplate(id);
        setTemplates((prev) => prev.map((template) => (template._id === id ? response.data : template)));
        return { success: true, data: response.data };
      },
      {
        showSuccess: true,
        showError: true,
        successMessage: t('schedule_templates.deactivate_success'),
        errorMessage: t('schedule_templates.deactivate_error')
      }
    );

    setLoading(false);
    return result;
  }, []);

  // Update auto generate settings
  const updateAutoGenerate = useCallback(async (id: string, settings: AutoGenerateSettings) => {
    setLoading(true);
    setError(null);

    const response = await scheduleTemplateApi.updateAutoGenerateSettings(id, settings);
    setTemplates((prev) => prev.map((template) => (template._id === id ? response.data : template)));
    setLoading(false);
    return response.data;
  }, []);

  // Search templates
  const searchTemplates = useCallback(async (searchTerm: string, branchId?: string) => {
    setLoading(true);
    setError(null);

    const response = await scheduleTemplateApi.searchTemplates(searchTerm, branchId);
    setTemplates(response.data);
    setLoading(false);
  }, []);

  // Get templates by branch
  const getTemplatesByBranch = useCallback(async (branchId: string, activeOnly: boolean = true) => {
    setLoading(true);
    setError(null);

    const response = await scheduleTemplateApi.getTemplatesByBranch(branchId, activeOnly);
    setTemplates(response.data);
    setLoading(false);
  }, []);

  // Get templates by type
  const getTemplatesByType = useCallback(async (type: string, branchId?: string) => {
    setLoading(true);
    setError(null);

    const response = await scheduleTemplateApi.getTemplatesByType(type, branchId);
    setTemplates(response.data);
    setLoading(false);
  }, []);

  // Get auto generate templates
  const getAutoGenerateTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await scheduleTemplateApi.getAutoGenerateTemplates();
    setTemplates(response.data);
    setLoading(false);
  }, []);

  // Get template stats
  const getTemplateStats = useCallback(async (branchId?: string): Promise<ScheduleTemplateStats | null> => {
    setLoading(true);
    setError(null);

    const response = await scheduleTemplateApi.getTemplateStats(branchId);
    setLoading(false);
    return response.data;
  }, []);

  // Increment template usage
  const incrementTemplateUsage = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    const response = await scheduleTemplateApi.incrementTemplateUsage(id);
    setTemplates((prev) => prev.map((template) => (template._id === id ? response.data : template)));
    setLoading(false);
    return response.data;
  }, []);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleTemplateCreated = (template: ScheduleTemplate) => {
      setTemplates((prev) => [template, ...prev]);
    };

    const handleTemplateUpdated = (template: ScheduleTemplate) => {
      setTemplates((prev) => prev.map((t) => (t._id === template._id ? template : t)));
    };

    const handleTemplateDeleted = (templateId: string) => {
      setTemplates((prev) => prev.filter((t) => t._id !== templateId));
    };

    const handleTemplateActivated = (template: ScheduleTemplate) => {
      setTemplates((prev) => prev.map((t) => (t._id === template._id ? template : t)));
    };

    const handleTemplateDeactivated = (template: ScheduleTemplate) => {
      setTemplates((prev) => prev.map((t) => (t._id === template._id ? template : t)));
    };

    const handleAutoGenerateUpdated = (template: ScheduleTemplate) => {
      setTemplates((prev) => prev.map((t) => (t._id === template._id ? template : t)));
    };

    // Register event listeners
    socket.on('schedule_template:created', handleTemplateCreated);
    socket.on('schedule_template:updated', handleTemplateUpdated);
    socket.on('schedule_template:deleted', handleTemplateDeleted);
    socket.on('schedule_template:activated', handleTemplateActivated);
    socket.on('schedule_template:deactivated', handleTemplateDeactivated);
    socket.on('schedule_template:auto_generate_updated', handleAutoGenerateUpdated);

    // Cleanup
    return () => {
      socket.off('schedule_template:created', handleTemplateCreated);
      socket.off('schedule_template:updated', handleTemplateUpdated);
      socket.off('schedule_template:deleted', handleTemplateDeleted);
      socket.off('schedule_template:activated', handleTemplateActivated);
      socket.off('schedule_template:deactivated', handleTemplateDeactivated);
      socket.off('schedule_template:auto_generate_updated', handleAutoGenerateUpdated);
    };
  }, [socket]);

  return {
    templates,
    loading,
    error,
    pagination,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    activateTemplate,
    deactivateTemplate,
    updateAutoGenerate,
    searchTemplates,
    getTemplatesByBranch,
    getTemplatesByType,
    getAutoGenerateTemplates,
    getTemplateStats,
    incrementTemplateUsage
  };
};
