import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileSpreadsheet, Dumbbell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CreateEquipmentRequest, UpdateEquipmentRequest } from '../../types/api/Equipment';
import type { Staff } from '../../types/api/Staff';
import type { Branch } from '../../types/api/Branch';
import { EQUIPMENT_CATEGORY_DISPLAY, getEquipmentStatusDisplay } from '../../types/api/Equipment';
import { useImageUpload } from '../../hooks/useImageUpload';

interface EquipmentFormProps {
  mode: 'add' | 'edit';
  formData: CreateEquipmentRequest | UpdateEquipmentRequest;
  onFormDataChange: (data: CreateEquipmentRequest | UpdateEquipmentRequest) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading?: boolean;
  staffInfo?: Staff | null;
  staffLoading?: boolean;
  staffError?: string | null;
  branches?: Branch[];
  branchesLoading?: boolean;
  onShowExcelImport?: () => void;
}

export const EquipmentForm: React.FC<EquipmentFormProps> = ({
  mode,
  formData,
  onFormDataChange,
  onSubmit,
  loading = false,
  staffInfo,
  staffLoading = false,
  staffError,
  branches = [],
  branchesLoading = false,
  onShowExcelImport
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { uploadingImages, handleImageUpload, removeImage } = useImageUpload();

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
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-orange-500">
                  <Dumbbell className="h-3.5 w-3.5" />
                  {t('equipment.equipment_management')}
                </span>
                <h2 className="mt-3 text-2xl font-semibold text-gray-900">{title}</h2>
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                {isAddMode && onShowExcelImport && (
                  <button
                    onClick={onShowExcelImport}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-500"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4 inline" />
                    {t('equipment.excel_import')}
                  </button>
                )}
                <button
                  onClick={() => navigate('/manage/technician/equipment')}
                  className="h-11 rounded-full bg-orange-500 px-6 text-sm font-semibold text-white shadow-sm hover:bg-orange-600"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 inline" />
                  {isAddMode ? t('common.back_to_list') : t('common.back')}
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
                ) : (
                  <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                    <p className="text-sm text-red-800 mb-3">
                      <span className="font-medium">{t('common.error')}:</span>{' '}
                      {staffError || t('equipment.staff_error')}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="rounded-full bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                    >
                      {t('equipment.reload_page')}
                    </button>
                  </div>
                )}
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
                  <select
                    name="category"
                    value={formData.category || 'STRENGTH'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {Object.entries(EQUIPMENT_CATEGORY_DISPLAY).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('equipment.branch')} *</label>
                  <select
                    name="branchId"
                    value={formData.branchId || ''}
                    onChange={handleInputChange}
                    disabled={branchesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">{t('equipment.select_branch')}</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.branchName}
                      </option>
                    ))}
                  </select>
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
                  <input
                    type="date"
                    name="dateOfPurchase"
                    value={formData.dateOfPurchase || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('equipment.warranty_expiration')}
                  </label>
                  <input
                    type="date"
                    name="warrantyExpirationDate"
                    value={formData.warrantyExpirationDate || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('equipment.status')} *</label>
                  <select
                    name="status"
                    value={formData.status || 'ACTIVE'}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="ACTIVE">{getEquipmentStatusDisplay('ACTIVE', t).label}</option>
                    <option value="INACTIVE">{getEquipmentStatusDisplay('INACTIVE', t).label}</option>
                    <option value="MAINTENANCE">{getEquipmentStatusDisplay('MAINTENANCE', t).label}</option>
                    <option value="REPAIR">{getEquipmentStatusDisplay('REPAIR', t).label}</option>
                    <option value="RETIRED">{getEquipmentStatusDisplay('RETIRED', t).label}</option>
                  </select>
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
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="h-12 rounded-full bg-orange-500 px-8 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
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
