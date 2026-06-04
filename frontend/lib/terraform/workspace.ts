// lib/terraform/workspace.ts
import path from "path";
import fs from "fs/promises";
import type { EnvName } from "../saviynt/client";

export function getWorkspaceRoot(env: EnvName): string {
  return path.join(process.cwd(), "terraform-workspaces", env);
}

export async function ensureFolderStructure(env: EnvName) {
  const root = getWorkspaceRoot(env);
  const folders = [
    root,
    path.join(root, "security-systems"),
    path.join(root, "endpoints"),
    path.join(root, "connections"),
  ];

  for (const folder of folders) {
    await fs.mkdir(folder, { recursive: true });
  }

  return root;
}
