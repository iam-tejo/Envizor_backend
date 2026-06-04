import path from "path";
import fs from "fs/promises";
import { getWorkspaceRoot as getConfigRoot } from "../workspaceConfig";
import type { EnvName } from "../saviynt/client";

export function getWorkspaceRoot(env: EnvName): string {
  const envKey = (env?.toUpperCase() || "DEV") as EnvName;
  return path.join(getConfigRoot(), envKey);
}

// All 11 EIC resource workspace subfolders
const WORKSPACE_FOLDERS = [
  "security-systems",
  "endpoints",
  "dynamic-attributes",
  "entitlement-types",
  "enterprise-roles",
  "entitlements",
  "privileges",
  "file-uploads",
  "connections",
  "jobs",
  "transport-packages",
  "lookups",
];

export async function ensureFolderStructure(env: EnvName) {
  const root = getWorkspaceRoot(env);

  const folders = [root, ...WORKSPACE_FOLDERS.map((f) => path.join(root, f))];

  for (const folder of folders) {
    await fs.mkdir(folder, { recursive: true });
  }

  return root;
}

export function getFolderForType(env: EnvName, type: string): string {
  const root = getWorkspaceRoot(env);
  const map: Record<string, string> = {
    securitySystems:    "security-systems",
    endpoints:          "endpoints",
    dynamicAttributes:  "dynamic-attributes",
    entitlementTypes:   "entitlement-types",
    enterpriseRoles:    "enterprise-roles",
    entitlements:       "entitlements",
    privileges:         "privileges",
    fileUploads:        "file-uploads",
    connections:        "connections",
    jobs:               "jobs",
    rules:              "jobs",          // rules map to jobs folder
    tasks:              "jobs",          // tasks alias
    transportPackages:  "transport-packages",
    lookups:            "lookups",
  };
  return path.join(root, map[type] ?? type);
}
