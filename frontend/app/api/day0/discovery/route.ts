import { NextResponse } from "next/server";
import { createSaviyntClient, EnvName } from "@/app/lib/saviynt/client";

type Artefact = { name: string };
type EnvKey = "DEV" | "PRE" | "PROD";

type EnvData = {
  securitySystems:   Artefact[];
  endpoints:         Artefact[];
  dynamicAttributes: Artefact[];
  entitlementTypes:  Artefact[];
  enterpriseRoles:   Artefact[];
  entitlements:      Artefact[];
  privileges:        Artefact[];
  fileUploads:       Artefact[];
  connections:       Artefact[];
  jobs:              Artefact[];
  transportPackages: Artefact[];
  // Legacy keys kept for backward-compat (Day-0 diff page etc.)
  roles:  Artefact[];
  tasks:  Artefact[];
  rules:  Artefact[];
  // 15th resource type
  lookups: Artefact[];
};

function sorted(list: Artefact[]): Artefact[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

const MOCK_DATA: Record<EnvKey, EnvData> = {
  DEV: {
    securitySystems:   sorted([{ name: "HR_SYSTEM_DEV" }, { name: "FINANCE_SYSTEM_DEV" }]),
    endpoints:         sorted([{ name: "HR_ENDPOINT_DEV" }, { name: "FIN_ENDPOINT_DEV" }]),
    dynamicAttributes: sorted([{ name: "department_code" }]),
    entitlementTypes:  sorted([{ name: "AD_Group" }]),
    enterpriseRoles:   sorted([{ name: "Enterprise_Dev_Engineer" }]),
    entitlements:      sorted([{ name: "Dev Entitlement A" }, { name: "Dev Entitlement B" }]),
    privileges:        sorted([{ name: "admin_dashboard_access" }]),
    fileUploads:       sorted([{ name: "sap_users_baseline.xlsx" }]),
    connections:       sorted([{ name: "DEV_DB_CONN" }, { name: "DEV_LDAP_CONN" }]),
    jobs:              sorted([{ name: "Dev Task A" }]),
    transportPackages: sorted([{ name: "Billing_Module_DEV" }]),
    // Legacy
    roles:  sorted([{ name: "Dev Role A" }, { name: "Dev Role B" }, { name: "Dev Role C" }]),
    tasks:  sorted([{ name: "Dev Task A" }]),
    rules:  sorted([{ name: "Dev Rule A" }]),
    // 15th type
    lookups: sorted([{ name: "CountryCodes" }, { name: "DeptMappings" }]),
  },
  PRE: {
    securitySystems:   sorted([{ name: "HR_SYSTEM_PRE" }]),
    endpoints:         sorted([{ name: "HR_ENDPOINT_PRE" }]),
    dynamicAttributes: sorted([{ name: "department_code" }]),
    entitlementTypes:  sorted([{ name: "AD_Group" }]),
    enterpriseRoles:   sorted([{ name: "Enterprise_Pre_Engineer" }]),
    entitlements:      sorted([{ name: "Pre Entitlement A" }]),
    privileges:        sorted([{ name: "admin_dashboard_access" }]),
    fileUploads:       [],
    connections:       sorted([{ name: "PRE_DB_CONN" }, { name: "PRE_LDAP_CONN" }]),
    jobs:              sorted([{ name: "Pre Task A" }]),
    transportPackages: sorted([{ name: "Billing_Module_PRE" }]),
    // Legacy
    roles:  sorted([{ name: "Pre Role A" }, { name: "Pre Role B" }]),
    tasks:  sorted([{ name: "Pre Task A" }]),
    rules:  sorted([{ name: "Pre Rule A" }]),
    // 15th type
    lookups: sorted([{ name: "CountryCodes" }]),
  },
  PROD: {
    securitySystems:   sorted([{ name: "HR_SYSTEM_PROD" }, { name: "FINANCE_SYSTEM_PROD" }]),
    endpoints:         sorted([{ name: "HR_ENDPOINT_PROD" }]),
    dynamicAttributes: sorted([{ name: "department_code" }]),
    entitlementTypes:  sorted([{ name: "AD_Group" }]),
    enterpriseRoles:   sorted([{ name: "Enterprise_Prod_Engineer" }]),
    entitlements:      sorted([{ name: "Prod Entitlement A" }, { name: "Prod Entitlement B" }]),
    privileges:        sorted([{ name: "admin_dashboard_access" }]),
    fileUploads:       [],
    connections:       sorted([{ name: "PROD_DB_CONN" }, { name: "PROD_LDAP_CONN" }]),
    jobs:              sorted([{ name: "Prod Task A" }, { name: "Prod Task B" }]),
    transportPackages: sorted([{ name: "Billing_Module_PROD" }]),
    // Legacy
    roles:  sorted([{ name: "Prod Role A" }, { name: "Prod Role B" }, { name: "Prod Role C" }, { name: "Prod Role D" }]),
    tasks:  sorted([{ name: "Prod Task A" }, { name: "Prod Task B" }]),
    rules:  sorted([{ name: "Prod Rule A" }]),
    // 15th type
    lookups: sorted([{ name: "CountryCodes" }, { name: "DeptMappings" }]),
  },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const env = searchParams.get("env");

  if (!env) {
    return NextResponse.json({ error: "Missing environment" });
  }

  const envKey = env.toUpperCase() as EnvKey;

  if (!MOCK_DATA[envKey]) {
    return NextResponse.json({ error: `Unknown environment: ${env}` });
  }

  try {
    const client = createSaviyntClient(envKey);

    // Fetch all 15 resource types in parallel
    const [
      securitySystems,
      endpoints,
      dynamicAttributes,
      entitlementTypes,
      enterpriseRoles,
      entitlements,
      privileges,
      fileUploads,
      connections,
      jobs,
      transportPackages,
      roles,
      tasks,
      rules,
      lookups,
    ] = await Promise.all([
      client.listSecuritySystems(),
      client.listEndpoints(),
      client.listDynamicAttributes(),
      client.listEntitlementTypes(),
      client.listEnterpriseRoles(),
      client.listEntitlements(),
      client.listPrivileges(),
      client.listFileUploads(),
      client.listConnections(),
      client.listJobs(),
      client.listTransportPackages(),
      client.listRoles(),
      client.listTasks(),
      client.listRules(),
      client.listLookups(),
    ]);

    // If all core arrays are empty, fall back to mock
    if (
      securitySystems.length === 0 &&
      endpoints.length === 0 &&
      connections.length === 0 &&
      entitlements.length === 0
    ) {
      throw new Error("Empty lists returned across all live APIs");
    }

    return NextResponse.json({
      isMock: false,
      securitySystems:   sorted(securitySystems.map((s) => ({ name: s.name }))),
      endpoints:         sorted(endpoints.map((e) => ({ name: e.name }))),
      dynamicAttributes: sorted(dynamicAttributes.map((d) => ({ name: d.name }))),
      entitlementTypes:  sorted(entitlementTypes.map((e) => ({ name: e.name }))),
      enterpriseRoles:   sorted(enterpriseRoles.map((e) => ({ name: e.name }))),
      entitlements:      sorted(entitlements.map((e) => ({ name: e.name || e.entitlement_value || "" }))),
      privileges:        sorted(privileges.map((p) => ({ name: p.name }))),
      fileUploads:       sorted(fileUploads.map((f) => ({ name: f.fileName }))),
      connections:       sorted(connections.map((c) => ({ name: c.name }))),
      jobs:              sorted(jobs.map((j) => ({ name: j.name }))),
      transportPackages: sorted(transportPackages.map((t) => ({ name: t.name }))),
      // Legacy keys
      roles:  sorted(roles.map((r) => ({ name: r.name }))),
      tasks:  sorted(tasks.map((t) => ({ name: t.name }))),
      rules:  sorted(rules.map((r) => ({ name: r.name }))),
      // 15th type
      lookups: sorted(lookups.map((l) => ({ name: l.name }))),
    });
  } catch (err: any) {
    console.warn(`[Saviynt Discovery] Failed to query live "${envKey}" (${err.message}). Using mock data.`);
    return NextResponse.json({ isMock: true, ...MOCK_DATA[envKey] });
  }
}
