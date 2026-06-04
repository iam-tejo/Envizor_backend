import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { getWorkspaceRoot } from "../../../lib/workspaceConfig";

export async function GET(
  req: Request,
  context: { params: Promise<{ workspace: string }> }
) {
  const { workspace } = await context.params;
  const baseDir = path.join(getWorkspaceRoot(), workspace);

  console.log("🔍 Checking workspace:", baseDir);

  try {
    // ⭐ Ensure workspace folder exists
    await fs.access(baseDir);
    console.log("📁 Workspace exists:", baseDir);

    const files: string[] = [];

    async function walk(dir: string, rel: string) {
      const items = await fs.readdir(dir, { withFileTypes: true });
      for (const item of items) {
        const full = path.join(dir, item.name);
        const relPath = rel ? path.join(rel, item.name) : item.name;

        if (item.isDirectory()) {
          await walk(full, relPath);
        } else {
          files.push(relPath);
        }
      }
    }

    await walk(baseDir, "");

    console.log(`📄 Found ${files.length} files in ${workspace}`);

    return NextResponse.json(files);
  } catch (err: any) {
    console.error("❌ Workspace read error:", err);

    return NextResponse.json(
      {
        error: `Workspace '${workspace}' not found or unreadable`,
        path: baseDir,
        message: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
