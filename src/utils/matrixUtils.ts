import type { MatrixDisplayData, MatrixCellData, MatrixResponse } from '@/types/api/Matrix';
import type { LegacyService } from '@/types/api/Package';

/**
 * Convert Matrix API response to legacy display format for existing component
 */
export const convertMatrixToLegacyFormat = (matrixData: MatrixResponse['data'] | null): MatrixDisplayData => {
  // Safety check for matrixData
  if (!matrixData) {
    return {
      services: [],
      features: [],
      cells: {}
    };
  }

  // Convert packages to legacy services
  const services: LegacyService[] = (matrixData.packages || []).map((pkg) => {
    return {
      id: pkg._id,
      name: pkg.name,
      type: undefined, // Type is not available in packages array
      price: undefined, // Price is not available in packages array
      durationInMonths: pkg.defaultDurationMonths,
      status: pkg.status === 'ACTIVE' ? 'active' : 'inactive'
    };
  });

  // Convert features to legacy format
  const features = (matrixData.features || []).map((feature, index) => ({
    id: feature._id,
    name: feature.name,
    type: feature.dataType as 'BOOLEAN' | 'NUMBER' | 'TEXT',
    unit: feature.unitLabel || null,
    rowOrder: index + 1
  }));

  // Convert matrix cells to legacy format using items
  const cells: Record<string, MatrixCellData> = {};

  (matrixData.items || []).forEach((item) => {
    item.featureValues.forEach((featureValue) => {
      const key = `${item.packageId}__${featureValue.featureId}`;

      cells[key] = {
        serviceId: item.packageId,
        featureId: featureValue.featureId,
        isIncluded: featureValue.value !== null && featureValue.value !== false,
        valueNumber: typeof featureValue.value === 'number' ? featureValue.value : null,
        valueText: typeof featureValue.value === 'string' ? featureValue.value : null
      };
    });
  });

  return {
    services,
    features,
    cells
  };
};

/**
 * Create matrix cell key
 */
export const createMatrixCellKey = (serviceId: string, featureId: string): string => {
  return `${serviceId}__${featureId}`;
};
