import { NextResponse } from "next/server";
import { getSaviyntSource } from "@/app/lib/saviynt/getSource";

export async function POST(req: Request) {
  const { env, name, type } = await req.json();

  const source = await getSaviyntSource(env, type, name);

  return NextResponse.json({ source });
}
