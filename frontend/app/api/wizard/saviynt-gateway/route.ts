// app/api/wizard/saviynt-gateway/route.ts

import { NextResponse } from "next/server";
import { createSaviyntClient, EnvName } from "@/app/lib/saviynt/client";
import {
  listHelper,
  getHelper,
  createHelper,
  updateHelper,
  deleteHelper
} from "@/app/lib/saviynt/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, env, type, id, payload } = body;

    if (!action || !env || !type) {
      return NextResponse.json(
        { error: "Missing required fields: 'action', 'env', or 'type'" },
        { status: 400 }
      );
    }

    const envName = env.toUpperCase() as EnvName;
    if (envName !== "DEV" && envName !== "PRE" && envName !== "PROD") {
      return NextResponse.json(
        { error: `Invalid environment: ${env}` },
        { status: 400 }
      );
    }

    // Instantiates a secure, server-only client for the correct environment
    const client = createSaviyntClient(envName);

    console.log(`[Saviynt Gateway API] Received action '${action}' for env '${envName}', resource type '${type}'`);

    let result: any;
    switch (action) {
      case "list":
        result = await listHelper(client, type);
        break;
      case "get":
        if (!id) {
          return NextResponse.json({ error: "Missing 'id' for 'get' action" }, { status: 400 });
        }
        result = await getHelper(client, type, id);
        break;
      case "create":
        if (!payload) {
          return NextResponse.json({ error: "Missing 'payload' for 'create' action" }, { status: 400 });
        }
        result = await createHelper(client, type, payload);
        break;
      case "update":
        if (!id || !payload) {
          return NextResponse.json({ error: "Missing 'id' or 'payload' for 'update' action" }, { status: 400 });
        }
        result = await updateHelper(client, type, id, payload);
        break;
      case "delete":
        if (!id) {
          return NextResponse.json({ error: "Missing 'id' for 'delete' action" }, { status: 400 });
        }
        result = await deleteHelper(client, type, id);
        break;
      default:
        return NextResponse.json(
          { error: `Unsupported gateway action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`[Saviynt Gateway Error] Action execution failed:`, err);
    return NextResponse.json(
      { error: err.message || "Failed to execute Saviynt gateway operation" },
      { status: 500 }
    );
  }
}
