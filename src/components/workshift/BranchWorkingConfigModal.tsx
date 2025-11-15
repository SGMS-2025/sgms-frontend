import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useBranch } from '@/contexts/BranchContext';
import { branchApi } from '@/services/api/branchApi';
import { toast } from 'sonner';
import type { ShiftConfig, RoleConfig, BranchWorkingConfigRequest } from '@/types/api/BranchWorkingConfig';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';

interface BranchWorkingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const defaultShiftObj = (): ShiftConfig => ({
  type: 'MORNING',
  startTime: '',
  endTime: ''
});
const defaultRoleConfig = (): RoleConfig => ({
  role: 'PT',
  workingDays: [1, 2, 3, 4, 5, 6],
  shifts: ['MORNING', 'AFTERNOON'],
  salaryType: 'HOURLY',
  hourlyRate: 0,
  fixedSalary: 0
});

const BranchWorkingConfigModal: React.FC<BranchWorkingConfigModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const { currentBranch } = useBranch();
  const branchId = currentBranch?._id;
  const [loading, setLoading] = useState(false);

  // Shift types with translations
  const SHIFT_TYPES = [
    { label: t('branch_working_config.shift_type.morning'), value: 'MORNING' },
    { label: t('branch_working_config.shift_type.afternoon'), value: 'AFTERNOON' },
    { label: t('branch_working_config.shift_type.evening'), value: 'EVENING' }
  ];

  // Roles with translations
  const ROLES = [
    { label: t('branch_working_config.role.pt'), value: 'PT' },
    { label: t('branch_working_config.role.technician'), value: 'TECHNICIAN' },
    { label: t('branch_working_config.role.manager'), value: 'MANAGER' }
  ];

  // Days with translations
  const DAYS = [
    { label: t('branch_working_config.days.sun'), value: 0 },
    { label: t('branch_working_config.days.mon'), value: 1 },
    { label: t('branch_working_config.days.tue'), value: 2 },
    { label: t('branch_working_config.days.wed'), value: 3 },
    { label: t('branch_working_config.days.thu'), value: 4 },
    { label: t('branch_working_config.days.fri'), value: 5 },
    { label: t('branch_working_config.days.sat'), value: 6 }
  ];
  // Main state (all fields)
  const [form, setForm] = useState<BranchWorkingConfigRequest>({
    defaultWorkingDays: [],
    defaultDayOff: [],
    defaultShifts: [defaultShiftObj(), defaultShiftObj(), defaultShiftObj()],
    restPattern: '6-1',
    overtimeConfig: { enabled: true, maxHoursPerDay: 12, maxHoursPerWeek: 48, overtimeRate: 1.5 },
    breakConfig: { enabled: true, breakDuration: 30, breakAfterHours: 4 },
    roleConfigs: [defaultRoleConfig()],
    isActive: true,
    customRestPattern: ''
  });
  const [error, setError] = useState('');
  const [shiftError, setShiftError] = useState('');
  const [roleError, setRoleError] = useState('');

  // Fetch initial config
  useEffect(() => {
    if (!isOpen || !branchId) return;
    setLoading(true);
    branchApi
      .getBranchWorkingConfig(branchId)
      .then((res) => {
        if (res?.data) setForm({ ...res.data, customRestPattern: res.data.customRestPattern || '' });
        setError('');
        setShiftError('');
        setRoleError('');
      })
      .catch(() => setError(t('branch_working_config.error.load_failed')))
      .finally(() => setLoading(false));

    // Clear errors when modal closes
    if (!isOpen) {
      setShiftError('');
      setRoleError('');
    }
  }, [isOpen, branchId, t]);

  // HANDLERS
  const toggleArray = <T,>(arr: T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const handleChange = <K extends keyof BranchWorkingConfigRequest>(key: K, value: BranchWorkingConfigRequest[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Default shift times
  const DEFAULT_SHIFT_TIMES: Record<string, { startTime: string; endTime: string }> = {
    MORNING: { startTime: '05:00', endTime: '10:00' },
    AFTERNOON: { startTime: '13:00', endTime: '18:00' },
    EVENING: { startTime: '18:00', endTime: '23:00' }
  };

  // Update shift
  const handleShiftChange = (idx: number, field: keyof ShiftConfig, value: ShiftConfig[keyof ShiftConfig]) => {
    // Clear shift error when user makes changes
    if (shiftError) {
      setShiftError('');
    }
    setForm((prev) => ({
      ...prev,
      defaultShifts: (prev.defaultShifts || []).map((shift, i) => {
        if (i === idx) {
          const updated = { ...shift, [field]: value };
          // Auto-fill default times when shift type changes and times are empty
          if (field === 'type' && value && typeof value === 'string' && value !== 'CUSTOM') {
            const defaultTimes = DEFAULT_SHIFT_TIMES[value];
            if (defaultTimes && (!shift.startTime || !shift.endTime)) {
              updated.startTime = defaultTimes.startTime;
              updated.endTime = defaultTimes.endTime;
            }
          }
          return updated;
        }
        return shift;
      })
    }));
  };

  // Role logic
  const handleRoleChange = (idx: number, field: keyof RoleConfig, value: RoleConfig[keyof RoleConfig]) => {
    // Clear role error when user makes changes
    if (roleError) {
      setRoleError('');
    }
    setForm((prev) => ({
      ...prev,
      roleConfigs: (prev.roleConfigs || []).map((role, i) => (i === idx ? { ...role, [field]: value } : role))
    }));
  };
  // List handler for workingDays, shifts

  // On submit
  const handleSave = async () => {
    if (!branchId) return;
    if (!form.defaultWorkingDays?.length) {
      setError(t('branch_working_config.error.min_working_days'));
      return;
    }
    // TỰ ĐỘNG TÍNH defaultDayOff = các ngày còn lại:
    const allDays = [0, 1, 2, 3, 4, 5, 6];
    const defaultDayOff = allDays.filter((d) => !(form.defaultWorkingDays || []).includes(d));
    const submitData = { ...form, defaultDayOff, customRestPattern: form.customRestPattern || '' };
    if (!form.defaultShifts?.length || form.defaultShifts.some((s) => !s.startTime || !s.endTime)) {
      setError(t('branch_working_config.error.shift_time_required'));
      return;
    }
    // Validate ca: giờ bắt đầu phải nhỏ hơn giờ kết thúc
    if (form.defaultShifts.some((s) => s.startTime && s.endTime && s.startTime >= s.endTime)) {
      setError(t('branch_working_config.error.invalid_time_range'));
      return;
    }
    // Validate duplicate shift names
    const shiftNames = new Set<string>();
    for (const shift of form.defaultShifts) {
      // Get shift identifier: type for MORNING/AFTERNOON/EVENING, customName for CUSTOM
      const shiftIdentifier = shift.type === 'CUSTOM' ? (shift.customName || '').trim().toLowerCase() : shift.type;

      // Check if custom name is required when type is CUSTOM
      if (shift.type === 'CUSTOM' && !shift.customName?.trim()) {
        setShiftError(t('branch_working_config.error.shift_time_required'));
        return;
      }

      // Check duplicate
      if (shiftIdentifier && shiftNames.has(shiftIdentifier)) {
        setShiftError(t('branch_working_config.error.duplicate_shift_name'));
        return;
      }
      shiftNames.add(shiftIdentifier);
    }
    // Clear shift error if validation passes
    setShiftError('');
    // Validate duplicate roles
    const roleTypes = new Set<string>();
    for (const roleConfig of form.roleConfigs || []) {
      if (roleConfig.role) {
        if (roleTypes.has(roleConfig.role)) {
          setRoleError(t('branch_working_config.error.duplicate_role'));
          return;
        }
        roleTypes.add(roleConfig.role);
      }
    }
    // Clear role error if validation passes
    setRoleError('');
    setLoading(true);
    setError('');
    try {
      await branchApi.updateBranchWorkingConfig(branchId, submitData);
      toast.success(t('branch_working_config.success.save'));
      // Trigger onSuccess callback to refresh calendar data
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch {
      setError(t('branch_working_config.error.save_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end items-stretch bg-black/30">
      <div className="relative bg-white h-full w-full md:w-[900px] xl:w-[900px] max-w-full p-8 overflow-y-auto shadow-xl border-l">
        <button
          className="absolute top-4 right-4 text-lg font-bold"
          onClick={onClose}
          aria-label={t('branch_working_config.close')}
        >
          ×
        </button>
        <h2 className="text-2xl font-bold mb-8">{t('branch_working_config.title')}</h2>
        {loading ? (
          <div className="py-10 text-center">{t('branch_working_config.loading')}</div>
        ) : (
          <div className="space-y-6">
            {/* Ngày làm/nghỉ */}
            <div>
              <div className="font-semibold mb-1">{t('branch_working_config.select_working_days')}</div>
              <div className="flex gap-2 flex-wrap mb-1">
                {(DAYS || []).map((d) => {
                  const sixDaysSelected =
                    (form.defaultWorkingDays || []).length >= 6 && !(form.defaultWorkingDays || []).includes(d.value);
                  return (
                    <Button
                      key={d.value}
                      variant={(form.defaultWorkingDays || []).includes(d.value) ? 'default' : 'outline'}
                      size="sm"
                      id={`day-${d.value}`}
                      onClick={() =>
                        !sixDaysSelected || d.value !== 0
                          ? handleChange(
                              'defaultWorkingDays',
                              toggleArray<number>(form.defaultWorkingDays || [], Number(d.value))
                            )
                          : undefined
                      }
                      disabled={sixDaysSelected && d.value === 0}
                      className={
                        sixDaysSelected && d.value === 0
                          ? 'bg-orange-100 border border-orange-300 opacity-60 cursor-not-allowed text-orange-700'
                          : ''
                      }
                    >
                      {d.label}
                    </Button>
                  );
                })}
              </div>
              <div className="text-xs text-gray-500">{t('branch_working_config.days_not_selected_hint')}</div>
            </div>
            {/* Default Shifts */}
            <div>
              <div className="font-semibold mb-1">{t('branch_working_config.default_shift_config')}</div>
              {shiftError && <div className="text-red-500 text-sm mb-2">{shiftError}</div>}
              <table className="w-full border mt-2 table-fixed">
                <thead>
                  <tr>
                    <th className="text-center align-middle px-4 py-2 w-[200px]">
                      {t('branch_working_config.shift_name')}
                    </th>
                    <th className="text-center align-middle px-4 py-2 w-[180px]">
                      {t('branch_working_config.start_time')}
                    </th>
                    <th className="text-center align-middle px-4 py-2 w-[180px]">
                      {t('branch_working_config.end_time')}
                    </th>
                    <th className="text-center align-middle px-4 py-2 w-[140px]">
                      {t('branch_working_config.total_hours')}
                    </th>
                    <th className="text-center align-middle px-4 py-2 w-[60px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {(form.defaultShifts || []).map((shift, idx) => {
                    // Tính tổng phút giữa startTime và endTime
                    const t1 = shift.startTime?.split(':');
                    const t2 = shift.endTime?.split(':');
                    let totalMinutes = 0;
                    if (t1?.length === 2 && t2?.length === 2) {
                      totalMinutes =
                        Number.parseInt(t2[0], 10) * 60 +
                        Number.parseInt(t2[1], 10) -
                        (Number.parseInt(t1[0], 10) * 60 + Number.parseInt(t1[1], 10));
                      if (totalMinutes < 0) totalMinutes = 0;
                    }
                    const totalHours = (totalMinutes / 60).toFixed(2);
                    return (
                      <tr key={`${idx}-${shift.type}`}>
                        <td className="align-middle px-4 py-1 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Select
                              value={shift.type}
                              onValueChange={(v) => handleShiftChange(idx, 'type', v as string)}
                            >
                              <SelectTrigger className="w-[200px]" id={`shift-type-${idx}`}>
                                <SelectValue placeholder={t('branch_working_config.shift_name')} />
                              </SelectTrigger>
                              <SelectContent>
                                {SHIFT_TYPES.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                                <SelectItem value="CUSTOM">{t('branch_working_config.custom')}</SelectItem>
                              </SelectContent>
                            </Select>
                            {shift.type === 'CUSTOM' && (
                              <Input
                                className="w-[180px]"
                                placeholder={t('branch_working_config.enter_shift_name')}
                                value={shift.customName || ''}
                                onChange={(e) => handleShiftChange(idx, 'customName', e.target.value)}
                              />
                            )}
                          </div>
                        </td>
                        <td className="align-middle px-4 py-1 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="time"
                              value={shift.startTime}
                              onChange={(e) => handleShiftChange(idx, 'startTime', e.target.value)}
                              className="w-[180px] text-center mx-auto block"
                              id={`shift-start-time-${idx}`}
                              placeholder={
                                shift.type && shift.type !== 'CUSTOM' && DEFAULT_SHIFT_TIMES[shift.type]
                                  ? DEFAULT_SHIFT_TIMES[shift.type].startTime
                                  : undefined
                              }
                            />
                            {shift.type &&
                              shift.type !== 'CUSTOM' &&
                              DEFAULT_SHIFT_TIMES[shift.type] &&
                              !shift.startTime && (
                                <span className="text-xs text-gray-400">
                                  {DEFAULT_SHIFT_TIMES[shift.type].startTime}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="align-middle px-4 py-1 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="time"
                              value={shift.endTime}
                              onChange={(e) => handleShiftChange(idx, 'endTime', e.target.value)}
                              className="w-[180px] text-center mx-auto block"
                              id={`shift-end-time-${idx}`}
                              placeholder={
                                shift.type && shift.type !== 'CUSTOM' && DEFAULT_SHIFT_TIMES[shift.type]
                                  ? DEFAULT_SHIFT_TIMES[shift.type].endTime
                                  : undefined
                              }
                            />
                            {shift.type &&
                              shift.type !== 'CUSTOM' &&
                              DEFAULT_SHIFT_TIMES[shift.type] &&
                              !shift.endTime && (
                                <span className="text-xs text-gray-400">{DEFAULT_SHIFT_TIMES[shift.type].endTime}</span>
                              )}
                          </div>
                        </td>
                        <td className="align-middle px-4 py-1 text-center">
                          <span className="font-semibold text-base">
                            {t1?.length === 2 && t2?.length === 2 && totalMinutes > 0 ? `${totalHours}h` : '--'}
                          </span>
                        </td>
                        <td className="align-middle px-2 py-1 text-center">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                defaultShifts: (prev.defaultShifts || []).filter((_, ii) => ii !== idx)
                              }))
                            }
                            disabled={(form.defaultShifts || []).length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex">
                <Button
                  className="ml-auto mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      defaultShifts: [...(prev.defaultShifts || []), { type: 'MORNING', startTime: '', endTime: '' }]
                    }))
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('branch_working_config.add_shift')}
                </Button>
              </div>
            </div>
            {/* Role configs */}
            <div>
              <label className="font-semibold">{t('branch_working_config.role_config')}</label>
              {roleError && <div className="text-red-500 text-sm mb-2">{roleError}</div>}
              <table className="w-full border mt-2 border-collapse" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr>
                    <th className="text-center align-middle px-4 py-2 w-[180px] font-semibold">
                      {t('branch_working_config.role')}
                    </th>
                    <th className="text-center align-middle px-4 py-2 w-[200px] font-semibold">
                      {t('branch_working_config.working_days')}
                    </th>
                    <th className="text-center align-middle px-4 py-2 w-[280px] font-semibold">
                      {t('branch_working_config.shifts')}
                    </th>
                    <th className="text-center align-middle px-2 py-2 w-[50px] font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {(form.roleConfigs || []).map((role, idx) => {
                    // if chọn role PT, auto add CN nếu thiếu
                    function handleRoleSelect(value: string) {
                      const next =
                        value === 'PT' && !(role.workingDays || []).includes(0)
                          ? { ...role, role: value, workingDays: [...(role.workingDays || []), 0] }
                          : { ...role, role: value };
                      handleRoleChange(idx, 'role', value as RoleConfig['role']);
                      // patch lại workingDays nếu cần
                      if (next.workingDays) handleRoleChange(idx, 'workingDays', next.workingDays);
                    }
                    return (
                      <tr key={`${idx}-${role.role}`} className="border-t">
                        <td className="text-center align-middle px-4 py-2">
                          <div className="flex justify-center">
                            <Select value={role.role} onValueChange={(v) => handleRoleSelect(v)}>
                              <SelectTrigger className="w-full" id={`role-select-${idx}`}>
                                <SelectValue placeholder={t('branch_working_config.role')} />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLES.map((r) => (
                                  <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </td>
                        <td className="text-center align-middle px-4 py-2">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {(DAYS || []).map((d) => (
                              <Button
                                key={d.value}
                                size="sm"
                                variant={role.workingDays?.includes(d.value) ? 'default' : 'outline'}
                                className="text-xs h-7"
                                onClick={() =>
                                  handleRoleChange(
                                    idx,
                                    'workingDays',
                                    toggleArray<number>(role.workingDays || [], Number(d.value))
                                  )
                                }
                                id={`working-day-${idx}-${d.value}`}
                              >
                                {d.label}
                              </Button>
                            ))}
                          </div>
                        </td>
                        <td className="text-center align-middle px-4 py-2">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {(form.defaultShifts || []).map((shift, shiftIdx) => (
                              <Button
                                key={`${idx}-shift-${shiftIdx}-${shift.type}`}
                                size="sm"
                                variant={role.shifts?.includes(shift.type) ? 'default' : 'outline'}
                                className="text-xs h-7"
                                onClick={() =>
                                  handleRoleChange(
                                    idx,
                                    'shifts',
                                    toggleArray<string>(
                                      (role.shifts ?? []) as string[],
                                      shift.type
                                    ) as RoleConfig['shifts']
                                  )
                                }
                                id={`shift-type-${idx}-${shift.type}-${shiftIdx}`}
                              >
                                {shift.type}
                              </Button>
                            ))}
                          </div>
                        </td>
                        <td className="text-center align-middle px-2 py-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                roleConfigs: (prev.roleConfigs || []).filter((_, ii) => ii !== idx)
                              }))
                            }
                            disabled={(form.roleConfigs || []).length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex">
                <Button
                  className="ml-auto mt-2"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, roleConfigs: [...(prev.roleConfigs || []), defaultRoleConfig()] }))
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('branch_working_config.add_role')}
                </Button>
              </div>
            </div>
            {/* Active status */}
            <div>
              <label className="font-semibold">{t('branch_working_config.active_status')}</label>
              <Checkbox checked={form.isActive} onCheckedChange={(v) => handleChange('isActive', v === true)} />{' '}
              {t('branch_working_config.enable')}
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex justify-end gap-2 mt-10 border-t pt-4 sticky bottom-0 bg-white">
              <Button variant="outline" onClick={onClose}>
                {t('branch_working_config.cancel')}
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? t('branch_working_config.saving') : t('branch_working_config.save_config')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchWorkingConfigModal;
