import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type TreeNode = {
  name: string;
  type: "file" | "folder";
  path: string;
  children?: TreeNode[];
};

import { getWorkspaceRoot } from "../../../../lib/workspaceConfig";

function buildTree(dir: string, basePath: string): TreeNode[] {
  let entries: fs.Dirent[] = [];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.error("Failed to read directory:", dir, err);
    return [];
  }

  return entries.map((entry) => {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory()) {
      return {
        name: entry.name,
        type: "folder",
        path: relativePath,
        children: buildTree(fullPath, relativePath),
      };
    }

    return {
      name: entry.name,
      type: "file",
      path: relativePath,
    };
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ workspace: string }> }
) {
  // ⭐ FIX: Next.js 16 requires awaiting params
  const { workspace } = await context.params;

  const root = path.join(getWorkspaceRoot(), workspace);

  if (!fs.existsSync(root)) {
    console.error("Workspace folder not found:", root);
    return NextResponse.json([], { status: 200 });
  }

  try {
    const tree = buildTree(root, "");
    return NextResponse.json(tree);
  } catch (err) {
    console.error("Tree API error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
