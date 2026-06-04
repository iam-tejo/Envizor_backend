import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getWorkspaceSettings } from "@/app/lib/workspaceConfig";

export const runtime = "nodejs";

export async function POST() {
  try {
    const settings = getWorkspaceSettings();
    if (settings.locationType !== "remote" || !settings.remoteUrl) {
      return NextResponse.json(
        { success: true, message: "Local strategy is active. Skipping remote git push." }
      );
    }

    const tempDir = path.join(process.cwd(), "terraform-workspaces-remote");
    const gitPath = path.join(tempDir, ".git");

    if (!fs.existsSync(gitPath)) {
      console.log("Git repository is not initialized inside remote workspaces. Recovering via side-clone...");
      try {
        const sideTempDir = path.join(process.cwd(), "terraform-workspaces-remote-temp");
        if (fs.existsSync(sideTempDir)) {
          fs.rmSync(sideTempDir, { recursive: true, force: true });
        }
        fs.mkdirSync(sideTempDir, { recursive: true });

        // Securely construct target Git remote URL
        let gitUrl = settings.remoteUrl.trim();
        const cleanBaseUrl = gitUrl.replace("https://", "").replace(/\/$/, "");
        const segments = cleanBaseUrl.split("/");
        if (segments.length === 2 && settings.remoteRepoName) {
          gitUrl = `https://${segments[0]}/${segments[1]}/${settings.remoteRepoName}`;
        }
        if (settings.remoteToken.trim() && gitUrl.startsWith("https://")) {
          const cleanUrl = gitUrl.replace("https://", "");
          gitUrl = `https://${settings.remoteToken.trim()}@${cleanUrl}`;
        }

        // Clone to side directory
        execSync(`git clone "${gitUrl}" .`, {
          cwd: sideTempDir,
          env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
          timeout: 25000
        });

        // Ensure target directory exists
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Move .git folder to tempDir
        fs.renameSync(path.join(sideTempDir, ".git"), gitPath);
        
        // Clean up side temp dir
        fs.rmSync(sideTempDir, { recursive: true, force: true });
        console.log("Successfully recovered Git repository structure via side-clone!");
      } catch (cloneErr: any) {
        console.error("Failed to recover Git repository via side-clone:", cloneErr);
        return NextResponse.json(
          { error: `Git repository is not initialized and side-clone recovery failed: ${cloneErr.message || cloneErr}` },
          { status: 500 }
        );
      }
    }


    console.log("Configuring commit author fallback parameters...");
    try {
      execSync(`git config user.name "Envizor GitOps Engine"`, { cwd: tempDir });
      execSync(`git config user.email "gitops@envizor.io"`, { cwd: tempDir });
    } catch (configErr) {
      console.warn("Could not set git commit config, relying on machine defaults:", configErr);
    }

    console.log("Staging workspace modifications...");
    execSync(`git add -A`, { cwd: tempDir });

    // Check if there are active changes to commit
    const status = execSync(`git status --porcelain`, { cwd: tempDir, encoding: "utf-8" }).trim();
    if (!status) {
      return NextResponse.json({
        success: true,
        message: "No changes detected. Git repository is already fully aligned with GitHub."
      });
    }

    console.log("Committing workspace files...");
    execSync(`git commit -m "Envizor GitOps: Automatically synchronized workspace structure and baseline configs"`, {
      cwd: tempDir,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
    });

    console.log("Setting remote origin credentials and executing Git push...");
    
    // secure assembled git url
    let gitUrl = settings.remoteUrl.trim();
    // Auto-assemble profile/org URLs if repo name is provided separately
    const cleanBaseUrl = gitUrl.replace("https://", "").replace(/\/$/, "");
    const segments = cleanBaseUrl.split("/");
    if (segments.length === 2 && settings.remoteRepoName) {
      gitUrl = `https://${segments[0]}/${segments[1]}/${settings.remoteRepoName}`;
    }

    if (settings.remoteToken.trim() && gitUrl.startsWith("https://")) {
      const cleanUrl = gitUrl.replace("https://", "");
      gitUrl = `https://${settings.remoteToken.trim()}@${cleanUrl}`;
    }

    // Set origin URL to push with PAT token authentication
    execSync(`git remote set-url origin "${gitUrl}"`, { cwd: tempDir });

    const branch = "main"; // Or settings.remoteRepoBranch if available, defaulting to main/head
    execSync(`git push -u origin HEAD:"${branch}"`, {
      cwd: tempDir,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      timeout: 20000
    });

    console.log("GitOps Push Successful!");

    return NextResponse.json({
      success: true,
      message: "Workspace directories successfully staged, committed, and pushed to your remote GitHub repository!"
    });
  } catch (err: any) {
    console.error("GitOps Push Failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to commit and push configurations to GitHub." },
      { status: 500 }
    );
  }
}
