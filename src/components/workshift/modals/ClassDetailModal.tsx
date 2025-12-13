import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  BookOpen,
  Package,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Loader2,
  Save
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { classApi } from '@/services/api/classApi';
import { classAttendanceApi } from '@/services/api/classAttendanceApi';
import type { Class, EnrolledStudent } from '@/types/Class';
import type { ClassAttendance } from '@/services/api/classAttendanceApi';

interface ClassDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: string;
  selectedDate?: Date | string;
}

/**
 * Modal to display class details with enrolled students
 * Matches the design from class detail view
 */
export const ClassDetailModal: React.FC<ClassDetailModalProps> = ({
  isOpen: _isOpen,
  onClose,
  classId,
  selectedDate: _selectedDate
}) => {
  const { t } = useTranslation();
  const [classData, setClassData] = useState<Class | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState<Date>(_selectedDate ? new Date(_selectedDate) : new Date());
  const [attendanceData, setAttendanceData] = useState<ClassAttendance | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'PRESENT' | 'ABSENT'>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Check if date is in the past (for disabling edit)
  const isPastDate = React.useMemo(() => {
    if (!attendanceDate) return false;
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const checkDate = new Date(attendanceDate);
    checkDate.setUTCHours(0, 0, 0, 0);
    return checkDate < today;
  }, [attendanceDate]);

  // Fetch class detail
  useEffect(() => {
    if (!_isOpen || !classId) return;

    const fetchClassDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await classApi.getClassById(classId);
        setClassData(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('classDetailModal.errors.fetchFailed');
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchClassDetail();
  }, [_isOpen, classId]);

  // Reset tab when modal opens
  useEffect(() => {
    if (_isOpen) {
      setActiveTab('overview');
    }
  }, [_isOpen]);

  // Update attendanceDate when selectedDate changes
  useEffect(() => {
    if (_selectedDate) {
      const date = new Date(_selectedDate);
      date.setUTCHours(0, 0, 0, 0);
      setAttendanceDate(date);
    }
  }, [_selectedDate]);

  // Load attendance when tab opens
  useEffect(() => {
    if (!_isOpen || !classId || activeTab !== 'attendance') return;

    const loadAttendance = async () => {
      setLoadingAttendance(true);
      try {
        // Use selectedDate or today's date (UTC)
        const dateToUse = _selectedDate || new Date();
        const normalizedDate = new Date(dateToUse);
        normalizedDate.setUTCHours(0, 0, 0, 0);
        setAttendanceDate(normalizedDate);

        const data = await classAttendanceApi.getOrCreateAttendance(classId, normalizedDate, 1);

        if (!data || !data.records || !Array.isArray(data.records)) {
          throw new Error(t('classDetailModal.errors.noRecords'));
        }

        // Get active enrollment IDs from classData to filter attendance records
        // This ensures we only show ACTIVE students even if backend returns all records
        const activeEnrollmentIds = new Set(
          classData?.enrolledStudents
            ?.filter((e: EnrolledStudent) => e.status === 'ACTIVE')
            .map((e: EnrolledStudent) => e._id || e.enrollmentId)
            .filter(Boolean) || []
        );

        // Filter attendance records to only include ACTIVE enrollments
        const filteredRecords = data.records.filter((record: Record<string, unknown>) => {
          const enrollmentId = record.enrollmentId as string;
          return activeEnrollmentIds.has(enrollmentId);
        });

        // Update data with filtered records
        const filteredData = {
          ...data,
          records: filteredRecords
        };

        setAttendanceData(filteredData);

        // Initialize attendance records from filtered backend data
        const records: Record<string, 'PRESENT' | 'ABSENT'> = {};
        if (Array.isArray(filteredRecords)) {
          filteredRecords.forEach((record: Record<string, unknown>) => {
            if (record.enrollmentId) {
              records[record.enrollmentId as string] = (record.status as 'PRESENT' | 'ABSENT') || 'ABSENT';
            }
          });
        }

        setAttendanceRecords(records);
      } catch (err) {
        const message = err instanceof Error ? err.message : t('classDetailModal.errors.loadAttendanceFailed');
        toast.error(message);
      } finally {
        setLoadingAttendance(false);
      }
    };

    loadAttendance();
  }, [_isOpen, classId, activeTab, _selectedDate, classData]);

  if (!_isOpen || !classId) return null;

  return (
    <Dialog open={_isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="pb-4 border-b">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-orange-500" />
            {classData?.name || t('classDetailModal.loading')}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            {classData?.status && (
              <Badge
                variant="outline"
                className={
                  classData.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : 'bg-gray-100 text-gray-800 border-gray-200'
                }
              >
                {classData.status}
              </Badge>
            )}
            {classData?.servicePackageId && typeof classData.servicePackageId === 'object' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {classData.servicePackageId.name}
              </Badge>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3">{t('common.loading')}</span>
          </div>
        ) : error ? (
          <div className="text-red-600 py-8 text-center flex-1">
            <p className="font-medium">{t('classDetailModal.error')}</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : classData ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('classDetailModal.tabs.overview')}</TabsTrigger>
              <TabsTrigger value="students">{t('classDetailModal.tabs.students')}</TabsTrigger>
              <TabsTrigger value="attendance">
                <ClipboardCheck className="h-4 w-4 mr-1" />
                {t('classDetailModal.tabs.attendance')}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-y-auto mt-4 space-y-6">
              {/* Capacity Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-700 mb-3">{t('classDetailModal.overview.capacity')}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {classData.activeEnrollment || 0} / {classData.capacity} {t('classDetailModal.overview.members')}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${((classData.activeEnrollment || 0) / classData.capacity) * 100}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {classData.capacity - (classData.activeEnrollment || 0)}{' '}
                  {t('classDetailModal.overview.slotsAvailable')}
                </p>
              </div>

              {/* Schedule Section */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  {t('classDetailModal.overview.schedule')}
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('classDetailModal.overview.days')}</p>
                    <p className="text-sm font-medium">{classData.schedulePattern?.daysOfWeek?.join(', ') || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('classDetailModal.overview.time')}</p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <p className="text-sm font-medium">
                        {classData.schedulePattern?.startTime || 'N/A'} - {classData.schedulePattern?.endTime || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  {t('classDetailModal.overview.location')}
                </h3>
                <div className="space-y-2">
                  {classData.location && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('classDetailModal.overview.studio')}</p>
                      <p className="text-sm font-medium">{classData.location}</p>
                    </div>
                  )}
                  {classData.servicePackageId && typeof classData.servicePackageId === 'object' && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('classDetailModal.overview.servicePackage')}</p>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <p className="text-sm font-medium">{classData.servicePackageId.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Trainers Section */}
              {classData.trainerIds && classData.trainerIds.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-3">{t('classDetailModal.overview.trainers')}</h3>
                  <div className="space-y-3">
                    {classData.trainerIds.map((trainer, idx) => {
                      // Handle both string and Staff object cases
                      if (typeof trainer === 'string') {
                        return (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {t('classDetailModal.overview.trainerId')}: {trainer}
                              </p>
                            </div>
                          </div>
                        );
                      }
                      // trainer is Staff object
                      const staff = trainer as unknown as Record<string, unknown>;
                      const userId = staff.userId as Record<string, unknown> | undefined;
                      const fullName = userId?.fullName as string | undefined;
                      const jobTitle = staff.jobTitle as string | undefined;
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{fullName || 'N/A'}</p>
                            <p className="text-xs text-gray-600">{jobTitle || 'N/A'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description Section */}
              {classData.description && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium text-sm text-gray-700 mb-2">
                    {t('classDetailModal.overview.description')}
                  </h3>
                  <p className="text-sm text-gray-700">{classData.description}</p>
                </div>
              )}

              {/* Class Period */}
              <div className="text-xs text-gray-500 pb-4">
                <p>
                  {t('classDetailModal.overview.classPeriod')}:{' '}
                  {new Date(classData.startDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')} -{' '}
                  {new Date(classData.endDate).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US')}
                </p>
              </div>
            </TabsContent>

            {/* Students Tab */}
            <TabsContent value="students" className="flex-1 overflow-y-auto mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-sm text-gray-700">
                    {t('classDetailModal.students.enrolledMembers')}
                  </h3>
                </div>

                {classData.enrolledStudents && classData.enrolledStudents.length > 0 ? (
                  <div className="space-y-3">
                    {classData.enrolledStudents
                      .filter((e: EnrolledStudent) => e.status === 'ACTIVE')
                      .map((enrollment: EnrolledStudent, idx: number) => {
                        const customerId = enrollment.customerId as Record<string, unknown>;
                        const userId = customerId?.userId as Record<string, unknown>;
                        const contractId = enrollment.contractId as Record<string, unknown>;

                        return (
                          <div key={idx} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-medium text-sm mb-1">{(userId?.fullName as string) || 'N/A'}</p>
                                <p className="text-xs text-gray-600">{(userId?.phoneNumber as string) || 'N/A'}</p>
                                <p className="text-xs text-gray-600">{(userId?.email as string) || 'N/A'}</p>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  enrollment.status === 'ACTIVE'
                                    ? 'bg-green-100 text-green-800 border-green-200'
                                    : 'bg-gray-100 text-gray-800 border-gray-200'
                                }`}
                              >
                                {enrollment.status}
                              </Badge>
                            </div>

                            {/* Contract Info */}
                            {contractId && (
                              <div className="mt-3 pt-3 border-t space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">{t('classDetailModal.students.sessions')}:</span>
                                  <span className="font-medium">
                                    {(contractId?.sessionsUsed as number) || 0} /
                                    {(contractId?.sessionsTotal as number) || 0}
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-600">{t('classDetailModal.students.remaining')}:</span>
                                  <span className="font-medium text-blue-600">
                                    {(contractId?.sessionsRemaining as number) || 0}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Enrollment Date */}
                            <div className="mt-3 text-xs text-gray-500">
                              {t('classDetailModal.students.enrolled')}:{' '}
                              {new Date(enrollment.enrolledDate).toLocaleDateString(
                                i18n.language === 'vi' ? 'vi-VN' : 'en-US'
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">{t('classDetailModal.students.noMembers')}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="flex-1 mt-4 flex flex-col min-h-0">
              {loadingAttendance ? (
                <div className="flex items-center justify-center py-12 flex-1">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <span className="ml-3 text-sm text-gray-600">{t('classDetailModal.attendance.loadingData')}</span>
                </div>
              ) : (
                <div className="space-y-4 flex-1 flex flex-col min-h-0 overflow-y-auto">
                  {/* Statistics */}
                  {attendanceData && (
                    <div className="bg-gray-50 rounded-lg p-4 flex-shrink-0">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-blue-800">{attendanceData.records?.length || 0}</p>
                          <p className="text-xs text-blue-600">{t('classDetailModal.attendance.totalStudents')}</p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-green-800">
                            {Object.values(attendanceRecords).filter((s) => s === 'PRESENT').length}
                          </p>
                          <p className="text-xs text-green-600">{t('classDetailModal.attendance.present')}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg text-center">
                          <p className="text-2xl font-bold text-red-800">
                            {Object.values(attendanceRecords).filter((s) => s === 'ABSENT').length}
                          </p>
                          <p className="text-xs text-red-600">{t('classDetailModal.attendance.absent')}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  {attendanceData && attendanceData.records.length > 0 && (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allPresent: Record<string, 'PRESENT' | 'ABSENT'> = {};
                          attendanceData!.records.forEach((record: Record<string, unknown>) => {
                            allPresent[record.enrollmentId as string] = 'PRESENT';
                          });
                          setAttendanceRecords(allPresent);
                        }}
                        className="flex-1"
                        disabled={isPastDate}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        {t('classDetailModal.attendance.markAllPresent')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allAbsent: Record<string, 'PRESENT' | 'ABSENT'> = {};
                          attendanceData!.records.forEach((record: Record<string, unknown>) => {
                            allAbsent[record.enrollmentId as string] = 'ABSENT';
                          });
                          setAttendanceRecords(allAbsent);
                        }}
                        className="flex-1"
                        disabled={isPastDate}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        {t('classDetailModal.attendance.markAllAbsent')}
                      </Button>
                    </div>
                  )}

                  {/* Student List */}
                  <div className="space-y-3 flex-1 min-h-0 overflow-y-auto">
                    <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2 flex-shrink-0">
                      <ClipboardCheck className="h-4 w-4" />
                      {t('classDetailModal.attendance.attendanceList')}
                    </h3>

                    {attendanceData && attendanceData.records.length > 0 ? (
                      <div className="space-y-2 pr-2 flex-1">
                        {attendanceData.records.map((record) => {
                          const enrollmentId = record.enrollmentId;
                          const status = attendanceRecords[enrollmentId] || record.status;
                          const customerId = record.customerId as Record<string, unknown> | undefined;
                          const userId = customerId?.userId as Record<string, unknown> | undefined;
                          const fullName = userId?.fullName as string | undefined;
                          const phoneNumber = userId?.phoneNumber as string | undefined;

                          return (
                            <div
                              key={enrollmentId}
                              className="bg-white border rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{fullName || 'N/A'}</p>
                                <p className="text-xs text-gray-600">{phoneNumber || 'N/A'}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  {status === 'PRESENT' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )}
                                  <span className="text-sm font-medium w-16 text-right">
                                    {status === 'PRESENT'
                                      ? t('classDetailModal.attendance.present')
                                      : t('classDetailModal.attendance.absent')}
                                  </span>
                                </div>
                                <Switch
                                  checked={status === 'PRESENT'}
                                  onCheckedChange={(checked) => {
                                    setAttendanceRecords((prev) => ({
                                      ...prev,
                                      [enrollmentId]: checked ? 'PRESENT' : 'ABSENT'
                                    }));
                                  }}
                                  disabled={isPastDate}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">{t('classDetailModal.attendance.noActiveStudents')}</p>
                      </div>
                    )}
                  </div>

                  {/* Past Date Warning */}
                  {isPastDate && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">{t('classDetailModal.attendance.pastDateWarning')}</p>
                    </div>
                  )}

                  {/* Save Button */}
                  {attendanceData && attendanceData.records.length > 0 && (
                    <div className="sticky bottom-0 bg-white pt-4 border-t -mx-6 px-6">
                      <Button
                        onClick={async () => {
                          setSavingAttendance(true);
                          try {
                            // Convert records to API format
                            const records = Object.entries(attendanceRecords).map(([enrollmentId, status]) => ({
                              enrollmentId,
                              status: status as 'PRESENT' | 'ABSENT'
                            }));

                            console.log('[ClassDetailModal] Saving attendance:', {
                              classId,
                              date: attendanceDate,
                              recordsCount: records.length,
                              records
                            });

                            // Save và nhận updated data từ backend
                            const updatedData = await classAttendanceApi.saveAttendance(
                              classId,
                              attendanceDate,
                              1,
                              records
                            );

                            console.log('[ClassDetailModal] Save response received:', updatedData);

                            // Update attendanceData with response from backend
                            if (updatedData && Array.isArray(updatedData.records)) {
                              setAttendanceData(updatedData);

                              // Sync attendanceRecords with data from backend
                              const syncedRecords: Record<string, 'PRESENT' | 'ABSENT'> = {};
                              updatedData.records.forEach((record) => {
                                syncedRecords[record.enrollmentId] = record.status;
                              });
                              setAttendanceRecords(syncedRecords);

                              console.log('[ClassDetailModal] Synced records:', syncedRecords);
                            }

                            toast.success(t('classDetailModal.attendance.saveSuccess'), {
                              icon: null
                            });
                          } catch (err) {
                            const message =
                              err instanceof Error ? err.message : t('classDetailModal.attendance.saveError');
                            console.error('[ClassDetailModal] Save error:', err);
                            toast.error(message);
                          } finally {
                            setSavingAttendance(false);
                          }
                        }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={savingAttendance || isPastDate}
                      >
                        {savingAttendance ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {savingAttendance
                          ? t('classDetailModal.attendance.saving')
                          : t('classDetailModal.attendance.saveAttendance')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default ClassDetailModal;
