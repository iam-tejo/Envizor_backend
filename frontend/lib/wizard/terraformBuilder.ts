"use client";

import { WizardObjectType } from "./wizardSchema";

export function buildTerraform(
  objectTypes: WizardObjectType[],
  values: Record<string, any>
): string {
  const blocks: string[] = [];

  const safeName = (fallback: string) =>
    (values["name"] as string) ||
    (values["endpointname"] as string) ||
    (values["systemname"] as string) ||
    (values["rolename"] as string) ||
    (values["entitlement_value"] as string) ||
    fallback;

  for (const obj of objectTypes) {
    const name = safeName(obj.toLowerCase());

    switch (obj as any) {
      //
      // 🔵 STANDARD — CONNECTIONS
      //
      case "Connection_AD":
      case "Connection_EntraID":
      case "Connection_REST":
        blocks.push(`
resource "saviynt_connection" "${name}" {
  name        = "${name}"
  description = "${values["description"] ?? ""}"
  type        = "${obj}"
  url         = "${values["url"] ?? ""}"
}
`.trim());
        break;

      //
      // 🔵 STANDARD — ENDPOINT
      //
      case "Endpoint":
        blocks.push(`
resource "saviynt_endpoint" "${name}" {
  name        = "${name}"
  description = "${values["description"] ?? ""}"
}
`.trim());
        break;

      //
      // 🔵 STANDARD — SECURITY SYSTEM
      //
      case "Security_System":
        blocks.push(`
resource "saviynt_security_system" "${name}" {
  name        = "${name}"
  description = "${values["description"] ?? ""}"
}
`.trim());
        break;

      //
      // 🔵 STANDARD — ENTERPRISE ROLE
      //
      case "Enterprise_Role":
        blocks.push(`
resource "saviynt_enterprise_role" "${name}" {
  name        = "${name}"
  description = "${values["description"] ?? ""}"
}
`.trim());
        break;

      //
      // 🔵 STANDARD — ENTITLEMENT
      //
      case "Entitlement":
        blocks.push(`
resource "saviynt_entitlement" "${name}" {
  value       = "${values["entitlement_value"] ?? name}"
  type        = "${values["entitlement_type"] ?? ""}"
  description = "${values["description"] ?? ""}"
}
`.trim());
        break;

      //
      // 🔵 STANDARD — ENTITLEMENT TYPE
      //
      case "Entitlement_Type":
        blocks.push(`
resource "saviynt_entitlement_type" "${name}" {
  name        = "${values["entitlement_type"] ?? name}"
  description = "${values["description"] ?? ""}"
}
`.trim());
        break;

      //
      // 🔵 EXPORT — TRANSPORT PACKAGE
      //
      case "Export_Transport_Package":
        blocks.push(`
resource "saviynt_transport_package" "${name}" {
  name        = "${name}"
  description = "${values["description"] ?? ""}"
  direction   = "export"
}
`.trim());
        break;

      //
      // 🔵 IMPORT — TRANSPORT PACKAGE
      //
      case "Import_Transport_Package":
        blocks.push(`
resource "saviynt_transport_package" "${name}" {
  name        = "${name}"
  description = "${values["description"] ?? ""}"
  direction   = "import"
}
`.trim());
        break;

      //
      // 🔵 JOBS — FULL IMPORT JOB
      //
      case "Accounts_Import_Full_Job":
        blocks.push(`
resource "saviynt_job" "${name}" {
  name = "${name}"
  type = "Accounts_Import_Full_Job"
}
`.trim());
        break;

      //
      // 🔵 JOBS — INCREMENTAL IMPORT JOB
      //
      case "Accounts_Import_Incremental_Job":
        blocks.push(`
resource "saviynt_job" "${name}" {
  name = "${name}"
  type = "Accounts_Import_Incremental_Job"
}
`.trim());
        break;

      //
      // 🔵 JOBS — WS RETRY JOB
      //
      case "WS_Retry_Job":
        blocks.push(`
resource "saviynt_job" "${name}" {
  name = "${name}"
  type = "WS_Retry_Job"
}
`.trim());
        break;

      //
      // 🔴 FALLBACK
      //
      default:
        blocks.push(`# TODO: Terraform for ${obj} not yet implemented`);
    }
  }

  return blocks.join("\n\n");
}
