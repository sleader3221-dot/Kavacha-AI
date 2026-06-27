import { ROLES } from "@/lib/catalog";
import type { RoleId } from "@/lib/types";

export function getRolePolicy(role: RoleId) {
  const roleConfig = ROLES.find((item) => item.id === role) ?? ROLES[ROLES.length - 1];
  return {
    role: roleConfig.id,
    label: roleConfig.label,
    scope: roleConfig.scope,
    districts: roleConfig.districtScope,
    canExport: roleConfig.canExport,
    canViewSensitive: roleConfig.canViewSensitive,
    piiMode: roleConfig.canViewSensitive ? "masked elevated workflow" : "masked aggregate workflow"
  };
}

export function canAccessDistrict(role: RoleId, district: string) {
  const policy = getRolePolicy(role);
  return policy.districts.includes("All Karnataka") || policy.districts.includes(district);
}
