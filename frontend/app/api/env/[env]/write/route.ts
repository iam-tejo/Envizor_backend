import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getWorkspaceRoot } from "../../../../lib/workspaceConfig";

export async function POST(
  req: Request,
  context: { params: Promise<{ env: string }> }
) {
  const { env } = await context.params;

  const body = await req.json();
  const { fullPath, content } = body;

  if (!fullPath) {
    return NextResponse.json(
      { error: "fullPath is required" },
      { status: 400 }
    );
  }

  const workspaceRoot = getWorkspaceRoot();

  const folder = path.join(workspaceRoot, env);
  const filePath = path.join(folder, fullPath);

  try {
    // Ensure nested folders exist
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // Write file
    fs.writeFileSync(filePath, content, "utf8");

    return NextResponse.json({ ok: true, file: fullPath });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
