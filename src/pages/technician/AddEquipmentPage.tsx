import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useCreateEquipment } from '../../hooks/useEquipment';
import { useBranches } from '../../hooks/useBranches';
import { useCurrentUserStaff } from '../../hooks/useCurrentUserStaff';
import { validateEquipmentForm } from '../../utils/equipmentValidation';
import type { CreateEquipmentRequest, UpdateEquipmentRequest, Equipment } from '../../types/api/Equipment';
import { QRCodeModal } from '../../components/modals/QRCodeModal';
import { ExcelImportModal } from '../../components/modals/ExcelImportModal';
import { EquipmentForm } from '../../components/equipment/EquipmentForm';

export const AddEquipmentPage: React.FC = () => {
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

  const { currentStaff, loading: userLoading } = useCurrentUserStaff();
  const { branches, loading: branchesLoading } = useBranches();

  const {
    createEquipment,
    loading: createLoading,
    error: createError,
    resetError: resetCreateError
  } = useCreateEquipment();

  // Local state cho UI
  const [showQRModal, setShowQRModal] = useState(false);
  const [createdEquipment, setCreatedEquipment] = useState<Equipment | null>(null);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [formData, setFormData] = useState<CreateEquipmentRequest>({
    equipmentName: '',
    category: 'STRENGTH',
    branchId: '',
    manufacturer: '',
    price: '',
    dateOfPurchase: '',
    warrantyExpirationDate: '',
    status: 'ACTIVE',
    location: '',
    images: []
  });

  // Filter branches based on user role
  const filteredBranches = React.useMemo(() => {
    if (!currentStaff) return branches;

    if (currentStaff.isOwner || currentStaff.isAdmin) {
      return branches; // Show all branches
    }

    // For STAFF, only show branches they have access to
    if (currentStaff.branchId) {
      const userBranchIds = currentStaff.branchId.map((branch) => branch._id);
      return branches.filter((branch) => userBranchIds.includes(branch._id));
    }

    return branches;
  }, [currentStaff, branches]);

  // Auto-select first branch for STAFF if they only have access to one branch
  useEffect(() => {
    if (currentStaff && !currentStaff.isOwner && !currentStaff.isAdmin && filteredBranches.length === 1) {
      setFormData((prev) => ({
        ...prev,
        branchId: filteredBranches[0]._id
      }));
    }
  }, [currentStaff, filteredBranches]);

  const handleFormDataChange = (data: CreateEquipmentRequest | UpdateEquipmentRequest) => {
    setFormData(data as CreateEquipmentRequest);
  };

  const validateForm = (): boolean => {
    const validation = validateEquipmentForm({
      ...formData,
      branchId: formData.branchId
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

    if (!validateForm()) {
      return;
    }

    // Create equipment using hook
    const newEquipment = await createEquipment(formData);

    if (newEquipment) {
      setCreatedEquipment(newEquipment);
      setShowQRModal(true);
      toast.success(t('success.equipment_created'));

      // Reset form
      setFormData({
        equipmentName: '',
        category: 'STRENGTH',
        branchId: '',
        manufacturer: '',
        price: '',
        dateOfPurchase: '',
        warrantyExpirationDate: '',
        status: 'ACTIVE',
        location: '',
        images: []
      });
    }
  };

  const handleQRModalClose = () => {
    setShowQRModal(false);
    setCreatedEquipment(null);
    navigate(getBasePath());
  };

  const handleQRGenerated = (equipment: Equipment) => {
    setCreatedEquipment(equipment);
  };

  // Handle Excel import success
  const handleExcelImportSuccess = () => {
    setShowExcelImportModal(false);
    navigate(getBasePath());
  };

  // Loading state
  const loading = userLoading || branchesLoading || createLoading;

  // Error state
  const error = createError;

  return (
    <>
      <EquipmentForm
        mode="add"
        formData={formData}
        onFormDataChange={handleFormDataChange}
        onSubmit={handleSubmit}
        onCancel={() => navigate(getBasePath())}
        loading={loading}
        staffInfo={currentStaff}
        staffLoading={userLoading}
        branches={filteredBranches}
        branchesLoading={branchesLoading}
        onShowExcelImport={() => setShowExcelImportModal(true)}
      />

      {/* QR Code Modal */}
      {showQRModal && createdEquipment && (
        <QRCodeModal
          isOpen={showQRModal}
          equipment={createdEquipment}
          onClose={handleQRModalClose}
          onQRGenerated={handleQRGenerated}
          showSuccessToast={true}
        />
      )}

      {/* Excel Import Modal */}
      {showExcelImportModal && (
        <ExcelImportModal
          isOpen={showExcelImportModal}
          branches={filteredBranches}
          onClose={() => setShowExcelImportModal(false)}
          onImportSuccess={handleExcelImportSuccess}
        />
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={resetCreateError}
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
