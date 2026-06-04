import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getWorkspaceRoot } from "../../../../lib/workspaceConfig";

function normalizeContent(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .replace(/\s+$/gm, "")
    .trim();
}

function resolveEnvFolder(env: string) {
  const base = getWorkspaceRoot();
  return path.join(base, env.toUpperCase());
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const left = searchParams.get("left");
  const right = searchParams.get("right");
  const file = searchParams.get("path");

  if (!left || !right || !file) {
    return NextResponse.json({ error: "Missing parameters" });
  }

  const leftPath = path.join(resolveEnvFolder(left), file);
  const rightPath = path.join(resolveEnvFolder(right), file);

  const leftContent = fs.existsSync(leftPath)
    ? normalizeContent(fs.readFileSync(leftPath, "utf8"))
    : "";

  const rightContent = fs.existsSync(rightPath)
    ? normalizeContent(fs.readFileSync(rightPath, "utf8"))
    : "";

  return NextResponse.json({
    leftContent,
    rightContent,
  });
}
