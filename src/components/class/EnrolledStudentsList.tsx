import React, { useState } from 'react';
import { Users, Search, X, Calendar, Package, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useClassDetail } from '@/hooks/useClassDetail';
import { AlertCircle } from 'lucide-react';
import type {
  EnrolledStudentsListProps,
  PopulatedCustomer,
  PopulatedContract
} from '@/types/class/EnrolledStudentsList';

export const EnrolledStudentsList: React.FC<EnrolledStudentsListProps> = ({
  classId,
  onRemoveStudent,
  onActivateStudent,
  showHeader = true,
  compact = false
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Fetch class details with enrolled students
  const { classData, loading, error, refetch } = useClassDetail(classId);

  // Filter enrolled students
  const filteredStudents = React.useMemo(() => {
    if (!classData?.enrolledStudents) return [];

    let filtered = classData.enrolledStudents;

    // Filter by status
    filtered = filtered.filter((s) => s.status === statusFilter);

    // Filter by search (name or email)
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((student) => {
        const customer = student.customerId as unknown;
        if (typeof customer === 'object' && customer !== null && 'userId' in customer) {
          const userId = (customer as PopulatedCustomer).userId;
          const fullName = userId.fullName?.toLowerCase() || '';
          const email = userId.email?.toLowerCase() || '';
          return fullName.includes(searchLower) || email.includes(searchLower);
        }
        return false;
      });
    }

    return filtered;
  }, [classData?.enrolledStudents, search, statusFilter]);

  // Get service package name from class
  const classServicePackageId = React.useMemo(() => {
    if (!classData?.servicePackageId) return null;
    return typeof classData.servicePackageId === 'object' ? classData.servicePackageId._id : classData.servicePackageId;
  }, [classData?.servicePackageId]);

  const classServicePackageName = React.useMemo(() => {
    if (!classData?.servicePackageId) return 'Unknown';
    return typeof classData.servicePackageId === 'object' ? classData.servicePackageId.name : 'Unknown';
  }, [classData?.servicePackageId]);

  // Filter students - Note: Backend already ensures only matching package students are enrolled
  // So we can show all enrolled students, but we'll still try to filter if contract has package info
  const validStudents = React.useMemo(() => {
    // If we can't get class package ID, show all filtered students
    if (!classServicePackageId) return filteredStudents;

    // Try to filter by package, but if contract doesn't have package info, include the student anyway
    // (because backend already validated during enrollment)
    return filteredStudents.filter((student) => {
      const contract = student.contractId as unknown;
      // If contract is populated and has servicePackageId, check it
      if (typeof contract === 'object' && contract !== null && 'servicePackageId' in contract) {
        const typedContract = contract as PopulatedContract;
        const contractPackageId =
          typeof typedContract.servicePackageId === 'object'
            ? typedContract.servicePackageId._id
            : typedContract.servicePackageId;
        // Convert both to strings for comparison to handle ObjectId vs string
        return String(contractPackageId) === String(classServicePackageId);
      }
      // If contract doesn't have package info, include the student anyway
      // (backend already validated during enrollment that package matches)
      return true;
    });
  }, [filteredStudents, classServicePackageId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-600 font-medium">{t('class.enrolledstudents.error_loading')}</p>
            <p className="text-sm text-red-500 mt-1">{error}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="mt-3">
          {t('class.enrolledstudents.button_retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">{t('class.enrolledstudents.header_title')}</h3>
          </div>
          {classServicePackageName && (
            <Badge variant="outline" className="text-xs">
              <Package className="w-3 h-3 mr-1" />
              {classServicePackageName}
            </Badge>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t('class.enrolledstudents.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <div className="flex gap-1 border rounded-lg p-1">
          <Button
            size="sm"
            variant={statusFilter === 'ACTIVE' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('ACTIVE')}
            className="h-7 px-3 text-xs"
          >
            {t('class.enrolledstudents.filter_active')}
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'INACTIVE' ? 'default' : 'ghost'}
            onClick={() => setStatusFilter('INACTIVE')}
            className="h-7 px-3 text-xs"
          >
            {t('class.enrolledstudents.filter_inactive')}
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      {!compact && classServicePackageName && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">{t('class.enrolledstudents.info_showing_package')}</span>{' '}
            {classServicePackageName}
          </p>
          {validStudents.length < filteredStudents.length && (
            <p className="text-xs text-blue-700 mt-1">
              {t('class.enrolledstudents.info_filtered_count', {
                count: filteredStudents.length - validStudents.length
              })}
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {validStudents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-lg font-medium">
            {search ? t('class.enrolledstudents.empty_no_match') : t('class.enrolledstudents.empty_no_students')}
          </p>
          <p className="text-sm mt-1">
            {search
              ? t('class.enrolledstudents.empty_adjust_search')
              : t('class.enrolledstudents.empty_enroll_students')}
          </p>
        </div>
      )}

      {/* Student List */}
      {validStudents.length > 0 && (
        <div className="space-y-2">
          {validStudents.map((student) => {
            const customer = student.customerId as unknown;
            const contract = student.contractId as unknown;

            // Type-safe customer data extraction
            let customerName = 'Unknown';
            let customerEmail = '';
            if (typeof customer === 'object' && customer !== null && 'userId' in customer) {
              const typedCustomer = customer as PopulatedCustomer;
              customerName = typedCustomer.userId.fullName;
              customerEmail = typedCustomer.userId.email;
            }

            const enrollmentDate = student.enrolledDate ? new Date(student.enrolledDate).toLocaleDateString() : 'N/A';

            // Get session info from contract
            let sessionsInfo = null;
            if (typeof contract === 'object' && contract !== null && 'sessionsTotal' in contract) {
              const typedContract = contract as PopulatedContract;
              const sessionsTotal = typedContract.sessionsTotal || 0;
              const sessionsUsed = typedContract.sessionsUsed || 0;
              const sessionsRemaining = typedContract.sessionsRemaining || 0;
              if (sessionsTotal > 0) {
                sessionsInfo = {
                  total: sessionsTotal,
                  used: sessionsUsed,
                  remaining: sessionsRemaining
                };
              }
            }

            return (
              <div
                key={student._id || student.enrollmentId}
                className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{customerName}</h4>
                    <Badge variant={student.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                      {student.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{customerEmail}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {t('class.enrolledstudents.enrolled_label')}: {enrollmentDate}
                      </span>
                    </div>
                    {sessionsInfo && (
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>
                          {t('class.enrolledstudents.sessions_label', {
                            used: sessionsInfo.used,
                            total: sessionsInfo.total,
                            remaining: sessionsInfo.remaining
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {onActivateStudent && student.status === 'INACTIVE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        const enrollmentId = student._id || student.enrollmentId;
                        if (enrollmentId) {
                          onActivateStudent(enrollmentId, customerName);
                        } else {
                          console.error('Enrollment ID not found for student:', student);
                        }
                      }}
                      className="flex-shrink-0"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      {t('class.enrolledstudents.button_activate')}
                    </Button>
                  )}
                  {onRemoveStudent && student.status === 'ACTIVE' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        const enrollmentId = student._id || student.enrollmentId;
                        if (enrollmentId) {
                          onRemoveStudent(enrollmentId, customerName);
                        } else {
                          console.error('Enrollment ID not found for student:', student);
                        }
                      }}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4 mr-1" />
                      {t('class.enrolledstudents.button_remove')}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
