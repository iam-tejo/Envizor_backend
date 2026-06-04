// lib/terraform/commands.ts
import type { EnvName } from "../saviynt/client";

export type TerraformCommand =
  | "plan"
  | "apply"
  | "destroy"
  | "refresh"
  | "fmt"
  | "state";

export interface TerraformCommandResult {
  success: boolean;
  output: string;
}

export async function runTerraformCommandMock(
  env: EnvName,
  command: TerraformCommand,
  args: string[] = []
): Promise<TerraformCommandResult> {
  // Mocked behaviour: just return a fake log
  const joinedArgs = args.join(" ");
  const output = [
    `Terraform mock runner`,
    `Environment: ${env}`,
    `Command: terraform ${command} ${joinedArgs}`.trim(),
    "",
    "This is a mocked Terraform execution.",
    "In a real implementation, this would spawn the terraform CLI,",
    "stream logs, and return the real exit code.",
  ].join("\n");

  const success = command !== "destroy"; // just for fun

  return { success, output };
}
