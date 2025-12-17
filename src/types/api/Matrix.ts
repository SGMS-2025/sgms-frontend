import type { FeatureValueDisplay } from './Feature';

// ===== MATRIX TYPES =====

/**
 * Matrix response from backend API
 */
export interface MatrixResponse {
  success: boolean;
  message: string;
  data: {
    branch: {
      _id: string;
      branchName: string;
      location: string;
    };
    features: {
      _id: string;
      key: string;
      name: string;
      dataType: 'BOOLEAN' | 'NUMBER' | 'TEXT';
      unitLabel?: string;
    }[];
    packages: {
      _id: string;
      name: string;
      type?: 'PT' | 'CLASS' | 'GENERAL';
      status: 'ACTIVE' | 'INACTIVE';
      defaultDurationMonths: number;
      sessionCount?: number;
    }[];
    items: MatrixItem[];
    effectiveDate: string;
  };
}

/**
 * Matrix item representing package with merged feature values
 */
export interface MatrixItem {
  packageId: string;
  packageName: string;
  priceVND?: number | null;
  durationMonths: number;
  featureValues: FeatureValueDisplay[];
  hasOverride: boolean;
  overrideStatus?: 'ACTIVE' | 'INACTIVE' | 'HIDDEN' | null;
}

/**
 * Matrix query parameters
 */
export interface MatrixQueryParams {
  branchId: string;
  effectiveDate?: string;
  type?: 'PT' | 'CLASS';
}

/**
 * Public matrix response (filtered for customer view)
 */
export interface PublicMatrixResponse {
  success: boolean;
  message: string;
  data: {
    branch: {
      _id: string;
      branchName: string;
      location: string;
    };
    features: {
      _id: string;
      key: string;
      name: string;
      dataType: 'BOOLEAN' | 'NUMBER' | 'TEXT';
      unitLabel?: string;
    }[];
    packages: {
      _id: string;
      name: string;
      status: 'ACTIVE';
    }[];
    items: {
      packageId: string;
      packageName: string;
      priceVND?: number | null;
      durationMonths: number;
      featureValues: {
        featureId: string;
        featureKey: string;
        featureName: string;
        dataType: 'BOOLEAN' | 'NUMBER' | 'TEXT';
        unitLabel?: string;
        displayValue: string;
      }[];
    }[];
    effectiveDate: string;
  };
}

/**
 * Matrix summary for dashboard
 */
export interface MatrixSummaryResponse {
  success: boolean;
  message: string;
  data: {
    branch: {
      _id: string;
      branchName: string;
      location: string;
    };
    totalFeatures: number;
    totalPackages: number;
    activePackages: number;
    packagesWithOverrides: number;
    hiddenPackages: number;
    averagePrice: number | null;
    priceRange: {
      min: number | null;
      max: number | null;
    };
    durationRange: {
      min: number | null;
      max: number | null;
    };
    featureCoverage: Record<
      string,
      {
        featureName: string;
        packagesWithFeature: number;
        totalPackages: number;
        percentage: number;
      }
    >;
    effectiveDate: string;
  };
}

/**
 * Package matrix across branches
 */
export interface PackageMatrixResponse {
  success: boolean;
  message: string;
  data: {
    package: {
      _id: string;
      name: string;
      description?: string;
      defaultDurationMonths: number;
      status: 'ACTIVE' | 'INACTIVE';
    };
    features: {
      _id: string;
      key: string;
      name: string;
      dataType: 'BOOLEAN' | 'NUMBER' | 'TEXT';
      unitLabel?: string;
    }[];
    branches: {
      _id: string;
      branchName: string;
      location: string;
    }[];
    items: (MatrixItem & {
      branchId: string;
      branchName: string;
      branchLocation: string;
    })[];
    effectiveDate: string;
  };
}

/**
 * Feature comparison across packages
 */
export interface FeatureComparisonResponse {
  success: boolean;
  message: string;
  data: {
    branch: {
      _id: string;
      branchName: string;
      location: string;
    };
    feature: {
      _id: string;
      key: string;
      name: string;
      dataType: 'BOOLEAN' | 'NUMBER' | 'TEXT';
      unitLabel?: string;
    };
    comparison: {
      packageId: string;
      packageName: string;
      priceVND?: number | null;
      durationMonths: number;
      featureValue: {
        value: boolean | number | string | null;
        displayValue: string;
        isOverridden: boolean;
      };
    }[];
    effectiveDate: string;
  };
}

// Frontend Component Types
export interface MatrixCellData {
  serviceId: string;
  featureId: string;
  isIncluded?: boolean | null;
  valueNumber?: number | null;
  valueText?: string | null;
}

export interface MatrixDisplayData {
  services: {
    id: string;
    name: string;
    price?: number;
    durationInMonths?: number;
    sessionCount?: number;
    status?: 'active' | 'inactive';
  }[];
  features: {
    id: string;
    name: string;
    type: 'BOOLEAN' | 'NUMBER' | 'TEXT';
    unit?: string | null;
    rowOrder: number;
  }[];
  cells: Record<string, MatrixCellData>;
}
