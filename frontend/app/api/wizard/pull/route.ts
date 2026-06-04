// app/api/wizard/pull/route.ts
// Full pipeline: fetch all artefacts from Saviynt → format via toTerraform.ts → return as workspace files

import { NextResponse } from "next/server";
import { createSaviyntClient, type EnvName } from "@/app/lib/saviynt/client";
import {
  securitySystemToTf,
  endpointToTf,
  dynamicAttributeToTf,
  entitlementTypeToTf,
  enterpriseRoleToTf,
  roleToTf,
  entitlementToTf,
  privilegeToTf,
  fileUploadToTf,
  connectionToTf,
  jobToTf,
  ruleToTf,
  transportPackageToTf,
  lookupToTf,
} from "@/app/lib/saviynt/toTerraform";

export async function POST(req: Request) {
  const { env, selection } = await req.json();
  const envName = (env?.toUpperCase() ?? "DEV") as EnvName;
  const client = createSaviyntClient(envName);

  // files map: workspace-relative path → HCL content
  const files: Record<string, string> = {};

  // ── 1. Security Systems ──────────────────────────────────────────────────
  if (selection.securitySystems?.length) {
    const all = await client.listSecuritySystems();
    const selected = selection.securitySystems as string[];
    for (const item of all.filter((s) => selected.includes(s.name))) {
      files[`security-systems/${safeName(item.name)}.tf`] = securitySystemToTf(item);
    }
  }

  // ── 2. Endpoints ─────────────────────────────────────────────────────────
  if (selection.endpoints?.length) {
    const all = await client.listEndpoints();
    const selected = selection.endpoints as string[];
    for (const item of all.filter((e) => selected.includes(e.name))) {
      files[`endpoints/${safeName(item.name)}.tf`] = endpointToTf(item);
    }
  }

  // ── 3. Dynamic Attributes ────────────────────────────────────────────────
  if (selection.dynamicAttributes?.length) {
    const all = await client.listDynamicAttributes();
    const selected = selection.dynamicAttributes as string[];
    for (const item of all.filter((d) => selected.includes(d.name))) {
      files[`dynamic-attributes/${safeName(item.name)}.tf`] = dynamicAttributeToTf(item);
    }
  }

  // ── 4. Entitlement Types ─────────────────────────────────────────────────
  if (selection.entitlementTypes?.length) {
    const all = await client.listEntitlementTypes();
    const selected = selection.entitlementTypes as string[];
    for (const item of all.filter((e) => selected.includes(e.name))) {
      files[`entitlement-types/${safeName(item.name)}.tf`] = entitlementTypeToTf(item);
    }
  }

  // ── 5. Enterprise Roles ──────────────────────────────────────────────────
  if (selection.enterpriseRoles?.length) {
    const all = await client.listEnterpriseRoles();
    const selected = selection.enterpriseRoles as string[];
    for (const item of all.filter((e) => selected.includes(e.name))) {
      files[`enterprise-roles/${safeName(item.name)}.tf`] = enterpriseRoleToTf(item);
    }
  }

  // ── 6. Entitlements ──────────────────────────────────────────────────────
  if (selection.entitlements?.length) {
    const all = await client.listEntitlements();
    const selected = selection.entitlements as string[];
    for (const item of all.filter((e) => selected.includes(e.name ?? e.entitlement_value ?? ""))) {
      files[`entitlements/${safeName(item.name ?? item.entitlement_value ?? item.id)}.tf`] = entitlementToTf(item);
    }
  }

  // ── 7. Privileges ────────────────────────────────────────────────────────
  if (selection.privileges?.length) {
    const all = await client.listPrivileges();
    const selected = selection.privileges as string[];
    for (const item of all.filter((p) => selected.includes(p.name))) {
      files[`privileges/${safeName(item.name)}.tf`] = privilegeToTf(item);
    }
  }

  // ── 8. File Uploads ──────────────────────────────────────────────────────
  if (selection.fileUploads?.length) {
    const all = await client.listFileUploads();
    const selected = selection.fileUploads as string[];
    for (const item of all.filter((f) => selected.includes(f.fileName))) {
      files[`file-uploads/${safeName(item.fileName)}.tf`] = fileUploadToTf(item);
    }
  }

  // ── 9. Connections ───────────────────────────────────────────────────────
  if (selection.connections?.length) {
    const all = await client.listConnections();
    const selected = selection.connections as string[];
    for (const item of all.filter((c) => selected.includes(c.name))) {
      files[`connections/${safeName(item.name)}.tf`] = connectionToTf(item);
    }
  }

  // ── 10. Jobs ─────────────────────────────────────────────────────────────
  if (selection.jobs?.length) {
    const all = await client.listJobs();
    const selected = selection.jobs as string[];
    for (const item of all.filter((j) => selected.includes(j.name))) {
      files[`jobs/${safeName(item.name)}.tf`] = jobToTf(item);
    }
  }

  // ── 11. Transport Packages ───────────────────────────────────────────────
  if (selection.transportPackages?.length) {
    const all = await client.listTransportPackages();
    const selected = selection.transportPackages as string[];
    for (const item of all.filter((t) => selected.includes(t.name))) {
      files[`transport-packages/${safeName(item.name)}.tf`] = transportPackageToTf(item);
    }
  }

  // ── 12. Roles ────────────────────────────────────────────────────────────
  if (selection.roles?.length) {
    const all = await client.listRoles();
    const selected = selection.roles as string[];
    for (const item of all.filter((r) => selected.includes(r.name))) {
      files[`roles/${safeName(item.name)}.tf`] = roleToTf(item);
    }
  }

  // ── 13. Tasks ────────────────────────────────────────────────────────────
  if (selection.tasks?.length) {
    const all = await client.listTasks();
    const selected = selection.tasks as string[];
    for (const item of all.filter((t) => selected.includes(t.name))) {
      files[`jobs/${safeName(item.name)}.tf`] = jobToTf(item);
    }
  }

  // ── 14. Rules ────────────────────────────────────────────────────────────
  if (selection.rules?.length) {
    const all = await client.listRules();
    const selected = selection.rules as string[];
    for (const item of all.filter((r) => selected.includes(r.name))) {
      files[`jobs/${safeName(item.name)}.tf`] = ruleToTf(item);
    }
  }

  // ── 15. Lookups ──────────────────────────────────────────────────────────
  if (selection.lookups?.length) {
    const all = await client.listLookups();
    const selected = selection.lookups as string[];
    for (const item of all.filter((l) => selected.includes(l.name))) {
      files[`lookups/${safeName(item.name)}.tf`] = lookupToTf(item);
    }
  }

  return NextResponse.json({ files });
}

// Sanitise names for use as filenames: lowercase, replace spaces/special chars with underscores
function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_");
}
