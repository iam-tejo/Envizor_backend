// app/lib/saviynt/service.ts

import { EnvName } from "./client";

export interface SaviyntService {
  list(env: EnvName, type: string): Promise<any[]>;
  get(env: EnvName, type: string, id: string): Promise<any | null>;
  create(env: EnvName, type: string, payload: any): Promise<any>;
  update(env: EnvName, type: string, id: string, payload: any): Promise<any>;
  delete(env: EnvName, type: string, id: string): Promise<boolean>;
}

// Normalizes resource type strings (singular, plural, case-insensitive, with/without underscores)
export function normalizeType(type: string): string {
  const t = type.toLowerCase().replace(/_/g, "").replace(/s$/, ""); // singular lowercase without underscores
  if (t === "securitysystem") return "securitySystem";
  if (t === "endpoint") return "endpoint";
  if (t === "dynamicattribute") return "dynamicAttribute";
  if (t === "entitlementtype") return "entitlementType";
  if (t === "enterpriserole") return "enterpriseRole";
  if (t === "role") return "role";
  if (t === "entitlement") return "entitlement";
  if (t === "privilege") return "privilege";
  if (t === "fileupload") return "fileUpload";
  if (t === "connection") return "connection";
  if (t === "task" || t === "job") return "job";
  if (t === "rule") return "rule";
  if (t === "transportpackage") return "transportPackage";
  return type; // fallback
}

// Helper resolvers to run securely on the server side
export async function listHelper(client: any, type: string): Promise<any[]> {
  const norm = normalizeType(type);
  switch (norm) {
    case "securitySystem": return client.listSecuritySystems();
    case "endpoint": return client.listEndpoints();
    case "dynamicAttribute": return client.listDynamicAttributes();
    case "entitlementType": return client.listEntitlementTypes();
    case "enterpriseRole": return client.listEnterpriseRoles();
    case "role": return client.listRoles();
    case "entitlement": return client.listEntitlements();
    case "privilege": return client.listPrivileges();
    case "fileUpload": return client.listFileUploads();
    case "connection": return client.listConnections();
    case "job": return client.listJobs();
    case "rule": return client.listRules();
    case "transportPackage": return client.listTransportPackages();
    default:
      throw new Error(`Unsupported resource type: ${type}`);
  }
}

export async function getHelper(client: any, type: string, id: string): Promise<any | null> {
  const norm = normalizeType(type);
  switch (norm) {
    case "securitySystem": return client.getSecuritySystem(id);
    case "endpoint": return client.getEndpoint(id);
    case "dynamicAttribute": return client.getDynamicAttribute(id);
    case "entitlementType": return client.getEntitlementType(id);
    case "enterpriseRole": return client.getEnterpriseRole(id);
    case "role": return client.getRole(id);
    case "entitlement": return client.getEntitlement(id);
    case "privilege": return client.getPrivilege(id);
    case "fileUpload": return client.getFileUpload(id);
    case "connection": return client.getConnection(id);
    case "job": return client.getJob(id);
    case "rule": return client.getRule(id);
    case "transportPackage": return client.getTransportPackage(id);
    default:
      throw new Error(`Unsupported resource type: ${type}`);
  }
}

export async function createHelper(client: any, type: string, payload: any): Promise<any> {
  const norm = normalizeType(type);
  switch (norm) {
    case "securitySystem": return client.createSecuritySystem(payload);
    case "endpoint": return client.createEndpoint(payload);
    case "dynamicAttribute": return client.createDynamicAttribute(payload);
    case "entitlementType": return client.createEntitlementType(payload);
    case "enterpriseRole": return client.createEnterpriseRole(payload);
    case "role": return client.createRole(payload);
    case "entitlement": return client.createEntitlement(payload);
    case "privilege": return client.createPrivilege(payload);
    case "fileUpload": return client.createFileUpload(payload);
    case "connection": return client.createConnection(payload);
    case "job": return client.createJob(payload);
    case "rule": return client.createRule(payload);
    case "transportPackage": return client.createTransportPackage(payload);
    default:
      throw new Error(`Unsupported resource type: ${type}`);
  }
}

export async function updateHelper(client: any, type: string, id: string, payload: any): Promise<any> {
  const norm = normalizeType(type);
  switch (norm) {
    case "securitySystem": return client.updateSecuritySystem(id, payload);
    case "endpoint": return client.updateEndpoint(id, payload);
    case "dynamicAttribute": return client.updateDynamicAttribute(id, payload);
    case "entitlementType": return client.updateEntitlementType(id, payload);
    case "enterpriseRole": return client.updateEnterpriseRole(id, payload);
    case "role": return client.updateRole(id, payload);
    case "entitlement": return client.updateEntitlement(id, payload);
    case "privilege": return client.updatePrivilege(id, payload);
    case "fileUpload": return client.updateFileUpload(id, payload);
    case "connection": return client.updateConnection(id, payload);
    case "job": return client.updateJob(id, payload);
    case "rule": return client.updateRule(id, payload);
    case "transportPackage": return client.updateTransportPackage(id, payload);
    default:
      throw new Error(`Unsupported resource type: ${type}`);
  }
}

export async function deleteHelper(client: any, type: string, id: string): Promise<boolean> {
  const norm = normalizeType(type);
  switch (norm) {
    case "securitySystem": return client.deleteSecuritySystem(id);
    case "endpoint": return client.deleteEndpoint(id);
    case "dynamicAttribute": return client.deleteDynamicAttribute(id);
    case "entitlementType": return client.deleteEntitlementType(id);
    case "enterpriseRole": return client.deleteEnterpriseRole(id);
    case "role": return client.deleteRole(id);
    case "entitlement": return client.deleteEntitlement(id);
    case "privilege": return client.deletePrivilege(id);
    case "fileUpload": return client.deleteFileUpload(id);
    case "connection": return client.deleteConnection(id);
    case "job": return client.deleteJob(id);
    case "rule": return client.deleteRule(id);
    case "transportPackage": return client.deleteTransportPackage(id);
    default:
      throw new Error(`Unsupported resource type: ${type}`);
  }
}

// Executes secure browser payload dispatch when run inside public UI scripts
async function browserProxyCall(action: string, args: any) {
  const res = await fetch("/api/wizard/saviynt-gateway", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...args }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Gateway call failed with status: ${res.status}`);
  }
  return res.json();
}

export const saviyntService: SaviyntService = {
  async list(env, type) {
    if (typeof window === "undefined") {
      const { createSaviyntClient } = require("./client");
      const client = createSaviyntClient(env);
      return listHelper(client, type);
    } else {
      return browserProxyCall("list", { env, type });
    }
  },

  async get(env, type, id) {
    if (typeof window === "undefined") {
      const { createSaviyntClient } = require("./client");
      const client = createSaviyntClient(env);
      return getHelper(client, type, id);
    } else {
      return browserProxyCall("get", { env, type, id });
    }
  },

  async create(env, type, payload) {
    if (typeof window === "undefined") {
      const { createSaviyntClient } = require("./client");
      const client = createSaviyntClient(env);
      return createHelper(client, type, payload);
    } else {
      return browserProxyCall("create", { env, type, payload });
    }
  },

  async update(env, type, id, payload) {
    if (typeof window === "undefined") {
      const { createSaviyntClient } = require("./client");
      const client = createSaviyntClient(env);
      return updateHelper(client, type, id, payload);
    } else {
      return browserProxyCall("update", { env, type, id, payload });
    }
  },

  async delete(env, type, id) {
    if (typeof window === "undefined") {
      const { createSaviyntClient } = require("./client");
      const client = createSaviyntClient(env);
      return deleteHelper(client, type, id);
    } else {
      return browserProxyCall("delete", { env, type, id });
    }
  },
};
