import path from "path";
import fs from "fs";

const isCloud = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
const projectRoot = isCloud ? "" : (process.cwd().endsWith("frontend") ? path.dirname(process.cwd()) : process.cwd());
const settingsPath = isCloud 
  ? "/tmp/workspace_settings.json"
  : path.join(process.cwd(), "app/lib/saviynt/workspace_settings.json");

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
    remoteUrl: "https://github.com/iam-tejo/IGAWorkspaceAutomationHub",
    remoteRepoName: "main",
    remoteToken: ""
  };
  
  try {
    let settings = { ...defaultSettings };
    let found = false;
    if (fs.existsSync(settingsPath)) {
      const fileContent = fs.readFileSync(settingsPath, "utf-8");
      settings = { ...defaultSettings, ...JSON.parse(fileContent) };
      found = true;
    } else if (isCloud) {
      // In cloud, read bundled file as fallback if tmp doesn't exist yet
      const bundledPath = path.join(process.cwd(), "app/lib/saviynt/workspace_settings.json");
      if (fs.existsSync(bundledPath)) {
        const fileContent = fs.readFileSync(bundledPath, "utf-8");
        settings = { ...defaultSettings, ...JSON.parse(fileContent) };
        found = true;
      }
    }
    if (!settings.remoteToken) {
      loadEnvLocalVariables();
      if (process.env.GITHUB_TOKEN) {
        settings.remoteToken = process.env.GITHUB_TOKEN;
      } else if (process.env.REMOTE_TOKEN) {
        settings.remoteToken = process.env.REMOTE_TOKEN;
      }
    }
    if (found || !isCloud) {
      return settings;
    }
  } catch (e) {
    console.error("Error reading workspace settings:", e);
  }
  
  return defaultSettings;
}

export function loadEnvLocalVariables() {
  const envFile = isCloud ? "/tmp/.env.local" : path.join(process.cwd(), ".env.local");
  try {
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        process.env[key] = val;
      }
    }
  } catch (e) {
    console.error("Failed to load env local variables:", e);
  }
}

export function getWorkspaceRoot(): string {
  // First load active env variables
  loadEnvLocalVariables();

  // 1. Load active workspace settings from JSON config
  const settings = getWorkspaceSettings();

  if (settings.locationType === "remote") {
    // For remote cloud workspaces, resolve to a local directory allocated for git repositories
    const remoteDir = isCloud
      ? "/tmp/terraform-workspaces-remote"
      : path.join(projectRoot, "terraform-workspaces-remote");
    if (!fs.existsSync(remoteDir)) {
      try {
        fs.mkdirSync(remoteDir, { recursive: true });
      } catch (e) {}
    }
    return remoteDir;
  }

  // 2. Check if user configured an explicit env variable (perfect for both local & production cloud)
  if (process.env.WORKSPACE_ROOT) {
    return process.env.WORKSPACE_ROOT;
  }

  // 3. Check if we are running in a serverless cloud container (Vercel, AWS Lambda, etc.)
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
  return isCloud;
}

export function isGitAvailable(): boolean {
  try {
    const { execSync } = require("child_process");
    execSync("git --version", { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

export function parseGitUrl(url: string): { owner: string; repo: string } | null {
  if (!url) return null;
  const clean = url.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const withoutProto = clean.replace(/^https?:\/\//, "");
  const segments = withoutProto.split("/");
  
  if (segments.length >= 3 && segments[0].includes("github.com")) {
    return { owner: segments[1], repo: segments[2] };
  } else if (segments.length === 2) {
    return { owner: segments[0], repo: segments[1] };
  } else if (segments.length >= 2) {
    const len = segments.length;
    return { owner: segments[len - 2], repo: segments[len - 1] };
  }
  return null;
}

export async function syncRepoViaApi(
  url: string,
  token: string,
  branch: string,
  targetDir: string
): Promise<void> {
  const repoInfo = parseGitUrl(url);
  if (!repoInfo) {
    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }
  const { owner, repo } = repoInfo;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  let activeBranch = branch || "main";
  if (branch === repo) {
    activeBranch = "main";
  }
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      if (!branch || branch === repo) {
        activeBranch = repoData.default_branch || "main";
      }
    }
  } catch (err) {
    console.warn("Failed to fetch repository details, using branch:", activeBranch, err);
  }

  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${activeBranch}?recursive=1`;
  const treeRes = await fetch(treeUrl, { headers });
  if (!treeRes.ok) {
    const errorBody = await treeRes.text().catch(() => "");
    throw new Error(
      `Failed to fetch Git tree from GitHub API (${treeRes.status}): ${errorBody || treeRes.statusText}`
    );
  }

  const treeData = await treeRes.json();
  const items = treeData.tree as Array<{
    path: string;
    mode: string;
    type: "blob" | "tree";
    sha: string;
    size?: number;
  }>;

  if (!items || !Array.isArray(items)) {
    throw new Error("Invalid response from GitHub Trees API: missing tree array.");
  }

  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    for (const file of files) {
      fs.rmSync(path.join(targetDir, file), { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const folders = items.filter((item) => item.type === "tree");
  for (const folder of folders) {
    const dirPath = path.join(targetDir, folder.path);
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const blobs = items.filter((item) => item.type === "blob");
  const chunkSize = 10;
  for (let i = 0; i < blobs.length; i += chunkSize) {
    const chunk = blobs.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (blob) => {
        const filePath = path.join(targetDir, blob.path);
        const parentDir = path.dirname(filePath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        const blobUrl = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${blob.sha}`;
        const blobRes = await fetch(blobUrl, {
          headers: {
            ...headers,
            Accept: "application/vnd.github.v3.raw",
          },
        });

        if (!blobRes.ok) {
          throw new Error(
            `Failed to download file ${blob.path} (${blobRes.status}): ${blobRes.statusText}`
          );
        }

        const buffer = Buffer.from(await blobRes.arrayBuffer());
        fs.writeFileSync(filePath, buffer);
      })
    );
  }

  const headSha = treeData.sha || "";
  const metaPath = path.join(targetDir, ".envizor_git_meta.json");
  fs.writeFileSync(
    metaPath,
    JSON.stringify({ url, branch: activeBranch, headSha, owner, repo }, null, 2),
    "utf-8"
  );
}

export async function pushRepoViaApi(
  url: string,
  token: string,
  branch: string,
  localDir: string,
  commitMessage: string = "Envizor GitOps: Automatically synchronized workspace"
): Promise<{ success: boolean; message: string }> {
  const repoInfo = parseGitUrl(url);
  if (!repoInfo) {
    throw new Error(`Invalid GitHub repository URL: ${url}`);
  }
  const { owner, repo } = repoInfo;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  let activeBranch = branch || "main";
  if (branch === repo) {
    activeBranch = "main";
  }
  const metaPath = path.join(localDir, ".envizor_git_meta.json");
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      if (meta.branch) activeBranch = meta.branch;
    } catch (e) {}
  } else if (!branch || branch === repo) {
    try {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (repoRes.ok) {
        const repoData = await repoRes.json();
        activeBranch = repoData.default_branch || "main";
      }
    } catch (e) {}
  }

  const localFiles: { path: string; content: string }[] = [];
  const getFilesRecursively = (dir: string, base: string = "") => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const relativePath = base ? `${base}/${item.name}` : item.name;
      if (
        item.name === ".git" ||
        item.name === ".envizor_git_meta.json" ||
        item.name === ".terraform" ||
        item.name === "terraform.tfstate" ||
        item.name === "terraform.tfstate.backup" ||
        item.name === ".terraform.lock.hcl" ||
        item.name.startsWith(".DS_Store")
      ) {
        continue;
      }
      
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        getFilesRecursively(fullPath, relativePath);
      } else {
        const content = fs.readFileSync(fullPath, "utf-8");
        localFiles.push({ path: relativePath, content });
      }
    }
  };

  if (fs.existsSync(localDir)) {
    getFilesRecursively(localDir);
  }

  const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${activeBranch}`;
  const refRes = await fetch(refUrl, { headers });
  if (!refRes.ok) {
    throw new Error(
      `Failed to fetch reference for branch ${activeBranch} (${refRes.status}): ${refRes.statusText}`
    );
  }
  const refData = await refRes.json();
  const parentCommitSha = refData.object.sha;

  const commitUrl = `https://api.github.com/repos/${owner}/${repo}/git/commits/${parentCommitSha}`;
  const commitRes = await fetch(commitUrl, { headers });
  if (!commitRes.ok) {
    throw new Error(`Failed to fetch commit ${parentCommitSha} (${commitRes.status}): ${commitRes.statusText}`);
  }
  const commitData = await commitRes.json();
  const parentTreeSha = commitData.tree.sha;

  const remoteTreeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${parentTreeSha}?recursive=1`;
  const remoteTreeRes = await fetch(remoteTreeUrl, { headers });
  if (!remoteTreeRes.ok) {
    throw new Error(`Failed to fetch tree ${parentTreeSha} (${remoteTreeRes.status}): ${remoteTreeRes.statusText}`);
  }
  const remoteTreeData = await remoteTreeRes.json();
  const remoteItems = remoteTreeData.tree as Array<{
    path: string;
    type: "blob" | "tree";
    sha: string;
  }>;

  const remoteBlobs = remoteItems.filter((item) => item.type === "blob" && item.path !== ".envizor_git_meta.json");

  const remoteMap = new Map<string, string>();
  for (const blob of remoteBlobs) {
    remoteMap.set(blob.path, blob.sha);
  }

  const crypto = require("crypto");
  function calculateGitSha(contentStr: string): string {
    const contentBuf = Buffer.from(contentStr, "utf-8");
    const header = `blob ${contentBuf.length}\0`;
    const store = Buffer.concat([Buffer.from(header), contentBuf]);
    return crypto.createHash("sha1").update(store).digest("hex");
  }

  const treeChanges: Array<{
    path: string;
    mode: string;
    type: "blob";
    content?: string;
    sha?: string | null;
  }> = [];

  const localPaths = new Set<string>();

  for (const file of localFiles) {
    localPaths.add(file.path);
    const localSha = calculateGitSha(file.content);
    const remoteSha = remoteMap.get(file.path);

    if (!remoteSha) {
      treeChanges.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content
      });
    } else if (localSha !== remoteSha) {
      treeChanges.push({
        path: file.path,
        mode: "100644",
        type: "blob",
        content: file.content
      });
    }
  }

  for (const remoteBlob of remoteBlobs) {
    if (!localPaths.has(remoteBlob.path)) {
      treeChanges.push({
        path: remoteBlob.path,
        mode: "100644",
        type: "blob",
        sha: null
      });
    }
  }

  if (treeChanges.length === 0) {
    return {
      success: true,
      message: "No changes detected. Git repository is already fully aligned with GitHub."
    };
  }

  const newTreeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      base_tree: parentTreeSha,
      tree: treeChanges
    })
  });

  if (!newTreeRes.ok) {
    const errorBody = await newTreeRes.text().catch(() => "");
    throw new Error(`Failed to create Git tree via GitHub API (${newTreeRes.status}): ${errorBody || newTreeRes.statusText}`);
  }
  const newTreeData = await newTreeRes.json();
  const newTreeSha = newTreeData.sha;

  const newCommitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: newTreeSha,
      parents: [parentCommitSha]
    })
  });

  if (!newCommitRes.ok) {
    const errorBody = await newCommitRes.text().catch(() => "");
    throw new Error(`Failed to create Git commit via GitHub API (${newCommitRes.status}): ${errorBody || newCommitRes.statusText}`);
  }
  const newCommitData = await newCommitRes.json();
  const newCommitSha = newCommitData.sha;

  const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${activeBranch}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      sha: newCommitSha,
      force: false
    })
  });

  if (!updateRefRes.ok) {
    const errorBody = await updateRefRes.text().catch(() => "");
    throw new Error(`Failed to update Git branch ref via GitHub API (${updateRefRes.status}): ${errorBody || updateRefRes.statusText}`);
  }

  const newMeta = { url, branch: activeBranch, headSha: newCommitSha, owner, repo };
  fs.writeFileSync(metaPath, JSON.stringify(newMeta, null, 2), "utf-8");

  return {
    success: true,
    message: "Workspace directories successfully staged, committed, and pushed to your remote GitHub repository!"
  };
}

export function getRemoteTrackingBranch(cwd: string): string {
  const { execSync } = require("child_process");
  try {
    return execSync("git rev-parse --abbrev-ref @{u}", { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch (e) {
    try {
      return execSync("git symbolic-ref --short refs/remotes/origin/HEAD", { cwd, encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch (e2) {
      return "origin/main";
    }
  }
}

export function getRemoteTrackedFolders(tempDir: string): string[] {
  const { execSync } = require("child_process");
  try {
    if (!isGitAvailable()) return [];
    const branch = getRemoteTrackingBranch(tempDir);
    const gitOutput = execSync(`git ls-tree -d -r --name-only ${branch}`, {
      cwd: tempDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    return gitOutput
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line && !line.startsWith("."));
  } catch (err) {
    console.warn("Failed to get remote tracked folders:", err);
    return [];
  }
}

export function getRemoteTrackedFiles(tempDir: string, env: string): string[] {
  const { execSync } = require("child_process");
  try {
    if (!isGitAvailable()) return [];
    const branch = getRemoteTrackingBranch(tempDir);
    const gitOutput = execSync(`git ls-tree -r --name-only ${branch} ${env}`, {
      cwd: tempDir,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"]
    });
    return gitOutput
      .split("\n")
      .map((line: string) => line.trim())
      .filter((line: string) => line.startsWith(`${env}/`))
      .map((line: string) => line.slice(env.length + 1));
  } catch (err) {
    console.warn(`Failed to get remote tracked files for env ${env}:`, err);
    return [];
  }
}

export async function pushWorkspaceToGit(
  commitMessage: string = "Envizor GitOps: Automatically synchronized workspace"
): Promise<{ success: boolean; message: string }> {
  const settings = getWorkspaceSettings();
  if (settings.locationType !== "remote" || !settings.remoteUrl) {
    return { success: true, message: "Local strategy is active. Skipping remote git push." };
  }

  const tempDir = isCloud
    ? "/tmp/terraform-workspaces-remote"
    : path.join(projectRoot, "terraform-workspaces-remote");
  const gitPath = path.join(tempDir, ".git");
  const metaPath = path.join(tempDir, ".envizor_git_meta.json");

  if (isGitAvailable()) {
    const { execSync } = require("child_process");
    if (!fs.existsSync(gitPath)) {
      console.log("Git repository is not initialized inside remote workspaces. Recovering via side-clone...");
      const sideTempDir = isCloud
        ? "/tmp/terraform-workspaces-remote-temp"
        : path.join(projectRoot, "terraform-workspaces-remote-temp");
      if (fs.existsSync(sideTempDir)) {
        fs.rmSync(sideTempDir, { recursive: true, force: true });
      }
      fs.mkdirSync(sideTempDir, { recursive: true });

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

      execSync(`git clone "${gitUrl}" .`, {
        cwd: sideTempDir,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
        timeout: 25000
      });

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      fs.renameSync(path.join(sideTempDir, ".git"), gitPath);
      fs.rmSync(sideTempDir, { recursive: true, force: true });
    }

    try {
      execSync(`git config user.name "Envizor GitOps Engine"`, { cwd: tempDir });
      execSync(`git config user.email "gitops@envizor.io"`, { cwd: tempDir });
    } catch (configErr) {
      console.warn("Could not set git commit config, relying on machine defaults:", configErr);
    }

    execSync(`git add -A`, { cwd: tempDir });
    const status = execSync(`git status --porcelain`, { cwd: tempDir, encoding: "utf-8" }).trim();
    if (!status) {
      return {
        success: true,
        message: "No changes detected. Git repository is already fully aligned with GitHub."
      };
    }

    execSync(`git commit -m "${commitMessage}"`, {
      cwd: tempDir,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
    });

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

    execSync(`git remote set-url origin "${gitUrl}"`, { cwd: tempDir });
    const branch = "main";
    execSync(`git push -u origin HEAD:"${branch}"`, {
      cwd: tempDir,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
      timeout: 20000
    });

    return {
      success: true,
      message: "Workspace directories successfully staged, committed, and pushed to your remote GitHub repository!"
    };
  } else {
    // API fallback
    if (!fs.existsSync(metaPath)) {
      let gitUrl = settings.remoteUrl.trim();
      const cleanBaseUrl = gitUrl.replace("https://", "").replace(/\/$/, "");
      const segments = cleanBaseUrl.split("/");
      if (segments.length === 2 && settings.remoteRepoName) {
        gitUrl = `https://${segments[0]}/${segments[1]}/${settings.remoteRepoName}`;
      }
      await syncRepoViaApi(gitUrl, settings.remoteToken, settings.remoteRepoName, tempDir);
    }

    let gitUrl = settings.remoteUrl.trim();
    const cleanBaseUrl = gitUrl.replace("https://", "").replace(/\/$/, "");
    const segments = cleanBaseUrl.split("/");
    if (segments.length === 2 && settings.remoteRepoName) {
      gitUrl = `https://${segments[0]}/${segments[1]}/${settings.remoteRepoName}`;
    }

    return await pushRepoViaApi(
      gitUrl,
      settings.remoteToken,
      settings.remoteRepoName,
      tempDir,
      commitMessage
    );
  }
}

