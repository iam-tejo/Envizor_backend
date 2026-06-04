// app/api/wizard/pull/mock-run/route.ts
// Browser-accessible endpoint: runs the FULL mock pipeline for a given env,
// writes all .tf files to disk, and returns a JSON report.
// No Saviynt credentials required — uses MOCK_DB only.
// Usage: POST /api/wizard/pull/mock-run  { "env": "DEV" }

import { NextResponse } from "next/server";
import { createSaviyntClient, type EnvName } from "@/app/lib/saviynt/client";
import {
  securitySystemToTf,
  endpointToTf,
  dynamicAttributeToTf,
  entitlementTypeToTf,
  enterpriseRoleToTf,
  entitlementToTf,
  privilegeToTf,
  fileUploadToTf,
  connectionToTf,
  jobToTf,
  transportPackageToTf,
  roleToTf,
  ruleToTf,
  lookupToTf,
} from "@/app/lib/saviynt/toTerraform";
import { writeToWorkspace } from "@/app/lib/wizard/writeToWorkspace";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const env = ((body.env as string) || "DEV") as EnvName;

  // Force mock mode by not setting real URLs — client.ts already falls back
  // to MOCK_DB when url.includes("example.com")
  const client = createSaviyntClient(env);

  const files: Record<string, string> = {};
  const report: { resource: string; file: string; lines: number }[] = [];

  function record(folder: string, name: string, hcl: string) {
    const safeName = name.toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_");
    const key = `${folder}/${safeName}.tf`;
    files[key] = hcl;
    report.push({ resource: folder, file: `${safeName}.tf`, lines: hcl.split("\n").length });
  }

  // 1. Security Systems
  for (const item of await client.listSecuritySystems())
    record("security-systems", item.name, securitySystemToTf(item));

  // 2. Endpoints
  for (const item of await client.listEndpoints())
    record("endpoints", item.name, endpointToTf(item));

  // 3. Dynamic Attributes
  for (const item of await client.listDynamicAttributes())
    record("dynamic-attributes", item.name, dynamicAttributeToTf(item));

  // 4. Entitlement Types
  for (const item of await client.listEntitlementTypes())
    record("entitlement-types", item.name, entitlementTypeToTf(item));

  // 5. Enterprise Roles
  for (const item of await client.listEnterpriseRoles())
    record("enterprise-roles", item.name, enterpriseRoleToTf(item));

  // 6. Entitlements
  for (const item of await client.listEntitlements())
    record("entitlements", item.name ?? item.entitlement_value ?? item.id, entitlementToTf(item));

  // 7. Privileges
  for (const item of await client.listPrivileges())
    record("privileges", item.name, privilegeToTf(item));

  // 8. File Uploads
  for (const item of await client.listFileUploads())
    record("file-uploads", item.fileName, fileUploadToTf(item));

  // 9. Connections
  for (const item of await client.listConnections())
    record("connections", item.name, connectionToTf(item));

  // 10. Jobs
  for (const item of await client.listJobs())
    record("jobs", item.name, jobToTf(item));

  // 11. Transport Packages
  for (const item of await client.listTransportPackages())
    record("transport-packages", item.name, transportPackageToTf(item));

  // 12. Roles
  for (const item of await client.listRoles())
    record("roles", item.name, roleToTf(item));

  // 13. Tasks
  for (const item of await client.listTasks())
    record("jobs", item.name, jobToTf(item));

  // 14. Rules
  for (const item of await client.listRules())
    record("jobs", item.name, ruleToTf(item));

  // 15. Lookups
  for (const item of await client.listLookups())
    record("lookups", item.name, lookupToTf(item));

  // Write all files to terraform-workspaces/{env}/
  const writeResult = await writeToWorkspace(env, files);

  return NextResponse.json({
    ok: true,
    env,
    filesWritten: writeResult.written.length,
    workspace: writeResult.workspace,
    report,
    // Also return HCL preview of every generated file
    preview: files,
  });
}
