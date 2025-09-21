import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Edit3,
  Camera,
  ChevronDown,
  Tag,
  Phone,
  Dumbbell,
  Target,
  MapPin,
  User,
  Building,
  Clock,
  Power,
  Save,
  X
} from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import { BranchSelectorModal } from '@/components/modals/BranchSelectorModal';
import { staffApi } from '@/services/api/staffApi';
import { mapManagersToStaffIds } from '@/utils/managerUtils';
import type { BranchDisplay, BranchEditValues, CreateAndUpdateBranchRequest } from '@/types/api/Branch';
import type { Staff } from '@/types/api/Staff';
import { toast } from 'sonner';

const BranchDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const {
    branches,
    currentBranch,
    fetchBranchDetail,
    updateBranchApi,
    toggleBranchStatus,
    switchBranch,
    loading: contextLoading
  } = useBranch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branch, setBranch] = useState<BranchDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValues, setEditValues] = useState<BranchEditValues>({
    branchName: '',
    description: '',
    hotline: '',
    location: '',
    facilities: [],
    managerId: [],
    openingHours: {
      open: '06:00',
      close: '21:00'
    }
  });
  const [isSaving, setIsSaving] = useState(false);
  const [managers, setManagers] = useState<Staff[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Image upload states
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Helper function to parse openingHours
  const parseOpeningHours = (openingHours: string | { open: string; close: string }) => {
    let parsedOpeningHours = { open: '06:00', close: '21:00' };
    if (typeof openingHours === 'string') {
      const timeMatch = openingHours.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if (timeMatch) {
        parsedOpeningHours = {
          open: timeMatch[1],
          close: timeMatch[2]
        };
      }
    } else if (openingHours && typeof openingHours === 'object') {
      parsedOpeningHours = openingHours;
    }
    return parsedOpeningHours;
  };

  // Fetch branch detail if branchId is provided
  useEffect(() => {
    const loadBranch = async () => {
      if (branchId) {
        setLoading(true);
        // Check if branch is already in branches list to avoid unnecessary API call
        const existingBranch = branches.find((b) => b._id === branchId);
        if (existingBranch) {
          setBranch(existingBranch);
          setLoading(false);
          return;
        }

        const branchDetail = await fetchBranchDetail(branchId);
        if (branchDetail) {
          setBranch(branchDetail);
        }
        setLoading(false);
      } else {
        // Use current branch or find from branches list
        const foundBranch = branches.find((b) => b._id === branchId) || currentBranch;
        setBranch(foundBranch);
      }
    };

    loadBranch();
  }, [branchId, branches, fetchBranchDetail, currentBranch]); // Add currentBranch back to dependencies

  const handleBranchSelect = async (selectedBranch: BranchDisplay) => {
    // Use switchBranch to safely switch branches
    await switchBranch(selectedBranch._id);
    // Navigate to the new branch
    navigate(`/manage/branch/${selectedBranch._id}`);
  };

  const handleAddBranch = () => {
    navigate('/manage/add-branch');
  };

  // Fetch managers on component mount
  useEffect(() => {
    const fetchManagers = async () => {
      setLoadingManagers(true);
      const response = await staffApi.getManagers().catch(() => ({
        success: false,
        message: 'Network error - Không thể tải danh sách quản lý',
        data: []
      }));

      if (response.success && response.data) {
        setManagers(response.data);
      } else {
        toast.error(t('toast.cannot_load_managers'));
      }
      setLoadingManagers(false);
    };

    fetchManagers();
  }, [t]);

  // Initialize edit values when branch data loads
  useEffect(() => {
    if (branch) {
      // Find the staff IDs that correspond to the current managers
      const currentManagerStaffIds = mapManagersToStaffIds(branch.managerId, managers);

      setEditValues({
        branchName: branch.branchName,
        description: branch.description || '',
        hotline: branch.hotline || '',
        location: branch.location,
        facilities: branch.facilities || [],
        managerId: currentManagerStaffIds,
        openingHours: parseOpeningHours(branch.openingHours)
      });
    }
  }, [branch, managers]);

  const handleStartEdit = () => {
    if (branch) {
      // Find the staff IDs that correspond to the current managers
      const currentManagerStaffIds = mapManagersToStaffIds(branch.managerId, managers);

      setEditValues({
        branchName: branch.branchName,
        description: branch.description || '',
        hotline: branch.hotline || '',
        location: branch.location,
        facilities: branch.facilities || [],
        managerId: currentManagerStaffIds,
        openingHours: parseOpeningHours(branch.openingHours)
      });
    }
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Reset to original values
    if (branch) {
      // Find the staff IDs that correspond to the current managers
      const currentManagerStaffIds = mapManagersToStaffIds(branch.managerId, managers);

      setEditValues({
        branchName: branch.branchName,
        description: branch.description || '',
        hotline: branch.hotline || '',
        location: branch.location,
        facilities: branch.facilities || [],
        managerId: currentManagerStaffIds,
        openingHours: parseOpeningHours(branch.openingHours)
      });
    }
    // Reset image states
    setNewImage(null);
    setImagePreview(null);
  };

  const handleSaveEdit = async () => {
    if (!branch) return;

    setIsSaving(true);
    const updateData: CreateAndUpdateBranchRequest = {
      branchName: editValues.branchName,
      description: editValues.description,
      hotline: editValues.hotline,
      location: editValues.location,
      facilities: editValues.facilities,
      managerId: editValues.managerId.length > 0 ? editValues.managerId : null,
      openingHours: `${editValues.openingHours.open}-${editValues.openingHours.close}`
    };

    // If there's a new image, convert it to base64 and add to update data
    if (newImage) {
      const base64Image = await convertFileToBase64(newImage).catch(() => {
        toast.error(t('toast.image_processing_error'));
        return null;
      });
      if (base64Image) {
        updateData.coverImage = base64Image;
      }
    }

    const updatedBranch = await updateBranchApi(branch._id, updateData);
    if (updatedBranch) {
      setBranch(updatedBranch);
      setIsEditMode(false);
      // Reset image states after successful save
      setNewImage(null);
      setImagePreview(null);
      toast.success(t('toast.update_success'));
    } else {
      // Show error toast if update failed
      toast.error(t('toast.update_failed'));
    }

    setIsSaving(false);
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert file to base64'));
      reader.readAsDataURL(file);
    });
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('openingHours.')) {
      const [, timeValue] = field.split('.');
      setEditValues((prev) => ({
        ...prev,
        openingHours: {
          ...prev.openingHours,
          [timeValue]: value
        }
      }));
    } else {
      setEditValues((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFacilityChange = (facility: string, checked: boolean) => {
    setEditValues((prev) => ({
      ...prev,
      facilities: checked ? [...prev.facilities, facility] : prev.facilities.filter((f) => f !== facility)
    }));
  };

  const handleManagerChange = (managerId: string, checked: boolean) => {
    setEditValues((prev) => ({
      ...prev,
      managerId: checked ? [...prev.managerId, managerId] : prev.managerId.filter((id) => id !== managerId)
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('toast.invalid_image_file'));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('toast.image_size_exceeded'));
        return;
      }

      setIsUploadingImage(true);
      setNewImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
        setIsUploadingImage(false);
      };
      reader.onerror = () => {
        toast.error(t('toast.image_read_error'));
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setNewImage(null);
    setImagePreview(null);
    // Reset the file input
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleToggleStatus = async () => {
    if (!branch || togglingStatus) return;

    setTogglingStatus(true);
    await toggleBranchStatus(branch._id);
    // The branch will be updated in context, so we need to refresh local state
    const updatedBranch = await fetchBranchDetail(branch._id);
    if (updatedBranch) {
      setBranch(updatedBranch);
    }
    setTogglingStatus(false);
  };

  if (loading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800">Đang tải thông tin chi nhánh...</h2>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Chi nhánh không tồn tại</h2>
          <Button onClick={() => navigate('/manage/owner')}>Quay lại Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f3f4]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-orange-600">{branch.branchName}</h1>
              <p className="text-base sm:text-lg font-bold text-gray-800">{t('branch_detail.manage_branch_info')}</p>
            </div>
          </div>
          <div className="relative">
            <Button
              className="bg-[#0D1523] hover:bg-[#1a2332] text-white border-[#0D1523] hover:border-[#1a2332]"
              onClick={() => setIsModalOpen(!isModalOpen)}
            >
              {t('branch_detail.change_branch')}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>

            <BranchSelectorModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              currentBranch={currentBranch}
              branches={branches}
              onBranchSelect={handleBranchSelect}
              onAddBranch={handleAddBranch}
            />
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="bg-orange-500 rounded-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="relative flex justify-center sm:justify-start">
              <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                <AvatarImage src={imagePreview || branch.coverImage} alt={branch.branchName} />
                <AvatarFallback className="bg-white text-orange-600 text-xl sm:text-2xl">
                  {branch.branchName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {isEditMode ? (
                <div className="absolute -bottom-1 -right-1">
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-white hover:bg-gray-100 p-0"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    disabled={isUploadingImage || isSaving}
                  >
                    {isUploadingImage ? (
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-orange-500"></div>
                    ) : (
                      <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                    )}
                  </Button>
                  {imagePreview && (
                    <Button
                      size="sm"
                      className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-red-500 hover:bg-red-600 p-0"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-2 w-2 sm:h-3 sm:w-3 text-white" />
                    </Button>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  className="absolute -bottom-1 -right-1 h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-white hover:bg-gray-100 p-0"
                  onClick={() => setIsEditMode(true)}
                >
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                </Button>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              {/* Branch Name */}
              <div className="mb-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{branch.branchName}</h2>
              </div>

              {/* Description */}
              <div className="mb-3">
                <p className="text-white/90 text-sm sm:text-base">{branch.description || 'Chưa có mô tả'}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-white text-orange-600 hover:bg-gray-100">
                  {branch.status === 'ACTIVE' ? t('branch_detail.status_active') : t('branch_detail.status_inactive')}
                </Badge>
                {imagePreview && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    {t('branch_detail.new_image_selected')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="bg-white border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-lg sm:text-xl font-bold text-orange-600">
                {t('branch_detail.branch_info_title')}
              </CardTitle>
              {!isEditMode ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800"
                  onClick={handleStartEdit}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {t('staff_modal.edit_profile')}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="bg-orange-600 text-white hover:bg-orange-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? t('branch_detail.saving') : t('branch_detail.save_changes')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="text-gray-600"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('branch_detail.cancel')}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-500">{t('branch_detail.branch_name')}</label>
                  </div>
                  {isEditMode ? (
                    <Input
                      value={editValues.branchName}
                      onChange={(e) => handleInputChange('branchName', e.target.value)}
                      className="text-lg font-semibold text-gray-800"
                      placeholder={t('branch_detail.branch_name_placeholder')}
                    />
                  ) : (
                    <p className="text-lg font-semibold text-gray-800">{branch.branchName}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Tag className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-500">{t('branch_detail.description')}</label>
                  </div>
                  {isEditMode ? (
                    <Textarea
                      value={editValues.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="text-lg text-gray-800 min-h-[80px]"
                      placeholder={t('branch_detail.description_placeholder')}
                    />
                  ) : (
                    <p className="text-lg text-gray-800">{branch.description || t('branch_detail.no_description')}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-500">{t('branch_detail.hotline')}</label>
                  </div>
                  {isEditMode ? (
                    <Input
                      value={editValues.hotline}
                      onChange={(e) => handleInputChange('hotline', e.target.value)}
                      className="text-lg text-gray-800"
                      placeholder={t('branch_detail.hotline_placeholder')}
                    />
                  ) : (
                    <p className="text-lg text-gray-800">{branch.hotline || t('branch_detail.no_hotline')}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Dumbbell className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-500">{t('branch_detail.facilities')}</label>
                  </div>
                  {isEditMode ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {[
                          'Gym',
                          'Cardio',
                          'Weight Training',
                          'Yoga',
                          'Pilates',
                          'Sauna',
                          'Swimming Pool',
                          'Personal Training',
                          'Group Classes',
                          'Locker Room',
                          'Parking',
                          'Café',
                          'Shower',
                          'Towel Service'
                        ].map((facility) => (
                          <label key={facility} className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editValues.facilities.includes(facility)}
                              onChange={(e) => handleFacilityChange(facility, e.target.checked)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-gray-700">{facility}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {branch.facilities && branch.facilities.length > 0 ? (
                        branch.facilities.slice(0, 3).map((facility, index) => (
                          <Badge key={index} variant="outline" className="text-gray-700 border-gray-300">
                            {facility}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-gray-700 border-gray-300">
                          Chưa có tiện ích
                        </Badge>
                      )}
                      {branch.facilities && branch.facilities.length > 3 && (
                        <Badge variant="outline" className="text-gray-500 border-gray-200">
                          +{branch.facilities.length - 3} khác
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Target className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-500">Tình trạng</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${branch.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}
                    ></div>
                    <span className={`font-medium ${branch.status === 'ACTIVE' ? 'text-green-600' : 'text-red-600'}`}>
                      {branch.status === 'ACTIVE'
                        ? t('branch_detail.status_active')
                        : t('branch_detail.status_inactive')}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleToggleStatus}
                      disabled={togglingStatus}
                      className="ml-2 text-xs"
                    >
                      <Power className="h-3 w-3 mr-1" />
                      {togglingStatus
                        ? t('branch_detail.processing')
                        : branch.status === 'ACTIVE'
                          ? t('branch_detail.turn_off')
                          : t('branch_detail.turn_on')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-500">{t('branch_detail.address')}</label>
                  </div>
                  {isEditMode ? (
                    <Input
                      value={editValues.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="text-lg text-gray-800"
                      placeholder={t('branch_detail.address_placeholder')}
                    />
                  ) : (
                    <p className="text-lg text-gray-800">{branch.location}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="h-4 w-4 text-gray-500 " />
                    <label className="text-sm font-medium text-gray-500 ">{t('branch_detail.manager')}</label>
                  </div>
                  {isEditMode ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {loadingManagers ? (
                        <p className="text-sm text-gray-500">{t('branch_detail.loading')}</p>
                      ) : managers.length === 0 ? (
                        <p className="text-sm text-gray-500">{t('branch_detail.no_managers_available')}</p>
                      ) : (
                        managers.map((manager) => (
                          <div key={manager._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`manager-${manager._id}`}
                              checked={editValues.managerId.includes(manager._id)}
                              onCheckedChange={(checked) => handleManagerChange(manager._id, checked as boolean)}
                            />
                            <label
                              htmlFor={`manager-${manager._id}`}
                              className="text-sm text-gray-800 cursor-pointer flex-1"
                            >
                              {manager.userId.fullName} - {manager.userId.email}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {Array.isArray(branch.managerId) && branch.managerId.length > 0 ? (
                        branch.managerId.map((manager, index) => (
                          <p key={index} className="text-lg text-gray-800">
                            {manager.fullName} - {manager.email}
                          </p>
                        ))
                      ) : branch.managerId && !Array.isArray(branch.managerId) ? (
                        <p className="text-lg text-gray-800">
                          {branch.managerId.fullName} - {branch.managerId.email}
                        </p>
                      ) : (
                        <p className="text-lg text-gray-800">{t('branch_detail.no_manager_option')}</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Building className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-500">{t('branch_detail.owner')}</label>
                  </div>
                  <p className="text-lg text-gray-800">
                    {branch.ownerId?.fullName || branch.ownerId?.email || t('branch_detail.no_owner')}
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <label className="text-sm font-medium text-gray-500">{t('branch_detail.opening_hours')}</label>
                  </div>
                  {isEditMode ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={editValues.openingHours.open}
                        onChange={(e) => handleInputChange('openingHours.open', e.target.value)}
                        className="text-lg text-gray-800"
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="time"
                        value={editValues.openingHours.close}
                        onChange={(e) => handleInputChange('openingHours.close', e.target.value)}
                        className="text-lg text-gray-800"
                      />
                    </div>
                  ) : (
                    <p className="text-lg text-gray-800">
                      {typeof branch.openingHours === 'string'
                        ? branch.openingHours
                        : `${branch.openingHours?.open || '06:00'} - ${branch.openingHours?.close || '21:00'}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BranchDetailPage;
