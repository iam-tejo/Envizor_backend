// lib/saviynt/toTerraform.ts
import {
  SaviyntSecuritySystem,
  SaviyntEndpoint,
  SaviyntConnection,
} from "./client";

export function securitySystemToTf(ss: SaviyntSecuritySystem): string {
  return `resource "saviynt_security_system" "${ss.name}" {
  system_id   = "${ss.id}"
  name        = "${ss.name}"
  description = "${ss.description ?? ""}"
}
`;
}

export function endpointToTf(ep: SaviyntEndpoint): string {
  return `resource "saviynt_endpoint" "${ep.name}" {
  endpoint_id       = "${ep.id}"
  name              = "${ep.name}"
  security_system_id = "${ep.securitySystemId}"
}
`;
}

export function connectionToTf(conn: SaviyntConnection): string {
  return `resource "saviynt_connection" "${conn.name}" {
  connection_id = "${conn.id}"
  name          = "${conn.name}"
  type          = "${conn.type}"
}
`;
}
