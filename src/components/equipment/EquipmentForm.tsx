import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileSpreadsheet, Dumbbell, ChevronDown, Check, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/utils/utils';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type {
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  EquipmentCategory,
  EquipmentStatus
} from '../../types/api/Equipment';
import type { Staff } from '../../types/api/Staff';
import type { Branch } from '../../types/api/Branch';
import { EQUIPMENT_CATEGORY_DISPLAY, getEquipmentStatusDisplay } from '../../types/api/Equipment';
import { useImageUpload } from '../../hooks/useImageUpload';

interface EquipmentFormProps {
  mode: 'add' | 'edit';
  formData: CreateEquipmentRequest | UpdateEquipmentRequest;
  onFormDataChange: (data: CreateEquipmentRequest | UpdateEquipmentRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  loading?: boolean;
  staffInfo?: Staff | null;
  staffLoading?: boolean;
  branches?: Branch[];
  branchesLoading?: boolean;
  onShowExcelImport?: () => void;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  mode,
  formData,
  onFormDataChange,
  onSubmit,
  onCancel,
  loading = false,
  staffInfo,
  staffLoading = false,
  branches = [],
  branchesLoading = false,
  onShowExcelImport
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { uploadingImages, handleImageUpload, removeImage } = useImageUpload();

  // Dropdown states
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Date picker states
  const [purchaseDatePickerOpen, setPurchaseDatePickerOpen] = useState(false);
  const [warrantyDatePickerOpen, setWarrantyDatePickerOpen] = useState(false);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowCategoryDropdown(false);
        setShowBranchDropdown(false);
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFormDataChange({
      ...formData,
      [name]: value
    });
  };

  const handleImageUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    await handleImageUpload(files, formData.images || [], (newImages) => {
      onFormDataChange({
        ...formData,
        images: newImages
      });
    });
  };

  const handleRemoveImage = (index: number) => {
    removeImage(index, formData.images || [], (newImages) => {
      onFormDataChange({
        ...formData,
        images: newImages
      });
    });
  };

  const handlePurchaseDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onFormDataChange({
        ...formData,
        dateOfPurchase: formattedDate
      });
    }
    setPurchaseDatePickerOpen(false);
  };

  const handleWarrantyDateSelect = (date: Date | undefined) => {
    if (date) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      onFormDataChange({
        ...formData,
        warrantyExpirationDate: formattedDate
      });
    }
    setWarrantyDatePickerOpen(false);
  };

  const isAddMode = mode === 'add';
  const title = isAddMode ? t('equipment.add_title') : t('equipment.edit_equipment');
  const subtitle = isAddMode
    ? t('equipment.add_equipment_subtitle') || 'Add new equipment to your inventory.'
    : t('equipment.edit_equipment_subtitle') || 'Update equipment information and settings.';

  return (
    <div className="px-3 sm:px-4 lg:px-6">
      <div className="mt-4">
        <div className="bg-white rounded-3xl border border-orange-100 shadow-sm p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {t('equipment.equipment_management')}
                </span>
                <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">{title}</h2>
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {isAddMode && onShowExcelImport && (
                  <button
                    onClick={onShowExcelImport}
                    className="rounded-full border border-gray-300 px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-500 flex items-center justify-center"
                  >
                    <FileSpreadsheet className="mr-1 sm:mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">{t('equipment.excel_import')}</span>
                    <span className="sm:hidden">Import</span>
                  </button>
                )}
                <button
                  onClick={onCancel || (() => navigate('/manage/technician/equipment'))}
                  className="h-11 rounded-full bg-orange-500 px-4 sm:px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 flex items-center justify-center"
                >
                  <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{isAddMode ? t('common.back_to_list') : t('common.back')}</span>
                  <span className="sm:hidden">Back</span>
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            {/* User and Branch Information - Only for Add mode */}
            {isAddMode && (
              <>
                {staffLoading ? (
                  <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">{t('common.loading')}:</span> {t('equipment.loading_staff')}
                    </p>
                  </div>
                ) : staffInfo ? (
                  <div className="rounded-2xl border border-orange-100 bg-[#FFF6EE] p-4">
                    <div className="space-y-2">
                      <p className="text-sm text-orange-800">
                        <span className="font-medium">{t('equipment.user_info')}:</span> {staffInfo.userId?.fullName} -{' '}
                        {staffInfo.jobTitle}
                      </p>
                      <p className="text-sm text-orange-800">
                        <span className="font-medium">{t('common.role')}:</span>{' '}
                        {staffInfo.isOwner
                          ? t('common.owner')
                          : staffInfo.isAdmin
                            ? t('common.admin')
                            : t('common.staff')}
                      </p>
                      <p className="text-xs text-orange-600">{t('equipment.select_branch_below')}</p>
                    </div>
                  </div>
                ) : null}
              </>
            )}

            {/* Equipment Information */}
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-orange-600 mb-4">{t('equipment.equipment_info')}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.equipment_name')} *
                  </label>
                  <input
                    type="text"
                    name="equipmentName"
                    value={formData.equipmentName || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={t('equipment.equipment_name_placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('equipment.category')} *</label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCategoryDropdown(!showCategoryDropdown);
                        setShowBranchDropdown(false);
                        setShowStatusDropdown(false);
                      }}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between"
                    >
                      <span className="truncate">
                        {formData.category
                          ? EQUIPMENT_CATEGORY_DISPLAY[formData.category as keyof typeof EQUIPMENT_CATEGORY_DISPLAY]
                          : 'Select Category'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                        {Object.entries(EQUIPMENT_CATEGORY_DISPLAY).map(([key, value]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              onFormDataChange({
                                ...formData,
                                category: key as EquipmentCategory
                              });
                              setShowCategoryDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                              formData.category === key ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                            }`}
                          >
                            <span>{value}</span>
                            {formData.category === key && <Check className="h-4 w-4 text-orange-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('equipment.branch')} *</label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBranchDropdown(!showBranchDropdown);
                        setShowCategoryDropdown(false);
                        setShowStatusDropdown(false);
                      }}
                      disabled={branchesLoading}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">
                        {formData.branchId
                          ? branches.find((b) => b._id === formData.branchId)?.branchName
                          : t('equipment.select_branch')}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showBranchDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {showBranchDropdown && !branchesLoading && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            onFormDataChange({
                              ...formData,
                              branchId: ''
                            });
                            setShowBranchDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                            !formData.branchId ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                          }`}
                        >
                          <span>{t('equipment.select_branch')}</span>
                          {!formData.branchId && <Check className="h-4 w-4 text-orange-500" />}
                        </button>
                        {branches.map((branch) => (
                          <button
                            key={branch._id}
                            type="button"
                            onClick={() => {
                              onFormDataChange({
                                ...formData,
                                branchId: branch._id
                              });
                              setShowBranchDropdown(false);
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                              formData.branchId === branch._id ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                            }`}
                          >
                            <span>{branch.branchName}</span>
                            {formData.branchId === branch._id && <Check className="h-4 w-4 text-orange-500" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.manufacturer')} *
                  </label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={t('equipment.manufacturer_placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('equipment.price')} *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={t('equipment.price_placeholder')}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.date_of_purchase')} *
                  </label>
                  <Popover open={purchaseDatePickerOpen} onOpenChange={setPurchaseDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50 focus:border-orange-500 h-10 px-3 py-2',
                          !formData.dateOfPurchase && 'text-muted-foreground'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.dateOfPurchase
                          ? format(new Date(formData.dateOfPurchase + 'T00:00:00'), 'dd/MM/yyyy', { locale: vi })
                          : t('equipment.select_purchase_date') || 'Select purchase date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={formData.dateOfPurchase ? new Date(formData.dateOfPurchase + 'T00:00:00') : undefined}
                        onSelect={handlePurchaseDateSelect}
                        initialFocus
                        locale={vi}
                        className="bg-white border-0"
                        fromYear={2000}
                        toYear={new Date().getFullYear()}
                        captionLayout="dropdown"
                        disabled={(date) => date > new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.warranty_expiration')}
                  </label>
                  <Popover open={warrantyDatePickerOpen} onOpenChange={setWarrantyDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-white border-gray-300 hover:bg-gray-50 focus:border-orange-500 h-10 px-3 py-2',
                          !formData.warrantyExpirationDate && 'text-muted-foreground'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {formData.warrantyExpirationDate
                          ? format(new Date(formData.warrantyExpirationDate + 'T00:00:00'), 'dd/MM/yyyy', {
                              locale: vi
                            })
                          : t('equipment.select_warranty_date') || 'Select warranty date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={
                          formData.warrantyExpirationDate
                            ? new Date(formData.warrantyExpirationDate + 'T00:00:00')
                            : undefined
                        }
                        onSelect={handleWarrantyDateSelect}
                        initialFocus
                        locale={vi}
                        className="bg-white border-0"
                        fromYear={new Date().getFullYear()}
                        toYear={new Date().getFullYear() + 10}
                        captionLayout="dropdown"
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('equipment.status')} *</label>
                  <div className="relative dropdown-container">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStatusDropdown(!showStatusDropdown);
                        setShowCategoryDropdown(false);
                        setShowBranchDropdown(false);
                      }}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent flex items-center justify-between"
                    >
                      <span className="truncate">
                        {formData.status ? getEquipmentStatusDisplay(formData.status, t).label : 'Select Status'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showStatusDropdown ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {showStatusDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2">
                        {['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'REPAIR', 'RETIRED'].map((status) => {
                          const statusDisplay = getEquipmentStatusDisplay(status, t);
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => {
                                onFormDataChange({
                                  ...formData,
                                  status: status as EquipmentStatus
                                });
                                setShowStatusDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                                formData.status === status ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
                              }`}
                            >
                              <span>{statusDisplay.label}</span>
                              {formData.status === status && <Check className="h-4 w-4 text-orange-500" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('equipment.location')}</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder={t('equipment.location_placeholder')}
                  />
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-orange-600 mb-4">{t('equipment.images')}</h2>

              <div className="space-y-4">
                <div className="flex space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUploadChange}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImages}
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center space-x-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium cursor-pointer transition-colors hover:border-orange-300 hover:text-orange-500"
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                        <span>{t('equipment.uploading_images')}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>{t('equipment.upload_images')}</span>
                      </>
                    )}
                  </label>
                </div>

                {formData.images && formData.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={typeof image === 'string' ? image : image.url}
                          alt={`Equipment ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center sm:justify-end">
              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full sm:w-auto rounded-full bg-orange-500 px-6 sm:px-8 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{isAddMode ? t('equipment.creating') : t('equipment.updating')}</span>
                  </div>
                ) : isAddMode ? (
                  t('equipment.add_equipment')
                ) : (
                  t('equipment.update_equipment')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
