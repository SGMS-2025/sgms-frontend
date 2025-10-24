import React, { useState } from 'react';
import { ScheduleTemplateList } from '@/components/schedule/ScheduleTemplateList';
import { ScheduleTemplateStats } from '@/components/schedule/ScheduleTemplateStats';

export const ScheduleTemplatePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'stats'>('list');

  const handleBackToList = () => {
    setCurrentView('list');
  };

  if (currentView === 'stats') {
    return <ScheduleTemplateStats onBack={handleBackToList} />;
  }

  return <ScheduleTemplateList />;
};
