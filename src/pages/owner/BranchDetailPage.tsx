import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ManagerSelector from '@/components/ui/ManagerSelector';
import { Edit3, Camera, Tag, Phone, Dumbbell, Target, MapPin, User, Clock, Power, Save, X } from 'lucide-react';
import { useBranch } from '@/contexts/BranchContext';
import { staffApi } from '@/services/api/staffApi';
import { mapManagersToStaffIds } from '@/utils/managerUtils';
import type { BranchDisplay, BranchEditValues, CreateAndUpdateBranchRequest } from '@/types/api/Branch';
import type { Staff } from '@/types/api/Staff';
import { toast } from 'sonner';
import DisableBranchModal from '@/components/modals/DisableBranchModal';

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
    loading: contextLoading
  } = useBranch();
  const [branch, setBranch] = useState<BranchDisplay | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

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
  const [showAllManagers, setShowAllManagers] = useState(false);

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
        // Always fetch fresh data from API to ensure we have the latest manager information
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
  }, [branchId, fetchBranchDetail, currentBranch, branches]);

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

    // If branch is active, show confirmation modal
    if (branch.status === 'ACTIVE') {
      setShowDisableModal(true);
      return;
    }

    // If branch is inactive, directly enable it
    setTogglingStatus(true);
    try {
      await toggleBranchStatus(branch._id);
      // The branch will be updated in context, so we need to refresh local state
      const updatedBranch = await fetchBranchDetail(branch._id);
      if (updatedBranch) {
        setBranch(updatedBranch);
      }
      toast.success(t('branch_detail.enable_success', { defaultValue: 'Chi nhánh đã được kích hoạt' }));
    } catch (_error) {
      toast.error(t('branch_detail.enable_failed', { defaultValue: 'Không thể kích hoạt chi nhánh' }));
    }
    setTogglingStatus(false);
  };

  const handleConfirmDisable = async () => {
    if (!branch || togglingStatus) return;

    setTogglingStatus(true);
    try {
      await toggleBranchStatus(branch._id);
      // The branch will be updated in context, so we need to refresh local state
      const updatedBranch = await fetchBranchDetail(branch._id);
      if (updatedBranch) {
        setBranch(updatedBranch);
      }
      toast.success(t('branch_detail.disable_success', { defaultValue: 'Chi nhánh đã được tắt' }));
    } catch (_error) {
      toast.error(t('branch_detail.disable_failed', { defaultValue: 'Không thể tắt chi nhánh' }));
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

  const activeManagers =
    Array.isArray(branch.managerId) && branch.managerId.length > 0
      ? branch.managerId.filter((manager) => manager.status === 'ACTIVE')
      : branch.managerId && !Array.isArray(branch.managerId) && branch.managerId.status === 'ACTIVE'
        ? [branch.managerId]
        : [];

  const openingHoursValue = branch.openingHours as unknown;
  const formattedOpeningHours =
    typeof openingHoursValue === 'string'
      ? openingHoursValue.includes('-')
        ? openingHoursValue.replace('-', ' - ')
        : openingHoursValue
      : `${(branch.openingHours as { open?: string; close?: string })?.open || '06:00'} - ${(branch.openingHours as { open?: string; close?: string })?.close || '21:00'}`;

  const facilityCount = branch.facilities?.length || 0;
  const visibleManagers = showAllManagers ? activeManagers : activeManagers.slice(0, 4);
  const remainingManagers = activeManagers.length - visibleManagers.length;

  return (
    <>
      <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-8 sm:pt-10">
          <div className="relative overflow-hidden rounded-[32px] border border-orange-100/70 bg-gradient-to-b from-white via-white to-orange-50/50 shadow-[0_32px_120px_rgba(240,90,41,0.1)]">
            <div className="pointer-events-none absolute inset-x-6 -top-10 h-36 rounded-full bg-gradient-to-b from-orange-100/50 via-orange-50/20 to-transparent blur-3xl" />
            <div className="relative p-4 sm:p-6 lg:p-8 space-y-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="flex flex-1 items-start gap-5">
                  <div className="relative">
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-4 ring-[color:var(--gym-orange)]/30 shadow-xl">
                      <AvatarImage src={imagePreview || branch.coverImage} alt={branch.branchName} />
                      <AvatarFallback className="bg-white/90 text-slate-900 text-xl sm:text-2xl font-semibold">
                        {branch.branchName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {isEditMode && (
                      <div className="absolute -bottom-3 -right-3 flex items-center gap-2">
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <Button
                          size="sm"
                          className="h-8 rounded-full border border-orange-200/80 bg-white px-3 text-xs font-medium text-orange-700 shadow-sm hover:bg-orange-50"
                          onClick={() => document.getElementById('image-upload')?.click()}
                          disabled={isUploadingImage || isSaving}
                        >
                          {isUploadingImage ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Camera className="h-4 w-4" />
                              <span>{t('branch_detail.change_cover', { defaultValue: 'Đổi ảnh' })}</span>
                            </>
                          )}
                        </Button>
                        {imagePreview && (
                          <Button
                            size="icon"
                            className="h-8 w-8 rounded-full border border-red-200 bg-red-500/90 text-white hover:bg-red-500"
                            onClick={handleRemoveImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl sm:text-3xl font-semibold leading-tight text-slate-900">
                        {branch.branchName}
                      </h1>
                      <Badge
                        variant="secondary"
                        className={`border-none text-white shadow-sm ${
                          branch.status === 'ACTIVE' ? 'bg-[color:var(--gym-orange)]' : 'bg-rose-500/90'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${branch.status === 'ACTIVE' ? 'bg-white' : 'bg-white/90'}`}
                        />
                        {branch.status === 'ACTIVE'
                          ? t('branch_detail.status_active')
                          : t('branch_detail.status_inactive')}
                      </Badge>
                      {imagePreview && (
                        <Badge variant="outline" className="border-amber-200/80 bg-amber-100/20 text-amber-50">
                          {t('branch_detail.new_image_selected')}
                        </Badge>
                      )}
                      {isEditMode && (
                        <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                          {t('branch_detail.editing', { defaultValue: 'Chế độ chỉnh sửa' })}
                        </Badge>
                      )}
                    </div>
                    <p className="max-w-3xl text-sm sm:text-base text-gray-700">
                      {branch.description || t('branch_detail.no_description')}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1 shadow-sm">
                        <MapPin className="h-4 w-4 text-[color:var(--gym-orange)]" />
                        {branch.location}
                      </span>
                      {branch.hotline && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1 shadow-sm">
                          <Phone className="h-4 w-4 text-[color:var(--gym-orange)]" />
                          {branch.hotline}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-3 py-1 shadow-sm">
                        <Clock className="h-4 w-4 text-[#f5b65c]" />
                        {formattedOpeningHours}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:w-[320px] lg:justify-end">
                  {isEditMode ? (
                    <>
                      <Button
                        size="lg"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-[color:var(--gym-orange)] to-amber-500 text-white shadow-lg hover:shadow-orange-500/40"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? t('branch_detail.saving') : t('branch_detail.save_changes')}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                      >
                        <X className="h-4 w-4" />
                        {t('branch_detail.cancel')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-orange-200 bg-white text-orange-700 hover:bg-orange-50"
                      onClick={handleStartEdit}
                    >
                      <Edit3 className="h-4 w-4" />
                      {t('staff_modal.edit_profile')}
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleToggleStatus}
                    disabled={togglingStatus}
                    className={`border-orange-200 text-orange-700 hover:bg-orange-50 ${
                      branch.status === 'ACTIVE' ? 'bg-[color:var(--gym-orange)]/10' : 'bg-rose-50'
                    }`}
                  >
                    <Power className="h-4 w-4" />
                    {togglingStatus
                      ? t('branch_detail.processing')
                      : branch.status === 'ACTIVE'
                        ? t('branch_detail.turn_off')
                        : t('branch_detail.turn_on')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-[0_14px_50px_rgba(240,90,41,0.12)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-3 text-[color:var(--gym-orange)]">
                  <Target className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-orange-700/80">Tình trạng</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {branch.status === 'ACTIVE' ? t('branch_detail.status_active') : t('branch_detail.status_inactive')}
                  </p>
                  <p className="text-xs text-gray-500">{formattedOpeningHours}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-[0_14px_50px_rgba(240,90,41,0.12)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-3 text-[color:var(--gym-orange)]">
                  <User className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-orange-700/80">{t('branch_detail.manager')}</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {activeManagers.length > 0
                      ? `${activeManagers.length} ${t('branch_detail.manager')}`
                      : t('branch_detail.no_manager_option')}
                  </p>
                  <p className="text-xs text-gray-500">
                    Owner: {branch.ownerId?.fullName || branch.ownerId?.email || t('branch_detail.no_owner')}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 shadow-[0_14px_50px_rgba(240,90,41,0.12)] backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-50 p-3 text-[color:var(--gym-orange)]">
                  <Dumbbell className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-orange-700/80">{t('branch_detail.facilities')}</p>
                  <p className="text-lg font-semibold text-slate-900">{facilityCount} tiện ích</p>
                  <p className="text-xs text-gray-500">
                    {facilityCount > 0 ? 'Đang hiển thị cho khách' : 'Thêm tiện ích để nổi bật'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 rounded-2xl border-slate-200/70 bg-white/95 text-slate-900 shadow-2xl">
              <CardHeader className="border-b border-slate-200/70">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-900">Thông tin chi nhánh</CardTitle>
                    <p className="text-sm text-slate-500">{t('branch_detail.branch_info_title')}</p>
                  </div>
                  {isEditMode && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                      {t('branch_detail.editing', { defaultValue: 'Đang chỉnh sửa' })}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Tag className="h-4 w-4 text-slate-400" />
                      {t('branch_detail.branch_name')}
                    </label>
                    {isEditMode ? (
                      <Input
                        value={editValues.branchName}
                        onChange={(e) => handleInputChange('branchName', e.target.value)}
                        className="h-11 rounded-lg border-slate-200 bg-white text-base"
                        placeholder={t('branch_detail.branch_name_placeholder')}
                      />
                    ) : (
                      <p className="text-lg font-semibold text-slate-900">{branch.branchName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {t('branch_detail.address')}
                    </label>
                    {isEditMode ? (
                      <Input
                        value={editValues.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="h-11 rounded-lg border-slate-200 bg-white text-base"
                        placeholder={t('branch_detail.address_placeholder')}
                      />
                    ) : (
                      <p className="text-lg text-slate-900">{branch.location}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <Tag className="h-4 w-4 text-slate-400" />
                    {t('branch_detail.description')}
                  </label>
                  {isEditMode ? (
                    <Textarea
                      value={editValues.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="min-h-[110px] rounded-lg border-slate-200 bg-white text-base"
                      placeholder={t('branch_detail.description_placeholder')}
                    />
                  ) : (
                    <p className="text-base leading-relaxed text-slate-800">
                      {branch.description || t('branch_detail.no_description')}
                    </p>
                  )}
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {t('branch_detail.hotline')}
                    </label>
                    {isEditMode ? (
                      <Input
                        value={editValues.hotline}
                        onChange={(e) => handleInputChange('hotline', e.target.value)}
                        className="h-11 rounded-lg border-slate-200 bg-white text-base"
                        placeholder={t('branch_detail.hotline_placeholder')}
                      />
                    ) : (
                      <p className="text-lg text-slate-900">{branch.hotline || t('branch_detail.no_hotline')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <Clock className="h-4 w-4 text-slate-400" />
                      {t('branch_detail.opening_hours')}
                    </label>
                    {isEditMode ? (
                      <div className="flex items-center gap-3">
                        <Input
                          type="time"
                          value={editValues.openingHours.open}
                          onChange={(e) => handleInputChange('openingHours.open', e.target.value)}
                          className="h-11 rounded-lg border-slate-200 bg-white text-base"
                        />
                        <span className="text-slate-500">-</span>
                        <Input
                          type="time"
                          value={editValues.openingHours.close}
                          onChange={(e) => handleInputChange('openingHours.close', e.target.value)}
                          className="h-11 rounded-lg border-slate-200 bg-white text-base"
                        />
                      </div>
                    ) : (
                      <p className="text-lg text-slate-900">{formattedOpeningHours}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-orange-100 bg-white/95 text-slate-900 shadow-[0_20px_70px_rgba(240,90,41,0.12)] backdrop-blur">
              <CardHeader className="border-b border-orange-100/80">
                <CardTitle className="text-lg font-semibold text-slate-900">Vận hành & nhân sự</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-orange-700/80">{t('branch_detail.manager')}</p>
                  {isEditMode ? (
                    <div className="rounded-xl border border-orange-100 bg-white p-3">
                      {loadingManagers ? (
                        <p className="text-sm text-gray-500">{t('branch_detail.loading')}</p>
                      ) : (
                        <ManagerSelector
                          managers={managers.map((manager) => ({
                            _id: manager._id,
                            fullName: manager.userId?.fullName || 'Unknown',
                            email: manager.userId.email,
                            status: manager.userId.status
                          }))}
                          selectedManagerIds={editValues.managerId}
                          onManagerChange={(managerIds) =>
                            setEditValues((prev) => ({ ...prev, managerId: managerIds }))
                          }
                          placeholder={t('branch_detail.manager_placeholder')}
                        />
                      )}
                    </div>
                  ) : activeManagers.length > 0 ? (
                    <div className="space-y-2">
                      {visibleManagers.map((manager, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-xl border border-orange-100 bg-white px-3 py-2 shadow-sm"
                        >
                          <div className="space-y-0.5">
                            <p className="font-medium text-slate-900">{manager.fullName}</p>
                            <p className="text-xs text-gray-600">{manager.email}</p>
                          </div>
                          <Badge className="border-none bg-[color:var(--gym-orange)]/90 text-white">
                            {t('branch_detail.status_active')}
                          </Badge>
                        </div>
                      ))}
                      {remainingManagers > 0 && !showAllManagers && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                          onClick={() => setShowAllManagers(true)}
                        >
                          Xem thêm {remainingManagers} quản lý
                        </Button>
                      )}
                      {showAllManagers && activeManagers.length > 4 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-orange-700 hover:bg-orange-50"
                          onClick={() => setShowAllManagers(false)}
                        >
                          Thu gọn
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">{t('branch_detail.no_manager_option')}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-orange-700/80">{t('branch_detail.owner')}</p>
                  <div className="rounded-xl border border-orange-100 bg-white px-3 py-2 shadow-sm">
                    <p className="font-medium text-slate-900">
                      {branch.ownerId?.fullName || branch.ownerId?.email || t('branch_detail.no_owner')}
                    </p>
                    {branch.ownerId?.email && <p className="text-xs text-gray-600">{branch.ownerId.email}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-orange-700/80">Tình trạng chi nhánh</p>
                  <div className="flex items-center justify-between rounded-xl border border-orange-100 bg-white px-3 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          branch.status === 'ACTIVE' ? 'bg-[color:var(--gym-orange)]' : 'bg-rose-400'
                        }`}
                      />
                      <div>
                        <p className="font-medium text-slate-900">
                          {branch.status === 'ACTIVE'
                            ? t('branch_detail.status_active')
                            : t('branch_detail.status_inactive')}
                        </p>
                        <p className="text-xs text-gray-600">Cập nhật nhanh ngay bên trái</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`border-orange-200 ${
                        branch.status === 'ACTIVE'
                          ? 'bg-[color:var(--gym-orange)]/10 text-orange-800'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {branch.status === 'ACTIVE' ? 'Live' : 'Paused'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 rounded-2xl border-slate-200/70 bg-white/95 text-slate-900 shadow-2xl">
            <CardHeader className="border-b border-slate-200/70">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    {t('branch_detail.facilities')}
                  </CardTitle>
                  <p className="text-sm text-slate-500">
                    {facilityCount > 0 ? `${facilityCount} tiện ích đã cấu hình` : 'Chưa có tiện ích nào'}
                  </p>
                </div>
                {branch.facilities && branch.facilities.length > 3 && !isEditMode && (
                  <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                    +{branch.facilities.length - 3} khác
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isEditMode ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                    <label
                      key={facility}
                      className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-3 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={editValues.facilities.includes(facility)}
                        onChange={(e) => handleFacilityChange(facility, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      {facility}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {branch.facilities && branch.facilities.length > 0 ? (
                    branch.facilities.slice(0, 12).map((facility, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-slate-200 bg-slate-50 px-3 py-1 text-slate-700"
                      >
                        {facility}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                      Chưa có tiện ích
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DisableBranchModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        branch={branch}
        onConfirm={handleConfirmDisable}
        isProcessing={togglingStatus}
      />
    </>
  );
};

export default BranchDetailPage;
