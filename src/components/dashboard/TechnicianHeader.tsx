import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

interface TechnicianHeaderProps {
  title?: string;
}

const formatSegment = (segment: string) => segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

export const TechnicianHeader: React.FC<TechnicianHeaderProps> = ({ title }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const computedTitle = React.useMemo(() => {
    if (title) return title;

    const segments = location.pathname.split('/').filter(Boolean);
    const lastSegment = segments.at(-1) ?? 'overview';

    const translationMap: Record<string, string> = {
      technician: t('dashboard.overview'),
      dashboard: t('dashboard.overview'),
      equipment: t('sidebar.equipment'),
      add: t('equipment.add_title'),
      edit: t('equipment.edit_equipment')
    };

    return translationMap[lastSegment] ?? formatSegment(lastSegment);
  }, [location.pathname, t, title]);

  return (
    <header className="border-b border-gray-200 pb-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold leading-tight text-gray-900">{computedTitle}</h1>
      </div>
    </header>
  );
};
