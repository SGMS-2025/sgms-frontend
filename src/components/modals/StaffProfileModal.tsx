import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, User, Building2, Phone, MapPin, Calendar, Shield, DollarSign, X, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useStaffDetails, useUpdateStaff } from '@/hooks/useStaff';
import { useCanManageStaff } from '@/hooks/useCanManageStaff';
import EditStaffForm from '@/components/forms/EditStaffForm';
import type { StaffDisplay, Staff, StaffFormData, StaffJobTitle, StaffUpdateData } from '@/types/api/Staff';
import { handleApiErrorForForm } from '@/utils/errorHandler';

interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffDisplay | null;
  initialEditMode?: boolean;
}

export default function StaffProfileModal({ isOpen, onClose, staff, initialEditMode = false }: StaffProfileModalProps) {
  const { t } = useTranslation();
  const { canManageStaff } = useCanManageStaff();
  const [activeTab, setActiveTab] = useState<'personal' | 'branch'>('personal');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<StaffFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    address: '',
    email: '',
    jobTitle: 'Personal Trainer',
    salary: '',
    branchId: [],
    status: 'ACTIVE'
  });

  // Use the custom hook for fetching staff details
  const { staffDetails, loading, error, refetch } = useStaffDetails(isOpen && staff ? staff.id : null);

  // Use the custom hook for updating staff
  const { updateStaff, loading: updateLoading } = useUpdateStaff();

  useEffect(() => {
    if (isOpen && staff) {
      refetch();
      // Reset to personal tab when modal opens
      setActiveTab('personal');
      setIsEditMode(initialEditMode);
    }
  }, [isOpen, staff, refetch, initialEditMode]);

  // Populate form data when staff details are loaded
  useEffect(() => {
    if (staffDetails && staff) {
      setFormData({
        fullName: staffDetails.userId?.fullName || staff.name || '',
        dateOfBirth: staffDetails.userId?.dateOfBirth
          ? new Date(staffDetails.userId.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: staffDetails.userId?.gender || '',
        phoneNumber: staffDetails.userId?.phoneNumber || staff.phone || '',
        address: staffDetails.userId?.address || '',
        email: staffDetails.userId?.email || staff.email || '',
        jobTitle: staffDetails.jobTitle || (staff.jobTitle as StaffJobTitle) || 'Personal Trainer',
        salary: staffDetails.salary?.toString() || staff.salary || '',
        branchId: staffDetails.branchId.map((branch) => branch._id).filter(Boolean),
        status: staffDetails.status || staff.status || 'ACTIVE'
      });
    }
  }, [staffDetails, staff]);

  const handleInputChange = (field: keyof StaffFormData, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleSave = async () => {
    if (!staff) return;

    const updateData: StaffUpdateData = {};

    // User fields
    if (formData.fullName) updateData.fullName = formData.fullName;
    if (formData.phoneNumber) updateData.phoneNumber = formData.phoneNumber;
    if (formData.address) updateData.address = formData.address;
    if (formData.email) updateData.email = formData.email;
    if (formData.dateOfBirth) updateData.dateOfBirth = formData.dateOfBirth;
    if (formData.gender) updateData.gender = formData.gender;

    // Staff fields
    if (formData.jobTitle) updateData.jobTitle = formData.jobTitle;
    // Temporarily allow all users to change branch
    if (formData.branchId.length > 0) {
      updateData.branchId = formData.branchId; // Pass the entire array
    }
    if (formData.salary) updateData.salary = parseInt(formData.salary);
    if (formData.status) updateData.status = formData.status;

    await updateStaff(staff.id, updateData)
      .then(async () => {
        await refetch();
        setIsEditMode(false);
        setFormErrors({}); // Clear errors on success
      })
      .catch(
        (
          error: Error & {
            meta?: { details?: Array<{ field: string; message: string }>; field?: string };
            code?: string;
            statusCode?: number;
          }
        ) => {
          // Use centralized error handler
          const fieldErrors = handleApiErrorForForm(error, {
            context: 'staff',
            // StaffProfileModal uses the same field names (no mapping needed)
            t: (key: string) => t(key)
          });
          setFormErrors(fieldErrors);
        }
      );
  };

  const handleCancel = () => {
    // Reset form errors
    setFormErrors({});
    // Reset form data to original values
    if (staffDetails && staff) {
      setFormData({
        fullName: staffDetails.userId?.fullName || staff.name || '',
        dateOfBirth: staffDetails.userId?.dateOfBirth
          ? new Date(staffDetails.userId.dateOfBirth).toISOString().split('T')[0]
          : '',
        gender: staffDetails.userId?.gender || '',
        phoneNumber: staffDetails.userId?.phoneNumber || staff.phone || '',
        address: staffDetails.userId?.address || '',
        email: staffDetails.userId?.email || staff.email || '',
        jobTitle: staffDetails.jobTitle || (staff.jobTitle as StaffJobTitle) || 'Personal Trainer',
        salary: staffDetails.salary?.toString() || staff.salary || '',
        branchId: staffDetails.branchId.map((branch) => branch._id).filter(Boolean),
        status: staffDetails.status || staff.status || 'ACTIVE'
      });
    }
    setIsEditMode(false);
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto hide-scrollbar">
        {/* Modal Header */}
        <div className="bg-[#f05a29] p-6 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors">
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white">
                <AvatarImage
                  src={staffDetails?.userId?.avatar?.url || '/src/assets/images/defaut-avatar.jpg'}
                  alt={staffDetails?.userId?.fullName || staff.name}
                />
                <AvatarFallback className="bg-gray-200 text-gray-600 text-lg font-semibold">
                  {(staffDetails?.userId?.fullName || staff.name)
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1">
                <div
                  className={`w-3 h-3 rounded-full ${
                    (staffDetails?.status || staff.status) === 'ACTIVE'
                      ? 'bg-green-500'
                      : (staffDetails?.status || staff.status) === 'INACTIVE'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                  }`}
                ></div>
              </div>
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{staffDetails?.userId?.fullName || staff.name}</h2>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary" className="bg-white text-orange-500">
                  {(staffDetails?.status || staff.status) === 'ACTIVE'
                    ? t('staff_modal.status_active')
                    : (staffDetails?.status || staff.status) === 'INACTIVE'
                      ? t('staff_modal.status_inactive')
                      : t('staff_modal.status_suspended')}
                </Badge>
                <Badge variant="secondary" className="bg-white text-orange-500">
                  {staffDetails?.jobTitle || staff.jobTitle}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Only show when not in edit mode */}
        {!isEditMode && (
          <div className="border-b bg-gray-50">
            <div className="flex px-6">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-4 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'personal'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                {t('staff_modal.personal_info')}
              </button>
              <button
                onClick={() => setActiveTab('branch')}
                className={`px-4 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'branch'
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Building2 className="w-4 h-4 inline mr-2" />
                {t('staff_modal.branch_info')}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#f05a29]" />
                <p className="text-gray-600">{t('staff_modal.loading_details')}</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={refetch} className="bg-[#f05a29] hover:bg-[#df4615] text-white">
                  {t('staff_modal.try_again')}
                </Button>
              </div>
            </div>
          ) : isEditMode ? (
            <EditStaffForm
              formData={formData}
              onInputChange={handleInputChange}
              onSave={handleSave}
              onCancel={handleCancel}
              t={t}
              loading={updateLoading}
              externalErrors={formErrors}
              onErrorsUpdate={setFormErrors}
            />
          ) : activeTab === 'branch' ? (
            <BranchInfo
              staffDetails={staffDetails}
              t={t}
              onEdit={handleEditClick}
              canEdit={staff ? canManageStaff(staff) : false}
            />
          ) : (
            <PersonalInfo
              staff={staff}
              staffDetails={staffDetails}
              t={t}
              onEdit={handleEditClick}
              canEdit={staff ? canManageStaff(staff) : false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BranchInfo({
  staffDetails,
  t,
  onEdit,
  canEdit
}: {
  staffDetails: Staff | null;
  t: (key: string) => string;
  onEdit: () => void;
  canEdit: boolean;
}) {
  const branches = staffDetails?.branchId || [];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-orange-500">{t('staff_modal.branch_info').toUpperCase()}</h3>
          {canEdit && (
            <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={onEdit}>
              <Edit className="w-4 h-4" />
              {t('staff_modal.edit_profile')}
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {branches.length > 0 ? (
            branches.map((branch, index) => (
              <div key={branch._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-4">
                  {/* Branch Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-orange-500" />
                    <h4 className="text-lg font-semibold text-gray-800">
                      {branch.branchName}
                      {branches.length > 1 && (
                        <span className="ml-2 text-sm text-gray-500">
                          ({index + 1}/{branches.length})
                        </span>
                      )}
                    </h4>
                  </div>

                  {/* Branch Information Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Branch Address */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{t('staff_modal.branch_address')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-700">{branch.location || t('staff_modal.no_info')}</p>
                      </div>
                    </div>

                    {/* Hotline */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">{t('staff_modal.hotline')}</span>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-gray-700">{branch.hotline || t('staff_modal.no_info')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Manager Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      <span className="font-medium">
                        {t('staff_modal.branch_manager')}
                        {Array.isArray(branch.managerId) && branch.managerId.length > 1 && (
                          <span className="ml-1 text-sm text-gray-500">({branch.managerId.length})</span>
                        )}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-lg">
                      {(() => {
                        if (!branch.managerId) {
                          return <p className="text-gray-700">{t('staff_modal.no_info')}</p>;
                        }

                        // Handle array structure - show all managers
                        if (Array.isArray(branch.managerId)) {
                          if (branch.managerId.length === 0) {
                            return <p className="text-gray-700">{t('staff_modal.no_info')}</p>;
                          }

                          return (
                            <div className="space-y-2">
                              {branch.managerId.map((manager, index) => (
                                <div
                                  key={manager._id || index}
                                  className="border-b border-gray-100 pb-2 last:border-b-0 last:pb-0"
                                >
                                  <p className="text-gray-800 font-medium">{manager.fullName}</p>
                                  {manager.email && (
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                      <Mail className="w-3 h-3" />
                                      {manager.email}
                                    </p>
                                  )}
                                  {manager.phoneNumber && (
                                    <p className="text-sm text-gray-600 flex items-center gap-2">
                                      <Phone className="w-3 h-3" />
                                      {manager.phoneNumber}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        }

                        // Handle object structure
                        if (typeof branch.managerId === 'object') {
                          return (
                            <div>
                              <p className="text-gray-800 font-medium">{branch.managerId.fullName}</p>
                              {branch.managerId.email && (
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <Mail className="w-3 h-3" />
                                  {branch.managerId.email}
                                </p>
                              )}
                              {branch.managerId.phoneNumber && (
                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                  <Phone className="w-3 h-3" />
                                  {branch.managerId.phoneNumber}
                                </p>
                              )}
                            </div>
                          );
                        }

                        return <p className="text-gray-700">{branch.managerId}</p>;
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg p-6 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('staff_modal.no_branch_assigned')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PersonalInfo({
  staff,
  staffDetails,
  t,
  onEdit,
  canEdit
}: {
  staff: StaffDisplay;
  staffDetails: Staff | null;
  t: (key: string) => string;
  onEdit: () => void;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-orange-500">{t('staff_modal.personal_info').toUpperCase()}</h3>
          {canEdit && (
            <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={onEdit}>
              <Edit className="w-4 h-4" />
              {t('staff_modal.edit_profile')}
            </Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Row 1: Full name, Date of birth, Gender */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.full_name')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-700">{staffDetails?.userId?.fullName || staff.name}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.date_of_birth')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-700">
                  {staffDetails?.userId?.dateOfBirth
                    ? new Date(staffDetails.userId.dateOfBirth).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : t('staff_modal.no_info')}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.gender')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-700">
                  {staffDetails?.userId?.gender
                    ? t(`staff_modal.gender_${staffDetails.userId.gender.toLowerCase()}`)
                    : t('staff_modal.no_info')}
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Phone number, Address */}
          <div className="flex gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.phone_number')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg w-40">
                <p className="text-gray-700">{staffDetails?.userId?.phoneNumber || staff.phone}</p>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.address')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-700">{staffDetails?.userId?.address || t('staff_modal.no_info')}</p>
              </div>
            </div>
          </div>

          {/* Row 3: Email, Role, Salary */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.email')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-700">{staffDetails?.userId?.email || staff.email}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.role')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <span className="text-orange-600">{staffDetails?.jobTitle || staff.jobTitle}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.salary')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-700">{staffDetails?.salary?.toLocaleString() || staff.salary}</p>
              </div>
            </div>
          </div>

          {/* Row 4: Join date, Username */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.join_date')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-700">
                  {staffDetails?.createdAt
                    ? new Date(staffDetails.createdAt).toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : t('staff_modal.no_info')}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{t('staff_modal.username')}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-gray-700">{staffDetails?.userId?.username || staff.email.split('@')[0]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
