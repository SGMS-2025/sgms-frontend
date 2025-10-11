import React, { useState } from 'react';
import { ScheduleTemplateList } from '@/components/schedule/ScheduleTemplateList';
import { ScheduleTemplateForm } from '@/components/schedule/ScheduleTemplateForm';
import { ScheduleTemplateStats } from '@/components/schedule/ScheduleTemplateStats';
import type { ScheduleTemplate } from '@/types/api/ScheduleTemplate';

export const ScheduleTemplatePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'form' | 'stats'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);

  const handleEditTemplate = (template: ScheduleTemplate) => {
    setSelectedTemplate(template);
    setCurrentView('form');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedTemplate(null);
  };

  const handleFormSuccess = () => {
    setCurrentView('list');
    setSelectedTemplate(null);
  };

  const handleFormCancel = () => {
    setCurrentView('list');
    setSelectedTemplate(null);
  };

  if (currentView === 'form') {
    return (
      <ScheduleTemplateForm
        template={selectedTemplate || undefined}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    );
  }

  if (currentView === 'stats') {
    return <ScheduleTemplateStats onBack={handleBackToList} />;
  }

  return <ScheduleTemplateList onTemplateSelect={handleEditTemplate} />;
};
