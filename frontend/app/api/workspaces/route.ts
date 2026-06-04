export const runtime = "nodejs";

import fs from "fs";
import path from "path";
import os from "os";

import { getWorkspaceRoot } from "../../lib/workspaceConfig";

export async function GET() {
  const root = getWorkspaceRoot();

  try {
    const workspaces = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    return Response.json({ workspaces });
  } catch (err) {
    console.error("Error reading workspaces:", err);
    return Response.json(
      { error: "Failed to read workspaces", details: String(err) },
      { status: 500 }
    );
  }
}
