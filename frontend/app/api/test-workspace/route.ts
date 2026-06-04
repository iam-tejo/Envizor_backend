import { ensureFolderStructure, getWorkspaceRoot } from "@/app/lib/terraform/workspace";

export async function GET() {
  return Response.json({
    ensureFolderStructure: typeof ensureFolderStructure,
    getWorkspaceRoot: typeof getWorkspaceRoot,
  });
}
