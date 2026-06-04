// app/api/wizard/pull/artefacts/route.ts
import { jsonResponse } from "@/app/lib/logging/logStream";
import { createSaviyntClient, type EnvName } from "@/app/lib/saviynt/client";

export async function POST(req: Request) {
  const body = await req.json();
  const env = (body.env ?? "DEV") as EnvName;
  const types = (body.types ?? []) as string[];

  const client = createSaviyntClient(env);
  const result: Record<string, any[]> = {};

  if (types.includes("securitySystems"))   result.securitySystems   = await client.listSecuritySystems();
  if (types.includes("endpoints"))         result.endpoints         = await client.listEndpoints();
  if (types.includes("dynamicAttributes")) result.dynamicAttributes = await client.listDynamicAttributes();
  if (types.includes("entitlementTypes"))  result.entitlementTypes  = await client.listEntitlementTypes();
  if (types.includes("enterpriseRoles"))   result.enterpriseRoles   = await client.listEnterpriseRoles();
  if (types.includes("entitlements"))      result.entitlements      = await client.listEntitlements();
  if (types.includes("privileges"))        result.privileges        = await client.listPrivileges();
  if (types.includes("fileUploads"))       result.fileUploads       = await client.listFileUploads();
  if (types.includes("connections"))       result.connections       = await client.listConnections();
  if (types.includes("jobs"))              result.jobs              = await client.listJobs();
  if (types.includes("transportPackages")) result.transportPackages = await client.listTransportPackages();

  return jsonResponse(result);
}
