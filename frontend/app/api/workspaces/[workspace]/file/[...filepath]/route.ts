import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

import { getWorkspaceRoot } from "@/app/lib/workspaceConfig";

// ⭐ Prevent directory traversal
function resolveSafePath(workspace: string, parts: string[]): string | null {
  const baseDir = path.join(getWorkspaceRoot(), workspace);
  const fullPath = path.join(baseDir, ...parts);
  const normalized = path.normalize(fullPath);

  if (!normalized.startsWith(baseDir)) {
    return null;
  }
  return normalized;
}

// ⭐ GET FILE CONTENT
export async function GET(
  req: Request,
  context: { params: Promise<{ workspace: string; filepath: string[] }> }
) {
  const { workspace, filepath } = await context.params;

  console.log("🔍 GET file:", workspace, filepath);

  const safePath = resolveSafePath(workspace, filepath);
  if (!safePath) {
    return NextResponse.json(
      { error: "Invalid file path (blocked for security)" },
      { status: 400 }
    );
  }

  try {
    const content = await fs.readFile(safePath, "utf8");
    return NextResponse.json({ content });
  } catch (err: any) {
    console.error("❌ File read error:", err);

    return NextResponse.json(
      {
        error: "File not found",
        path: safePath,
        message: err?.message ?? "Unknown error",
      },
      { status: 404 }
    );
  }
}

// ⭐ PUT — WRITE FILE CONTENT
export async function PUT(
  req: Request,
  context: { params: Promise<{ workspace: string; filepath: string[] }> }
) {
  const { workspace, filepath } = await context.params;

  console.log("✏️ PUT file:", workspace, filepath);

  const safePath = resolveSafePath(workspace, filepath);
  if (!safePath) {
    return NextResponse.json(
      { error: "Invalid file path (blocked for security)" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const content = body.content ?? "";

  console.log("SAFE PATH:", safePath);
  console.log("CONTENT LENGTH:", content.length);

  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(safePath), { recursive: true });

    // Write file
    await fs.writeFile(safePath, content, "utf8");

    console.log("✅ WRITE COMPLETED:", safePath);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("❌ File write error:", err);

    return NextResponse.json(
      {
        error: "Failed to write file",
        path: safePath,
        message: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
