import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { 
  getWorkspaceRoot, 
  getWorkspaceSettings, 
  isGitAvailable, 
  getRemoteTrackedFiles, 
  pushWorkspaceToGit 
} from "../../../lib/workspaceConfig";

export const dynamic = "force-dynamic";

function walk(dir: string, base = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of list) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);

    if (entry.isDirectory()) {
      results = results.concat(walk(full, base));
    } else {
      results.push(rel);
    }
  }

  return results;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ env: string }> }
) {
  const { env } = await context.params;
  const settings = getWorkspaceSettings();

  let exists = false;
  let files: string[] = [];

  const isCloud = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
  const projectRoot = isCloud ? "" : (process.cwd().endsWith("frontend") ? path.dirname(process.cwd()) : process.cwd());
  const tempDir = isCloud
    ? "/tmp/terraform-workspaces-remote"
    : path.join(projectRoot, "terraform-workspaces-remote");

  if (settings.locationType === "remote" && isGitAvailable() && fs.existsSync(path.join(tempDir, ".git"))) {
    const trackedFiles = getRemoteTrackedFiles(tempDir, env);
    if (trackedFiles.length > 0) {
      exists = true;
      files = trackedFiles;
    }
  } else {
    const root = path.join(getWorkspaceRoot(), env);
    exists = fs.existsSync(root);
    if (exists) {
      files = walk(root);
      // In remote mode, the folder is considered missing/empty if it contains no files
      if (settings.locationType === "remote" && files.length === 0) {
        exists = false;
      }
    }
  }

  if (!exists) {
    return NextResponse.json(
      { error: `Environment folder not found` },
      { status: 404 }
    );
  }

  return NextResponse.json({ files });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ env: string }> }
) {
  const { env } = await context.params;
  const root = path.join(getWorkspaceRoot(), env);

  try {
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    // Write a .gitkeep file inside the folder so it is not empty and is tracked by Git
    const gitKeepPath = path.join(root, ".gitkeep");
    if (!fs.existsSync(gitKeepPath)) {
      fs.writeFileSync(gitKeepPath, "", "utf-8");
    }

    const settings = getWorkspaceSettings();
    if (settings.locationType === "remote") {
      try {
        await pushWorkspaceToGit(`Envizor GitOps: Initialize ${env} environment folder`);
      } catch (pushErr) {
        console.warn("GitOps immediate push warning:", pushErr);
      }
    }

    return NextResponse.json({ ok: true, message: `Directory created: ${root}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ env: string }> }
) {
  const { env } = await context.params;
  const root = path.join(getWorkspaceRoot(), env);

  try {
    if (fs.existsSync(root)) {
      fs.rmSync(root, { recursive: true, force: true });
    }

    const settings = getWorkspaceSettings();
    if (settings.locationType === "remote") {
      try {
        await pushWorkspaceToGit(`Envizor GitOps: Delete ${env} environment folder`);
      } catch (pushErr) {
        console.warn("GitOps immediate push warning:", pushErr);
      }
    }

    return NextResponse.json({ ok: true, message: `Directory deleted: ${root}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


