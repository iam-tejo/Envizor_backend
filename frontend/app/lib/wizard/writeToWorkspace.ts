import path from "path";
import { promises as fs } from "fs";

import { getWorkspaceRoot } from "../workspaceConfig";

export async function writeToWorkspace(env: string, files: Record<string, string>) {
  const envPath = path.join(getWorkspaceRoot(), env);

  // Ensure the env folder exists
  await fs.mkdir(envPath, { recursive: true });

  const written: string[] = [];

  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(envPath, filename);

    // Ensure nested folders exist
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    await fs.writeFile(filePath, content, "utf8");
    written.push(filename);
  }

  return {
    ok: true,
    written,
    workspace: envPath, // return correct folder
  };
}

