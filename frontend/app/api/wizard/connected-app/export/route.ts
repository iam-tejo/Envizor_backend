import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getWorkspaceRoot } from "../../../../lib/workspaceConfig";

export async function POST(req: Request) {
  try {
    const { appName, files } = await req.json();

    if (!appName || !files) {
      return NextResponse.json({ error: "Missing appName or files payload" }, { status: 400 });
    }

    // Clean app name for filesystem safety
    const safeAppName = appName.replace(/[^a-zA-Z0-9_-]/g, "_");
    
    const workspaceRoot = getWorkspaceRoot();

    const targetDir = path.join(workspaceRoot, "connected-apps", safeAppName);
    
    // Ensure directory exists
    await fs.mkdir(targetDir, { recursive: true });

    const written: string[] = [];

    // Write all configurations in the onboarding suite
    for (const [filename, content] of Object.entries(files)) {
      const fileContent = typeof content === "object" ? JSON.stringify(content, null, 2) : String(content);
      const filePath = path.join(targetDir, filename);
      await fs.writeFile(filePath, fileContent, "utf8");
      written.push(filename);
    }

    return NextResponse.json({
      success: true,
      path: targetDir,
      written,
    });
  } catch (err: any) {
    console.error("[Connected App Export Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

