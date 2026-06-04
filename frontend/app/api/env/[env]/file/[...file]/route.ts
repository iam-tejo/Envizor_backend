import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { getWorkspaceRoot } from "../../../../../lib/workspaceConfig";

export async function GET(req: Request, context: any) {
  // ⭐ Next.js 16.2.4: params is a Promise
  const params = await context.params;
  const { env, file } = params;

  const filePath = file.join("/");
  const root = path.join(getWorkspaceRoot(), env);
  const fullPath = path.join(root, filePath);

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ content: "" });
  }

  const content = fs.readFileSync(fullPath, "utf8");
  return NextResponse.json({ content });
}

export async function POST(req: Request, context: any) {
  const params = await context.params;
  const { env, file } = params;

  const filePath = file.join("/");
  const root = path.join(getWorkspaceRoot(), env);
  const fullPath = path.join(root, filePath);

  const body = await req.json();
let content = body.content;

if (content === "__EMPTY_FILE__") {
  content = "";
}

fs.writeFileSync(fullPath, content, "utf8");

  return NextResponse.json({ ok: true });
}
