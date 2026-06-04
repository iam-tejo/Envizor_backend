import { NextResponse } from "next/server";
import { writeToWorkspace } from "@/app/lib/wizard/writeToWorkspace";

export async function POST(req: Request) {
  const { env, files } = await req.json();

  try {
    const result = await writeToWorkspace(env, files);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}
