// app/api/wizard/push/files/route.ts
import { jsonResponse } from "@/app/lib/logging/logStream";
import { listWorkspaceFiles } from "@/app/lib/terraform/files";
import type { EnvName } from "@/app/lib/saviynt/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const env = (searchParams.get("env") ?? "DEV") as EnvName;

  const files = await listWorkspaceFiles(env);
  return jsonResponse({ env, files });
}
