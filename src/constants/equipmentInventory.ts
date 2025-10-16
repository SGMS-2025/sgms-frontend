export const EQUIPMENT_INVENTORY_STATUS = {
  PRESENT: 'PRESENT',
  MISSING: 'MISSING'
} as const;

export type EquipmentInventoryStatus = (typeof EQUIPMENT_INVENTORY_STATUS)[keyof typeof EQUIPMENT_INVENTORY_STATUS];
