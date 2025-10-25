import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, X, ChevronDown } from 'lucide-react';
import type { ScheduleTemplate } from '@/types/api/ScheduleTemplate';
import { safeJsonParse } from '../../utils/jsonHelpers';

interface TemplateShiftMetadata {
  shiftType: string;
  startTime: string;
  endTime: string;
  daysOfWeek: string[];
}

interface TemplateNotesData {
  multipleShifts?: boolean;
  shifts?: TemplateShiftMetadata[];
}

interface TemplateSelectorProps {
  templates: ScheduleTemplate[];
  loading: boolean;
  selectedTemplate: ScheduleTemplate | null;
  onTemplateSelect: (template: ScheduleTemplate) => void;
  onTemplateClear: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  loading,
  selectedTemplate,
  onTemplateSelect,
  onTemplateClear
}) => {
  const { t } = useTranslation();
  const [showSelector, setShowSelector] = useState(false);

  // Helper function to parse template shifts
  const parseTemplateShifts = (template: ScheduleTemplate): TemplateShiftMetadata[] | null => {
    const notesData = safeJsonParse<TemplateNotesData>(template.notes, {});

    if (notesData?.multipleShifts && Array.isArray(notesData.shifts)) {
      return notesData.shifts;
    }

    return null;
  };

  if (selectedTemplate) {
    const templateShifts = parseTemplateShifts(selectedTemplate);

    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {t('workshift.template_selection')}
          </CardTitle>
          <p className="text-xs text-gray-500">{t('workshift.template_selection_description')}</p>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">{selectedTemplate.name}</p>
                {templateShifts ? (
                  <div className="mt-1">
                    <p className="text-xs text-green-600">
                      {t('workshift.multiple_shifts')}:{' '}
                      {templateShifts.map((s: TemplateShiftMetadata) => s.shiftType).join(', ')}
                    </p>
                    <div className="mt-1 space-y-1">
                      {templateShifts.map((shift: TemplateShiftMetadata) => (
                        <div
                          key={`${shift.shiftType}-${shift.startTime}-${shift.endTime}`}
                          className="text-xs text-green-600"
                        >
                          {shift.shiftType}: {shift.startTime} - {shift.endTime}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-green-600">
                    {selectedTemplate.type} • {selectedTemplate.startTime || 'N/A'} -{' '}
                    {selectedTemplate.endTime || 'N/A'}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onTemplateClear}
                className="text-green-600 border-green-300 hover:bg-green-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {t('workshift.template_selection')}
        </CardTitle>
        <p className="text-xs text-gray-500">{t('workshift.template_selection_description')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowSelector(!showSelector)}
            className="w-full justify-start"
            disabled={loading}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            {loading ? t('common.loading') : t('workshift.select_template')}
            <ChevronDown className="h-4 w-4 ml-auto" />
          </Button>

          {showSelector && templates && templates.length > 0 && (
            <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
              {templates.map((template) => {
                const templateShifts = parseTemplateShifts(template);

                return (
                  <button
                    key={template._id}
                    type="button"
                    className="w-full p-2 hover:bg-gray-50 rounded cursor-pointer text-left"
                    onClick={() => {
                      onTemplateSelect(template);
                      setShowSelector(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onTemplateSelect(template);
                        setShowSelector(false);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{template.name}</p>
                        {templateShifts ? (
                          <div className="mt-1">
                            <p className="text-xs text-gray-500">
                              {t('workshift.multiple_shifts')}:{' '}
                              {templateShifts.map((s: TemplateShiftMetadata) => s.shiftType).join(', ')}
                            </p>
                            <div className="mt-1 space-y-1">
                              {templateShifts.slice(0, 2).map((shift: TemplateShiftMetadata) => (
                                <div
                                  key={`${shift.shiftType}-${shift.startTime}-${shift.endTime}`}
                                  className="text-xs text-gray-500"
                                >
                                  {shift.shiftType}: {shift.startTime} - {shift.endTime}
                                </div>
                              ))}
                              {templateShifts.length > 2 && (
                                <div className="text-xs text-gray-400">
                                  +{templateShifts.length - 2} {t('workshift.more_shifts')}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">
                            {template.type} • {template.startTime || 'N/A'} - {template.endTime || 'N/A'}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 ml-2">
                        {template.daysOfWeek?.length || 0} {t('workshift.days')}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {showSelector && (!templates || templates.length === 0) && !loading && (
            <div className="text-center py-4 text-sm text-gray-500">{t('workshift.no_templates_available')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
