import type { CreateEquipmentRequest, UpdateEquipmentRequest } from '@/types/api/Equipment';

export interface EquipmentValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateEquipmentForm = (
  formData: (CreateEquipmentRequest | UpdateEquipmentRequest) & { branchId?: string }
): EquipmentValidationResult => {
  const errors: string[] = [];

  // Equipment Code validation - removed because it's auto-generated

  // Equipment Name validation
  if (!formData.equipmentName?.trim()) {
    errors.push('equipment_name_required');
  } else if (formData.equipmentName.trim().length > 200) {
    errors.push('equipment_name_too_long');
  }

  // Category validation
  if (!formData.category) {
    errors.push('equipment_category_required');
  }

  // Branch ID validation
  const branchId = (() => {
    if (typeof formData.branchId === 'string') {
      return formData.branchId;
    }
    if (formData.branchId && typeof formData.branchId === 'object' && '_id' in formData.branchId) {
      return (formData.branchId as { _id: string })._id;
    }
    return formData.branchId;
  })();

  if (!branchId || (typeof branchId === 'string' && !branchId.trim())) {
    errors.push('equipment_branch_required');
  } else if (typeof branchId === 'string' && !/^[0-9a-fA-F]{24}$/.test(branchId.trim())) {
    errors.push('equipment_branch_invalid');
  }

  // Manufacturer validation
  if (!formData.manufacturer?.trim()) {
    errors.push('equipment_manufacturer_required');
  } else if (formData.manufacturer.trim().length > 100) {
    errors.push('equipment_manufacturer_too_long');
  }

  // Price validation
  if (!formData.price?.trim()) {
    errors.push('equipment_price_required');
  } else if (!/^\d+(\.\d{1,2})?$/.test(formData.price.trim())) {
    errors.push('equipment_price_invalid');
  }

  // Date of Purchase validation
  if (!formData.dateOfPurchase) {
    errors.push('equipment_purchase_date_required');
  } else {
    const purchaseDate = new Date(formData.dateOfPurchase);
    const today = new Date();
    if (purchaseDate > today) {
      errors.push('equipment_purchase_date_future');
    }
  }

  // Warranty Expiration Date validation
  if (!formData.warrantyExpirationDate) {
    errors.push('equipment_warranty_date_required');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.warrantyExpirationDate)) {
    errors.push('equipment_warranty_date_invalid');
  }

  // Status validation
  if (!formData.status) {
    errors.push('equipment_status_required');
  }

  // Location validation (optional but check length if provided)
  if (formData.location && formData.location.trim().length > 200) {
    errors.push('equipment_location_too_long');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
