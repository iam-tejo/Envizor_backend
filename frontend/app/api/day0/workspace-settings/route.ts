import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureFolderStructure } from "@/app/lib/terraform/workspace";

// Path to the workspace_settings.json inside app/lib/saviynt/
const filePath = path.join(process.cwd(), "app/lib/saviynt/workspace_settings.json");

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({
        locationType: "local",
        localPath: "/Users/tejov/Documents/IGA-Saviynt",
        remoteUrl: "",
        remoteRepoName: "",
        remoteToken: ""
      });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const settings = JSON.parse(fileContent);

    return NextResponse.json(settings);
  } catch (err: any) {
    console.error("Error reading workspace settings:", err);
    return NextResponse.json({ error: err.message || "Failed to read workspace settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const settings = await req.json();
    const { locationType, localPath, remoteUrl, remoteRepoName, remoteToken } = settings;

    if (!locationType || (locationType !== "local" && locationType !== "remote")) {
      return NextResponse.json({ error: "Invalid locationType parameter." }, { status: 400 });
    }

    // Overwrite the config file
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), "utf-8");

    // Automatically clone the remote Git repository if remote strategy is configured
    if (locationType === "remote" && remoteUrl) {
      try {
        const { execSync } = require("child_process");
        const tempDir = path.join(process.cwd(), "terraform-workspaces-remote");
        const gitPath = path.join(tempDir, ".git");

        let originMatches = false;
        let gitUrl = remoteUrl.trim();
        const cleanBaseUrl = gitUrl.replace("https://", "").replace(/\/$/, "");
        const segments = cleanBaseUrl.split("/");
        if (segments.length === 2 && remoteRepoName) {
          gitUrl = `https://${segments[0]}/${segments[1]}/${remoteRepoName}`;
        }
        if (remoteToken.trim() && gitUrl.startsWith("https://")) {
          const cleanUrl = gitUrl.replace("https://", "");
          gitUrl = `https://${remoteToken.trim()}@${cleanUrl}`;
        }

        if (fs.existsSync(gitPath)) {
          try {
            const currentOrigin = execSync(`git config --get remote.origin.url`, {
              cwd: tempDir,
              encoding: "utf-8"
            }).trim();

            const cleanCurrent = currentOrigin.replace(/https:\/\/.*@/, "https://").replace(/\.git$/, "").replace(/\/$/, "");
            const cleanTarget = gitUrl.replace(/https:\/\/.*@/, "https://").replace(/\.git$/, "").replace(/\/$/, "");

            if (cleanCurrent === cleanTarget) {
              originMatches = true;
            }
          } catch (originErr) {
            console.warn("Could not retrieve current Git origin:", originErr);
          }
        }

        if (!originMatches) {
          console.log(`Cloning ${remoteUrl} into ${tempDir}...`);
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          } else {
            const files = fs.readdirSync(tempDir);
            for (const file of files) {
              fs.rmSync(path.join(tempDir, file), { recursive: true, force: true });
            }
          }

          execSync(`git clone "${gitUrl}" .`, {
            cwd: tempDir,
            env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
            timeout: 25000
          });
        }
      } catch (cloneErr: any) {
        console.error("Failed to automatically clone remote Git repository:", cloneErr);
        return NextResponse.json(
          { error: `Settings saved successfully, but failed to clone repository: ${cloneErr.message || cloneErr}` },
          { status: 500 }
        );
      }
    }

    // Automatically bootstrap folder directories (DEV, PRE, PROD) in the targeted location
    try {
      await Promise.all([
        ensureFolderStructure("DEV"),
        ensureFolderStructure("PRE"),
        ensureFolderStructure("PROD")
      ]);
    } catch (bootstrapErr) {
      console.warn("Folder bootstrap warning: could not initialize all paths immediately.", bootstrapErr);
    }

    return NextResponse.json({ success: true, settings });
  } catch (err: any) {
    console.error("Error saving workspace settings:", err);
    return NextResponse.json({ error: err.message || "Failed to save workspace settings" }, { status: 500 });
  }
}

