import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TemplateCreationFormProps } from '@/types/forms/StaffScheduleFormTypes';

const TemplateCreationForm: React.FC<TemplateCreationFormProps> = ({
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
  setEndDate
}) => {
  const { t } = useTranslation();

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {t('workshift.save_as_template')}
        </CardTitle>
        <p className="text-xs text-gray-500">{t('workshift.save_template_description')}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="saveAsTemplate"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <Label htmlFor="saveAsTemplate" className="text-sm font-medium">
            {t('workshift.save_current_as_template')}
          </Label>
        </div>

        {saveAsTemplate && (
          <div className="space-y-4 pl-6 border-l-2 border-orange-200">
            {/* Template Basic Info */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="templateName" className="text-xs font-medium">
                  {t('workshift.template_name')} *
                </Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={t('workshift.template_name_placeholder')}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="templateDescription" className="text-xs font-medium">
                  {t('workshift.template_description')}
                </Label>
                <Input
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder={t('workshift.template_description_placeholder')}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Auto-Generation Settings */}
            <div className="space-y-3 p-3 bg-gray-50 rounded border">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableAutoGenerate"
                  checked={autoGenerateEnabled}
                  onChange={(e) => setAutoGenerateEnabled(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="enableAutoGenerate" className="text-sm font-medium">
                  Enable Auto-Generation
                </Label>
              </div>

              {autoGenerateEnabled && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="advanceDays" className="text-xs font-medium">
                        Advance Days *
                      </Label>
                      <Input
                        id="advanceDays"
                        type="number"
                        min="1"
                        max="30"
                        value={advanceDays}
                        onChange={(e) => setAdvanceDays(parseInt(e.target.value) || 7)}
                        className="h-8 text-sm"
                      />
                      <p className="text-xs text-gray-500">Days in advance to generate schedules</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate" className="text-xs font-medium">
                        End Date *
                      </Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="h-8 text-sm"
                      />
                      <p className="text-xs text-gray-500">When to stop auto-generation</p>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>
                        Auto-generation will create schedules automatically based on this template's days and times
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              <div className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                <span>{t('workshift.template_save_info')}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateCreationForm;
