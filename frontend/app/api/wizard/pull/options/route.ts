// app/api/wizard/pull/options/route.ts
import { jsonResponse } from "@/app/lib/logging/logStream";

export async function GET() {
  return jsonResponse({
    types: [
      "securitySystems",
      "endpoints",
      "dynamicAttributes",
      "entitlementTypes",
      "enterpriseRoles",
      "entitlements",
      "privileges",
      "fileUploads",
      "connections",
      "jobs",
      "transportPackages",
    ],
  });
}
