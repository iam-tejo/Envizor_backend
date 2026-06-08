import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

import { 
  getWorkspaceRoot, 
  getWorkspaceSettings, 
  isGitAvailable, 
  getRemoteTrackedFolders 
} from "../../lib/workspaceConfig";

export async function GET() {
  const root = getWorkspaceRoot();
  const settings = getWorkspaceSettings();

  try {
    let workspaces: string[] = [];

    const isCloud = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
    const projectRoot = isCloud ? "" : (process.cwd().endsWith("frontend") ? path.dirname(process.cwd()) : process.cwd());
    const tempDir = isCloud
      ? "/tmp/terraform-workspaces-remote"
      : path.join(projectRoot, "terraform-workspaces-remote");

    if (settings.locationType === "remote" && isGitAvailable() && fs.existsSync(path.join(tempDir, ".git"))) {
      const folders = getRemoteTrackedFolders(tempDir);
      // Retrieve only top-level workspace folder names (e.g., DEV, PRE, PROD)
      workspaces = Array.from(new Set(folders.map((f) => f.split("/")[0])));
    } else {
      workspaces = fs
        .readdirSync(root, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith("."))
        .map((dirent) => dirent.name);
    }

    return NextResponse.json({ workspaces });
  } catch (err) {
    console.error("Error reading workspaces:", err);
    return NextResponse.json(
      { error: "Failed to read workspaces", details: String(err) },
      { status: 500 }
    );
  }
}

