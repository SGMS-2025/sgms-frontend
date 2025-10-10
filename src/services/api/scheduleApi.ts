import { api } from './api';
import type {
  Schedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesParams,
  GetSchedulesResponse,
  ScheduleResponse
} from '@/types/api/Schedule';

class ScheduleApi {
  // Create a new schedule
  async createSchedule(scheduleData: CreateScheduleRequest): Promise<ScheduleResponse> {
    const response = await api.post('/schedules', scheduleData);
    return response.data;
  }

  // Get all schedules with filters
  async getSchedules(params: GetSchedulesParams = {}): Promise<GetSchedulesResponse> {
    const response = await api.get('/schedules', { params });
    return response.data;
  }

  // Get single schedule by ID
  async getScheduleById(id: string): Promise<ScheduleResponse> {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  }

  // Update schedule
  async updateSchedule(id: string, updateData: UpdateScheduleRequest): Promise<ScheduleResponse> {
    const response = await api.put(`/schedules/${id}`, updateData);
    return response.data;
  }

  // Delete schedule
  async deleteSchedule(id: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  }

  // Get schedules by branch
  async getSchedulesByBranch(branchId: string, params: GetSchedulesParams = {}): Promise<GetSchedulesResponse> {
    return this.getSchedules({ ...params, branchId });
  }

  // Get schedules by PT
  async getSchedulesByPT(ptId: string, params: GetSchedulesParams = {}): Promise<GetSchedulesResponse> {
    return this.getSchedules({ ...params, ptId });
  }

  // Get schedules by date range
  async getSchedulesByDateRange(
    dateFrom: string,
    dateTo: string,
    params: GetSchedulesParams = {}
  ): Promise<GetSchedulesResponse> {
    return this.getSchedules({ ...params, dateFrom, dateTo });
  }

  // Get schedules by type
  async getSchedulesByType(type: Schedule['type'], params: GetSchedulesParams = {}): Promise<GetSchedulesResponse> {
    return this.getSchedules({ ...params, type });
  }

  // Get schedules by status
  async getSchedulesByStatus(
    status: Schedule['status'],
    params: GetSchedulesParams = {}
  ): Promise<GetSchedulesResponse> {
    return this.getSchedules({ ...params, status });
  }
}

export const scheduleApi = new ScheduleApi();
