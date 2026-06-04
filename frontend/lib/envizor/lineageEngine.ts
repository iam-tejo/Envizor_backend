// lib/envizor/lineageEngine.ts

import {
  SaviyntModel,
  SaviyntRole,
  SaviyntEntitlement,
  SaviyntAccount,
} from "./saviyntModel";

export type RoleLineage = {
  role: SaviyntRole;
  entitlements: SaviyntEntitlement[];
  accounts: SaviyntAccount[];
};

export function buildRoleLineage(
  model: SaviyntModel,
  roleId: string
): RoleLineage | null {
  const role = model.roles.find((r) => r.id === roleId);
  if (!role) return null;

  const entitlements = model.entitlements.filter((e) =>
    role.entitlementIds.includes(e.id)
  );

  const accounts = model.accounts.filter((a) =>
    a.roleIds.includes(role.id)
  );

  return { role, entitlements, accounts };
}
