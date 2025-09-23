import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, User, Building2, Phone, MapPin, Calendar, Shield, DollarSign, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useStaffDetails, useUpdateStaff } from '@/hooks/useStaff';
import { useUser } from '@/hooks/useAuth';
import EditStaffForm from '@/components/forms/EditStaffForm';
import type { StaffDisplay, Staff, StaffFormData, StaffJobTitle, StaffUpdateData } from '@/types/api/Staff';
import type { PopulatedUser } from '@/types/api/User';

interface StaffProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffDisplay | null;
  initialEditMode?: boolean;
}

export default function StaffProfileModal({ isOpen, onClose, staff, initialEditMode = false }: StaffProfileModalProps) {
  const { t } = useTranslation();
  const currentUser = useUser();
  const [activeTab, setActiveTab] = useState<'personal' | 'branch'>('personal');
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<StaffFormData>({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    phoneNumber: '',
    address: '',
    email: '',
    jobTitle: 'Personal Trainer',
    salary: '',
    branchId: '',
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
        branchId: staffDetails.branchId?._id || '',
        status: staffDetails.status || staff.status || 'ACTIVE'
      });
    }
  }, [staffDetails, staff]);

  const handleInputChange = (field: keyof StaffFormData, value: string) => {
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
    // Only include branchId if user is OWNER (managers cannot change branch)
    if (formData.branchId && currentUser?.role === 'OWNER') {
      updateData.branchId = formData.branchId;
    }
    if (formData.salary) updateData.salary = parseInt(formData.salary);
    if (formData.status) updateData.status = formData.status;

    await updateStaff(staff.id, updateData);
    await refetch();
    setIsEditMode(false);
  };

  const handleCancel = () => {
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
        branchId: staffDetails.branchId?._id || '',
        status: staffDetails.status || staff.status || 'ACTIVE'
      });
    }
    setIsEditMode(false);
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-10 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
              currentBranchName={staffDetails?.branchId?.branchName || staff.branch}
            />
          ) : activeTab === 'branch' ? (
            <BranchInfo staff={staff} staffDetails={staffDetails} t={t} onEdit={handleEditClick} />
          ) : (
            <PersonalInfo staff={staff} staffDetails={staffDetails} t={t} onEdit={handleEditClick} />
          )}
        </div>
      </div>
    </div>
  );
}

function BranchInfo({
  staff,
  staffDetails,
  t,
  onEdit
}: {
  staff: StaffDisplay;
  staffDetails: Staff | null;
  t: (key: string) => string;
  onEdit: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-orange-500">{t('staff_modal.branch_info').toUpperCase()}</h3>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={onEdit}>
          <Edit className="w-4 h-4" />
          {t('staff_modal.edit_profile')}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Row 1: Branch name, Branch address */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.branch_name')}</span>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-700">{staffDetails?.branchId?.branchName || staff.branch}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.branch_address')}</span>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-700">{staffDetails?.branchId?.location}</p>
            </div>
          </div>
        </div>

        {/* Row 2: Hotline, Branch owner */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.hotline')}</span>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-700">{staffDetails?.branchId?.hotline}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{t('staff_modal.branch_manager')}</span>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-700">
                {(() => {
                  const managerId = staffDetails?.branchId?.managerId as PopulatedUser | PopulatedUser[] | undefined;
                  if (!managerId) return t('staff_modal.no_info');

                  if (Array.isArray(managerId)) {
                    const activeManager = managerId.find((manager) => manager?.status === 'ACTIVE');
                    return activeManager?.fullName || t('staff_modal.no_info');
                  }

                  return managerId?.status === 'ACTIVE'
                    ? managerId?.fullName || t('staff_modal.no_info')
                    : t('staff_modal.no_info');
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonalInfo({
  staff,
  staffDetails,
  t,
  onEdit
}: {
  staff: StaffDisplay;
  staffDetails: Staff | null;
  t: (key: string) => string;
  onEdit: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-orange-500">{t('staff_modal.personal_info').toUpperCase()}</h3>
          <Button variant="outline" className="flex items-center gap-2 bg-transparent" onClick={onEdit}>
            <Edit className="w-4 h-4" />
            {t('staff_modal.edit_profile')}
          </Button>
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
