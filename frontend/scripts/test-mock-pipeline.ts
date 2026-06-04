#!/usr/bin/env npx ts-node --skip-project
/**
 * scripts/test-mock-pipeline.ts
 *
 * Runs the full mock pipeline WITHOUT connecting to Saviynt:
 *   1. Fetches all 11 resource types from MOCK_DB (DEV env by default)
 *   2. Generates HCL blocks via toTerraform.ts
 *   3. Writes .tf files to terraform-workspaces/DEV-MOCK/
 *   4. Prints a summary table of every file written
 *
 * Usage:
 *   npx ts-node --skip-project scripts/test-mock-pipeline.ts
 *   npx ts-node --skip-project scripts/test-mock-pipeline.ts PRE
 *   npx ts-node --skip-project scripts/test-mock-pipeline.ts PROD
 */

import path from "path";
import fs from "fs/promises";

// ── Inline types (avoids bundler issues in standalone script) ─────────────────
type EnvName = "DEV" | "PRE" | "PROD";

const ENV = (process.argv[2] || "DEV") as EnvName;
const OUT_DIR = path.join(process.cwd(), "terraform-workspaces", `${ENV}-MOCK`);

// ── Helpers ───────────────────────────────────────────────────────────────────
function safe(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9_-]/g, "_").replace(/_+/g, "_");
}

async function write(relPath: string, content: string) {
  const full = path.join(OUT_DIR, relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, "utf8");
  return relPath;
}

function box(label: string, lines: string[]) {
  const width = Math.max(label.length + 4, ...lines.map(l => l.length + 4));
  const bar = "─".repeat(width);
  console.log(`\n┌${bar}┐`);
  console.log(`│  ${label.padEnd(width - 2)}│`);
  console.log(`├${bar}┤`);
  for (const l of lines) console.log(`│  ${l.padEnd(width - 2)}│`);
  console.log(`└${bar}┘`);
}

// ── Mock data (mirrors MOCK_DB in client.ts) ──────────────────────────────────
const MOCK: Record<EnvName, Record<string, any[]>> = {
  DEV: {
    securitySystems:   [
      { id: "ss-dev-1", name: "HR_SYSTEM_DEV",      description: "HR Security System for Development" },
      { id: "ss-dev-2", name: "FINANCE_SYSTEM_DEV", description: "Finance Security System for Development" }
    ],
    endpoints:         [
      { id: "ep-dev-1", name: "HR_ENDPOINT_DEV",  securitySystemId: "ss-dev-1", description: "HR Endpoint Dev" },
      { id: "ep-dev-2", name: "FIN_ENDPOINT_DEV", securitySystemId: "ss-dev-2", description: "Finance Endpoint Dev" }
    ],
    dynamicAttributes: [
      { id: "da-dev-1", name: "department_code", value: "HR-DEV", description: "Department code dynamic attribute" }
    ],
    entitlementTypes:  [
      { id: "et-dev-1", name: "AD_Group", description: "Active Directory Group Entitlement" }
    ],
    enterpriseRoles:   [
      { id: "er-dev-1", name: "Enterprise_Dev_Engineer", description: "General Enterprise Role for dev engineers" }
    ],
    entitlements:      [
      { id: "ent-dev-1", name: "Dev_Entitlement_A", entitlement_value: "read-only",  description: "Read-only access entitlement" },
      { id: "ent-dev-2", name: "Dev_Entitlement_B", entitlement_value: "read-write", description: "Read-write access entitlement" }
    ],
    privileges:        [
      { id: "pr-dev-1", name: "admin_dashboard_access", description: "Access to developer portal" }
    ],
    fileUploads:       [
      { id: "up-dev-1", fileName: "sap_users_baseline.xlsx", fileSize: 1048576, status: "SUCCESS" }
    ],
    connections:       [
      { id: "conn-dev-1", name: "DEV_DB_CONN",   type: "Database",         description: "Development DB Connection" },
      { id: "conn-dev-2", name: "DEV_LDAP_CONN", type: "Active Directory", description: "Development LDAP Connection" }
    ],
    jobs:              [
      { id: "job-dev-1", name: "HR_Data_Import",       jobType: "application_data_import", status: "SUCCESS", description: "Daily HR data import job" },
      { id: "job-dev-2", name: "Finance_Accounts_Sync", jobType: "accounts_import_full",    status: "SUCCESS", description: "Full finance accounts sync" }
    ],
    transportPackages: [
      { id: "tp-dev-1", name: "Billing_Module_DEV", version: "1.0.0", actionType: "export", description: "Billing access configurations export" },
      { id: "tp-dev-2", name: "Billing_Module_PRE", version: "1.0.0", actionType: "import", packagePath: "./packages/Billing_Module_DEV.zip", description: "Billing import to PRE" }
    ]
  },
  PRE: {
    securitySystems:   [{ id: "ss-pre-1", name: "HR_SYSTEM_PRE",   description: "HR Security System for Pre-production" }],
    endpoints:         [{ id: "ep-pre-1", name: "HR_ENDPOINT_PRE", securitySystemId: "ss-pre-1", description: "HR Endpoint Pre" }],
    dynamicAttributes: [{ id: "da-pre-1", name: "department_code", value: "HR-PRE", description: "Dept code pre" }],
    entitlementTypes:  [{ id: "et-pre-1", name: "AD_Group", description: "AD Group Entitlement" }],
    enterpriseRoles:   [{ id: "er-pre-1", name: "Enterprise_Pre_Engineer", description: "Enterprise Role preprod" }],
    entitlements:      [{ id: "ent-pre-1", name: "Pre_Entitlement_A", entitlement_value: "read-only", description: "Read-only access" }],
    privileges:        [{ id: "pr-pre-1", name: "admin_dashboard_access", description: "Portal access" }],
    fileUploads:       [],
    connections:       [
      { id: "conn-pre-1", name: "PRE_DB_CONN",   type: "Database",         description: "Preprod DB Connection" },
      { id: "conn-pre-2", name: "PRE_LDAP_CONN", type: "Active Directory", description: "Preprod LDAP Connection" }
    ],
    jobs:              [{ id: "job-pre-1", name: "Pre_Daily_Sync", jobType: "user_import", status: "SUCCESS", description: "Preprod daily user sync" }],
    transportPackages: [{ id: "tp-pre-1", name: "Billing_Module_PRE", version: "1.0.0", actionType: "import", packagePath: "./packages/Billing_Module_DEV.zip", description: "Billing import" }]
  },
  PROD: {
    securitySystems:   [
      { id: "ss-prod-1", name: "HR_SYSTEM_PROD",      description: "HR Security System Production" },
      { id: "ss-prod-2", name: "FINANCE_SYSTEM_PROD", description: "Finance Security System Production" }
    ],
    endpoints:         [{ id: "ep-prod-1", name: "HR_ENDPOINT_PROD", securitySystemId: "ss-prod-1", description: "HR Endpoint Prod" }],
    dynamicAttributes: [{ id: "da-prod-1", name: "department_code", value: "HR-PROD", description: "Dept code prod" }],
    entitlementTypes:  [{ id: "et-prod-1", name: "AD_Group", description: "AD Group Entitlement" }],
    enterpriseRoles:   [{ id: "er-prod-1", name: "Enterprise_Prod_Engineer", description: "Enterprise Role production" }],
    entitlements:      [
      { id: "ent-prod-1", name: "Prod_Entitlement_A", entitlement_value: "read-only",  description: "Prod read-only" },
      { id: "ent-prod-2", name: "Prod_Entitlement_B", entitlement_value: "read-write", description: "Prod read-write" }
    ],
    privileges:        [{ id: "pr-prod-1", name: "admin_dashboard_access", description: "Portal access" }],
    fileUploads:       [],
    connections:       [
      { id: "conn-prod-1", name: "PROD_DB_CONN",   type: "Database",         description: "Production DB Connection" },
      { id: "conn-prod-2", name: "PROD_LDAP_CONN", type: "Active Directory", description: "Production LDAP Connection" }
    ],
    jobs:              [
      { id: "job-prod-1", name: "Prod_Daily_Reconcile", jobType: "application_data_import", status: "SUCCESS", description: "Prod daily reconcile" },
      { id: "job-prod-2", name: "Prod_Analytics_Job",   jobType: "schema_user",             status: "SUCCESS", description: "Prod analytics job" }
    ],
    transportPackages: [{ id: "tp-prod-1", name: "Billing_Module_PROD", version: "1.0.0", actionType: "import", packagePath: "./packages/Billing_Module_PRE.zip", description: "Billing prod deploy" }]
  }
};

// ── HCL generators (mirrors toTerraform.ts) ───────────────────────────────────
function gen_security_system(ss: any) {
  return `resource "saviynt_security_system" "${safe(ss.name)}" {\n  name        = "${ss.name}"\n  description = "${ss.description || ""}"\n}\n`;
}
function gen_endpoint(ep: any) {
  return `resource "saviynt_endpoint" "${safe(ep.name)}" {\n  name               = "${ep.name}"\n  security_system_id = "${ep.securitySystemId || ""}"\n  description        = "${ep.description || ""}"\n}\n`;
}
function gen_dynamic_attribute(da: any) {
  return `resource "saviynt_dynamic_attribute" "${safe(da.name)}" {\n  name        = "${da.name}"\n  value       = "${da.value || ""}"\n  description = "${da.description || ""}"\n}\n`;
}
function gen_entitlement_type(et: any) {
  return `resource "saviynt_entitlement_type" "${safe(et.name)}" {\n  name        = "${et.name}"\n  description = "${et.description || ""}"\n}\n`;
}
function gen_enterprise_role(er: any) {
  return `resource "saviynt_enterprise_role" "${safe(er.name)}" {\n  name        = "${er.name}"\n  description = "${er.description || ""}"\n}\n`;
}
function gen_entitlement(ent: any) {
  const label = safe(ent.name || ent.entitlement_value || ent.id);
  return `resource "saviynt_entitlement" "${label}" {\n  name              = "${ent.name || ""}"\n  entitlement_value = "${ent.entitlement_value || ""}"\n  description       = "${ent.description || ""}"\n}\n`;
}
function gen_privilege(pr: any) {
  return `resource "saviynt_privilege" "${safe(pr.name)}" {\n  name        = "${pr.name}"\n  description = "${pr.description || ""}"\n}\n`;
}
function gen_file_upload(up: any) {
  return `resource "saviynt_file_upload" "${safe(up.fileName)}" {\n  file_name = "${up.fileName}"\n  file_size = ${up.fileSize || 0}\n  status    = "${up.status || "PENDING"}"\n}\n`;
}
function gen_connection(conn: any) {
  return `resource "saviynt_connection" "${safe(conn.name)}" {\n  name        = "${conn.name}"\n  type        = "${conn.type || ""}"\n  description = "${conn.description || ""}"\n}\n`;
}
function gen_job(job: any) {
  const blockType = jobBlock(job.jobType);
  return `resource "${blockType}" "${safe(job.name)}" {\n  name        = "${job.name}"\n  status      = "${job.status || "PENDING"}"\n  description = "${job.description || ""}"\n}\n`;
}
function gen_transport_package(tp: any) {
  if (tp.actionType === "import") {
    return `resource "saviynt_import_transport_package_resource" "${safe(tp.name)}" {\n  name         = "${tp.name}"\n  package_path = "${tp.packagePath || ""}"\n  description  = "${tp.description || ""}"\n}\n`;
  }
  return `resource "saviynt_export_transport_package_resource" "${safe(tp.name)}" {\n  name        = "${tp.name}"\n  version     = "${tp.version || "1.0.0"}"\n  description = "${tp.description || ""}"\n}\n`;
}
function jobBlock(jobType?: string): string {
  const map: Record<string, string> = {
    application_data_import:       "saviynt_application_data_import_job_resource",
    user_import:                   "saviynt_user_import_job_resource",
    accounts_import_full:          "saviynt_accounts_import_full_job_resource",
    accounts_import_incremental:   "saviynt_accounts_import_incremental_job_resource",
    schema_user:                   "saviynt_schema_user_job_resource",
    schema_account:                "saviynt_schema_account_job_resource",
    schema_role:                   "saviynt_schema_role_job_resource",
    file_transfer:                 "saviynt_file_transfer_job_resource",
    ws_retry:                      "saviynt_ws_retry_job_resource",
    ecm:                           "saviynt_ecm_job_resource",
    ecm_sap_user:                  "saviynt_ecm_sap_user_job_resource",
    job_control:                   "saviynt_job_control_resource",
  };
  return map[jobType || ""] || "saviynt_application_data_import_job_resource";
}

// ── Main pipeline ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  🔧 Envizor Mock Pipeline Test — Environment: ${ENV}`);
  console.log(`  📁 Output: ${OUT_DIR}`);
  console.log(`${"═".repeat(60)}`);

  const db = MOCK[ENV];
  const written: string[] = [];

  const tasks: Array<{ folder: string; items: any[]; gen: (item: any) => string; nameKey?: string }> = [
    { folder: "security-systems",   items: db.securitySystems,   gen: gen_security_system },
    { folder: "endpoints",          items: db.endpoints,          gen: gen_endpoint },
    { folder: "dynamic-attributes", items: db.dynamicAttributes,  gen: gen_dynamic_attribute },
    { folder: "entitlement-types",  items: db.entitlementTypes,   gen: gen_entitlement_type },
    { folder: "enterprise-roles",   items: db.enterpriseRoles,    gen: gen_enterprise_role },
    { folder: "entitlements",       items: db.entitlements,       gen: gen_entitlement,     nameKey: "name" },
    { folder: "privileges",         items: db.privileges,         gen: gen_privilege },
    { folder: "file-uploads",       items: db.fileUploads,        gen: gen_file_upload,     nameKey: "fileName" },
    { folder: "connections",        items: db.connections,        gen: gen_connection },
    { folder: "jobs",               items: db.jobs,               gen: gen_job },
    { folder: "transport-packages", items: db.transportPackages,  gen: gen_transport_package },
  ];

  for (const task of tasks) {
    if (!task.items.length) {
      console.log(`  ⚪ ${task.folder.padEnd(22)} — (no items in mock)`);
      continue;
    }
    for (const item of task.items) {
      const rawName = task.nameKey ? item[task.nameKey] : item.name;
      const fileName = `${safe(rawName)}.tf`;
      const hcl = task.gen(item);
      const rel = await write(`${task.folder}/${fileName}`, hcl);
      written.push(rel);
      console.log(`  ✅ ${task.folder.padEnd(22)} → ${fileName}`);
    }
  }

  box(
    `Summary: ${written.length} .tf files written to terraform-workspaces/${ENV}-MOCK/`,
    written.map(f => `  📄 ${f}`)
  );

  // Print one sample file to console to verify HCL output
  if (written.length > 0) {
    const sample = written[Math.floor(written.length / 2)];
    const content = await fs.readFile(path.join(OUT_DIR, sample), "utf8");
    console.log(`\n── Sample HCL output: ${sample} ${"─".repeat(30)}`);
    console.log(content);
  }

  console.log(`\n✅ Done. Run: cat terraform-workspaces/${ENV}-MOCK/**/*.tf\n`);
}

main().catch(console.error);
