// app/api/day0/tenant-credentials/route.ts
// Reads and writes Saviynt tenant credentials to/from .env.local
// This runs server-side only — credentials never touch the browser.

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const isCloud = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
const ENV_FILE = isCloud
  ? "/tmp/.env.local"
  : path.join(process.cwd(), ".env.local");

// Keys we manage — we leave any other lines in .env.local untouched
const MANAGED_KEYS = [
  "SAVIYNT_DEV_URL",
  "SAVIYNT_DEV_USERNAME",
  "SAVIYNT_DEV_PASSWORD",
  "SAVIYNT_PRE_URL",
  "SAVIYNT_PRE_USERNAME",
  "SAVIYNT_PRE_PASSWORD",
  "SAVIYNT_PROD_URL",
  "SAVIYNT_PROD_USERNAME",
  "SAVIYNT_PROD_PASSWORD",
  "WORKSPACE_ROOT",
  "GITHUB_TOKEN",
];

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    result[key] = val;
  }
  return result;
}

function buildEnvFile(existing: Record<string, string>, updates: Record<string, string>): string {
  const merged = { ...existing, ...updates };

  // Build sections with comments
  const lines: string[] = [
    "# ─── Saviynt Tenant Credentials (managed by Envizor Day 0 setup) ──────────────",
    `SAVIYNT_DEV_URL=${merged["SAVIYNT_DEV_URL"] ?? ""}`,
    `SAVIYNT_DEV_USERNAME=${merged["SAVIYNT_DEV_USERNAME"] ?? ""}`,
    `SAVIYNT_DEV_PASSWORD=${merged["SAVIYNT_DEV_PASSWORD"] ?? ""}`,
    "",
    `SAVIYNT_PRE_URL=${merged["SAVIYNT_PRE_URL"] ?? ""}`,
    `SAVIYNT_PRE_USERNAME=${merged["SAVIYNT_PRE_USERNAME"] ?? ""}`,
    `SAVIYNT_PRE_PASSWORD=${merged["SAVIYNT_PRE_PASSWORD"] ?? ""}`,
    "",
    `SAVIYNT_PROD_URL=${merged["SAVIYNT_PROD_URL"] ?? ""}`,
    `SAVIYNT_PROD_USERNAME=${merged["SAVIYNT_PROD_USERNAME"] ?? ""}`,
    `SAVIYNT_PROD_PASSWORD=${merged["SAVIYNT_PROD_PASSWORD"] ?? ""}`,
    "",
    "# ─── Workspace & Git ─────────────────────────────────────────────────────────",
    `WORKSPACE_ROOT=${merged["WORKSPACE_ROOT"] ?? ""}`,
    `GITHUB_TOKEN=${merged["GITHUB_TOKEN"] ?? ""}`,
  ];

  // Append any unmanaged keys that were already in the file
  for (const [key, val] of Object.entries(merged)) {
    if (!MANAGED_KEYS.includes(key)) {
      lines.push(`${key}=${val}`);
    }
  }

  return lines.join("\n") + "\n";
}

export async function GET() {
  try {
    let existing: Record<string, string> = {};
    if (fs.existsSync(ENV_FILE)) {
      existing = parseEnvFile(fs.readFileSync(ENV_FILE, "utf-8"));
    } else if (isCloud) {
      const bundledEnv = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(bundledEnv)) {
        existing = parseEnvFile(fs.readFileSync(bundledEnv, "utf-8"));
      }
    }

    // Return only managed keys — never leak other env vars
    const safe: Record<string, string> = {};
    for (const key of MANAGED_KEYS) {
      safe[key] = existing[key] ?? "";
    }

    // Mask passwords and tokens in the response — we'll show them as placeholders
    // so the UI can show "set" vs "unset" without exposing the actual value
    const masked = { ...safe };
    for (const key of ["SAVIYNT_DEV_PASSWORD", "SAVIYNT_PRE_PASSWORD", "SAVIYNT_PROD_PASSWORD", "GITHUB_TOKEN"]) {
      if (masked[key]) masked[key] = "••••••••"; // signal "already set"
    }

    return NextResponse.json({ credentials: masked, fileExists: fs.existsSync(ENV_FILE) || (isCloud && fs.existsSync(path.join(process.cwd(), ".env.local"))) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: Record<string, string> = await req.json();

    // Read existing .env.local (to preserve unmanaged keys)
    let existing: Record<string, string> = {};
    if (fs.existsSync(ENV_FILE)) {
      existing = parseEnvFile(fs.readFileSync(ENV_FILE, "utf-8"));
    } else if (isCloud) {
      const bundledEnv = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(bundledEnv)) {
        existing = parseEnvFile(fs.readFileSync(bundledEnv, "utf-8"));
      }
    }

    // Only apply keys that are in our managed set
    const updates: Record<string, string> = {};
    for (const key of MANAGED_KEYS) {
      if (body[key] !== undefined) {
        // If the value is our mask sentinel, skip it (don't overwrite real value with mask)
        if (body[key] === "••••••••") continue;
        updates[key] = body[key];
      }
    }

    const newContent = buildEnvFile(existing, updates);
    fs.writeFileSync(ENV_FILE, newContent, "utf-8");

    // Re-load variables into process.env dynamically
    const { loadEnvLocalVariables } = require("../../../lib/workspaceConfig");
    try {
      loadEnvLocalVariables();
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
