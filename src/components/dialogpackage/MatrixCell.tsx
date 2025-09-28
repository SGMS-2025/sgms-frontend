import { Checkbox } from '@/components/ui/checkbox';
import type { MatrixCellData, MatrixDisplayData } from '@/types/api/Matrix';

type MatrixFeature = MatrixDisplayData['features'][0];

interface MatrixCellProps {
  readonly feature: MatrixFeature;
  readonly cell: MatrixCellData | undefined;
  readonly onChange: (patch: Partial<MatrixCellData>) => void;
  readonly disabled?: boolean;
}

export function MatrixCell({ feature, cell, onChange, disabled }: MatrixCellProps) {
  // Create default cell if not provided
  const effectiveCell = cell || {
    serviceId: '',
    featureId: feature.id,
    isIncluded: false,
    valueNumber: null,
    valueText: null
  };

  return (
    <div className="p-2">
      {/* Checkbox for inclusion - only BOOLEAN type supported */}
      <div className="flex items-center justify-center">
        <Checkbox
          checked={!!effectiveCell.isIncluded}
          onCheckedChange={(v) => onChange({ isIncluded: Boolean(v) })}
          aria-label={`Toggle ${feature.name}`}
          disabled={disabled}
          id={`checkbox-${feature.id}`}
          className="border-2 border-gray-400"
        />
      </div>
    </div>
  );
}
