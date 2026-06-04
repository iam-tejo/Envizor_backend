// app/api/wizard/push/command/route.ts
import { jsonResponse } from "@/app/lib/logging/logStream";
import type { EnvName } from "@/app/lib/saviynt/client";
import {
  runTerraformCommandMock,
  type TerraformCommand,
} from "@/app/lib/terraform/commands";

export async function POST(req: Request) {
  const body = await req.json();
  const env = (body.env ?? "DEV") as EnvName;
  const command = (body.command ?? "plan") as TerraformCommand;
  const args = (body.args ?? []) as string[];

  const result = await runTerraformCommandMock(env, command, args);

  return jsonResponse({
    env,
    command,
    args,
    success: result.success,
    output: result.output,
  });
}
