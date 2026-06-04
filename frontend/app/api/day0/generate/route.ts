import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getWorkspaceRoot } from "../../../lib/workspaceConfig";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const env = searchParams.get("env") || "DEV";

  const root = getWorkspaceRoot();
  const workspaceMap: Record<string, string> = {
    DEV: path.join(root, "DEV"),
    PRE: path.join(root, "PRE"),
    PROD: path.join(root, "PROD"),
  };

  const workspace = workspaceMap[env] || workspaceMap.DEV;

  if (!fs.existsSync(workspace)) {
    fs.mkdirSync(workspace, { recursive: true });
  }

  const securitySystemTF = `
resource "saviynt_security_system_resource" "terraform_security_system" {
  systemname       = "Terraform_Security_System"
  display_name     = "Terraform Security System"
  hostname         = "EntitlementsOnly"
  port             = "443"
  automated_provisioning = true
  use_open_connector     = true
  recon_application      = true
}
`.trimStart();

  const filePath = path.join(workspace, "security_systems.tf");
  fs.writeFileSync(filePath, securitySystemTF, { encoding: "utf8" });

  return NextResponse.json({
    workspacePath: workspace,
    files: ["security_systems.tf"],
  });
}
