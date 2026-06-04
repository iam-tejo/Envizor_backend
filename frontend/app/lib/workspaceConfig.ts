import path from "path";
import fs from "fs";

const settingsPath = path.join(process.cwd(), "app/lib/saviynt/workspace_settings.json");

export interface WorkspaceSettings {
  locationType: "local" | "remote";
  localPath: string;
  remoteUrl: string;
  remoteRepoName: string;
  remoteToken: string;
}

export function getWorkspaceSettings(): WorkspaceSettings {
  const defaultSettings: WorkspaceSettings = {
    locationType: "local",
    localPath: "/Users/tejov/Documents/IGA-Saviynt",
    remoteUrl: "",
    remoteRepoName: "",
    remoteToken: ""
  };
  
  try {
    if (fs.existsSync(settingsPath)) {
      const fileContent = fs.readFileSync(settingsPath, "utf-8");
      return { ...defaultSettings, ...JSON.parse(fileContent) };
    }
  } catch (e) {
    console.error("Error reading workspace settings:", e);
  }
  
  return defaultSettings;
}

export function getWorkspaceRoot(): string {
  // 1. Check if user configured an explicit env variable (perfect for both local & production cloud)
  if (process.env.WORKSPACE_ROOT) {
    return process.env.WORKSPACE_ROOT;
  }

  // 2. Load active workspace settings from JSON config
  const settings = getWorkspaceSettings();

  if (settings.locationType === "remote") {
    // For remote cloud workspaces, resolve to a local directory allocated for git repositories
    const remoteDir = path.join(process.cwd(), "terraform-workspaces-remote");
    if (!fs.existsSync(remoteDir)) {
      try {
        fs.mkdirSync(remoteDir, { recursive: true });
      } catch (e) {}
    }
    return remoteDir;
  }

  // 3. Check if we are running in a serverless cloud container (Vercel, AWS Lambda, etc.)
  // On these platforms, the standard filesystem is read-only, but /tmp is writable and ephemeral.
  const isCloud = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
  if (isCloud) {
    const cloudTmpPath = "/tmp/IGA-Saviynt";
    if (!fs.existsSync(cloudTmpPath)) {
      try {
        fs.mkdirSync(cloudTmpPath, { recursive: true });
      } catch (e) {
        // Fallback to relative workspace
      }
    }
    return cloudTmpPath;
  }

  // 4. Default local platform paths
  const pathOnDisk = settings.localPath || "/Users/tejov/Documents/IGA-Saviynt";
  if (!fs.existsSync(pathOnDisk)) {
    try {
      fs.mkdirSync(pathOnDisk, { recursive: true });
    } catch (e) {}
  }
  return pathOnDisk;
}

export function isCloudEnvironment(): boolean {
  return !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
}
