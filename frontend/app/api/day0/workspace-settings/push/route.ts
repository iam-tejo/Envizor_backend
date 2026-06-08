import { NextResponse } from "next/server";
import { pushWorkspaceToGit } from "@/app/lib/workspaceConfig";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await pushWorkspaceToGit(
      "Envizor GitOps: Automatically synchronized workspace structure and baseline configs"
    );
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.message
    });
  } catch (err: any) {
    console.error("GitOps Push Failed:", err);
    return NextResponse.json(
      { error: err.message || "Failed to commit and push configurations to GitHub." },
      { status: 500 }
    );
  }
}

