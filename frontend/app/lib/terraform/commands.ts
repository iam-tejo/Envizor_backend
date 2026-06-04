// app/lib/terraform/commands.ts
import fs from "fs";
import path from "path";
import { MOCK_DB, type EnvName } from "../saviynt/client";
import { getWorkspaceRoot } from "../workspaceConfig";

export type TerraformCommand =
  | "init"
  | "plan"
  | "apply"
  | "destroy"
  | "refresh"
  | "fmt"
  | "state";

export interface TerraformCommandResult {
  success: boolean;
  output: string;
}

function getAllTfFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTfFiles(fullPath));
    } else if (file.endsWith(".tf")) {
      results.push(fullPath);
    }
  }
  return results;
}

export function applyWorkspaceHclToMockDb(env: EnvName): number {
  const dir = path.join(getWorkspaceRoot(), env);
  const tfFiles = getAllTfFiles(dir);
  let parsedCount = 0;

  for (const file of tfFiles) {
    const content = fs.readFileSync(file, "utf-8");
    
    // Parse resource blocks using regex
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = resourceRegex.exec(content)) !== null) {
      const type = match[1];
      const tfName = match[2];
      const blockContent = match[3];

      // Parse fields
      const attrRegex = /^\s*([a-zA-Z0-9_]+)\s*=\s*(.*)$/gm;
      const attrs: Record<string, string> = {};
      let attrMatch;
      while ((attrMatch = attrRegex.exec(blockContent)) !== null) {
        const key = attrMatch[1];
        let val = attrMatch[2].trim();
        // Remove surrounding quotes and handle HCL escaping
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1)
            .replace(/\\"/g, '"')
            .replace(/\\n/g, "\n");
        }
        attrs[key] = val;
      }

      parsedCount++;

      // Check which category and update MOCK_DB
      if (type === "saviynt_security_system") {
        const id = attrs.system_id || `ss-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const description = attrs.description || "";
        const list = MOCK_DB[env].securitySystems;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, description };
        } else {
          list.push({ id, name, description });
        }
      } else if (type === "saviynt_endpoint") {
        const id = attrs.endpoint_id || `ep-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const securitySystemId = attrs.security_system_id || "ss-dev-1";
        const description = attrs.description || "";
        const list = MOCK_DB[env].endpoints;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, securitySystemId, description };
        } else {
          list.push({ id, name, securitySystemId, description });
        }
      } else if (type === "saviynt_dynamic_attribute") {
        const id = attrs.attribute_id || `da-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const value = attrs.value || "";
        const description = attrs.description || "";
        const list = MOCK_DB[env].dynamicAttributes;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, value, description };
        } else {
          list.push({ id, name, value, description });
        }
      } else if (type === "saviynt_entitlement_type") {
        const id = attrs.type_id || `et-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const description = attrs.description || "";
        const list = MOCK_DB[env].entitlementTypes;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, description };
        } else {
          list.push({ id, name, description });
        }
      } else if (type === "saviynt_enterprise_role") {
        const id = attrs.role_id || `er-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const description = attrs.description || "";
        const list = MOCK_DB[env].enterpriseRoles;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, description };
        } else {
          list.push({ id, name, description });
        }
      } else if (type === "saviynt_role") {
        const id = attrs.role_id || `role-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const description = attrs.description || "";
        const list = MOCK_DB[env].roles;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, description };
        } else {
          list.push({ id, name, description });
        }
      } else if (type === "saviynt_entitlement") {
        const id = attrs.entitlement_id || `ent-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const entitlement_value = attrs.entitlement_value || "";
        const description = attrs.description || "";
        const list = MOCK_DB[env].entitlements;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, entitlement_value, description };
        } else {
          list.push({ id, name, entitlement_value, description });
        }
      } else if (type === "saviynt_privilege") {
        const id = attrs.privilege_id || `pr-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const description = attrs.description || "";
        const list = MOCK_DB[env].privileges;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, description };
        } else {
          list.push({ id, name, description });
        }
      } else if (type === "saviynt_file_upload") {
        const id = attrs.file_id || `up-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const fileName = attrs.file_name || tfName;
        const fileSize = attrs.file_size ? parseInt(attrs.file_size, 10) : 0;
        const status = attrs.status || "SUCCESS";
        const list = MOCK_DB[env].fileUploads;
        const existingIdx = list.findIndex(x => x.id === id || x.fileName === fileName);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, fileName, fileSize, status };
        } else {
          list.push({ id, fileName, fileSize, status });
        }
      } else if (type === "saviynt_connection") {
        const id = attrs.connection_id || `conn-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const connType = attrs.type || "Database";
        const description = attrs.description || "";
        const list = MOCK_DB[env].connections;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, type: connType, description };
        } else {
          list.push({ id, name, type: connType, description });
        }
      } else if (type === "saviynt_rule") {
        const id = attrs.rule_id || `rule-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const description = attrs.description || "";
        const list = MOCK_DB[env].rules;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, description };
        } else {
          list.push({ id, name, description });
        }
      } else if (type === "saviynt_lookup") {
        const id = attrs.lookup_id || `lk-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const value = attrs.value || "";
        const description = attrs.description || "";
        const list = MOCK_DB[env].lookups;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, value, description };
        } else {
          list.push({ id, name, value, description });
        }
      } else if (type.endsWith("_job_resource")) {
        const id = attrs.job_id || `job-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const status = attrs.status || "SUCCESS";
        const description = attrs.description || "";
        const jobType = type.replace(/^saviynt_/, "").replace(/_resource$/, "");
        
        const taskList = MOCK_DB[env].tasks;
        const existingTaskIdx = taskList.findIndex(x => x.id === id || x.name === name);
        if (existingTaskIdx !== -1) {
          taskList[existingTaskIdx] = { id, name, status, description, jobType };
        } else {
          taskList.push({ id, name, status, description, jobType });
        }

        const jobList = MOCK_DB[env].jobs;
        const existingJobIdx = jobList.findIndex(x => x.id === id || x.name === name);
        if (existingJobIdx !== -1) {
          jobList[existingJobIdx] = { id, name, status, description, jobType };
        } else {
          jobList.push({ id, name, status, description, jobType });
        }
      } else if (type.endsWith("_transport_package_resource")) {
        const id = attrs.package_id || `tp-${env.toLowerCase()}-${tfName.toLowerCase()}`;
        const name = attrs.name || tfName;
        const version = attrs.version || "1.0.0";
        const description = attrs.description || "";
        const actionType = type.includes("import") ? "import" : "export";
        const packagePath = attrs.package_path || `./packages/${name}.zip`;
        const list = MOCK_DB[env].transportPackages;
        const existingIdx = list.findIndex(x => x.id === id || x.name === name);
        if (existingIdx !== -1) {
          list[existingIdx] = { id, name, version, description, actionType, packagePath };
        } else {
          list.push({ id, name, version, description, actionType, packagePath });
        }
      }
    }
  }

  return parsedCount;
}

export async function runTerraformCommandMock(
  env: EnvName,
  command: TerraformCommand,
  args: string[] = []
): Promise<TerraformCommandResult> {
  const envLower = env.toLowerCase();

  const parsedCount = (command === "apply") ? applyWorkspaceHclToMockDb(env) : 0;
  let destroyedCount = 0;
  if (command === "destroy") {
    const db = MOCK_DB[env];
    destroyedCount = 
      (db.securitySystems?.length ?? 0) +
      (db.endpoints?.length ?? 0) +
      (db.dynamicAttributes?.length ?? 0) +
      (db.entitlementTypes?.length ?? 0) +
      (db.enterpriseRoles?.length ?? 0) +
      (db.roles?.length ?? 0) +
      (db.entitlements?.length ?? 0) +
      (db.privileges?.length ?? 0) +
      (db.fileUploads?.length ?? 0) +
      (db.connections?.length ?? 0) +
      (db.tasks?.length ?? 0) +
      (db.rules?.length ?? 0) +
      (db.transportPackages?.length ?? 0) +
      (db.lookups?.length ?? 0);

    MOCK_DB[env] = {
      securitySystems: [],
      endpoints: [],
      dynamicAttributes: [],
      entitlementTypes: [],
      enterpriseRoles: [],
      roles: [],
      entitlements: [],
      privileges: [],
      fileUploads: [],
      connections: [],
      tasks: [],
      jobs: [],
      rules: [],
      transportPackages: [],
      lookups: []
    };
  }

  const outputs: Record<TerraformCommand, string> = {
    init: [
      `Initializing the backend...`,
      ``,
      `Initializing provider plugins...`,
      `- Finding saviynt/saviynt versions matching "~> 1.2"...`,
      `- Installing saviynt/saviynt v1.2.4...`,
      `- Installed saviynt/saviynt v1.2.4 (signed by HashiCorp)`,
      ``,
      `Terraform has been successfully initialized!`,
      ``,
      `You may now begin working with Terraform. Try running "terraform plan" to see`,
      `any changes that are required for your infrastructure. All Terraform commands`,
      `should now work.`,
      ``,
      `✔  Backend: local  (workspace: ${envLower})`,
      `✔  Provider cache: .terraform/providers`,
    ].join("\n"),

    fmt: [
      `Running terraform fmt on workspace: ${env}`,
      ``,
      `Reformatting HCL files to canonical style...`,
      ``,
      `  saviynt_roles.tf            → reformatted`,
      `  saviynt_entitlements.tf     → reformatted`,
      `  saviynt_security_systems.tf → no changes`,
      `  saviynt_endpoints.tf        → reformatted`,
      `  saviynt_connections.tf      → no changes`,
      `  variables.tf                → reformatted`,
      `  outputs.tf                  → no changes`,
      ``,
      `✔  5 files reformatted, 2 files unchanged.`,
      `All HCL files are now in canonical Terraform format.`,
    ].join("\n"),

    plan: [
      `Refreshing Terraform state in memory prior to plan...`,
      `The refreshed state will be used to calculate this plan, but will not be`,
      `persisted to local or remote state storage.`,
      ``,
      `─────────────────────────────────────────────────────────────────────────────`,
      ``,
      `Terraform used the selected providers to generate the following execution`,
      `plan. Resource actions are indicated with the following symbols:`,
      `  + create`,
      `  ~ update in-place`,
      `  - destroy`,
      ``,
      `Terraform will perform the following actions:`,
      ``,
      `  # saviynt_role.admin_role will be created`,
      `  + resource "saviynt_role" "admin_role" {`,
      `      + id          = (known after apply)`,
      `      + name        = "ADMIN_ROLE_${env}"`,
      `      + description = "Administrator role for ${env} tenant"`,
      `      + env         = "${envLower}"`,
      `    }`,
      ``,
      `  # saviynt_endpoint.hr_api will be updated`,
      `  ~ resource "saviynt_endpoint" "hr_api" {`,
      `      ~ description = "HR API endpoint" -> "HR API endpoint (${env})"`,
      `        id          = "endpoint-hr-001"`,
      `    }`,
      ``,
      `Plan: 1 to add, 1 to change, 0 to destroy.`,
      ``,
      `─────────────────────────────────────────────────────────────────────────────`,
      `Note: You didn't use the -out option to save this plan, so Terraform can't`,
      `guarantee to take exactly these actions if you run "terraform apply" now.`,
    ].join("\n"),

    apply: [
      `Acquiring state lock. This may take a few moments...`,
      ``,
      `saviynt_provider.connection: Ephemeral session handshake successful.`,
      `Analyzing HCL workspace configurations for environment ${env}...`,
      ``,
      `saviynt_role.admin_role: Creating...`,
      `saviynt_role.admin_role: Creation complete after 2s [id=role-${envLower}-001]`,
      ``,
      `saviynt_endpoint.hr_api: Modifying...`,
      `saviynt_endpoint.hr_api: Modifications complete after 1s [id=endpoint-hr-001]`,
      ``,
      `⚡ Pushed ${parsedCount} HCL baseline resources successfully to live Saviynt ${env} tenant environment:`,
      `  - Memory state mappings updated correctly in MOCK_DB caches.`,
      `  - Compliance structures baselined in active staged environment.`,
      ``,
      `Apply complete! Resources: ${parsedCount} added/updated, 0 destroyed.`,
      ``,
      `Outputs:`,
      ``,
      `role_id = "role-${envLower}-001"`,
      `endpoint_id = "endpoint-hr-001"`,
      `environment = "${env}"`,
      `pushed_resources_count = ${parsedCount}`,
    ].join("\n"),

    destroy: [
      `⚠  WARNING: This will destroy all managed Terraform resources in ${env}.`,
      ``,
      `Acquiring state lock. This may take a few moments...`,
      `saviynt_provider.connection: Ephemeral session connection open.`,
      ``,
      `saviynt_provider: Wiping out ${destroyedCount} managed resources in ${env} tenant environment...`,
      `  - Cleaned up active roles, connections, endpoints, security systems, rules, lookups, etc.`,
      `  - Ephemeral assets strictly scrubbed from state databases.`,
      ``,
      `Destroy complete! Resources: 0 added, 0 changed, ${destroyedCount} destroyed.`,
    ].join("\n"),

    refresh: [
      `Refreshing Terraform state from remote Saviynt ${env} tenant...`,
      ``,
      `saviynt_role.admin_role: Refreshing state... [id=role-${envLower}-001]`,
      `saviynt_security_system.hr_sys: Refreshing state... [id=sys-hr-${envLower}]`,
      `saviynt_endpoint.hr_api: Refreshing state... [id=endpoint-hr-001]`,
      `saviynt_connection.db_conn: Refreshing state... [id=conn-db-${envLower}]`,
      ``,
      `✔  State refreshed. 4 resources in sync with remote.`,
      `No drift detected between local state and ${env} tenant.`,
    ].join("\n"),

    state: [
      `Listing resources in the Terraform state for workspace: ${env}`,
      ``,
      `  saviynt_role.admin_role`,
      `  saviynt_role.readonly_role`,
      `  saviynt_role.devops_role`,
      `  saviynt_security_system.hr_sys`,
      `  saviynt_security_system.payroll_sys`,
      `  saviynt_endpoint.hr_api`,
      `  saviynt_endpoint.payroll_api`,
      `  saviynt_connection.db_conn`,
      `  saviynt_connection.ldap_conn`,
      ``,
      `Total: 9 resources tracked in state`,
      ``,
      `─────────────────────────────────────────────────────────────────────────────`,
      `State file: ./terraform.tfstate`,
      `Backend:    local`,
      `Workspace:  ${envLower}`,
      `Serial:     12`,
      `Lineage:    "e3a7c1f2-44b0-4c1e-b9d2-a91e8f203a7c"`,
    ].join("\n"),
  };

  const output = outputs[command] ??
    `terraform ${command} ${args.join(" ")}\n\nCommand executed on ${env} workspace.`.trim();

  const success = command !== "destroy";

  return { success, output };
}

