import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Calendar, Clock, User, Building, Brain } from 'lucide-react';
import { useScheduleTemplate } from '@/hooks/useScheduleTemplate';
import { useBranches } from '@/hooks/useBranches';
import { useStaffList } from '@/hooks/useStaff';
import type {
  CreateScheduleTemplateRequest,
  ScheduleTemplate,
  ScheduleTemplateFormData,
  ScheduleType,
  DayOfWeek
} from '@/types/api/ScheduleTemplate';
import { SCHEDULE_TYPES, DAYS_OF_WEEK } from '@/types/api/ScheduleTemplate';

interface ScheduleTemplateFormProps {
  template?: ScheduleTemplate;
  onSuccess?: (template: ScheduleTemplate) => void;
  onCancel?: () => void;
}

// Use constants from types
const DAYS_OF_WEEK_OPTIONS = Object.entries(DAYS_OF_WEEK).map(([value, label]) => ({
  value: value as DayOfWeek,
  label
}));

const SCHEDULE_TYPE_OPTIONS = Object.entries(SCHEDULE_TYPES).map(([value, config]) => ({
  value: value as ScheduleType,
  label: config.label,
  description: config.description
}));

export const ScheduleTemplateForm: React.FC<ScheduleTemplateFormProps> = ({ template, onSuccess, onCancel }) => {
  const { createTemplate, updateTemplate, loading, error } = useScheduleTemplate();
  const { branches } = useBranches();
  // Note: Class API not yet implemented - using empty array for now
  const classes: never[] = [];

  const [formData, setFormData] = useState<ScheduleTemplateFormData>({
    name: '',
    description: '',
    type: 'PERSONAL_TRAINING', // Default type
    branchId: '',
    ptId: '',
    classId: '',
    startTime: '09:00',
    endTime: '17:00',
    daysOfWeek: [],
    maxCapacity: 1,
    priority: 1,
    autoGenerate: {
      enabled: false,
      advanceDays: 7,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    notes: ''
  });

  const { staffList: staff } = useStaffList();

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Data is already loaded by hooks

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description || '',
        type: template.type,
        branchId: template.branchId._id,
        ptId: template.ptId?._id || '',
        classId: template.classId?._id || '',
        startTime: template.startTime,
        endTime: template.endTime,
        daysOfWeek: template.daysOfWeek,
        maxCapacity: template.maxCapacity,
        priority: template.priority,
        autoGenerate: template.autoGenerate
          ? {
              enabled: template.autoGenerate.enabled,
              advanceDays: template.autoGenerate.advanceDays,
              endDate: template.autoGenerate.endDate || new Date().toISOString()
            }
          : {
              enabled: false,
              advanceDays: 7,
              endDate: new Date().toISOString()
            },
        notes: template.notes || ''
      });
      setSelectedDays(template.daysOfWeek);
    }
  }, [template]);

  const handleInputChange = (field: keyof ScheduleTemplateFormData, value: unknown) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: value
      };

      // If changing to CLASS type but no classes available, switch to PERSONAL_TRAINING
      if (field === 'type' && value === 'CLASS' && classes.length === 0) {
        toast.error('No classes available. Switching to Personal Training type.');
        newData.type = 'PERSONAL_TRAINING';
      }

      // Reset ptId when changing branch or type
      if (field === 'branchId' || field === 'type') {
        newData.ptId = '';
      }

      return newData;
    });
    // Clear field error when user makes changes
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAutoGenerateChange = (field: keyof ScheduleTemplateFormData['autoGenerate'], value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      autoGenerate: {
        ...prev.autoGenerate,
        [field]: value
      }
    }));
  };

  const handleDayToggle = (day: DayOfWeek) => {
    const newDays = selectedDays.includes(day) ? selectedDays.filter((d) => d !== day) : [...selectedDays, day];

    setSelectedDays(newDays);
    setFormData((prev) => ({
      ...prev,
      daysOfWeek: newDays
    }));

    // Clear field error when user makes changes
    if (fieldErrors.daysOfWeek) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.daysOfWeek;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous field errors
    setFieldErrors({});

    // Validate required fields based on type
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Schedule title is required';
    }

    if (!formData.branchId) {
      errors.branchId = 'Branch selection is required';
    }

    if (formData.type === 'CLASS' && !formData.classId) {
      if (classes.length === 0) {
        toast.error('No classes available. Please contact administrator to add classes first.');
        return;
      }
      errors.classId = 'Class selection is required';
    }

    if ((formData.type === 'CLASS' || formData.type === 'PERSONAL_TRAINING') && !formData.ptId) {
      errors.ptId = 'Personal Trainer is required for CLASS and PERSONAL_TRAINING types';
    }

    if (formData.type === 'MAINTENANCE' && !formData.ptId) {
      errors.ptId = 'Technician is required for MAINTENANCE type';
    }

    if (!formData.daysOfWeek || formData.daysOfWeek.length === 0) {
      errors.daysOfWeek = 'Please select at least one day of the week';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Helper function to safely convert to string ID
    const convertToStringId = (value: unknown): string | undefined => {
      if (!value) return undefined;
      if (typeof value === 'string') return value.trim() || undefined;
      if (typeof value === 'object' && value !== null && '_id' in value) return (value as { _id: string })._id;
      if (typeof value === 'object' && value !== null && 'id' in value) return (value as { id: string }).id;
      return String(value).trim() || undefined;
    };

    // Clean up data before sending
    const cleanedData: CreateScheduleTemplateRequest = {
      name: formData.name.trim(),
      type: formData.type,
      branchId: convertToStringId(formData.branchId) || '',
      startTime: formData.startTime,
      endTime: formData.endTime,
      daysOfWeek: formData.daysOfWeek,
      maxCapacity: formData.maxCapacity,
      priority: formData.priority,
      autoGenerate: {
        enabled: formData.autoGenerate.enabled,
        advanceDays: formData.autoGenerate.advanceDays,
        endDate: formData.autoGenerate.enabled
          ? formData.autoGenerate.endDate
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    };

    // Ensure branchId is always a valid string
    const branchIdString = convertToStringId(formData.branchId);
    if (!branchIdString) {
      toast.error('Invalid branch ID. Please select a branch.');
      return;
    }
    cleanedData.branchId = branchIdString;

    // Add optional fields
    if (formData.description?.trim()) {
      cleanedData.description = formData.description.trim();
    }

    if (formData.notes?.trim()) {
      cleanedData.notes = formData.notes.trim();
    }

    // Add conditional required fields with proper string conversion
    if (formData.type === 'CLASS') {
      const classId = convertToStringId(formData.classId);
      if (classId) {
        cleanedData.classId = classId;
      }
    }

    if (formData.type === 'CLASS' || formData.type === 'PERSONAL_TRAINING' || formData.type === 'MAINTENANCE') {
      const ptId = convertToStringId(formData.ptId);
      if (ptId) {
        cleanedData.ptId = ptId;
      }
    }

    // Remove any undefined or empty string values to avoid Mongoose validation errors
    if (cleanedData.ptId === '' || cleanedData.ptId === undefined) {
      delete cleanedData.ptId;
    }
    if (cleanedData.classId === '' || cleanedData.classId === undefined) {
      delete cleanedData.classId;
    }

    // Validate data types before sending
    if (!cleanedData.branchId || typeof cleanedData.branchId !== 'string' || cleanedData.branchId.trim() === '') {
      toast.error('Invalid branch ID. Please select a branch.');
      return;
    }

    // Validate ObjectId format for branchId
    if (!/^[0-9a-fA-F]{24}$/.test(cleanedData.branchId)) {
      toast.error('Invalid branch ID format. Please select a valid branch.');
      return;
    }

    // Validate ptId if provided
    if (cleanedData.ptId) {
      if (typeof cleanedData.ptId !== 'string' || cleanedData.ptId.trim() === '') {
        toast.error('Invalid staff ID. Please select a staff member.');
        return;
      }
      if (!/^[0-9a-fA-F]{24}$/.test(cleanedData.ptId)) {
        toast.error('Invalid staff ID format. Please select a valid staff member.');
        return;
      }
    }

    // Validate classId if provided
    if (cleanedData.classId) {
      if (typeof cleanedData.classId !== 'string' || cleanedData.classId.trim() === '') {
        toast.error('Invalid class ID. Please select a class.');
        return;
      }
      if (!/^[0-9a-fA-F]{24}$/.test(cleanedData.classId)) {
        toast.error('Invalid class ID format. Please select a valid class.');
        return;
      }
    }

    // Debug: Log the cleaned data before sending
    console.log('=== SCHEDULE TEMPLATE FORM DEBUG ===');
    console.log('Original formData:', {
      branchId: formData.branchId,
      ptId: formData.ptId,
      classId: formData.classId,
      type: formData.type
    });
    console.log('Cleaned data being sent to backend:', {
      branchId: cleanedData.branchId,
      ptId: cleanedData.ptId,
      classId: cleanedData.classId,
      type: cleanedData.type,
      name: cleanedData.name
    });
    console.log('Data types:', {
      branchIdType: typeof cleanedData.branchId,
      ptIdType: typeof cleanedData.ptId,
      classIdType: typeof cleanedData.classId
    });
    console.log('=== END DEBUG ===');

    // Final data sanitization - ensure all ID fields are strings
    const finalData = {
      ...cleanedData,
      branchId: String(cleanedData.branchId),
      ...(cleanedData.ptId && { ptId: String(cleanedData.ptId) }),
      ...(cleanedData.classId && { classId: String(cleanedData.classId) })
    };

    // Additional validation to ensure all required fields are strings
    if (typeof finalData.branchId !== 'string' || finalData.branchId.trim() === '') {
      toast.error('Invalid branch ID. Please select a branch.');
      return;
    }

    if (finalData.ptId && (typeof finalData.ptId !== 'string' || finalData.ptId.trim() === '')) {
      toast.error('Invalid staff ID. Please select a staff member.');
      return;
    }

    if (finalData.classId && (typeof finalData.classId !== 'string' || finalData.classId.trim() === '')) {
      toast.error('Invalid class ID. Please select a class.');
      return;
    }

    console.log('Final sanitized data:', finalData);

    try {
      if (template) {
        const updatedTemplate = await updateTemplate(template._id, finalData);
        onSuccess?.(updatedTemplate);
        toast.success('Template updated successfully!');
      } else {
        const newTemplate = await createTemplate(finalData);
        onSuccess?.(newTemplate);
        toast.success('Template created successfully!');
      }
    } catch (err: unknown) {
      console.error('Failed to save template:', err);

      // Handle specific error messages
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = err as { response?: { data?: { message?: string } } };
        if (errorResponse.response?.data?.message) {
          const errorMessage = errorResponse.response.data.message;
          if (errorMessage.includes('already exists')) {
            toast.error('Template name already exists. Please choose a different name.');
          } else {
            toast.error(errorMessage);
          }
        }
      } else {
        toast.error('Failed to save template. Please try again.');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{template ? 'Edit Schedule Template' : 'Create Schedule Template'}</h1>
          <p className="text-muted-foreground">
            {template ? 'Update template configuration' : 'Configure work schedule and staff availability'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline">
            <Brain className="w-4 h-4 mr-2" />
            Help
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Schedule Title *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter schedule title"
                  required
                  className={fieldErrors.name ? 'border-red-500 focus:border-red-500' : ''}
                />
                {fieldErrors.name && <p className="text-sm text-red-600">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Schedule Type *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULE_TYPE_OPTIONS.map((type) => (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        disabled={type.value === 'CLASS' && classes.length === 0}
                      >
                        <div>
                          <div className="font-medium">
                            {type.label}
                            {type.value === 'CLASS' && classes.length === 0 && ' (No classes available)'}
                          </div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Select value={formData.branchId} onValueChange={(value) => handleInputChange('branchId', value)}>
                  <SelectTrigger className={fieldErrors.branchId ? 'border-red-500 focus:border-red-500' : ''}>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {branch.branchName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.branchId && <p className="text-sm text-red-600">{fieldErrors.branchId}</p>}
              </div>

              {formData.type === 'CLASS' && (
                <div className="space-y-2">
                  <Label htmlFor="class">Class *</Label>
                  <Select value={formData.classId} onValueChange={(value) => handleInputChange('classId', value)}>
                    <SelectTrigger className={fieldErrors.classId ? 'border-red-500 focus:border-red-500' : ''}>
                      <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No classes available</div>
                    </SelectContent>
                  </Select>
                  {fieldErrors.classId && <p className="text-sm text-red-600">{fieldErrors.classId}</p>}
                </div>
              )}

              {(formData.type === 'CLASS' || formData.type === 'PERSONAL_TRAINING') && (
                <div className="space-y-2">
                  <Label htmlFor="pt">Personal Trainer *</Label>
                  <Select value={formData.ptId} onValueChange={(value) => handleInputChange('ptId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PT" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.filter((s) => s.jobTitle === 'Personal Trainer').length > 0 ? (
                        staff
                          .filter((s) => s.jobTitle === 'Personal Trainer')
                          .map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {staff.name} ({staff.branches.map((b) => b.branchName).join(', ')})
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No Personal Trainer available</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.type === 'MAINTENANCE' && (
                <div className="space-y-2">
                  <Label htmlFor="pt">Technician *</Label>
                  <Select value={formData.ptId} onValueChange={(value) => handleInputChange('ptId', value)}>
                    <SelectTrigger className={fieldErrors.ptId ? 'border-red-500 focus:border-red-500' : ''}>
                      <SelectValue placeholder="Select Technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {staff.filter((s) => s.jobTitle === 'Technician').length > 0 ? (
                        staff
                          .filter((s) => s.jobTitle === 'Technician')
                          .map((staff) => (
                            <SelectItem key={staff.id} value={staff.id}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {staff.name} ({staff.branches.map((b) => b.branchName).join(', ')})
                              </div>
                            </SelectItem>
                          ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No Technician available</div>
                      )}
                    </SelectContent>
                  </Select>
                  {fieldErrors.ptId && <p className="text-sm text-red-600">{fieldErrors.ptId}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shift Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Shift Duration
            </CardTitle>
            <p className="text-sm text-muted-foreground">How long should each work shift last?</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Max Capacity</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.maxCapacity}
                  onChange={(e) => handleInputChange('maxCapacity', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority?.toString() || '1'}
                  onValueChange={(value) => handleInputChange('priority', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        Priority {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Days of Week */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              General Availability
            </CardTitle>
            <p className="text-sm text-muted-foreground">Set the times you are generally available for work shifts</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Repeat Weekly</span>
                <Badge variant="outline">Weekly</Badge>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK_OPTIONS.map((day) => (
                  <div key={day.value} className="space-y-2">
                    <div className="text-center text-sm font-medium">{day.label.slice(0, 3)}</div>
                    <Button
                      type="button"
                      variant={selectedDays.includes(day.value) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleDayToggle(day.value)}
                      className="w-full"
                    >
                      {selectedDays.includes(day.value) ? 'Available' : 'Unavailable'}
                    </Button>
                  </div>
                ))}
              </div>
              {fieldErrors.daysOfWeek && <p className="text-sm text-red-600">{fieldErrors.daysOfWeek}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Auto Generation Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Auto Generation Settings
            </CardTitle>
            <p className="text-sm text-muted-foreground">Configure automatic schedule generation</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="autoGenerate">Enable Auto Generation</Label>
                <p className="text-sm text-muted-foreground">Automatically generate schedules from this template</p>
              </div>
              <Switch
                id="autoGenerate"
                checked={formData.autoGenerate?.enabled || false}
                onCheckedChange={(checked) => handleAutoGenerateChange('enabled', checked)}
              />
            </div>

            {formData.autoGenerate?.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="advanceDays">Advance Days</Label>
                  <Input
                    id="advanceDays"
                    type="number"
                    min="1"
                    max="30"
                    value={formData.autoGenerate?.advanceDays || 7}
                    onChange={(e) => handleAutoGenerateChange('advanceDays', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Number of days in advance to schedule (e.g., 7 = create schedule 7 days from now)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.autoGenerate?.endDate?.split('T')[0] || ''}
                    onChange={(e) => handleAutoGenerateChange('endDate', new Date(e.target.value).toISOString())}
                  />
                  <p className="text-xs text-muted-foreground">When to stop auto generation</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes or instructions..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {(() => {
              if (loading) return 'Saving...';
              return template ? 'Update Template' : 'Create Template';
            })()}
          </Button>
        </div>
      </form>
    </div>
  );
};
