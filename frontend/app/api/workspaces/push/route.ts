import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { getWorkspaceRoot } from "../../../lib/workspaceConfig";

export async function POST(req: Request) {
  const { source, target, path: filePath } = await req.json();

  try {
    const root = getWorkspaceRoot();
    const sourceFile = path.join(root, source, filePath);
    const targetFile = path.join(root, target, filePath);

    // Ensure target folder exists
    fs.mkdirSync(path.dirname(targetFile), { recursive: true });

    // Read from source
    const content = fs.readFileSync(sourceFile, "utf8");

    // Write to target
    fs.writeFileSync(targetFile, content, "utf8");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push error:", err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
