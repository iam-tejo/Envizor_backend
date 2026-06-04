import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getWorkspaceRoot } from "../../../../lib/workspaceConfig";

export async function GET(req: Request, context: any) {
  const params = await context.params;
  const { env } = params;

  const root = path.join(getWorkspaceRoot(), env);

  function walk(dir: string, prefix = ""): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let results: string[] = [];

    for (const entry of entries) {
      if (entry.name === ".DS_Store") continue; // ignore macOS junk

      const fullPath = path.join(dir, entry.name);
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        results.push(relPath + "/");      // ⭐ folder entry
        results = results.concat(walk(fullPath, relPath)); // ⭐ recurse
      } else {
        results.push(relPath);            // ⭐ file entry
      }
    }

    return results;
  }

  const files = walk(root);
  return NextResponse.json({ files });
}
