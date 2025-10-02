import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useEquipmentDetails, useUpdateEquipment } from '../../hooks/useEquipment';
import { useBranch } from '../../contexts/BranchContext';
import { validateEquipmentForm } from '../../utils/equipmentValidation';
import type { Branch } from '../../types/api/Branch';
import type { UpdateEquipmentRequest, CreateEquipmentRequest } from '../../types/api/Equipment';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { NotFoundMessage } from '../../components/common/NotFoundMessage';
import { EquipmentForm } from '../../components/equipment/EquipmentForm';

// Helper function to extract branch ID safely
const extractBranchId = (branchId: string | { _id: string } | undefined): string | undefined => {
  if (typeof branchId === 'string') {
    return branchId;
  }
  if (branchId && typeof branchId === 'object' && '_id' in branchId) {
    return branchId._id;
  }
  return undefined;
};

export const EditEquipmentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  // Determine base path based on current location
  const getBasePath = () => {
    if (location.pathname.startsWith('/manage/technician')) {
      return '/manage/technician/equipment';
    } else if (location.pathname.startsWith('/manage')) {
      return '/manage/equipment';
    }
    return '/manage/technician/equipment'; // fallback
  };

  const {
    equipment,
    loading: equipmentLoading,
    error: equipmentError,
    refetch: refetchEquipment
  } = useEquipmentDetails(id || null);

  const { branches: branchDisplays, loading: branchesLoading } = useBranch();

  // Convert BranchDisplay[] to Branch[] for compatibility
  const branches: Branch[] = branchDisplays.map((branch) => ({
    ...branch,
    openingHours:
      typeof branch.openingHours === 'object'
        ? `${branch.openingHours.open} - ${branch.openingHours.close}`
        : branch.openingHours
  }));

  // Update equipment mutation
  const {
    updateEquipment,
    loading: updateLoading,
    error: updateError,
    resetError: resetUpdateError
  } = useUpdateEquipment();

  // Local state cho form
  const [formData, setFormData] = useState<UpdateEquipmentRequest>({});

  // Initialize form data when equipment is loaded
  useEffect(() => {
    if (equipment) {
      const branchIdString = extractBranchId(equipment.branchId);

      setFormData({
        equipmentCode: equipment.equipmentCode,
        equipmentName: equipment.equipmentName,
        category: equipment.category,
        branchId: branchIdString,
        manufacturer: equipment.manufacturer,
        price: equipment.price,
        dateOfPurchase: equipment.dateOfPurchase ? new Date(equipment.dateOfPurchase).toISOString().split('T')[0] : '',
        warrantyExpirationDate: equipment.warrantyExpirationDate,
        status: equipment.status,
        location: equipment.location,
        images: equipment.images
      });
    }
  }, [equipment]);

  const handleFormDataChange = (data: CreateEquipmentRequest | UpdateEquipmentRequest) => {
    setFormData(data as UpdateEquipmentRequest);
  };

  const validateForm = (): boolean => {
    const validation = validateEquipmentForm({
      ...formData,
      branchId: formData.branchId || ''
    });

    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(t(`error.${error}`));
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !id) {
      return;
    }

    // Update equipment using hook
    const updatedEquipment = await updateEquipment(id, formData);

    if (updatedEquipment) {
      toast.success(t('equipment.update_success'));
      navigate(getBasePath());
    }
  };

  // Loading state
  const loading = equipmentLoading || branchesLoading || updateLoading;

  // Error state
  const error = equipmentError || updateError;

  if (loading && !equipment) {
    return <LoadingSpinner />;
  }

  if (equipmentError && !equipment) {
    return <NotFoundMessage message={t('equipment.not_found')} />;
  }

  if (!equipment) {
    return <NotFoundMessage message={t('equipment.not_found')} />;
  }

  return (
    <>
      <EquipmentForm
        mode="edit"
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate(getBasePath())}
        loading={loading}
        branches={branches}
        branchesLoading={branchesLoading}
      />

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    resetUpdateError();
                    if (equipmentError) {
                      refetchEquipment();
                    }
                  }}
                  className="bg-red-100 px-2 py-1 text-sm font-medium text-red-800 rounded-md hover:bg-red-200"
                >
                  {t('common.dismiss')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
