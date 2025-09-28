import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  readonly error: string;
  readonly onRetry: () => void;
  readonly serviceType: 'CLASS' | 'PT';
}

export function ErrorDisplay({ error, onRetry, serviceType }: ErrorDisplayProps) {
  const { t } = useTranslation();
  const translationKey = serviceType === 'CLASS' ? 'class_service' : 'pt_service';

  return (
    <div className="p-4 border border-red-200 bg-red-50 rounded-md">
      <div className="flex items-center gap-2 text-red-800 mb-2">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">{t(`${translationKey}.error_title`)}</span>
      </div>
      <p className="text-red-700 text-sm mb-3">{error}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        {t(`${translationKey}.retry`)}
      </Button>
    </div>
  );
}
