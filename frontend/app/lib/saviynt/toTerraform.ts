// app/lib/saviynt/toTerraform.ts

import {
  SaviyntSecuritySystem,
  SaviyntEndpoint,
  SaviyntDynamicAttribute,
  SaviyntEntitlementType,
  SaviyntEnterpriseRole,
  SaviyntRole,
  SaviyntEntitlement,
  SaviyntPrivilege,
  SaviyntFileUpload,
  SaviyntConnection,
  SaviyntJob,
  SaviyntRule,
  SaviyntTransportPackage,
  SaviyntLookup
} from "./client";

// Helper to escape HCL values properly
function escapeTf(val?: string): string {
  if (!val) return "";
  return val.replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

// 1. Security Systems (saviynt_security_system)
export function securitySystemToTf(ss: SaviyntSecuritySystem): string {
  return `resource "saviynt_security_system" "${ss.name}" {
  system_id   = "${ss.id}"
  name        = "${ss.name}"
  description = "${escapeTf(ss.description)}"
}
`;
}

// 2. Endpoints (saviynt_endpoint)
export function endpointToTf(ep: SaviyntEndpoint): string {
  return `resource "saviynt_endpoint" "${ep.name}" {
  endpoint_id        = "${ep.id}"
  name               = "${ep.name}"
  security_system_id = "${ep.securitySystemId}"
  description        = "${escapeTf(ep.description)}"
}
`;
}

// 3. Dynamic Attributes (saviynt_dynamic_attribute)
export function dynamicAttributeToTf(da: SaviyntDynamicAttribute): string {
  return `resource "saviynt_dynamic_attribute" "${da.name}" {
  attribute_id = "${da.id}"
  name         = "${da.name}"
  value        = "${escapeTf(da.value)}"
  description  = "${escapeTf(da.description)}"
}
`;
}

// 4. Entitlement Types (saviynt_entitlement_type)
export function entitlementTypeToTf(et: SaviyntEntitlementType): string {
  return `resource "saviynt_entitlement_type" "${et.name}" {
  type_id     = "${et.id}"
  name        = "${et.name}"
  description = "${escapeTf(et.description)}"
}
`;
}

// 5. Enterprise Roles (saviynt_enterprise_role)
export function enterpriseRoleToTf(er: SaviyntEnterpriseRole): string {
  return `resource "saviynt_enterprise_role" "${er.name}" {
  role_id     = "${er.id}"
  name        = "${er.name}"
  description = "${escapeTf(er.description)}"
}
`;
}

// 6. Roles (saviynt_role)
export function roleToTf(role: SaviyntRole): string {
  return `resource "saviynt_role" "${role.name}" {
  role_id     = "${role.id}"
  name        = "${role.name}"
  description = "${escapeTf(role.description)}"
}
`;
}

// 7. Entitlements (saviynt_entitlement)
export function entitlementToTf(ent: SaviyntEntitlement): string {
  const name = ent.name || ent.entitlement_value || `entitlement_${ent.id}`;
  return `resource "saviynt_entitlement" "${name}" {
  entitlement_id    = "${ent.id}"
  name              = "${name}"
  entitlement_value = "${escapeTf(ent.entitlement_value)}"
  description       = "${escapeTf(ent.description)}"
}
`;
}

// 8. Privileges (saviynt_privilege)
export function privilegeToTf(pr: SaviyntPrivilege): string {
  return `resource "saviynt_privilege" "${pr.name}" {
  privilege_id = "${pr.id}"
  name         = "${pr.name}"
  description  = "${escapeTf(pr.description)}"
}
`;
}

// 9. File Uploads (saviynt_file_upload)
export function fileUploadToTf(up: SaviyntFileUpload): string {
  return `resource "saviynt_file_upload" "${up.fileName.replace(/\./g, "_")}" {
  file_id   = "${up.id}"
  file_name = "${up.fileName}"
  file_size = ${up.fileSize ?? 0}
  status    = "${escapeTf(up.status)}"
}
`;
}

// 10. Connections (saviynt_connection)
export function connectionToTf(conn: SaviyntConnection): string {
  return `resource "saviynt_connection" "${conn.name}" {
  connection_id = "${conn.id}"
  name          = "${conn.name}"
  type          = "${conn.type}"
  description   = "${escapeTf(conn.description)}"
}
`;
}

// 11. Jobs & Generic Job Types per Application (saviynt_*_job_resource)
export function jobToTf(job: SaviyntJob): string {
  // Normalize jobType or default to application_data_import or job_control
  const rawType = job.jobType || "application_data_import";
  
  // Format the resource block according to EIC job resource types:
  // e.g. "saviynt_application_data_import_job_resource"
  let blockName = rawType;
  if (!blockName.startsWith("saviynt_")) {
    if (blockName.endsWith("_job_resource")) {
      blockName = `saviynt_${blockName}`;
    } else if (blockName.endsWith("_job")) {
      blockName = `saviynt_${blockName}_resource`;
    } else if (blockName.endsWith("_resource")) {
      blockName = `saviynt_${blockName}`;
    } else {
      blockName = `saviynt_${blockName}_job_resource`;
    }
  }

  return `resource "${blockName}" "${job.name}" {
  job_id      = "${job.id}"
  name        = "${job.name}"
  status      = "${escapeTf(job.status)}"
  description = "${escapeTf(job.description)}"
}
`;
}

// 12. Rules (saviynt_rule)
export function ruleToTf(rule: SaviyntRule): string {
  return `resource "saviynt_rule" "${rule.name}" {
  rule_id     = "${rule.id}"
  name        = "${rule.name}"
  description = "${escapeTf(rule.description)}"
}
`;
}

// 13. Export & Import Transport Packages (saviynt_export/import_transport_package_resource)
export function transportPackageToTf(tp: SaviyntTransportPackage): string {
  const isImport = tp.actionType === "import";
  if (isImport) {
    return `resource "saviynt_import_transport_package_resource" "${tp.name}" {
  package_id   = "${tp.id}"
  name         = "${tp.name}"
  package_path = "${escapeTf(tp.packagePath || `./packages/${tp.name}.zip`)}"
  description  = "${escapeTf(tp.description)}"
}
`;
  } else {
    return `resource "saviynt_export_transport_package_resource" "${tp.name}" {
  package_id  = "${tp.id}"
  name        = "${tp.name}"
  version     = "${escapeTf(tp.version || "1.0.0")}"
  description = "${escapeTf(tp.description)}"
}
`;
  }
}

// 14. Lookups (saviynt_lookup)
export function lookupToTf(lk: SaviyntLookup): string {
  return `resource "saviynt_lookup" "${lk.name}" {
  lookup_id   = "${lk.id}"
  name        = "${lk.name}"
  value       = "${escapeTf(lk.value)}"
  description = "${escapeTf(lk.description)}"
}
`;
}
