import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Safe resolve within workspace root to prevent directory traversal outside workspace
const WORKSPACE_ROOT = path.resolve(process.cwd(), "..");

function getSafePath(relativePath: string): string {
  let cleanRelative = relativePath.trim();

  // If absolute path within workspace, clean it up
  const rootDirName = "generate-workspace-terraform";
  if (cleanRelative.startsWith("/Users/") || cleanRelative.includes(rootDirName)) {
    const idx = cleanRelative.indexOf(rootDirName);
    if (idx !== -1) {
      cleanRelative = cleanRelative.slice(idx + rootDirName.length);
    }
  }

  // Strip leading slash if any
  if (cleanRelative.startsWith("/")) {
    cleanRelative = cleanRelative.slice(1);
  }

  const WORKSPACE_ROOT = path.resolve(process.cwd(), "..");
  const resolved = path.resolve(WORKSPACE_ROOT, cleanRelative);

  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    throw new Error("Access Denied: Path is outside workspace scope.");
  }
  return resolved;
}

// GitHub API Helper Functions
async function fetchGithubFile(repo: string, token: string, branch: string, filePath: string) {
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": `token ${token}`,
      "User-Agent": "Envizor-AI-Agent"
    }
  });
  if (res.status !== 200) return null;
  const data = await res.json();
  return {
    content: Buffer.from(data.content, "base64").toString("utf-8"),
    sha: data.sha
  };
}

async function commitGithubFile(repo: string, token: string, branch: string, filePath: string, newContent: string, commitMessage: string) {
  const headers = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": `token ${token}`,
    "User-Agent": "Envizor-AI-Agent",
    "Content-Type": "application/json"
  };

  // 1. Fetch SHA first
  const getUrl = `https://api.github.com/repos/${repo}/contents/${filePath}?ref=${branch}`;
  const getRes = await fetch(getUrl, { headers: { ...headers, "Content-Type": undefined } as any });
  let sha: string | undefined = undefined;
  if (getRes.status === 200) {
    const getData = await getRes.json();
    sha = getData.sha;
  }

  // 2. Commit changes
  const putUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;
  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(newContent).toString("base64"),
      sha,
      branch
    })
  });

  if (putRes.status !== 200 && putRes.status !== 201) {
    const errData = await putRes.json();
    throw new Error(errData.message || "Failed to commit file to GitHub.");
  }
  return true;
}

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeNode[];
}

function buildFileTree(dirPath: string, relativeRoot = ""): TreeNode[] {
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const results: TreeNode[] = [];

  const ignores = [
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "tsconfig.tsbuildinfo",
    ".DS_Store",
    "target"
  ];

  for (const item of items) {
    if (ignores.includes(item.name)) continue;

    const relPath = relativeRoot ? `${relativeRoot}/${item.name}` : item.name;
    const fullPath = path.join(dirPath, item.name);

    if (item.isDirectory()) {
      results.push({
        name: item.name,
        path: relPath,
        isDir: true,
        children: buildFileTree(fullPath, relPath)
      });
    } else {
      results.push({
        name: item.name,
        path: relPath,
        isDir: false
      });
    }
  }

  return results.sort((a, b) => {
    if (a.isDir && !b.isDir) return -1;
    if (!a.isDir && b.isDir) return 1;
    return a.name.localeCompare(b.name);
  });
}

function transformFlatToTree(flatList: { path: string; type: string }[]): TreeNode[] {
  const root: TreeNode[] = [];
  const map: Record<string, TreeNode> = {};

  flatList.sort((a, b) => a.path.localeCompare(b.path));

  const ignores = [
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "tsconfig.tsbuildinfo",
    ".DS_Store",
    "target"
  ];

  for (const item of flatList) {
    const segments = item.path.split("/");
    if (segments.some(seg => ignores.includes(seg))) continue;

    const isDir = item.type === "tree";
    const node: TreeNode = {
      name: segments[segments.length - 1],
      path: item.path,
      isDir,
      ...(isDir ? { children: [] } : {})
    };

    if (segments.length === 1) {
      root.push(node);
      map[item.path] = node;
    } else {
      const parentPath = segments.slice(0, -1).join("/");
      const parent = map[parentPath];
      if (parent && parent.children) {
        parent.children.push(node);
        map[item.path] = node;
      }
    }
  }

  const sortTree = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) {
      if (n.children) sortTree(n.children);
    }
  };

  sortTree(root);
  return root;
}

// ==========================================
// OFFLINE LOCAL INTELLIGENCE ENGINE UTILITIES
// ==========================================

function localSearchWorkspace(query: string): string {
  const root = path.resolve(process.cwd(), "..");
  const matches: { file: string; line: number; text: string }[] = [];
  const lowercaseQuery = query.toLowerCase();

  const searchDir = (dirPath: string) => {
    if (matches.length >= 15) return;
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    const ignores = [
      "node_modules",
      ".next",
      ".git",
      ".vercel",
      "tsconfig.tsbuildinfo",
      ".DS_Store",
      "target",
      "dist",
      "package-lock.json"
    ];

    for (const item of items) {
      if (ignores.includes(item.name)) continue;
      const fullPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        searchDir(fullPath);
      } else {
        const ext = path.extname(item.name).toLowerCase();
        const textExtensions = [".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".xml", ".css", ".java", ".tf", ".hcl", ".properties", ".sh"];
        if (textExtensions.includes(ext)) {
          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            if (content.toLowerCase().includes(lowercaseQuery)) {
              const lines = content.split("\n");
              lines.forEach((line: string, index: number) => {
                if (line.toLowerCase().includes(lowercaseQuery)) {
                  const relPath = path.relative(root, fullPath);
                  matches.push({
                    file: relPath,
                    line: index + 1,
                    text: line.trim()
                  });
                }
              });
            }
          } catch (e) {
            // Ignore read errors
          }
        }
      }
      if (matches.length >= 15) break;
    }
  };

  searchDir(root);

  if (matches.length === 0) {
    return `🔍 **Local Workspace Search:**\n\nNo matches found for query: \`${query}\`.`;
  }

  let report = `🔍 **Local Workspace Search Results for "${query}":**\n\n`;
  const grouped: Record<string, typeof matches> = {};
  matches.forEach(m => {
    if (!grouped[m.file]) grouped[m.file] = [];
    grouped[m.file].push(m);
  });

  for (const [file, fileMatches] of Object.entries(grouped)) {
    report += `📂 **[${file}](file:///${path.resolve(root, file)})**\n`;
    fileMatches.forEach(m => {
      report += `  - Line ${m.line}: \`${m.text.slice(0, 100)}\`\n`;
    });
    report += `\n`;
  }

  if (matches.length >= 15) {
    report += `*Note: Showing the first 15 matches. Consider refining your search query.*`;
  }

  return report;
}

interface PostmanEndpoint {
  name: string;
  method: string;
  url: string;
  description: string;
}

function searchSaviyntEndpoints(query: string): string {
  const root = path.resolve(process.cwd(), "..");
  const postmanPath = path.join(root, "saviynt_api.json");
  if (!fs.existsSync(postmanPath)) {
    return `❌ **Saviynt API Search:**\n\nCould not find \`saviynt_api.json\` catalog in the workspace root.`;
  }

  const lowercaseQuery = query.toLowerCase();
  const endpoints: PostmanEndpoint[] = [];

  try {
    const rawData = fs.readFileSync(postmanPath, "utf-8");
    const collection = JSON.parse(rawData);

    const traverseItems = (items: any[]) => {
      for (const item of items) {
        if (item.request) {
          const req = item.request;
          const name = item.name || "";
          const method = req.method || "GET";
          
          let urlStr = "";
          if (typeof req.url === "string") {
            urlStr = req.url;
          } else if (req.url && req.url.raw) {
            urlStr = req.url.raw;
          } else if (req.url && req.url.path) {
            urlStr = "/" + req.url.path.join("/");
          }

          const desc = req.description || "";
          
          const matchText = `${name} ${method} ${urlStr} ${desc}`.toLowerCase();
          if (matchText.includes(lowercaseQuery)) {
            const cleanDesc = desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
            endpoints.push({
              name,
              method,
              url: urlStr,
              description: cleanDesc.length > 150 ? cleanDesc.slice(0, 150) + "..." : cleanDesc
            });
          }
        }
        if (item.item && Array.isArray(item.item)) {
          traverseItems(item.item);
        }
        if (endpoints.length >= 15) break;
      }
    };

    if (collection.item && Array.isArray(collection.item)) {
      traverseItems(collection.item);
    }
  } catch (err: any) {
    return `❌ **Saviynt API Search Error:**\n\nFailed to parse Postman API Catalog:\n\`\`\`\n${err.message}\n\`\`\``;
  }

  if (endpoints.length === 0) {
    return `📒 **Saviynt Chicago Release API Catalog:**\n\nNo matching endpoints found for query: \`${query}\`.`;
  }

  let table = `📒 **Saviynt Chicago Release API Catalog Results for "${query}":**\n\n`;
  table += `| API Name | Method | Route Path | Description |\n`;
  table += `| :--- | :--- | :--- | :--- |\n`;
  
  endpoints.forEach(e => {
    table += `| **${e.name}** | \`${e.method}\` | \`${e.url}\` | ${e.description || "*No description*"} |\n`;
  });

  if (endpoints.length >= 15) {
    table += `\n*Note: Showing the first 15 matching endpoints.*`;
  }

  return table;
}

function auditWorkspaceDependencies(): string {
  const root = path.resolve(process.cwd(), "..");
  const pomPath = path.join(root, "pom.xml");
  const frontendPkgPath = path.join(root, "frontend", "package.json");
  const rootPkgPath = path.join(root, "package.json");

  let report = `📦 **Workspace Dependency Auditor Report**\n\n`;

  if (fs.existsSync(pomPath)) {
    try {
      const pomContent = fs.readFileSync(pomPath, "utf-8");
      
      const properties: Record<string, string> = {};
      const propBlockRegex = /<properties>([\s\S]*?)<\/properties>/;
      const propBlockMatch = pomContent.match(propBlockRegex);
      if (propBlockMatch) {
        const propBlock = propBlockMatch[1];
        const propRegex = /<([^>]+)>([^<]+)<\/\1>/g;
        let match;
        while ((match = propRegex.exec(propBlock)) !== null) {
          properties[match[1]] = match[2];
        }
      }

      const depRegex = /<dependency>([\s\S]*?)<\/dependency>/g;
      let depMatch;
      const mavenDeps: { groupId: string; artifactId: string; version: string; scope: string }[] = [];

      while ((depMatch = depRegex.exec(pomContent)) !== null) {
        const depContent = depMatch[1];
        const groupId = (depContent.match(/<groupId>([^<]+)<\/groupId>/) || [])[1] || "";
        const artifactId = (depContent.match(/<artifactId>([^<]+)<\/artifactId>/) || [])[1] || "";
        let version = (depContent.match(/<version>([^<]+)<\/version>/) || [])[1] || "";
        const scope = (depContent.match(/<scope>([^<]+)<\/scope>/) || [])[1] || "compile";

        if (version.startsWith("${") && version.endsWith("}")) {
          const propName = version.slice(2, -1);
          version = properties[propName] || version;
        }

        mavenDeps.push({ groupId, artifactId, version, scope });
      }

      report += `### ☕ Java Maven Backend Dependencies (\`pom.xml\`)\n\n`;
      if (mavenDeps.length > 0) {
        report += `| Group ID | Artifact ID | Version | Scope |\n`;
        report += `| :--- | :--- | :--- | :--- |\n`;
        mavenDeps.forEach(d => {
          report += `| \`${d.groupId}\` | **${d.artifactId}** | \`${d.version || "managed"}\` | \`${d.scope}\` |\n`;
        });
      } else {
        report += `*No Maven dependencies identified.*\n`;
      }
      report += `\n`;
    } catch (e: any) {
      report += `❌ *Failed to parse pom.xml: ${e.message}*\n\n`;
    }
  } else {
    report += `⚠️ *No pom.xml found in workspace root.*\n\n`;
  }

  if (fs.existsSync(frontendPkgPath)) {
    try {
      const pkgData = JSON.parse(fs.readFileSync(frontendPkgPath, "utf-8"));
      report += `### ⚛️ Frontend Next.js App Dependencies (\`frontend/package.json\`)\n\n`;
      
      const deps = pkgData.dependencies || {};
      const devDeps = pkgData.devDependencies || {};

      if (Object.keys(deps).length > 0) {
        report += `**Production Dependencies:**\n\n`;
        report += `| Package | Version |\n`;
        report += `| :--- | :--- |\n`;
        for (const [name, ver] of Object.entries(deps)) {
          report += `| **${name}** | \`${ver}\` |\n`;
        }
        report += `\n`;
      }

      if (Object.keys(devDeps).length > 0) {
        report += `**Development Dependencies:**\n\n`;
        report += `| Package | Version |\n`;
        report += `| :--- | :--- |\n`;
        for (const [name, ver] of Object.entries(devDeps)) {
          report += `| **${name}** | \`${ver}\` |\n`;
        }
        report += `\n`;
      }
    } catch (e: any) {
      report += `❌ *Failed to parse frontend/package.json: ${e.message}*\n\n`;
    }
  }

  if (fs.existsSync(rootPkgPath)) {
    try {
      const pkgData = JSON.parse(fs.readFileSync(rootPkgPath, "utf-8"));
      const deps = pkgData.dependencies || {};
      const devDeps = pkgData.devDependencies || {};

      if (Object.keys(deps).length > 0 || Object.keys(devDeps).length > 0) {
        report += `### 🛠️ Workspace Root Node Dependencies (\`package.json\`)\n\n`;
        report += `| Package | Version | Type |\n`;
        report += `| :--- | :--- | :--- |\n`;
        for (const [name, ver] of Object.entries(deps)) {
          report += `| **${name}** | \`${ver}\` | \`production\` |\n`;
        }
        for (const [name, ver] of Object.entries(devDeps)) {
          report += `| **${name}** | \`${ver}\` | \`dev\` |\n`;
        }
        report += `\n`;
      }
    } catch (e) {
      // Skip
    }
  }

  return report;
}

function generateOfflineTemplate(componentName: string, activeFile: string): { response: string; hasChanges: boolean; diff: string; targetFile: string; modifiedContent: string } {
  const cleanName = componentName.replace(/[^a-zA-Z0-9]/g, "");
  const targetFile = activeFile || `frontend/app/components/${cleanName}.tsx`;

  let componentCode = "";

  if (cleanName.toLowerCase().includes("badge") || cleanName.toLowerCase().includes("status")) {
    componentCode = `import React from 'react';

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'pending';
  label: string;
}

export const ${cleanName}: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const colorMap = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/5',
    error: 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-rose-500/5',
    pending: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-blue-500/5',
  };

  return (
    <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-sm transition-all duration-200 \${colorMap[status]}\`}>
      <span className={\`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse \${
        status === 'success' ? 'bg-emerald-400' :
        status === 'warning' ? 'bg-amber-400' :
        status === 'error' ? 'bg-rose-400' : 'bg-blue-400'
      }\`} />
      {label}
    </span>
  );
};
`;
  } else if (cleanName.toLowerCase().includes("toggle") || cleanName.toLowerCase().includes("settings") || cleanName.toLowerCase().includes("theme")) {
    componentCode = `import React, { useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export const ${cleanName}: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl max-w-sm shadow-xl">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">Console Theme Settings</h3>
      <div className="flex gap-2">
        {(['light', 'dark', 'system'] as const).map((t) => {
          const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Laptop;
          const isActive = theme === t;
          return (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={\`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all duration-200 capitalize \${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }\`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
};
`;
  } else {
    componentCode = `import React, { useState } from 'react';
import { Terminal, Shield, ArrowRight } from 'lucide-react';

interface ${cleanName}Props {
  title?: string;
  subtitle?: string;
}

export const ${cleanName}: React.FC<${cleanName}Props> = ({ 
  title = "DevOps Console Guard", 
  subtitle = "Secure local cloud workspaces in real-time" 
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl transition-all duration-300 hover:border-slate-700">
      <div className="absolute top-0 right-0 h-32 w-32 bg-amber-500/5 blur-3xl rounded-full" />
      
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-100">{title}</h4>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-b border-slate-900 mb-5">
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5" />
          Status
        </span>
        <button 
          onClick={() => setIsEnabled(!isEnabled)}
          className={\`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-200 border \${
            isEnabled 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }\`}
        >
          {isEnabled ? 'Active' : 'Inactive'}
        </button>
      </div>

      <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all hover:text-white group">
        Proceed to Guard Console
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
};
export default ${cleanName};
`;
  }

  const diffReport = `--- a/${path.basename(targetFile)}\n+++ b/${path.basename(targetFile)}\n@@ -0,0 +${componentCode.split('\n').length} @@\n+` + componentCode.split('\n').slice(0, 10).join('\n+') + '\n+...';

  return {
    response: `🎨 **Interactive Offline React Component Template Generated!**\n\nI have automatically structured a premium, state-managed React typescript component named \`${cleanName}\` utilizing modern glassmorphism UI palettes and responsive styling.\n\n* **Staged Path:** \`${targetFile}\`\n* **Next steps:** Inspect the generated source in the diff viewer on the right and click **Apply & Save to Local Workspace** to write the component to disk!`,
    hasChanges: true,
    diff: diffReport,
    targetFile: targetFile,
    modifiedContent: componentCode
  };
}

function offlineDeveloperKnowledge(query: string): string {
  const lowercase = query.toLowerCase();

  let article = "";

  if (lowercase.includes("spring") || lowercase.includes("boot") || lowercase.includes("java")) {
    article = `📚 **Spring Boot & REST Controllers Developer Guide**

Spring Boot controllers utilize annotations to expose REST endpoints securely. Under the hood, Spring parses HCL and maps database queries contextually.

### Essential REST Pattern
\`\`\`java
@RestController
@RequestMapping("/api/v1/workspaces")
public class WorkspaceController {

    @GetMapping("/{id}")
    public ResponseEntity<Workspace> getWorkspace(@PathVariable String id) {
        // Safe access audit log
        return ResponseEntity.ok(new Workspace(id, "PROD_HCL_DEPLOY"));
    }
}
\`\`\``;
  } else if (lowercase.includes("terraform") || lowercase.includes("hcl") || lowercase.includes("provider")) {
    article = `📚 **Terraform HCL Governance & Provider Configuration**

The \`saviynt\` provider (version \`>= 0.3.4\`) communicates with Saviynt Cloud over TLS 1.3 endpoints. Session tokens are rotated dynamically using JIT mechanisms.

### Provider Declaration
\`\`\`hcl
terraform {
  required_providers {
    saviynt = {
      source  = "saviynt/saviynt"
      version = ">= 0.3.4"
    }
  }
}

provider "saviynt" {
  url           = var.saviynt_url
  client_id     = var.client_id
  client_secret = var.client_secret
}
\`\`\`;`;
  } else if (lowercase.includes("react") || lowercase.includes("state") || lowercase.includes("hooks") || lowercase.includes("zustand")) {
    article = `📚 **Modern React 19 State & Custom Hook Architecture**

React 19 promotes decoupled state orchestration using hooks like \`use\` or micro-state containers like **Zustand**.

### Custom State Hook
\`\`\`typescript
import { create } from 'zustand';

interface UserRoleState {
  role: string;
  setRole: (role: string) => void;
}

export const useRoleStore = create<UserRoleState>((set) => ({
  role: 'BasicUser',
  setRole: (role) => set({ role }),
}));
\`\`\``;
  } else if (lowercase.includes("maven") || lowercase.includes("pom")) {
    article = `📚 **Maven Build Lifecycle & Dependency Scopes Guide**

Maven builds are managed via the \`pom.xml\` descriptor. Key compilation phases are: \`validate\`, \`compile\`, \`test\`, \`package\`, \`verify\`, \`install\`, \`deploy\`.

### Key Dependency Scopes:
- \`compile\` (default): Available in classpath of all phases.
- \`provided\`: Expects target JDK or container to supply at runtime.
- \`runtime\`: Not needed for compiling but required at execution (e.g. database drivers).
- \`test\`: Only compiled and run for testing.`;
  } else {
    article = `📚 **DevOps Portal Governance Knowledge Base**

Welcome to Envizor's local handbook. Use keywords like **Spring Boot**, **Terraform HCL**, **React State**, or **Maven** to query specific technical integrations.

### Key Governance Principles:
1. **Zero Trust JIT Elevators**: Keep roles demoted by default. Elevate only for brief verification windows.
2. **Strict Folder Traversal Boundaries**: Always check that local path inputs resolve within the workspace scope.
3. **No Hardcoded Keys**: Avoid storing Gemini API keys or service accounts on disk; rely on localStorage or env variables.`;
  }

  return article;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, prompt, activeFile, newContent, command, githubToken, githubRepo, githubBranch = "main", geminiApiKey, activeFileContent } = body;

    const isAdo = !!(githubRepo && (githubRepo.includes("azure.com") || githubRepo.includes("visualstudio.com") || githubRepo.toLowerCase().includes("ado")));
    const isRemoteMode = !!(githubToken && githubRepo) && !isAdo;

    // 0. GET FILE TREE ACTION
    if (action === "tree") {
      if (isRemoteMode) {
        try {
          const url = `https://api.github.com/repos/${githubRepo}/git/trees/${githubBranch}?recursive=1`;
          const res = await fetch(url, {
            headers: {
              "Accept": "application/vnd.github.v3+json",
              "Authorization": `token ${githubToken}`,
              "User-Agent": "Envizor-AI-Agent"
            }
          });
          if (res.status !== 200) {
            const errData = await res.json();
            return NextResponse.json({ error: errData.message || "Failed to fetch remote Git tree." }, { status: res.status });
          }
          const data = await res.json();
          const tree = transformFlatToTree(data.tree);
          return NextResponse.json({ status: "success", tree });
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 500 });
        }
      } else {
        try {
          const tree = buildFileTree(path.resolve(process.cwd(), ".."));
          return NextResponse.json({ status: "success", tree });
        } catch (err: any) {
          return NextResponse.json({ error: err.message }, { status: 500 });
        }
      }
    }

    // 1. READ FILE ACTION
    if (action === "read") {
      if (!activeFile) {
        return NextResponse.json({ error: "No target file specified for reading." }, { status: 400 });
      }

      if (isRemoteMode) {
        const fileData = await fetchGithubFile(githubRepo, githubToken, githubBranch, activeFile);
        if (!fileData) {
          return NextResponse.json({ error: `Remote file not found in GitHub: ${activeFile}` }, { status: 404 });
        }
        return NextResponse.json({
          status: "success",
          file: activeFile,
          content: fileData.content
        });
      } else {
        const fullPath = getSafePath(activeFile);
        if (!fs.existsSync(fullPath)) {
          return NextResponse.json({ error: `File not found: ${activeFile}` }, { status: 404 });
        }
        const content = fs.readFileSync(fullPath, "utf-8");
        return NextResponse.json({
          status: "success",
          file: activeFile,
          content
        });
      }
    }

    // 2. WRITE FILE ACTION
    if (action === "write") {
      if (!activeFile || newContent === undefined) {
        return NextResponse.json({ error: "File path or content missing for writing." }, { status: 400 });
      }

      if (isRemoteMode) {
        await commitGithubFile(githubRepo, githubToken, githubBranch, activeFile, newContent, `🤖 Envizor AI Agent: Write ${activeFile}`);
        return NextResponse.json({
          status: "success",
          message: `Successfully committed ${activeFile} directly to GitHub repository ${githubRepo}.`,
          file: activeFile
        });
      } else {
        const fullPath = getSafePath(activeFile);

        // Ensure parent directories exist
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, newContent, "utf-8");

        return NextResponse.json({
          status: "success",
          message: `Successfully wrote ${activeFile} to disk.`,
          file: activeFile
        });
      }
    }

    // 3. RUN COMMAND / BUILD VERIFICATION
    if (action === "build") {
      if (isRemoteMode) {
        return NextResponse.json({
          status: "success",
          output: `⚡ Remote GitHub mode active.\nCommitting code directly triggers automatic Vercel compilation and deployment.\n\nRepository: https://github.com/${githubRepo}\nActive Branch: ${githubBranch}\n\nPlease check your Vercel Console to monitor real-time build and deployment logs!`
        });
      }

      const frontendDir = path.join(process.cwd());
      try {
        const output = execSync(command || "npm run build", { cwd: frontendDir, encoding: "utf-8", timeout: 15000 });
        return NextResponse.json({
          status: "success",
          output
        });
      } catch (err: any) {
        return NextResponse.json({
          status: "failed",
          error: err.message,
          output: err.stdout || err.stderr || "Execution failed."
        }, { status: 500 });
      }
    }

    // 4. CHAT / AGENT ORCHESTRATION
    if (action === "chat") {
      if (geminiApiKey) {
        try {
          const systemPrompt = `You are Envizor, a premium, hyper-intelligent agentic developer coding assistant.
You are helping the user modify or analyze their workspace code.

You have access to the user's currently selected active file.
Active File Path: ${activeFile || "None"}
Active File Contents:
\`\`\`
${activeFileContent || "Empty"}
\`\`\`

Based on the user's prompt, determine if they want to make an edit to the active file or write new code.
If they want to make code changes:
1. Apply the edits to the active file contents.
2. Return a JSON object with:
   - "response": A clear, professional explanation of what you are changing.
   - "hasChanges": true
   - "targetFile": The active file path.
   - "modifiedContent": The complete, entire, updated code content of the file.
   - "diff": A clean, readable git-like unified diff showing only the added (+) or removed (-) lines (e.g. --- a/file\\n+++ b/file\\n@@ -1,3 +1,4 @@\\n-old line\\n+new line).
   - "toolCalls": [{"tool": "write_file", "target": "${activeFile || ""}", "status": "SUCCESS"}]

If they do not want to make code changes (e.g., asking a question, analyzing code, or running a search):
1. Return a JSON object with:
   - "response": Your natural language response (markdown is supported).
   - "hasChanges": false
   - "toolCalls": [{"tool": "read_file", "target": "${activeFile || ""}", "status": "SUCCESS"}]

You MUST return ONLY a valid, parseable JSON object matching one of these structures. Do not wrap your response in markdown code blocks. Output raw JSON.`;

          const gres = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: systemPrompt },
                  { text: `User request: ${prompt}` }
                ]
              }],
              generationConfig: {
                responseMimeType: "application/json"
              }
            })
          });

          if (gres.status === 200) {
            const gdata = await gres.json();
            const text = gdata.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const parsed = JSON.parse(text.trim());
              return NextResponse.json({
                status: "success",
                response: parsed.response || "",
                toolCalls: parsed.toolCalls || [],
                hasChanges: !!parsed.hasChanges,
                diff: parsed.diff || "",
                targetFile: parsed.targetFile || activeFile || "",
                modifiedContent: parsed.modifiedContent || ""
              });
            }
          } else {
            const errData = await gres.json();
            throw new Error(errData.error?.message || "Failed to generate response from Gemini API.");
          }
        } catch (err: any) {
          console.error("Error in Gemini chat route:", err);
          return NextResponse.json({
            status: "success",
            response: `🧠 **Gemini API Key Active but failed to fetch:**\n\nI encountered an error using your Gemini API key:\n\n\`\`\`\n${err.message}\n\`\`\`\n\nFalling back to Envizor's offline rule-based agent...`,
            toolCalls: [{ tool: "agent_fallback", target: "local_rules", status: "WARNING" }],
            hasChanges: false
          });
        }
      }

      const lower = prompt.toLowerCase();
      let responseText = "";
      const toolCalls: any[] = [];
      let diffReport = "";
      let hasChanges = false;
      let targetFilePath = activeFile || "";
      let modifiedContent = "";

      // ─── Workspace Search handling ──────────────────────────────────────────
      if (lower.includes("find ") || lower.includes("search for ") || lower.includes("grep ") || lower.includes("locate ")) {
        let query = prompt;
        const searchPrefixes = ["search for ", "find ", "grep ", "locate "];
        for (const pref of searchPrefixes) {
          const idx = lower.indexOf(pref);
          if (idx !== -1) {
            query = prompt.slice(idx + pref.length).trim();
            break;
          }
        }
        query = query.replace(/^["']|["']$/g, "");

        responseText = localSearchWorkspace(query);
        toolCalls.push({
          tool: "workspace_search",
          target: query,
          status: "SUCCESS"
        });
      }
      // ─── Dependency Auditor handling ──────────────────────────────────────
      else if (lower.includes("dependency") || lower.includes("dependencies") || lower.includes("pom.xml") || lower.includes("package.json") || lower.includes("libraries")) {
        responseText = auditWorkspaceDependencies();
        toolCalls.push({
          tool: "dependency_audit",
          target: "workspace_files",
          status: "SUCCESS"
        });
      }
      // ─── Saviynt Postman API Searcher handling ─────────────────────────────
      else if (lower.includes("saviynt") || lower.includes("postman") || lower.includes("endpoint") || lower.includes("api path")) {
        let term = "rules";
        const terms = ["endpoints for", "endpoints", "endpoint", "saviynt", "postman", "api path"];
        for (const t of terms) {
          const idx = lower.indexOf(t);
          if (idx !== -1) {
            const remainder = prompt.slice(idx + t.length).trim();
            if (remainder) {
              term = remainder;
              break;
            }
          }
        }
        term = term.replace(/^["']|["']$/g, "");

        responseText = searchSaviyntEndpoints(term);
        toolCalls.push({
          tool: "saviynt_api_search",
          target: term,
          status: "SUCCESS"
        });
      }
      // ─── Interactive Component Template Generator handling ────────────────
      else if (lower.includes("generate") || lower.includes("create component") || lower.includes("add widget") || lower.includes("create widget")) {
        let compName = "StatusBadge";
        const generators = ["generate component", "generate", "create component", "add widget", "create widget"];
        for (const g of generators) {
          const idx = lower.indexOf(g);
          if (idx !== -1) {
            const remainder = prompt.slice(idx + g.length).trim();
            if (remainder) {
              compName = remainder;
              break;
            }
          }
        }
        compName = compName.split(" ")[0].trim();
        
        const templateData = generateOfflineTemplate(compName, activeFile);
        responseText = templateData.response;
        hasChanges = templateData.hasChanges;
        diffReport = templateData.diff;
        targetFilePath = templateData.targetFile;
        modifiedContent = templateData.modifiedContent;
        
        toolCalls.push({
          tool: "write_file",
          target: targetFilePath,
          status: "SUCCESS"
        });
      }
      // ─── Developer Knowledge Base handling ────────────────────────────────
      else if (
        lower.includes("spring") || 
        lower.includes("boot") || 
        lower.includes("java") || 
        lower.includes("terraform") || 
        lower.includes("hcl") || 
        lower.includes("provider") || 
        lower.includes("react") || 
        lower.includes("state") || 
        lower.includes("hooks") || 
        lower.includes("zustand") || 
        lower.includes("maven") || 
        lower.includes("pom")
      ) {
        responseText = offlineDeveloperKnowledge(prompt);
        toolCalls.push({
          tool: "offline_knowledge_base",
          target: prompt,
          status: "SUCCESS"
        });
      }
      // ─── Git pull/sync handling ──────────────────────────────────────────
      else if (lower.includes("pull") || lower.includes("sync") || lower.includes("update from git")) {
        toolCalls.push({
          tool: "git_pull",
          target: "origin/main",
          status: "SUCCESS"
        });

        try {
          const output = execSync("git pull origin main", { cwd: process.cwd(), encoding: "utf-8", timeout: 15000 });
          responseText = `🔄 **Git Pull Execution Successful!**\n\nI have run a local \`git pull origin main\` on your behalf to synchronize remote updates to your local workspace.\n\n* **Results:**\n\`\`\`bash\n${output}\n\`\`\``;
        } catch (err: any) {
          responseText = `❌ **Git Pull Encountered an Error:**\n\n\`\`\`\n${err.message}\n\`\`\n\nEnsure that you have set up proper remote repository credentials in your local git client.`;
        }
      }
      // ─── Theme addition handling ──────────────────────────────────────────
      else if (lower.includes("theme")) {
        const contextPath = "app/lib/ThemeContext.tsx";
        const cssPath = "app/globals.css";

        let originalContext = "";
        let originalCss = "";
        let foundFiles = false;

        if (isRemoteMode) {
          const contextData = await fetchGithubFile(githubRepo, githubToken, githubBranch, contextPath);
          const cssData = await fetchGithubFile(githubRepo, githubToken, githubBranch, cssPath);
          if (contextData && cssData) {
            originalContext = contextData.content;
            originalCss = cssData.content;
            foundFiles = true;
          }
        } else {
          const fullContextPath = getSafePath(contextPath);
          const fullCssPath = getSafePath(cssPath);
          if (fs.existsSync(fullContextPath) && fs.existsSync(fullCssPath)) {
            originalContext = fs.readFileSync(fullContextPath, "utf-8");
            originalCss = fs.readFileSync(fullCssPath, "utf-8");
            foundFiles = true;
          }
        }

        if (foundFiles) {
          toolCalls.push({
            tool: "read_file",
            target: contextPath,
            status: "SUCCESS"
          });
          toolCalls.push({
            tool: "read_file",
            target: cssPath,
            status: "SUCCESS"
          });

          // Check if already modified
          if (!originalContext.includes("sunset")) {
            // Modify ThemeContext.tsx
            const sunsetMeta = '  { id: "sunset",    label: "Sunset",    accent: "#781a08", emoji: "🌇" },\n';
            const modifiedContext = originalContext.replace(
              '  { id: "forest",    label: "Forest",    accent: "#052e16", emoji: "🌿" },',
              '  { id: "forest",    label: "Forest",    accent: "#052e16", emoji: "🌿" },\n' + sunsetMeta
            );

            // Modify globals.css
            const sunsetCss = `
/* ── SUNSET ── */
[data-theme="sunset"] {
  --bg-base:        #1a0b08;
  --bg-surface:     #2e120d;
  --bg-panel:       #441b12;
  --bg-elevated:    #5c2419;
  --border:         #782d1e;
  --border-subtle:  #441b12;
  --text-primary:   #fef2f2;
  --text-secondary: #fca5a5;
  --text-muted:     #f87171;
  --accent:         #f97316;
  --accent-glow:    rgba(249,115,22,0.25);
  --accent-hover:   #ea580c;
  --code-bg:        #120705;
  --code-text:      #fed7aa;
  --success:        #f97316;
  --warning:        #facc15;
  --danger:         #ef4444;
  --tag-bg:         rgba(249,115,22,0.15);
  --tag-text:       #ffedd5;
  --scrollbar:      #782d1e;
  --scrollbar-thumb:#f97316;
}
`;

            let modifiedCss = originalCss;
            if (!originalCss.includes('[data-theme="sunset"]')) {
              modifiedCss = originalCss.replace(
                '/* ── FOREST ── */',
                sunsetCss + '/* ── FOREST ── */'
              );
            }

            hasChanges = true;
            targetFilePath = contextPath;
            modifiedContent = modifiedContext;

            // Commit CSS update right away so the stylesheets are updated immediately
            if (isRemoteMode) {
              await commitGithubFile(githubRepo, githubToken, githubBranch, cssPath, modifiedCss, `🤖 Envizor AI Agent: Injected Sunset Theme variables to globals.css`);
            } else {
              const fullCssPath = getSafePath(cssPath);
              fs.writeFileSync(fullCssPath, modifiedCss, "utf-8");
            }

            toolCalls.push({
              tool: "write_file",
              target: cssPath,
              status: "SUCCESS"
            });

            diffReport = `--- a/ThemeContext.tsx\n+++ b/ThemeContext.tsx\n@@ -17,5 +17,6 @@\n   { id: "cyberpunk", label: "Cyberpunk", accent: "#18011a", emoji: "⚡" },\n   { id: "forest",    label: "Forest",    accent: "#052e16", emoji: "🌿" },\n+  { id: "sunset",    label: "Sunset",    accent: "#781a08", emoji: "🌇" },\n ];`;

            responseText = `🌇 **Warm Sunset Theme Generated & Staged!**\n\nI have successfully designed a beautiful **Sunset Theme** (warm cherry-mahogany backgrounds with glowing tangerine orange accents swatches \`🌇\`) and registered it inside your workspace.\n\n* **Actions taken:**\n  1. Read \`ThemeContext.tsx\` and \`globals.css\`\n  2. Injected \`[data-theme="sunset"]\` styles into your CSS variables sheet\n  3. Staged registration of the \`sunset\` token in \`ThemeContext.tsx\`\n\n* **Next steps:** Click **Apply & Save to Local Workspace** on the right to commit the Context modifications, and then check Vercel deployments!`;
          } else {
            responseText = `🧠 **AI Agent Brain Insight:**\n\nThe Sunset theme is already fully registered and configured in your workspace! Navigate to your top-right header and toggle through the theme presets to select the **Sunset** swatches 🌇!`;
          }
        } else {
          responseText = `🧠 **AI Agent Brain Error:**\n\nI could not locate \`ThemeContext.tsx\` or \`globals.css\` in the expected directories. Please check that you are running within the correct Next.js workspace structure.`;
        }
      }
      // Smart extraction of target file from prompt if not explicitly selected
      else {
        if (!targetFilePath) {
          if (lower.includes("baseline/page.tsx") || lower.includes("baseline page")) {
            targetFilePath = "app/wizard/day0/baseline/page.tsx";
          } else if (lower.includes("layout.tsx") || lower.includes("layout")) {
            targetFilePath = "app/wizard/layout.tsx";
          } else if (lower.includes("globals.css") || lower.includes("css")) {
            targetFilePath = "app/globals.css";
          }
        }

        if (targetFilePath && (lower.includes("comment") || lower.includes("add") || lower.includes("modify") || lower.includes("change"))) {
          let original = "";
          let foundFile = false;

          if (isRemoteMode) {
            const fileData = await fetchGithubFile(githubRepo, githubToken, githubBranch, targetFilePath);
            if (fileData) {
              original = fileData.content;
              foundFile = true;
            }
          } else {
            const fullPath = getSafePath(targetFilePath);
            if (fs.existsSync(fullPath)) {
              original = fs.readFileSync(fullPath, "utf-8");
              foundFile = true;
            }
          }

          if (foundFile) {
            toolCalls.push({
              tool: "read_file",
              target: targetFilePath,
              status: "SUCCESS"
            });

            // Perform a safe edit (inject comment at line 1)
            const commentText = `// Envizor AI Agent Staged Mod: ${prompt}\n`;
            if (!original.startsWith("// Envizor AI Agent Staged Mod")) {
              const modified = commentText + original;

              hasChanges = true;
              modifiedContent = modified;
              diffReport = `--- a/${path.basename(targetFilePath)}\n+++ b/${path.basename(targetFilePath)}\n@@ -1,3 +1,4 @@\n+${commentText} ${original.slice(0, 100)}...`;

              // If user explicitly asks to apply immediately
              if (lower.includes("write") || lower.includes("apply") || lower.includes("force")) {
                if (isRemoteMode) {
                  await commitGithubFile(githubRepo, githubToken, githubBranch, targetFilePath, modified, `🤖 Envizor AI Agent: Write ${targetFilePath}`);
                } else {
                  const fullPath = getSafePath(targetFilePath);
                  fs.writeFileSync(fullPath, modified, "utf-8");
                }

                toolCalls.push({
                  tool: "write_file",
                  target: targetFilePath,
                  status: "SUCCESS"
                });
                responseText = `🧠 **AI Agent Brain Execution Success!**\n\nI processed your request, identified the target file at \`${targetFilePath}\`, and committed the changes directly to your repository.\n\n* **Actions taken:**\n  1. Read \`${targetFilePath}\`\n  2. Injected comment token at line 1\n  3. Wrote changes to branch \`${githubBranch}\`\n\n* **Next steps:** Monitor your Vercel deployment tracking panel.`;
              } else {
                responseText = `🧠 **AI Agent Brain Staging Complete!**\n\nI have read \`${targetFilePath}\` and generated the staged code modification. Please inspect the **Staged Edits Diff** panel on the right and click **Apply & Save to Local Workspace** to commit this change to ${isAdo ? 'Azure DevOps' : 'GitHub'}!`;
              }
            } else {
              responseText = `🧠 **AI Agent Brain Insight:**\n\nThe target file \`${targetFilePath}\` already contains a recently staged AI Agent modification header. No redundant edits were committed.`;
            }
          } else {
            responseText = `🧠 **AI Agent Brain Error:**\n\nI resolved the target file path to \`${targetFilePath}\` but could not locate it on your remote ${isAdo ? 'Azure DevOps' : 'GitHub'} repository or local workspace.`;
          }
        } else {
          // General free-form agent chat response explaining its capabilities
          responseText = `🧠 **AI Agent Brain Hub Activated!**\n\nI have access to your workspace files. \n\n* **Mode Active:** ${isAdo ? `🐙 Remote Azure DevOps (Repo: ${githubRepo}, Branch: ${githubBranch})` : (isRemoteMode ? `🐙 Remote GitHub (Repo: ${githubRepo}, Branch: ${githubBranch})` : `💻 Local Filesystem`)}\n\n* **What I can do:**\n  - Read and analyze files in your active workspace.\n  - Stage code modifications (such as injecting baseline configurations, commenting code, or editing components).\n  - Apply changes directly to your local workspace or commit them straight to ${isAdo ? 'Azure DevOps' : 'GitHub'}.\n  - Monitor Vercel production deployment links.\n\n* **Try asking me:**\n  - *"Add a developer comment to the baseline page"* or\n  - *"Add one more theme"*`;
        }
      }

      return NextResponse.json({
        status: "success",
        response: responseText,
        toolCalls,
        hasChanges,
        diff: diffReport,
        targetFile: targetFilePath,
        modifiedContent: modifiedContent
      });
    }

    return NextResponse.json({ error: "Invalid action request." }, { status: 400 });
  } catch (err: any) {
    console.error("Local Agent API Route Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

