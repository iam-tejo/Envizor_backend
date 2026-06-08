import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getWorkspaceRoot } from "../../../../lib/workspaceConfig";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ workspace: string }> }
) {
  const { workspace } = await context.params;
  const statePath = path.join(getWorkspaceRoot(), workspace, "terraform.tfstate");

  try {
    const data = await fs.readFile(statePath, "utf8");
    const state = JSON.parse(data);

    const resources = state.resources ?? [];
    const artifacts: any[] = [];

    resources.forEach((res: any) => {
      const type = res.type;
      const name = res.name;
      const provider = res.provider;
      const instances = res.instances ?? [];

      instances.forEach((inst: any, idx: number) => {
        const attrs = inst.attributes ?? {};
        artifacts.push({
          id: attrs.id || `${type}.${name}[${idx}]`,
          type,
          name,
          tenantName: attrs.name || attrs.username || attrs.displayname || name,
          status: attrs.status || attrs.state || "ACTIVE",
          provider,
          attributes: attrs
        });
      });
    });

    return NextResponse.json({ exists: true, artifacts });
  } catch (err: any) {
    const envUpper = (workspace ?? "DEV").toUpperCase();
    let artifacts: any[] = [];

    if (envUpper === "PRE") {
      artifacts = [
        {
          id: "ROLE_PRE_991823",
          type: "saviynt_role",
          name: "enterprise_pre_ops_lead",
          tenantName: "PRE-PROD Enterprise Operations Lead",
          status: "ACTIVE",
          provider: "saviynt/saviynt",
          attributes: {
            id: "ROLE_PRE_991823",
            name: "PRE-PROD Enterprise Operations Lead",
            description: "Access control for pre-prod operations leads.",
            status: "ACTIVE",
            role_type: "SYSTEM_ACCESS",
            owner: "admin"
          }
        },
        {
          id: "TASK_PRE_388122",
          type: "saviynt_task",
          name: "pre_compliance_audit",
          tenantName: "PRE-PROD Compliance Audit Job",
          status: "SUCCESS",
          provider: "saviynt/saviynt",
          attributes: {
            id: "TASK_PRE_388122",
            name: "PRE-PROD Compliance Audit Job",
            task_type: "RECONCILIATION",
            frequency: "DAILY",
            last_run: "2026-05-30T12:00:00Z"
          }
        },
        {
          id: "LOOKUP_PRE_011922",
          type: "saviynt_lookup",
          name: "pre_country_code_mappings",
          tenantName: "PRE-PROD Country Code Mappings Directory",
          status: "ACTIVE",
          provider: "saviynt/saviynt",
          attributes: {
            id: "LOOKUP_PRE_011922",
            name: "PRE-PROD Country Code Mappings Directory",
            values: ["US", "CA", "IN", "DE", "GB", "FR", "JP"]
          }
        }
      ];
    } else if (envUpper === "PROD") {
      artifacts = [
        {
          id: "ROLE_PROD_991823",
          type: "saviynt_role",
          name: "enterprise_prod_ops_lead",
          tenantName: "PROD Enterprise Operations Lead",
          status: "ACTIVE",
          provider: "saviynt/saviynt",
          attributes: {
            id: "ROLE_PROD_991823",
            name: "PROD Enterprise Operations Lead",
            description: "Production Access control for operations leads.",
            status: "ACTIVE",
            role_type: "SYSTEM_ACCESS",
            owner: "admin"
          }
        },
        {
          id: "TASK_PROD_388122",
          type: "saviynt_task",
          name: "prod_compliance_audit",
          tenantName: "PROD Compliance Audit Job",
          status: "SUCCESS",
          provider: "saviynt/saviynt",
          attributes: {
            id: "TASK_PROD_388122",
            name: "PROD Compliance Audit Job",
            task_type: "RECONCILIATION",
            frequency: "DAILY",
            last_run: "2026-05-30T12:00:00Z"
          }
        },
        {
          id: "LOOKUP_PROD_011922",
          type: "saviynt_lookup",
          name: "prod_country_code_mappings",
          tenantName: "PROD Country Code Mappings Directory",
          status: "ACTIVE",
          provider: "saviynt/saviynt",
          attributes: {
            id: "LOOKUP_PROD_011922",
            name: "PROD Country Code Mappings Directory",
            values: ["US", "CA", "IN", "DE", "GB", "FR", "JP", "AU", "BR"]
          }
        }
      ];
    } else {
      // DEV default
      artifacts = [
        {
          id: "ROLE_991823",
          type: "saviynt_role",
          name: "enterprise_ops_lead",
          tenantName: "Enterprise Operations Lead",
          status: "ACTIVE",
          provider: "saviynt/saviynt",
          attributes: {
            id: "ROLE_991823",
            name: "Enterprise Operations Lead",
            description: "Access control for operations leads across all zones.",
            status: "ACTIVE",
            role_type: "SYSTEM_ACCESS",
            owner: "admin"
          }
        },
        {
          id: "TASK_388122",
          type: "saviynt_task",
          name: "daily_compliance_audit",
          tenantName: "Daily Compliance Audit Job",
          status: "SUCCESS",
          provider: "saviynt/saviynt",
          attributes: {
            id: "TASK_388122",
            name: "Daily Compliance Audit Job",
            task_type: "RECONCILIATION",
            frequency: "DAILY",
            last_run: "2026-05-30T12:00:00Z"
          }
        },
        {
          id: "LOOKUP_011922",
          type: "saviynt_lookup",
          name: "country_code_mappings",
          tenantName: "Country Code Mappings Directory",
          status: "ACTIVE",
          provider: "saviynt/saviynt",
          attributes: {
            id: "LOOKUP_011922",
            name: "Country Code Mappings Directory",
            values: ["US", "CA", "IN", "DE", "GB"]
          }
        }
      ];
    }

    // If state file doesn't exist, return projection mock states for rich presentation
    return NextResponse.json({ 
      exists: false, 
      artifacts,
      message: "No active terraform.tfstate found on disk. Showing workspace state projections." 
    });
  }
}
