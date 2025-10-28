import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Info, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';
import { useBranch } from '@/contexts/BranchContext';
import { useAuthState } from '@/hooks/useAuth';
import { useStaffScheduleForm } from '@/hooks/useStaffScheduleForm';
import { useStaffScheduleData } from '@/hooks/useStaffScheduleData';
import BasicInfoForm from './forms/BasicInfoForm';
import WeeklyFixedShiftSelector from './forms/WeeklyFixedShiftSelector';
import TemplateCreationForm from './forms/TemplateCreationForm';
import StaffScheduleView from './forms/StaffScheduleView';
import { TemplateSelector } from './TemplateSelector';
import type { StaffScheduleModalProps, StaffScheduleFormData } from '@/types/api/StaffSchedule';
import type { CustomTime } from '@/types/schedule';

const StaffScheduleModal: React.FC<StaffScheduleModalProps> = ({ isOpen, onClose, selectedStaffId, initialData }) => {
  const { t } = useTranslation();
  const { branches } = useBranch();
  const { isAuthenticated, user } = useAuthState();
  const [modalWidth, setModalWidth] = useState(1200);
  const [isResizing, setIsResizing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Use custom hooks for form logic
  const {
    form,
    templates,
    loadingTemplates,
    selectedTemplate,
    isStaffFieldDisabled,
    templateStaffInfo,
    saveAsTemplate,
    setSaveAsTemplate,
    templateName,
    setTemplateName,
    templateDescription,
    setTemplateDescription,
    autoGenerateEnabled,
    setAutoGenerateEnabled,
    advanceDays,
    setAdvanceDays,
    endDate,
    endDateError,
    handleEndDateChange,
    timeRangeError,
    scheduleDateError,
    handleScheduleDateChange,
    handleTemplateSelect,
    handleTemplateClear,
    handleShiftToggle,
    handleCustomTimeChange,
    handleAddCustomShift,
    customShiftTimes,
    isSubmitting,
    handleSubmit
  } = useStaffScheduleForm(selectedStaffId);

  const { watch } = form;
  const watchedBranchId = watch('branchId');
  const watchedStaffId = watch('staffId');
  const watchedTitle = watch('title');

  // Use custom hook for data fetching
  const { staffList, loadingStaff, workShifts, loadingWorkShifts, workShiftError, refetchWorkShifts } =
    useStaffScheduleData(watchedBranchId, watchedStaffId, selectedTemplate);

  // Handle resize functionality
  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      const minWidth = 500;
      const maxWidth = window.innerWidth * 0.9;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setModalWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleMouseDown = (e: Event) => {
      const mouseEvent = e as MouseEvent;
      mouseEvent.preventDefault();
      setIsResizing(true);
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    };

    if (isOpen) {
      const resizeHandle = document.querySelector('[data-resize-handle]');
      if (resizeHandle) {
        resizeHandle.addEventListener('mousedown', handleMouseDown);
      }
    }

    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isOpen, isResizing]);

  // Handle form submission
  const onSubmit = async (data: StaffScheduleFormData) => {
    const result = await handleSubmit(data);
    if (result?.success) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Check authentication
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <button
        className="fixed inset-0 bg-black/50 border-none cursor-default"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        aria-label="Close modal"
      />

      {/* Resizable Modal */}
      <div
        ref={modalRef}
        className="fixed right-0 top-0 h-full bg-background border-l shadow-lg flex flex-col transition-all duration-200"
        style={{
          width: `${modalWidth}px`,
          minWidth: '500px',
          maxWidth: '90vw'
        }}
      >
        {/* Resize Handle */}
        <div
          className={cn(
            'absolute left-0 top-0 w-2 h-full cursor-col-resize z-10 transition-all duration-200 group',
            isResizing ? 'bg-orange-400' : 'bg-gray-200 hover:bg-gray-300'
          )}
          data-resize-handle
        >
          <div
            className={cn(
              'absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-200',
              isResizing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <GripVertical className="h-4 w-4 text-gray-600" />
          </div>
        </div>

        {/* Header */}
        <div className="border-b px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {initialData ? t('workshift.edit_schedule') : t('workshift.create_schedule')}
              </h2>
              <p className="text-sm text-gray-500">{t('workshift.schedule_description')}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Info className="h-4 w-4 mr-1" />
                {t('common.help')}
              </Button>
              <Button variant="outline" size="sm">
                {t('common.feedback')}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Basic Information */}
              <BasicInfoForm
                form={form}
                branches={branches}
                staffList={staffList}
                selectedTemplate={selectedTemplate}
                templateStaffInfo={templateStaffInfo}
                isStaffFieldDisabled={isStaffFieldDisabled}
                loadingStaff={loadingStaff}
                onStaffChange={(staffId) => {
                  form.setValue('staffId', staffId);
                  form.trigger('staffId'); // Trigger validation after setValue
                }}
                onBranchChange={(branchId) => {
                  form.setValue('branchId', branchId);
                  form.trigger('branchId'); // Trigger validation after setValue
                }}
                onStartEndTimeChange={(field, value) => {
                  form.setValue(`timeRange.${field}`, value);
                  // Sync to all enabled days in General Availability
                  const currentAvailability = form.watch('availability') || {};
                  for (const dayKey of Object.keys(currentAvailability)) {
                    const dayData = currentAvailability[dayKey as keyof StaffScheduleFormData['availability']];
                    if (dayData?.enabled) {
                      form.setValue(`availability.${dayKey}.${field}` as keyof StaffScheduleFormData, value);
                    }
                  }
                }}
                timeRangeError={timeRangeError}
                scheduleDateError={scheduleDateError}
                onScheduleDateChange={handleScheduleDateChange}
              />

              {/* Template Selection */}
              <TemplateSelector
                templates={templates}
                loading={loadingTemplates}
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                onTemplateClear={handleTemplateClear}
              />

              {/* Weekly Fixed Shift Selection - Only show when branch and staff are selected */}
              {watchedBranchId &&
                watchedStaffId &&
                (() => {
                  const selectedStaff = staffList.find((staff) => staff._id === watchedStaffId);
                  const jobTitle = selectedStaff?.jobTitle || 'Staff';

                  return (
                    <WeeklyFixedShiftSelector
                      form={form}
                      onShiftToggle={handleShiftToggle}
                      onCustomTimeChange={handleCustomTimeChange}
                      customShiftTimes={customShiftTimes}
                      jobTitle={jobTitle}
                      onAddCustomShift={(
                        dayKey: keyof StaffScheduleFormData['availability'],
                        customShift: CustomTime
                      ) => handleAddCustomShift(dayKey, customShift)}
                    />
                  );
                })()}

              {/* Save as Template */}
              <TemplateCreationForm
                saveAsTemplate={saveAsTemplate}
                setSaveAsTemplate={setSaveAsTemplate}
                templateName={templateName}
                setTemplateName={setTemplateName}
                templateDescription={templateDescription}
                setTemplateDescription={setTemplateDescription}
                autoGenerateEnabled={autoGenerateEnabled}
                setAutoGenerateEnabled={setAutoGenerateEnabled}
                advanceDays={advanceDays}
                setAdvanceDays={setAdvanceDays}
                endDate={endDate}
                endDateError={endDateError}
                handleEndDateChange={handleEndDateChange}
                watchedTitle={watchedTitle}
              />

              {/* Staff Current Schedule */}
              {watchedBranchId && (
                <StaffScheduleView
                  staffId={watchedStaffId}
                  templateStaffInfo={templateStaffInfo}
                  workShifts={workShifts}
                  loadingWorkShifts={loadingWorkShifts}
                  workShiftError={workShiftError}
                  onRefetch={refetchWorkShifts}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t flex-shrink-0">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={isSubmitting}>
                {isSubmitting ? t('common.creating') : t('common.submit')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffScheduleModal;
