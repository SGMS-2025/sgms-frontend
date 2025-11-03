import type { ReactNode } from 'react';

export interface BaseImportResult {
  successCount: number;
  failedCount: number;
  errors: Array<{
    row: number;
    error?: string;
    errorKey?: string;
    errorData?: Record<string, unknown>;
    message?: string;
    field?: string;
  }>;
}

export interface ExcelImportModalBaseProps<T extends BaseImportResult> {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
  /** Translation namespace for all text keys (e.g., 'staff_import', 'customer_excel_import') */
  translationNamespace: string;
  /** Function to import data from file */
  importFunction: (file: File, branchId: string) => Promise<T>;
  /** Function to download template */
  downloadTemplateFunction: () => Promise<void>;
  /** Loading state from hook */
  loading: boolean;
  /** Error state from hook */
  error: string | null;
  /** Function to reset error */
  resetError: () => void;
  /** Custom render function for additional result content (e.g., password display) */
  renderCustomResultContent?: (result: T) => ReactNode;
  /** Max width class for modal (default: 'max-w-4xl') */
  maxWidth?: string;
  /** Instructions list items count (default: 4) */
  instructionsCount?: number;
}
