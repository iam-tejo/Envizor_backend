import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const isCloud = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
const ENV_FILE = isCloud
  ? "/tmp/.env.local"
  : path.join(process.cwd(), ".env.local");

export async function GET() {
  try {
    if (!fs.existsSync(ENV_FILE)) {
      return NextResponse.json({ exists: false, content: "", filePath: ENV_FILE });
    }
    const content = fs.readFileSync(ENV_FILE, "utf-8");
    return NextResponse.json({ exists: true, content, filePath: ENV_FILE });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
