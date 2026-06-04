import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { getWorkspaceRoot } from "../../../lib/workspaceConfig";

function walk(dir: string, base = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of list) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full);

    if (entry.isDirectory()) {
      results = results.concat(walk(full, base));
    } else {
      results.push(rel);
    }
  }

  return results;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ env: string }> }
) {
  const { env } = await context.params;
  const root = path.join(getWorkspaceRoot(), env);

  if (!fs.existsSync(root)) {
    return NextResponse.json(
      { error: `Environment folder not found: ${root}` },
      { status: 404 }
    );
  }

  const files = walk(root);
  return NextResponse.json({ files });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ env: string }> }
) {
  const { env } = await context.params;
  const root = path.join(getWorkspaceRoot(), env);

  try {
    if (!fs.existsSync(root)) {
      fs.mkdirSync(root, { recursive: true });
    }
    return NextResponse.json({ ok: true, message: `Directory created: ${root}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ env: string }> }
) {
  const { env } = await context.params;
  const root = path.join(getWorkspaceRoot(), env);

  try {
    if (fs.existsSync(root)) {
      fs.rmSync(root, { recursive: true, force: true });
    }
    return NextResponse.json({ ok: true, message: `Directory deleted: ${root}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

