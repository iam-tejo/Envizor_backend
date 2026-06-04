// app/lib/terraform/files.ts

import path from "path";
import fs from "fs/promises";
import type { EnvName } from "../saviynt/client";
import { ensureFolderStructure, getFolderForType, getWorkspaceRoot } from "./workspace";

// All 15 supported artefact types
export type ArtefactType =
  | "securitySystems"
  | "endpoints"
  | "dynamicAttributes"
  | "entitlementTypes"
  | "enterpriseRoles"
  | "entitlements"
  | "privileges"
  | "fileUploads"
  | "connections"
  | "jobs"
  | "transportPackages"
  | "roles"
  | "tasks"
  | "rules"
  | "lookups";

export async function writeArtefactFile(
  env: EnvName,
  type: ArtefactType,
  name: string,
  content: string
) {
  await ensureFolderStructure(env);
  const folder = getFolderForType(env, type);
  await fs.mkdir(folder, { recursive: true });
  const filePath = path.join(folder, `${name}.tf`);
  await fs.writeFile(filePath, content, "utf8");
  return filePath;
}

export async function updateOrCreateFile(
  env: EnvName,
  type: ArtefactType,
  name: string,
  content: string
) {
  return writeArtefactFile(env, type, name, content);
}

export async function listWorkspaceFiles(env: EnvName): Promise<string[]> {
  const root = getWorkspaceRoot(env);

  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const sub = await fs.readdir(path.join(root, entry.name));
        sub.forEach((f) => files.push(path.join(entry.name, f)));
      } else if (entry.isFile()) {
        files.push(entry.name);
      }
    }

    return files;
  } catch {
    return [];
  }
}
