// lib/envizor/saviyntModel.ts

export type SaviyntTenant = {
  id: string;
  name: string;
};

export type SaviyntApplication = {
  id: string;
  name: string;
  tenantId: string;
};

export type SaviyntRole = {
  id: string;
  name: string;
  applicationId: string;
  entitlementIds: string[];
};

export type SaviyntEntitlement = {
  id: string;
  name: string;
  applicationId: string;
};

export type SaviyntAccount = {
  id: string;
  name: string;
  tenantId: string;
  roleIds: string[];
};

export type SaviyntModel = {
  tenants: SaviyntTenant[];
  applications: SaviyntApplication[];
  roles: SaviyntRole[];
  entitlements: SaviyntEntitlement[];
  accounts: SaviyntAccount[];
};

export function buildSaviyntModel(discovered: any): SaviyntModel {
  return {
    tenants: discovered?.tenants ?? [],
    applications: discovered?.applications ?? [],
    roles: discovered?.roles ?? [],
    entitlements: discovered?.entitlements ?? [],
    accounts: discovered?.accounts ?? [],
  };
}
