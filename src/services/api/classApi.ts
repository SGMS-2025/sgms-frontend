import { api } from './api';
import { convertMongoDecimalToNumbers } from '@/utils/mongodbDecimalConverter';
import type {
  Class,
  ClassListResponse,
  CreateClassDTO,
  UpdateClassDTO,
  EnrollStudentsDTO,
  PendingCustomersResponse,
  EnrollmentResult,
  ScheduleGenerationResult,
  GetClassesParams,
  GetPendingCustomersParams,
  RemoveStudentDTO,
  ClassDetailResponse
} from '@/types/Class';

/**
 * ============================================
 * CLASS API SERVICE
 * ============================================
 *
 * Handle all class-related API calls with proper error handling,
 * type safety, and response transformation
 */

class ClassApi {
  private readonly baseURL = '/classes';

  /**
   * Get list of classes with filters and pagination
   * @param params - Filter, search, sort, and pagination parameters
   * @returns List of classes with pagination info
   */
  async getClasses(params?: GetClassesParams): Promise<ClassListResponse> {
    try {
      const response = await api.get<{ data: ClassListResponse }>(this.baseURL, { params });
      return convertMongoDecimalToNumbers(response.data.data) as ClassListResponse;
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get single class by ID with full details
   * @param classId - Class ID
   * @returns Class detail with all relations
   */
  async getClassById(classId: string): Promise<Class> {
    try {
      const response = await api.get<ClassDetailResponse>(`${this.baseURL}/${classId}`);
      return convertMongoDecimalToNumbers(response.data.data) as Class;
    } catch (error) {
      console.error(`Failed to fetch class ${classId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Create new class
   * @param data - Class creation data
   * @returns Created class
   */
  async createClass(data: CreateClassDTO): Promise<Class> {
    try {
      const response = await api.post<ClassDetailResponse>(this.baseURL, data);
      return convertMongoDecimalToNumbers(response.data.data) as Class;
    } catch (error) {
      console.error('Failed to create class:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Update existing class
   * @param classId - Class ID
   * @param data - Update data
   * @returns Updated class
   */
  async updateClass(classId: string, data: UpdateClassDTO): Promise<Class> {
    try {
      const response = await api.put<ClassDetailResponse>(`${this.baseURL}/${classId}`, data);
      return convertMongoDecimalToNumbers(response.data.data) as Class;
    } catch (error) {
      console.error(`Failed to update class ${classId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Toggle class status (ACTIVE <-> INACTIVE)
   * @param classId - Class ID
   * @returns Updated class
   */
  async toggleClassStatus(classId: string): Promise<Class> {
    try {
      const response = await api.patch<ClassDetailResponse>(`${this.baseURL}/${classId}/status`);
      return convertMongoDecimalToNumbers(response.data.data) as Class;
    } catch (error) {
      console.error(`Failed to toggle status for class ${classId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete class
   * @param classId - Class ID
   * @returns Success message
   */
  async deleteClass(classId: string): Promise<{ message: string }> {
    try {
      const response = await api.delete<{ message: string }>(`${this.baseURL}/${classId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to delete class ${classId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Get pending customers eligible for enrollment
   * Customers must satisfy ALL conditions:
   * 1. Have active contract with this service package
   * 2. Not already enrolled in this class (or already dropped)
   * 3. Contract has remaining sessions > 0
   * 4. Contract not expired
   * 5. Customer status = ACTIVE
   *
   * @param classId - Class ID
   * @param params - Pagination, search, sort params
   * @returns List of eligible customers
   */
  async getPendingCustomers(classId: string, params?: GetPendingCustomersParams): Promise<PendingCustomersResponse> {
    try {
      const response = await api.get<{ data: PendingCustomersResponse }>(
        `${this.baseURL}/${classId}/pending-customers`,
        { params }
      );
      return convertMongoDecimalToNumbers(response.data.data) as PendingCustomersResponse;
    } catch (error) {
      console.error(`Failed to fetch pending customers for class ${classId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Enroll multiple students to class (bulk operation)
   *
   * Handles:
   * - Checking duplicate enrollments
   * - Validating contract eligibility
   * - Creating enrollment records
   * - Returns both succeeded and failed enrollments
   *
   * @param classId - Class ID
   * @param data - List of customer IDs to enroll
   * @returns Enrollment result with success/failed counts
   */
  async enrollStudents(classId: string, data: EnrollStudentsDTO): Promise<EnrollmentResult> {
    try {
      const response = await api.post<{ data: EnrollmentResult }>(`${this.baseURL}/${classId}/enroll`, data);
      return convertMongoDecimalToNumbers(response.data.data) as EnrollmentResult;
    } catch (error) {
      console.error(`Failed to enroll students to class ${classId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Remove student from class (soft delete)
   *
   * Marks enrollment as INACTIVE and records:
   * - droppedDate: current datetime
   * - dropReason: provided reason (optional)
   *
   * @param classId - Class ID
   * @param enrollmentId - Enrollment record ID
   * @param reason - Reason for removal (optional)
   * @returns Updated class
   */
  async removeStudent(classId: string, enrollmentId: string, reason?: string): Promise<Class> {
    try {
      const data: RemoveStudentDTO = reason ? { reason } : {};
      const response = await api.delete<ClassDetailResponse>(`${this.baseURL}/${classId}/enrollments/${enrollmentId}`, {
        data
      });
      return convertMongoDecimalToNumbers(response.data.data) as Class;
    } catch (error) {
      console.error(`Failed to remove student from class ${classId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * Generate schedules for class
   *
   * Creates WorkShift records for all schedule pattern dates
   * within the specified date range.
   *
   * @param classId - Class ID
   * @param startDate - Schedule generation start date
   * @param endDate - Schedule generation end date
   * @returns Generated schedules info
   */
  async generateSchedules(
    classId: string,
    startDate: Date | string,
    endDate: Date | string
  ): Promise<ScheduleGenerationResult> {
    try {
      const response = await api.post<{ data: ScheduleGenerationResult }>(`/schedule-generation/class/${classId}`, {
        startDate,
        endDate
      });
      return convertMongoDecimalToNumbers(response.data.data) as ScheduleGenerationResult;
    } catch (error) {
      console.error(`Failed to generate schedules for class ${classId}:`, error);
      throw this.handleError(error);
    }
  }

  /**
   * ============================================
   * CONVENIENCE METHODS
   * ============================================
   */

  /**
   * Get classes by branch
   */
  async getClassesByBranch(branchId: string, params?: Omit<GetClassesParams, 'branchId'>): Promise<ClassListResponse> {
    return this.getClasses({ ...params, branchId });
  }

  /**
   * Get active classes only
   */
  async getActiveClasses(params?: Omit<GetClassesParams, 'status'>): Promise<ClassListResponse> {
    return this.getClasses({ ...params, status: 'ACTIVE' });
  }

  /**
   * Search classes by name
   */
  async searchClasses(search: string, params?: Omit<GetClassesParams, 'search'>): Promise<ClassListResponse> {
    return this.getClasses({ ...params, search });
  }

  /**
   * ============================================
   * ERROR HANDLING
   * ============================================
   */

  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (error && typeof error === 'object' && 'response' in error && (error as Record<string, unknown>).response) {
      // Backend returned error response
      const response = (error as Record<string, unknown>).response as Record<string, unknown>;
      const { status, data } = response;
      const responseData = data as Record<string, unknown> | undefined;
      const message =
        (responseData?.message as string) ||
        ((responseData?.error as Record<string, unknown>)?.message as string) ||
        'Unknown error';

      const errorObj = new Error(message);
      Object.assign(errorObj, { status, data });

      return errorObj;
    } else if (error && typeof error === 'object' && 'request' in error && (error as Record<string, unknown>).request) {
      // Request made but no response
      return new Error('No response from server. Please check your connection.');
    } else {
      // Error in request setup
      const message =
        typeof error === 'object' && error !== null && 'message' in error
          ? String((error as Record<string, unknown>).message)
          : String(error);
      return new Error(message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
export const classApi = new ClassApi();

// Export for testing
export default classApi;
