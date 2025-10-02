import { api } from './api';
import type { ApiResponse } from '@/types/api/Api';
import type {
  Testimonial,
  CreateTestimonialRequest,
  UpdateTestimonialRequest,
  UpdateTestimonialStatusRequest,
  TestimonialQueryParams,
  TestimonialStats,
  TestimonialListResponse
} from '../../types/api/Testimonial';

class TestimonialApi {
  async createTestimonial(data: CreateTestimonialRequest): Promise<ApiResponse<Testimonial>> {
    const response = await api.post('/testimonials', data);
    return response.data;
  }

  async getTestimonials(params: TestimonialQueryParams = {}): Promise<TestimonialListResponse> {
    const response = await api.get<TestimonialListResponse>('/testimonials', { params });
    return response.data;
  }

  async getTestimonialById(id: string): Promise<ApiResponse<Testimonial>> {
    const response = await api.get(`/testimonials/${id}`);
    return response.data;
  }

  async updateTestimonial(id: string, data: UpdateTestimonialRequest): Promise<ApiResponse<Testimonial>> {
    const response = await api.put(`/testimonials/${id}`, data);
    return response.data;
  }

  async updateTestimonialStatus(id: string, data: UpdateTestimonialStatusRequest): Promise<ApiResponse<Testimonial>> {
    const response = await api.patch(`/testimonials/${id}/status`, data);
    return response.data;
  }

  async deleteTestimonial(id: string): Promise<ApiResponse<null>> {
    const response = await api.delete(`/testimonials/${id}`);
    return response.data;
  }

  async getTestimonialStats(): Promise<ApiResponse<TestimonialStats>> {
    const response = await api.get('/testimonials/stats');
    return response.data;
  }

  async uploadImage(file: File): Promise<ApiResponse<{ publicId: string; url: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await api.post('/testimonials/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  }
}

export const testimonialApi = new TestimonialApi();
