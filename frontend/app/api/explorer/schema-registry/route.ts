import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Path to the artefacts_schema.json in app/lib/saviynt/
const filePath = path.join(process.cwd(), "app/lib/saviynt/artefacts_schema.json");

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "artefacts_schema.json file not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const schemas = JSON.parse(fileContent);

    return NextResponse.json({ schemas });
  } catch (err: any) {
    console.error("Error reading Saviynt Provider schema registry:", err);
    return NextResponse.json({ error: err.message || "Failed to read schema registry" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { schemas } = body;

    if (!Array.isArray(schemas)) {
      return NextResponse.json({ error: "Invalid payload format. Expected schemas array." }, { status: 400 });
    }

    // Write back to artefacts_schema.json with pretty-printing
    fs.writeFileSync(filePath, JSON.stringify(schemas, null, 2), "utf-8");

    return NextResponse.json({ success: true, schemas });
  } catch (err: any) {
    console.error("Error saving Saviynt Provider schema registry:", err);
    return NextResponse.json({ error: err.message || "Failed to save schema registry" }, { status: 500 });
  }
}
