import { NextResponse } from "next/server";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { getWorkspaceSettings } from "@/app/lib/workspaceConfig";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const settings = getWorkspaceSettings();

    // Prefer active query params (real-time typed inputs) or fallback to saved settings
    const locationType = searchParams.get("locationType") || settings.locationType;
    const remoteUrl = (searchParams.get("remoteUrl") || settings.remoteUrl || "").trim();
    const remoteRepoName = (searchParams.get("remoteRepoName") || settings.remoteRepoName || "").trim();
    const remoteToken = (searchParams.get("remoteToken") || settings.remoteToken || "").trim();

    if (locationType !== "remote" || !remoteUrl) {
      return NextResponse.json(
        { error: "Remote storage strategy is not active or Git Repository URL is missing." },
        { status: 400 }
      );
    }

    const tempDir = path.join(process.cwd(), "terraform-workspaces-remote");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Securely construct target Git remote URL
    let gitUrl = remoteUrl;

    // Auto-assemble profile/org URLs if repo name is provided separately
    const cleanBaseUrl = remoteUrl.replace("https://", "").replace(/\/$/, "");
    const segments = cleanBaseUrl.split("/");
    if (segments.length === 2 && remoteRepoName) {
      gitUrl = `https://${segments[0]}/${segments[1]}/${remoteRepoName}`;
    }

    if (remoteToken && gitUrl.startsWith("https://")) {
      const cleanUrl = gitUrl.replace("https://", "");
      gitUrl = `https://${remoteToken}@${cleanUrl}`;
    }

    let originMatches = false;
    const gitPath = path.join(tempDir, ".git");

    if (fs.existsSync(gitPath)) {
      try {
        // Read current origin URL
        const currentOrigin = execSync(`git config --get remote.origin.url`, { 
          cwd: tempDir, 
          encoding: "utf-8" 
        }).trim();

        // Standardize URLs by stripping tokens to check if it's the same repo
        const cleanCurrent = currentOrigin.replace(/https:\/\/.*@/, "https://").replace(/\.git$/, "").replace(/\/$/, "");
        const cleanTarget = gitUrl.replace(/https:\/\/.*@/, "https://").replace(/\.git$/, "").replace(/\/$/, "");

        if (cleanCurrent === cleanTarget) {
          originMatches = true;
        }
      } catch (originErr) {
        console.warn("Could not retrieve current Git origin, forcing clean clone:", originErr);
      }
    }

    if (!originMatches) {
      console.log(`Repository mismatch or uninitialized. Performing fresh clone of ${remoteUrl} into ${tempDir}...`);
      
      // Delete existing files to avoid non-empty directory errors
      const files = fs.readdirSync(tempDir);
      for (const file of files) {
        fs.rmSync(path.join(tempDir, file), { recursive: true, force: true });
      }

      execSync(`git clone "${gitUrl}" .`, { 
        cwd: tempDir, 
        stdio: "pipe",
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
        timeout: 25000 
      });
    } else {
      console.log("Git origin matches. Pulling latest commits...");
      try {
        execSync(`git pull`, { 
          cwd: tempDir, 
          stdio: "pipe",
          env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
          timeout: 15000 
        });
      } catch (pullErr) {
        console.warn("Git pull warning (falling back to cached repository state):", pullErr);
      }
    }

    // Scan top-level folders
    const items = fs.readdirSync(tempDir, { withFileTypes: true });
    const folders = items
      .filter((item) => item.isDirectory() && !item.name.startsWith("."))
      .map((item) => item.name);

    return NextResponse.json({
      success: true,
      repoName: remoteRepoName || "remote-repository",
      folders
    });
  } catch (err: any) {
    console.error("Failed to connect to remote repository:", err);
    return NextResponse.json(
      { 
        error: err.message || "Failed to clone or pull Git repository. Please check your URL credentials and token permissions." 
      },
      { status: 500 }
    );
  }
}
