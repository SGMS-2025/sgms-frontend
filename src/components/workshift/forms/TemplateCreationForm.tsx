import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Info, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
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
  endDateError,
  handleEndDateChange
}) => {
  const { t } = useTranslation();
  const [endDateOpen, setEndDateOpen] = useState(false);

  const selectedEndDate = useMemo(() => {
    if (!endDate) return undefined;
    const date = new Date(`${endDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }, [endDate]);

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
                  {t('workshift.enable_auto_generation')}
                </Label>
              </div>

              {autoGenerateEnabled && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="advanceDays" className="text-xs font-medium">
                        {t('workshift.advance_days')} *
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
                      <p className="text-xs text-gray-500">{t('workshift.advance_days_description')}</p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="endDate" className="text-xs font-medium">
                        {t('workshift.end_date')} *
                      </Label>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen} modal={false}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={`h-8 text-sm w-full justify-between text-left font-normal ${
                              endDateError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              {selectedEndDate
                                ? format(selectedEndDate, 'dd/MM/yyyy', { locale: vi })
                                : t('membership_registration.activation_date_placeholder', {
                                    defaultValue: 'Chọn ngày'
                                  })}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto rounded-2xl border border-border bg-white p-0 shadow-lg z-[9999]"
                          align="start"
                          side="bottom"
                          sideOffset={8}
                          collisionPadding={8}
                        >
                          <CalendarComponent
                            mode="single"
                            selected={selectedEndDate}
                            onSelect={(date) => {
                              handleEndDateChange(date ? format(date, 'yyyy-MM-dd') : '');
                              setEndDateOpen(false);
                            }}
                            initialFocus
                            locale={vi}
                            className="bg-white"
                            fromDate={new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      {endDateError && <p className="text-red-500 text-sm font-medium">{endDateError}</p>}
                      <p className="text-xs text-gray-500">{t('workshift.end_date_description')}</p>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                    <div className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>{t('workshift.auto_generation_info')}</span>
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
