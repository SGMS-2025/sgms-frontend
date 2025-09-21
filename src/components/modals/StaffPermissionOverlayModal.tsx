import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from 'react-i18next';
import { useEffectivePermissions, usePermissionOperations } from '@/hooks/usePermissions';
import { permissionApi } from '@/services/api/permissionApi';
import type {
  Permission,
  StaffPermissionOverlayModalProps,
  PermissionItem,
  PermissionGroup
} from '@/types/api/Permission';

const StaffPermissionOverlayModal: React.FC<StaffPermissionOverlayModalProps> = ({
  isOpen,
  onClose,
  staff,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const [selectedPermissionGroup, setSelectedPermissionGroup] = useState<string>('all');

  // Get effective permissions for the staff member
  const {
    permissions: effectivePermissions,
    loading: permissionsLoading,
    refetch: refetchEffectivePermissions
  } = useEffectivePermissions(staff?.userId?._id);

  // Permission operations hook
  const { assignPermission, revokePermission } = usePermissionOperations();

  // Load available permissions
  useEffect(() => {
    const loadPermissions = async () => {
      if (!staff?.userId?._id) return;

      setLoading(true);

      const response = await permissionApi.getPermissions({}, { limit: 100 });
      if (response.success) {
        setAvailablePermissions(response.data.permissions);
      }

      setLoading(false);
    };

    if (isOpen && staff?.userId?._id) {
      loadPermissions();
    }
  }, [isOpen, staff?.userId?._id]);

  useEffect(() => {
    if (availablePermissions.length > 0) {
      const mappedPermissions: PermissionItem[] = availablePermissions.map((perm) => {
        const sanitizedPermissionName = perm.name.toLowerCase().trim().replace(/\s+/g, '');
        const isEnabled = Array.isArray(effectivePermissions)
          ? effectivePermissions.includes(sanitizedPermissionName)
          : false;
        return {
          id: perm._id,
          name: perm.description || perm.name,
          description: perm.description || `Access to ${perm.resource} ${perm.action}`,
          enabled: isEnabled,
          permissionName: sanitizedPermissionName,
          resource: perm.resource,
          action: perm.action
        };
      });

      setPermissions(mappedPermissions);

      // Group permissions by resource
      const groupedPermissions = groupPermissionsByResource(mappedPermissions);
      setPermissionGroups(groupedPermissions);
    }
  }, [availablePermissions, effectivePermissions]);

  const handlePermissionToggle = (permissionId: string, enabled: boolean) => {
    setPermissions((prev) =>
      prev.map((permission) => (permission.id === permissionId ? { ...permission, enabled } : permission))
    );

    // Update permission groups as well
    setPermissionGroups((prev) =>
      prev.map((group) => ({
        ...group,
        permissions: group.permissions.map((permission) =>
          permission.id === permissionId ? { ...permission, enabled } : permission
        )
      }))
    );

    setHasChanges(true);
  };

  const handlePermissionGroupChange = (permissionGroup: string) => {
    setSelectedPermissionGroup(permissionGroup);
  };

  // Function to group permissions by resource
  const groupPermissionsByResource = (permissions: PermissionItem[]): PermissionGroup[] => {
    const resourceMapping: { [key: string]: string } = {
      staff: t('permissions.staff_management'),
      branch: t('permissions.branch_management'),
      permission: t('permissions.permission_management')
    };

    const grouped = permissions.reduce(
      (groups, permission) => {
        const resource = permission.resource;
        const resourceName = resourceMapping[resource] || resource.charAt(0).toUpperCase() + resource.slice(1);

        if (!groups[resource]) {
          groups[resource] = {
            resource,
            resourceName,
            permissions: []
          };
        }

        groups[resource].permissions.push(permission);
        return groups;
      },
      {} as { [key: string]: PermissionGroup }
    );

    // Sort permissions within each group by priority (action order)
    Object.values(grouped).forEach((group) => {
      group.permissions.sort((a, b) => {
        const actionOrder = ['read', 'create', 'update', 'delete', 'manage'];
        const aIndex = actionOrder.indexOf(a.action);
        const bIndex = actionOrder.indexOf(b.action);
        return aIndex - bIndex;
      });
    });

    return Object.values(grouped).sort((a, b) => a.resourceName.localeCompare(b.resourceName));
  };

  // Filter permission groups based on selected group
  const getFilteredPermissionGroups = (): PermissionGroup[] => {
    if (selectedPermissionGroup === 'all') {
      return permissionGroups;
    }
    return permissionGroups.filter((group) => group.resource === selectedPermissionGroup);
  };

  const handleSave = async () => {
    if (!staff || !hasChanges) return;

    setSaving(true);

    const userId = staff.userId?._id;
    if (!userId) {
      setSaving(false);
      return;
    }

    // Get the original effective permissions
    const originalPermissions = new Set(effectivePermissions);

    // Process each permission change
    for (const permission of permissions) {
      const sanitizedPermissionName = permission.permissionName.toLowerCase().trim().replace(/\s+/g, '');
      const hasOriginalPermission = originalPermissions.has(sanitizedPermissionName);

      if (permission.enabled && !hasOriginalPermission) {
        // Assign new permission
        await assignPermission({
          userId,
          permissionName: sanitizedPermissionName,
          scope: 'global', // Use global scope for staff permissions
          resourceId: undefined,
          resourceType: undefined
        });
      } else if (!permission.enabled && hasOriginalPermission) {
        // Revoke permission
        await revokePermission({
          userId,
          permissionName: sanitizedPermissionName,
          resourceId: undefined,
          resourceType: undefined
        });
      }
    }
    setHasChanges(false);

    const freshResponse = await permissionApi.getEffectivePermissions(userId);
    if (freshResponse.success) {
      setPermissions((prev) =>
        prev.map((permission) => ({
          ...permission,
          enabled: freshResponse.data.permissions.includes(
            permission.permissionName.toLowerCase().trim().replace(/\s+/g, '')
          )
        }))
      );
    }

    refetchEffectivePermissions();

    setTimeout(() => {
      onSuccess?.();
      onClose();
    }, 1000);

    setSaving(false);
  };

  if (!isOpen || !staff) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex">
      {/* Left side - transparent overlay that allows clicking to close */}
      <button
        className="flex-1 bg-transparent focus:outline-none"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-label="Close modal"
      />

      {/* Right side - modal panel */}
      <div className="bg-white shadow-2xl w-[600px] h-full overflow-hidden border border-gray-200 flex flex-col rounded-lg mr-4 my-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#f05a29] to-[#df4615] text-white rounded-t-lg">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('permissions.title')}</h2>
              <p className="text-white text-opacity-90 text-sm">{staff.userId?.fullName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Staff Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12 border-2 border-[#f05a29]">
              <AvatarImage src="" alt={staff.userId?.fullName} />
              <AvatarFallback className="bg-[#f05a29] text-white font-bold">
                {staff.userId?.fullName?.charAt(0) || 'A'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{staff.userId?.fullName}</h3>
              <p className="text-sm text-gray-600">{staff.userId?.email}</p>
              <p className="text-sm text-[#f05a29] font-medium">{staff.jobTitle}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">{t('permissions.permission_description')}</div>
            </div>
          </div>
        </div>

        {/* Permission Group Selector */}
        <div className="p-6 border-b border-gray-200">
          <label htmlFor="permission-group" className="block text-sm font-medium text-gray-700 mb-2">
            {t('permissions.permission_group')}
          </label>
          <select
            id="permission-group"
            value={selectedPermissionGroup}
            onChange={(e) => handlePermissionGroupChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('permissions.all_permissions')}</option>
            {permissionGroups.map((group) => (
              <option key={group.resource} value={group.resource}>
                {group.resourceName} ({group.permissions.length})
              </option>
            ))}
          </select>
        </div>

        {/* Permissions List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-6">
            {loading || permissionsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-gray-600">{t('permissions.loading_permissions')}</span>
              </div>
            ) : (
              <div className="space-y-6">
                {getFilteredPermissionGroups().length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {selectedPermissionGroup === 'all'
                      ? t('permissions.no_permissions_available')
                      : t('permissions.no_permissions_in_group', {
                          group:
                            permissionGroups.find((g) => g.resource === selectedPermissionGroup)?.resourceName ||
                            selectedPermissionGroup
                        })}
                  </div>
                ) : (
                  getFilteredPermissionGroups().map((group) => (
                    <div key={group.resource} className="space-y-3">
                      {/* Group Header */}
                      <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                        <div className="p-1.5 bg-orange-100 rounded-md">
                          <Shield className="h-4 w-4 text-orange-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800">{group.resourceName}</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {group.permissions.length}{' '}
                          {group.permissions.length !== 1 ? t('permissions.permissions') : t('permissions.permission')}
                        </span>
                      </div>

                      {/* Group Permissions */}
                      <div className="space-y-2 ml-6">
                        {group.permissions.map((permission) => (
                          <div
                            key={permission.id}
                            className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                              permission.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`p-1.5 rounded-md ${permission.enabled ? 'bg-green-100' : 'bg-green-100'}`}
                              >
                                <Shield className="h-3 w-3 text-green-600" />
                              </div>
                              <div>
                                <h4
                                  className={`text-sm font-medium ${
                                    permission.enabled ? 'text-green-900' : 'text-gray-900'
                                  }`}
                                >
                                  {permission.name}
                                </h4>
                                <p className="text-xs text-gray-500">{permission.description}</p>
                                <p className="text-xs text-gray-400 font-mono">{permission.permissionName}</p>
                              </div>
                            </div>
                            <Switch
                              checked={permission.enabled}
                              onCheckedChange={(enabled) => handlePermissionToggle(permission.id, enabled)}
                              disabled={saving}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          {/* Messages */}
          <div className="space-y-3 mb-4">
            {hasChanges && (
              <div className="flex items-center space-x-2 text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{t('permissions.changes_detected')}</span>
              </div>
            )}

            {selectedPermissionGroup !== 'all' && (
              <div className="flex items-center space-x-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                <Shield className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">
                  {t('permissions.showing_permissions_for')}{' '}
                  <strong>
                    {permissionGroups.find((g) => g.resource === selectedPermissionGroup)?.resourceName ||
                      selectedPermissionGroup}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Button */}
          <div className="flex items-center justify-end space-x-3">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 relative z-10"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {t('permissions.saving')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('permissions.save_changes')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffPermissionOverlayModal;
