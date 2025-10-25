import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Calendar,
  Clock,
  Users,
  Building,
  Brain,
  Activity,
  User,
  CalendarDays,
  Settings,
  BarChart3,
  Save,
  X
} from 'lucide-react';
import type { ScheduleTemplateDetailModalProps } from '@/types/api/ScheduleTemplateDetail';
import type { ScheduleType } from '@/types/api/ScheduleTemplate';
import { useScheduleTemplate } from '@/hooks/useScheduleTemplate';
import {
  getAllShifts,
  hasMultipleShifts,
  getShiftCount,
  formatTime,
  getTemplateTypeColor,
  getTemplateStatusColor,
  getAutoGenerateColor
} from '@/utils/scheduleTemplateHelpers';
import { getScheduleTypeLabel, formatDaysOfWeek } from '@/utils/scheduleTypeHelpers';
import { handleAsyncOperationWithOptions } from '@/utils/errorHandler';
import { toast } from 'sonner';

export const ScheduleTemplateDetailModal: React.FC<ScheduleTemplateDetailModalProps> = ({
  template,
  isOpen,
  onClose,
  onEdit
}) => {
  const { t } = useTranslation();
  const { updateTemplate } = useScheduleTemplate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    type: '' as ScheduleType | '',
    maxCapacity: 1,
    priority: 1,
    isActive: true,
    autoGenerateEnabled: false,
    advanceDays: 7,
    endDate: '',
    notes: ''
  });

  // Initialize edit data when template changes
  React.useEffect(() => {
    if (template) {
      setEditData({
        name: template.name,
        description: template.description || '',
        type: template.type,
        maxCapacity: template.maxCapacity,
        priority: template.priority,
        isActive: template.isActive,
        autoGenerateEnabled: template.autoGenerate.enabled,
        advanceDays: template.autoGenerate.advanceDays,
        endDate: template.autoGenerate.endDate
          ? new Date(template.autoGenerate.endDate).toISOString().split('T')[0]
          : '',
        notes: template.notes || ''
      });
    }
  }, [template]);

  if (!template) return null;

  const shifts = getAllShifts(template);
  const hasMultiple = hasMultipleShifts(template);
  const shiftCount = getShiftCount(template);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editData.name.trim() === '') {
      toast.error(t('schedule_templates.name_required'));
      return;
    }

    if (editData.type === '') {
      toast.error(t('schedule_templates.type_required'));
      return;
    }
    setIsSaving(true);

    // Prepare the update data
    const updateData = {
      name: editData.name.trim(),
      description: editData.description.trim(),
      type: editData.type as ScheduleType,
      maxCapacity: editData.maxCapacity,
      priority: editData.priority,
      isActive: editData.isActive,
      autoGenerate: {
        enabled: editData.autoGenerateEnabled,
        advanceDays: editData.advanceDays,
        endDate: editData.endDate ? new Date(editData.endDate + 'T00:00:00').toISOString() : ''
      },
      notes: editData.notes.trim()
    };

    // Use error handler for the update operation
    const result = await handleAsyncOperationWithOptions(
      async () => {
        const response = await updateTemplate(template._id, updateData);
        return { success: true, data: response };
      },
      {
        showSuccess: true,
        showError: true,
        successMessage: t('schedule_templates.update_success'),
        errorMessage: t('schedule_templates.update_error')
      }
    );

    if (result) {
      setIsEditing(false);

      // Call onEdit with updated data for parent component
      onEdit({
        ...template,
        ...updateData,
        type: updateData.type,
        autoGenerate: updateData.autoGenerate
      });
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset edit data to original template data
    if (template) {
      setEditData({
        name: template.name,
        description: template.description || '',
        type: template.type,
        maxCapacity: template.maxCapacity,
        priority: template.priority,
        isActive: template.isActive,
        autoGenerateEnabled: template.autoGenerate.enabled,
        advanceDays: template.autoGenerate.advanceDays,
        endDate: template.autoGenerate.endDate
          ? new Date(template.autoGenerate.endDate).toISOString().split('T')[0]
          : '',
        notes: template.notes || ''
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {isEditing ? (
            <div className="space-y-4">
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                placeholder="Template name"
                className="text-xl font-semibold"
              />
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                placeholder="Template description"
                className="text-sm text-muted-foreground"
                rows={2}
              />
            </div>
          ) : (
            <>
              <DialogTitle className="text-xl font-semibold">{template.name}</DialogTitle>
              {template.description && (
                <DialogDescription className="text-sm text-muted-foreground">{template.description}</DialogDescription>
              )}
            </>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {t('schedule_templates.basic_information')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.type_column')}:</span>
                    </div>
                    <Select
                      value={editData.type}
                      onValueChange={(value) => setEditData({ ...editData, type: value as ScheduleType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLASS">{getScheduleTypeLabel('CLASS', t)}</SelectItem>
                        <SelectItem value="PERSONAL_TRAINING">
                          {getScheduleTypeLabel('PERSONAL_TRAINING', t)}
                        </SelectItem>
                        <SelectItem value="FREE_TIME">{getScheduleTypeLabel('FREE_TIME', t)}</SelectItem>
                        <SelectItem value="MAINTENANCE">{getScheduleTypeLabel('MAINTENANCE', t)}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.branch_column')}:</span>
                    </div>
                    <span className="text-sm">{template.branchId?.branchName || t('common.unknown')}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.status')}:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editData.isActive}
                        onCheckedChange={(checked) => setEditData({ ...editData, isActive: checked })}
                      />
                      <span className="text-sm">{editData.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.auto_gen')}:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={editData.autoGenerateEnabled}
                        onCheckedChange={(checked) => setEditData({ ...editData, autoGenerateEnabled: checked })}
                      />
                      <span className="text-sm">{editData.autoGenerateEnabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.type_column')}:</span>
                    </div>
                    <Badge className={getTemplateTypeColor(template.type)}>
                      {getScheduleTypeLabel(template.type, t)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.branch_column')}:</span>
                    </div>
                    <span className="text-sm">{template.branchId?.branchName || t('common.unknown')}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.status')}:</span>
                    </div>
                    <Badge className={getTemplateStatusColor(template.isActive)}>
                      {template.isActive ? t('schedule_templates.active') : t('schedule_templates.inactive')}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.auto_gen')}:</span>
                    </div>
                    <Badge className={getAutoGenerateColor(template.autoGenerate.enabled)}>
                      {template.autoGenerate.enabled
                        ? t('schedule_templates.enabled')
                        : t('schedule_templates.disabled')}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('schedule_templates.schedule_settings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.days')}:</span>
                    </div>
                    <span className="text-sm">{formatDaysOfWeek(template.daysOfWeek, t)}</span>
                    <span className="text-xs text-muted-foreground">(Days cannot be edited here)</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.capacity')}:</span>
                    </div>
                    <Input
                      type="number"
                      value={editData.maxCapacity}
                      onChange={(e) => setEditData({ ...editData, maxCapacity: Number.parseInt(e.target.value) || 1 })}
                      min="1"
                      max="100"
                      className="w-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Priority:</span>
                    </div>
                    <Input
                      type="number"
                      value={editData.priority}
                      onChange={(e) => setEditData({ ...editData, priority: Number.parseInt(e.target.value) || 1 })}
                      min="1"
                      max="10"
                      className="w-20"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.days')}:</span>
                    </div>
                    <span className="text-sm">{formatDaysOfWeek(template.daysOfWeek, t)}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{t('schedule_templates.capacity')}:</span>
                    </div>
                    <span className="text-sm">{template.maxCapacity}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Priority:</span>
                    </div>
                    <span className="text-sm">{template.priority}</span>
                  </div>
                </div>
              )}

              <Separator />

              {/* Time Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {hasMultiple
                      ? `${t('schedule_templates.time')} (${shiftCount} ${t('schedule_templates.shifts')})`
                      : t('schedule_templates.time')}
                    :
                  </span>
                </div>

                {hasMultiple ? (
                  <div className="space-y-2">
                    {shifts.map((shift) => (
                      <div
                        key={`${shift.shiftType || shift.name}-${shift.startTime}-${shift.endTime}`}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{shift.shiftType || shift.name}</span>
                          {shift.daysOfWeek && (
                            <span className="text-xs text-muted-foreground">({shift.daysOfWeek.length} days)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {formatTime(template.startTime)} - {formatTime(template.endTime)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Auto Generation Settings */}
          {(template.autoGenerate.enabled || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {t('schedule_templates.auto_generation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Advance Days:</span>
                      <Input
                        type="number"
                        value={editData.advanceDays}
                        onChange={(e) =>
                          setEditData({ ...editData, advanceDays: Number.parseInt(e.target.value) || 7 })
                        }
                        min="1"
                        max="30"
                        className="w-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="text-sm font-medium">End Date:</span>
                      <Input
                        type="date"
                        value={editData.endDate}
                        onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                        className="w-40"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Advance Days:</span>
                      <span className="text-sm">{template.autoGenerate.advanceDays} days</span>
                    </div>
                    {template.autoGenerate.endDate && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">End Date:</span>
                        <span className="text-sm">{new Date(template.autoGenerate.endDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Usage Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium">{t('schedule_templates.usage')}:</span>
                  <span className="text-sm">{template.usageCount} lần</span>
                </div>

                {template.lastUsed && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">Last Used:</span>
                    <span className="text-sm">{new Date(template.lastUsed).toLocaleDateString()}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Created By:</span>
                  </div>
                  <span className="text-sm">{template.createdBy?.fullName || 'Unknown'}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Created At:</span>
                  <span className="text-sm">{new Date(template.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(template.notes || isEditing) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editData.notes}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    placeholder="Add notes about this template..."
                    rows={4}
                    className="w-full"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{template.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>
                {t('common.close')}
              </Button>
              <Button variant="outline" onClick={handleEdit}>
                <Activity className="h-4 w-4 mr-2" />
                {t('schedule_templates.edit')}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
