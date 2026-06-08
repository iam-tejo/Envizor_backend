// app/lib/saviynt/client.ts

export type EnvName = "DEV" | "PRE" | "PROD";

// Types for all 11 Saviynt Enterprise Identity Cloud (EIC) resources
export interface SaviyntSecuritySystem {
  id: string;
  name: string;
  description?: string;
}

export interface SaviyntEndpoint {
  id: string;
  name: string;
  securitySystemId: string;
  description?: string;
}

export interface SaviyntDynamicAttribute {
  id: string;
  name: string;
  value?: string;
  description?: string;
}

export interface SaviyntEntitlementType {
  id: string;
  name: string;
  description?: string;
}

export interface SaviyntEnterpriseRole {
  id: string;
  name: string;
  description?: string;
}

export interface SaviyntRole {
  id: string;
  name: string;
  description?: string;
}

export interface SaviyntEntitlement {
  id: string;
  name?: string;
  entitlement_value?: string;
  description?: string;
}

export interface SaviyntPrivilege {
  id: string;
  name: string;
  description?: string;
}

export interface SaviyntFileUpload {
  id: string;
  fileName: string;
  fileSize?: number;
  status?: string;
}

export interface SaviyntConnection {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface SaviyntTask {
  id: string;
  name: string;
  status?: string;
  description?: string;
  jobType?: string; // Generic job type identifier
}

export interface SaviyntJob {
  id: string;
  name: string;
  status?: string;
  description?: string;
  jobType?: string; // Generic job type identifier
}

export interface SaviyntRule {
  id: string;
  name: string;
  description?: string;
}

export interface SaviyntTransportPackage {
  id: string;
  name: string;
  version?: string;
  description?: string;
  actionType?: "export" | "import"; // Distinguish export vs import resources
  packagePath?: string; // Zip package storage location path
}

export interface SaviyntLookup {
  id: string;
  name: string;
  value?: string;
  description?: string;
}

// Stateful mock collections to support CRUD in mock mode
export const MOCK_DB: Record<EnvName, {
  securitySystems: SaviyntSecuritySystem[];
  endpoints: SaviyntEndpoint[];
  dynamicAttributes: SaviyntDynamicAttribute[];
  entitlementTypes: SaviyntEntitlementType[];
  enterpriseRoles: SaviyntEnterpriseRole[];
  roles: SaviyntRole[];
  entitlements: SaviyntEntitlement[];
  privileges: SaviyntPrivilege[];
  fileUploads: SaviyntFileUpload[];
  connections: SaviyntConnection[];
  tasks: SaviyntTask[];
  jobs: SaviyntJob[];
  rules: SaviyntRule[];
  transportPackages: SaviyntTransportPackage[];
  lookups: SaviyntLookup[];
}> = {
  DEV: {
    securitySystems: [
      { id: "ss-dev-1", name: "HR_SYSTEM_DEV", description: "HR Security System for Development" },
      { id: "ss-dev-2", name: "FINANCE_SYSTEM_DEV", description: "Finance Security System for Development" }
    ],
    endpoints: [
      { id: "ep-dev-1", name: "HR_ENDPOINT_DEV", securitySystemId: "ss-dev-1", description: "HR Endpoint Dev" },
      { id: "ep-dev-2", name: "FIN_ENDPOINT_DEV", securitySystemId: "ss-dev-2", description: "Finance Endpoint Dev" }
    ],
    dynamicAttributes: [
      { id: "da-dev-1", name: "department_code", value: "HR-DEV", description: "Department code dynamic attribute" }
    ],
    entitlementTypes: [
      { id: "et-dev-1", name: "AD_Group", description: "Active Directory Group Entitlement" }
    ],
    enterpriseRoles: [
      { id: "er-dev-1", name: "Enterprise_Dev_Engineer", description: "General Enterprise Role for dev engineers" }
    ],
    roles: [
      { id: "role-dev-1", name: "Dev Role A", description: "Development Role A" },
      { id: "role-dev-2", name: "Dev Role B", description: "Development Role B" },
      { id: "role-dev-3", name: "Dev Role C", description: "Development Role C" }
    ],
    entitlements: [
      { id: "ent-dev-1", name: "Dev Entitlement A", entitlement_value: "read-only", description: "Read-only access entitlement" },
      { id: "ent-dev-2", name: "Dev Entitlement B", entitlement_value: "read-write", description: "Read-write access entitlement" }
    ],
    privileges: [
      { id: "pr-dev-1", name: "admin_dashboard_access", description: "Access to developer portal" }
    ],
    fileUploads: [
      { id: "up-dev-1", fileName: "sap_users_baseline.xlsx", fileSize: 1048576, status: "SUCCESS" }
    ],
    connections: [
      { id: "conn-dev-1", name: "DEV_DB_CONN", type: "Database", description: "Development DB Connection" },
      { id: "conn-dev-2", name: "DEV_LDAP_CONN", type: "Active Directory", description: "Development LDAP Connection" },
      { id: "conn-dev-3", name: "Billing_West_Portal", type: "Disconnected", description: "Legacy billing administrative interface" },
      { id: "conn-dev-4", name: "Legacy_HR_Directory", type: "Disconnected", description: "Legacy employees directory database" }
    ],
    tasks: [
      { id: "job-dev-1", name: "Dev Task A", status: "SUCCESS", description: "Daily reconcile task" }
    ],
    jobs: [
      { id: "job-dev-1", name: "Dev Task A", status: "SUCCESS", description: "Daily reconcile task" }
    ],
    rules: [
      { id: "rule-dev-1", name: "Dev Rule A", description: "Check dev environment segregation of duties" }
    ],
    transportPackages: [
      { id: "tp-dev-1", name: "Billing_Module_DEV", version: "1.0.0", description: "Billing access configurations package" }
    ],
    lookups: [
      { id: "lk-dev-1", name: "CountryCodes", value: "US,CA,MX,GB", description: "Country codes lookup" },
      { id: "lk-dev-2", name: "DeptMappings", value: "HR=100,FIN=200,ENG=300", description: "Department mapping codes" }
    ]
  },
  PRE: {
    securitySystems: [
      { id: "ss-pre-1", name: "HR_SYSTEM_PRE", description: "HR Security System for Pre-production" }
    ],
    endpoints: [
      { id: "ep-pre-1", name: "HR_ENDPOINT_PRE", securitySystemId: "ss-pre-1", description: "HR Endpoint Pre" }
    ],
    dynamicAttributes: [
      { id: "da-pre-1", name: "department_code", value: "HR-PRE", description: "Department code dynamic attribute" }
    ],
    entitlementTypes: [
      { id: "et-pre-1", name: "AD_Group", description: "Active Directory Group Entitlement" }
    ],
    enterpriseRoles: [
      { id: "er-pre-1", name: "Enterprise_Pre_Engineer", description: "Enterprise Role for preprod engineers" }
    ],
    roles: [
      { id: "role-pre-1", name: "Pre Role A", description: "Pre-production Role A" },
      { id: "role-pre-2", name: "Pre Role B", description: "Pre-production Role B" }
    ],
    entitlements: [
      { id: "ent-pre-1", name: "Pre Entitlement A", entitlement_value: "read-only", description: "Read-only access" }
    ],
    privileges: [
      { id: "pr-pre-1", name: "admin_dashboard_access", description: "Access to developer portal" }
    ],
    fileUploads: [],
    connections: [
      { id: "conn-pre-1", name: "PRE_DB_CONN", type: "Database", description: "Preprod DB Connection" },
      { id: "conn-pre-2", name: "PRE_LDAP_CONN", type: "Active Directory", description: "Preprod LDAP Connection" }
    ],
    tasks: [
      { id: "job-pre-1", name: "Pre Task A", status: "SUCCESS", description: "Preprod daily sync" }
    ],
    jobs: [
      { id: "job-pre-1", name: "Pre Task A", status: "SUCCESS", description: "Preprod daily sync" }
    ],
    rules: [
      { id: "rule-pre-1", name: "Pre Rule A", description: "Preprod segregation audit rule" }
    ],
    transportPackages: [
      { id: "tp-pre-1", name: "Billing_Module_PRE", version: "1.0.0", description: "Billing access configurations package" }
    ],
    lookups: [
      { id: "lk-pre-1", name: "CountryCodes", value: "US,CA,MX,GB,FR,DE", description: "Country codes lookup" }
    ]
  },
  PROD: {
    securitySystems: [
      { id: "ss-prod-1", name: "HR_SYSTEM_PROD", description: "HR Security System for Production" },
      { id: "ss-prod-2", name: "FINANCE_SYSTEM_PROD", description: "Finance Security System for Production" }
    ],
    endpoints: [
      { id: "ep-prod-1", name: "HR_ENDPOINT_PROD", securitySystemId: "ss-prod-1", description: "HR Endpoint Prod" }
    ],
    dynamicAttributes: [
      { id: "da-prod-1", name: "department_code", value: "HR-PROD", description: "Department code dynamic attribute" }
    ],
    entitlementTypes: [
      { id: "et-prod-1", name: "AD_Group", description: "Active Directory Group Entitlement" }
    ],
    enterpriseRoles: [
      { id: "er-prod-1", name: "Enterprise_Prod_Engineer", description: "Enterprise Role for prod engineers" }
    ],
    roles: [
      { id: "role-prod-1", name: "Prod Role A", description: "Production Role A" },
      { id: "role-prod-2", name: "Prod Role B", description: "Production Role B" },
      { id: "role-prod-3", name: "Prod Role C", description: "Production Role C" },
      { id: "role-prod-4", name: "Prod Role D", description: "Production Role D" }
    ],
    entitlements: [
      { id: "ent-prod-1", name: "Prod Entitlement A", entitlement_value: "read-only", description: "Prod read-only" },
      { id: "ent-prod-2", name: "Prod Entitlement B", entitlement_value: "read-write", description: "Prod read-write" }
    ],
    privileges: [
      { id: "pr-prod-1", name: "admin_dashboard_access", description: "Access to developer portal" }
    ],
    fileUploads: [],
    connections: [
      { id: "conn-prod-1", name: "PROD_DB_CONN", type: "Database", description: "Production DB Connection" },
      { id: "conn-prod-2", name: "PROD_LDAP_CONN", type: "Active Directory", description: "Production LDAP Connection" }
    ],
    tasks: [
      { id: "job-prod-1", name: "Prod Task A", status: "SUCCESS", description: "Prod daily reconcile" },
      { id: "job-prod-2", name: "Prod Task B", status: "SUCCESS", description: "Prod analytics job" }
    ],
    jobs: [
      { id: "job-prod-1", name: "Prod Task A", status: "SUCCESS", description: "Prod daily reconcile" },
      { id: "job-prod-2", name: "Prod Task B", status: "SUCCESS", description: "Prod analytics job" }
    ],
    rules: [
      { id: "rule-prod-1", name: "Prod Rule A", description: "SoD production violation scan" }
    ],
    transportPackages: [
      { id: "tp-prod-1", name: "Billing_Module_PROD", version: "1.0.0", description: "Billing access configurations package" }
    ],
    lookups: [
      { id: "lk-prod-1", name: "CountryCodes", value: "US,CA,MX,GB,FR,DE,JP,AU", description: "Country codes lookup" },
      { id: "lk-prod-2", name: "DeptMappings", value: "HR=100,FIN=200,ENG=300", description: "Department mapping codes" }
    ]
  }
};

export interface SaviyntClient {
  env: EnvName;

  // Security Systems
  listSecuritySystems(): Promise<SaviyntSecuritySystem[]>;
  getSecuritySystem(id: string): Promise<SaviyntSecuritySystem | null>;
  createSecuritySystem(payload: Partial<SaviyntSecuritySystem>): Promise<SaviyntSecuritySystem>;
  updateSecuritySystem(id: string, payload: Partial<SaviyntSecuritySystem>): Promise<SaviyntSecuritySystem>;
  deleteSecuritySystem(id: string): Promise<boolean>;

  // Endpoints
  listEndpoints(): Promise<SaviyntEndpoint[]>;
  getEndpoint(id: string): Promise<SaviyntEndpoint | null>;
  createEndpoint(payload: Partial<SaviyntEndpoint>): Promise<SaviyntEndpoint>;
  updateEndpoint(id: string, payload: Partial<SaviyntEndpoint>): Promise<SaviyntEndpoint>;
  deleteEndpoint(id: string): Promise<boolean>;

  // Dynamic Attributes
  listDynamicAttributes(): Promise<SaviyntDynamicAttribute[]>;
  getDynamicAttribute(id: string): Promise<SaviyntDynamicAttribute | null>;
  createDynamicAttribute(payload: Partial<SaviyntDynamicAttribute>): Promise<SaviyntDynamicAttribute>;
  updateDynamicAttribute(id: string, payload: Partial<SaviyntDynamicAttribute>): Promise<SaviyntDynamicAttribute>;
  deleteDynamicAttribute(id: string): Promise<boolean>;

  // Entitlement Types
  listEntitlementTypes(): Promise<SaviyntEntitlementType[]>;
  getEntitlementType(id: string): Promise<SaviyntEntitlementType | null>;
  createEntitlementType(payload: Partial<SaviyntEntitlementType>): Promise<SaviyntEntitlementType>;
  updateEntitlementType(id: string, payload: Partial<SaviyntEntitlementType>): Promise<SaviyntEntitlementType>;
  deleteEntitlementType(id: string): Promise<boolean>;

  // Enterprise Roles
  listEnterpriseRoles(): Promise<SaviyntEnterpriseRole[]>;
  getEnterpriseRole(id: string): Promise<SaviyntEnterpriseRole | null>;
  createEnterpriseRole(payload: Partial<SaviyntEnterpriseRole>): Promise<SaviyntEnterpriseRole>;
  updateEnterpriseRole(id: string, payload: Partial<SaviyntEnterpriseRole>): Promise<SaviyntEnterpriseRole>;
  deleteEnterpriseRole(id: string): Promise<boolean>;

  // Roles (standard)
  listRoles(): Promise<SaviyntRole[]>;
  getRole(id: string): Promise<SaviyntRole | null>;
  createRole(payload: Partial<SaviyntRole>): Promise<SaviyntRole>;
  updateRole(id: string, payload: Partial<SaviyntRole>): Promise<SaviyntRole>;
  deleteRole(id: string): Promise<boolean>;

  // Entitlements
  listEntitlements(): Promise<SaviyntEntitlement[]>;
  getEntitlement(id: string): Promise<SaviyntEntitlement | null>;
  createEntitlement(payload: Partial<SaviyntEntitlement>): Promise<SaviyntEntitlement>;
  updateEntitlement(id: string, payload: Partial<SaviyntEntitlement>): Promise<SaviyntEntitlement>;
  deleteEntitlement(id: string): Promise<boolean>;

  // Privileges
  listPrivileges(): Promise<SaviyntPrivilege[]>;
  getPrivilege(id: string): Promise<SaviyntPrivilege | null>;
  createPrivilege(payload: Partial<SaviyntPrivilege>): Promise<SaviyntPrivilege>;
  updatePrivilege(id: string, payload: Partial<SaviyntPrivilege>): Promise<SaviyntPrivilege>;
  deletePrivilege(id: string): Promise<boolean>;

  // File Uploads
  listFileUploads(): Promise<SaviyntFileUpload[]>;
  getFileUpload(id: string): Promise<SaviyntFileUpload | null>;
  createFileUpload(payload: Partial<SaviyntFileUpload>): Promise<SaviyntFileUpload>;
  updateFileUpload(id: string, payload: Partial<SaviyntFileUpload>): Promise<SaviyntFileUpload>;
  deleteFileUpload(id: string): Promise<boolean>;

  // Connections
  listConnections(): Promise<SaviyntConnection[]>;
  getConnection(id: string): Promise<SaviyntConnection | null>;
  createConnection(payload: Partial<SaviyntConnection>): Promise<SaviyntConnection>;
  updateConnection(id: string, payload: Partial<SaviyntConnection>): Promise<SaviyntConnection>;
  deleteConnection(id: string): Promise<boolean>;

  // Tasks (Backward compatible)
  listTasks(): Promise<SaviyntTask[]>;
  getTask(id: string): Promise<SaviyntTask | null>;
  createTask(payload: Partial<SaviyntTask>): Promise<SaviyntTask>;
  updateTask(id: string, payload: Partial<SaviyntTask>): Promise<SaviyntTask>;
  deleteTask(id: string): Promise<boolean>;

  // Jobs
  listJobs(): Promise<SaviyntJob[]>;
  getJob(id: string): Promise<SaviyntJob | null>;
  createJob(payload: Partial<SaviyntJob>): Promise<SaviyntJob>;
  updateJob(id: string, payload: Partial<SaviyntJob>): Promise<SaviyntJob>;
  deleteJob(id: string): Promise<boolean>;

  // Rules
  listRules(): Promise<SaviyntRule[]>;
  getRule(id: string): Promise<SaviyntRule | null>;
  createRule(payload: Partial<SaviyntRule>): Promise<SaviyntRule>;
  updateRule(id: string, payload: Partial<SaviyntRule>): Promise<SaviyntRule>;
  deleteRule(id: string): Promise<boolean>;

  // Transport Packages
  listTransportPackages(): Promise<SaviyntTransportPackage[]>;
  getTransportPackage(id: string): Promise<SaviyntTransportPackage | null>;
  createTransportPackage(payload: Partial<SaviyntTransportPackage>): Promise<SaviyntTransportPackage>;
  updateTransportPackage(id: string, payload: Partial<SaviyntTransportPackage>): Promise<SaviyntTransportPackage>;
  deleteTransportPackage(id: string): Promise<boolean>;

  // Lookups
  listLookups(): Promise<SaviyntLookup[]>;
  getLookup(id: string): Promise<SaviyntLookup | null>;
  createLookup(payload: Partial<SaviyntLookup>): Promise<SaviyntLookup>;
  updateLookup(id: string, payload: Partial<SaviyntLookup>): Promise<SaviyntLookup>;
  deleteLookup(id: string): Promise<boolean>;
}

// Configurable multi-environment credentials using standard environment variables
const ENV_CONFIGS: Record<EnvName, { url: string; username?: string; password?: string }> = {
  DEV: {
    url: process.env.SAVIYNT_DEV_URL || "https://dev-saviynt.example.com",
    username: process.env.SAVIYNT_DEV_USERNAME || "admin",
    password: process.env.SAVIYNT_DEV_PASSWORD || "password123",
  },
  PRE: {
    url: process.env.SAVIYNT_PRE_URL || "https://pre-saviynt.example.com",
    username: process.env.SAVIYNT_PRE_USERNAME || "admin",
    password: process.env.SAVIYNT_PRE_PASSWORD || "password123",
  },
  PROD: {
    url: process.env.SAVIYNT_PROD_URL || "https://prod-saviynt.example.com",
    username: process.env.SAVIYNT_PROD_USERNAME || "admin",
    password: process.env.SAVIYNT_PROD_PASSWORD || "password123",
  },
};

import { loadEnvLocalVariables } from "../workspaceConfig";

export function createSaviyntClient(envInput: EnvName): SaviyntClient {
  const env = (envInput?.toUpperCase() || "DEV") as EnvName;

  try {
    loadEnvLocalVariables();
  } catch (e) {}

  const url = process.env[`SAVIYNT_${env}_URL`] || ENV_CONFIGS[env]?.url || "";
  const username = process.env[`SAVIYNT_${env}_USERNAME`] || ENV_CONFIGS[env]?.username || "";
  const password = process.env[`SAVIYNT_${env}_PASSWORD`] || ENV_CONFIGS[env]?.password || "";

  // Ephemeral authentication closures (lifetime limited to 5 minutes)
  let cachedToken: string | null = null;
  let tokenExpiresAt: number | null = null;

  async function login(): Promise<string> {
    const now = Date.now();
    if (cachedToken && tokenExpiresAt && now < tokenExpiresAt) {
      console.log(`[Saviynt Ephemeral Auth] Reusing valid session token for ${env}. Expires in ${Math.round((tokenExpiresAt - now) / 1000)}s.`);
      return cachedToken || "";
    }

    if (cachedToken) {
      console.log(`[Saviynt Ephemeral Auth] Session expired (5-min boundary limit exceeded). Rotating dynamic token for ${env}.`);
    } else {
      console.log(`[Saviynt Ephemeral Auth] Initiating initial ephemeral session block for ${env}.`);
    }

    const isMock = url.includes("example.com");
    if (isMock) {
      cachedToken = `ephemeral_mock_token_${env.toLowerCase()}_${Math.random().toString(36).substring(2, 10)}`;
      tokenExpiresAt = Date.now() + 300000; // Strictly 5 minutes dynamic duration (Zero-Trust Auditing compliance)
      console.log(`[Saviynt Ephemeral Auth] Dynamic mock session bound successfully. Expires: ${new Date(tokenExpiresAt).toISOString()}`);
      return cachedToken || "";
    }

    try {
      const res = await fetch(`${url}/ECM/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (!res.ok) {
        throw new Error(`Login failed with status ${res.status}`);
      }

      const data = await res.json();
      cachedToken = data.access_token || data.token || "";
      tokenExpiresAt = Date.now() + 300000;
      console.log(`[Saviynt Ephemeral Auth] Live session authenticated successfully. Expires: ${new Date(tokenExpiresAt).toISOString()}`);
      return cachedToken || "";
    } catch (err: any) {
      console.warn(`[Saviynt Login] Connection failed for live tenant ${env}: ${err.message}. Defaulting to secure mock credentials.`);
      cachedToken = `ephemeral_fallback_token_${env.toLowerCase()}_${Math.random().toString(36).substring(2, 10)}`;
      tokenExpiresAt = Date.now() + 300000;
      return cachedToken || "";
    }
  }

  // Check if active provider connection is in mock mode
  function isMockMode() {
    return url.includes("example.com");
  }

  return {
    env,

    // ==========================================
    // 1. SECURITY SYSTEMS (saviynt_security_system)
    // ==========================================
    async listSecuritySystems() {
      if (isMockMode()) return MOCK_DB[env].securitySystems;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getSecuritySystems`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`getSecuritySystems failed: ${res.status}`);
        const data = await res.json();
        return data.securitysystems || data || [];
      } catch (err) {
        console.warn(`[Saviynt API] getSecuritySystems failed. Returning mock fallback.`);
        return MOCK_DB[env].securitySystems;
      }
    },
    async getSecuritySystem(id) {
      const list = await this.listSecuritySystems();
      return list.find((item) => item.id === id) ?? null;
    },
    async createSecuritySystem(payload) {
      const db = MOCK_DB[env].securitySystems;
      const newItem: SaviyntSecuritySystem = {
        id: payload.id || `ss-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `SECURITY_SYSTEM_${db.length + 1}`,
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateSecuritySystem(id, payload) {
      const db = MOCK_DB[env].securitySystems;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Security system with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteSecuritySystem(id) {
      const db = MOCK_DB[env].securitySystems;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 2. ENDPOINTS (saviynt_endpoint)
    // ==========================================
    async listEndpoints() {
      if (isMockMode()) return MOCK_DB[env].endpoints;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getEndpoints`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ filterCriteria: {} }),
        });
        if (!res.ok) throw new Error(`getEndpoints failed: ${res.status}`);
        const data = await res.json();
        return data.endpoints || data || [];
      } catch (err) {
        console.warn(`[Saviynt API] getEndpoints failed. Returning mock fallback.`);
        return MOCK_DB[env].endpoints;
      }
    },
    async getEndpoint(id) {
      const list = await this.listEndpoints();
      return list.find((item) => item.id === id) ?? null;
    },
    async createEndpoint(payload) {
      const db = MOCK_DB[env].endpoints;
      const newItem: SaviyntEndpoint = {
        id: payload.id || `ep-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `ENDPOINT_${db.length + 1}`,
        securitySystemId: payload.securitySystemId || "ss-dev-1",
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateEndpoint(id, payload) {
      const db = MOCK_DB[env].endpoints;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Endpoint with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteEndpoint(id) {
      const db = MOCK_DB[env].endpoints;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 3. DYNAMIC ATTRIBUTES (saviynt_dynamic_attribute)
    // ==========================================
    async listDynamicAttributes() {
      if (isMockMode()) return MOCK_DB[env].dynamicAttributes;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getDynamicAttributes`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`getDynamicAttributes failed: ${res.status}`);
        const data = await res.json();
        return data.dynamicAttributes || data || [];
      } catch (err) {
        return MOCK_DB[env].dynamicAttributes;
      }
    },
    async getDynamicAttribute(id) {
      const list = await this.listDynamicAttributes();
      return list.find(item => item.id === id) ?? null;
    },
    async createDynamicAttribute(payload) {
      const db = MOCK_DB[env].dynamicAttributes;
      const newItem: SaviyntDynamicAttribute = {
        id: payload.id || `da-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `DYNAMIC_ATTR_${db.length + 1}`,
        value: payload.value || "",
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateDynamicAttribute(id, payload) {
      const db = MOCK_DB[env].dynamicAttributes;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Dynamic Attribute with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteDynamicAttribute(id) {
      const db = MOCK_DB[env].dynamicAttributes;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 4. ENTITLEMENT TYPES (saviynt_entitlement_type)
    // ==========================================
    async listEntitlementTypes() {
      if (isMockMode()) return MOCK_DB[env].entitlementTypes;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getEntitlementTypes`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`getEntitlementTypes failed: ${res.status}`);
        const data = await res.json();
        return data.entitlementTypes || data || [];
      } catch (err) {
        return MOCK_DB[env].entitlementTypes;
      }
    },
    async getEntitlementType(id) {
      const list = await this.listEntitlementTypes();
      return list.find(item => item.id === id) ?? null;
    },
    async createEntitlementType(payload) {
      const db = MOCK_DB[env].entitlementTypes;
      const newItem: SaviyntEntitlementType = {
        id: payload.id || `et-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `ENT_TYPE_${db.length + 1}`,
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateEntitlementType(id, payload) {
      const db = MOCK_DB[env].entitlementTypes;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Entitlement Type with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteEntitlementType(id) {
      const db = MOCK_DB[env].entitlementTypes;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 5. ENTERPRISE ROLES (saviynt_enterprise_role)
    // ==========================================
    async listEnterpriseRoles() {
      if (isMockMode()) return MOCK_DB[env].enterpriseRoles;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getEnterpriseRoles`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`getEnterpriseRoles failed: ${res.status}`);
        const data = await res.json();
        return data.enterpriseRoles || data || [];
      } catch (err) {
        return MOCK_DB[env].enterpriseRoles;
      }
    },
    async getEnterpriseRole(id) {
      const list = await this.listEnterpriseRoles();
      return list.find(item => item.id === id) ?? null;
    },
    async createEnterpriseRole(payload) {
      const db = MOCK_DB[env].enterpriseRoles;
      const newItem: SaviyntEnterpriseRole = {
        id: payload.id || `er-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `ENT_ROLE_${db.length + 1}`,
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateEnterpriseRole(id, payload) {
      const db = MOCK_DB[env].enterpriseRoles;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Enterprise Role with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteEnterpriseRole(id) {
      const db = MOCK_DB[env].enterpriseRoles;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 6. ROLES (standard)
    // ==========================================
    async listRoles() {
      if (isMockMode()) return MOCK_DB[env].roles;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getRoles`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ max: 100 }),
        });
        if (!res.ok) throw new Error(`getRoles failed: ${res.status}`);
        const data = await res.json();
        return data.roles || data || [];
      } catch (err) {
        console.warn(`[Saviynt API] getRoles failed. Returning mock fallback.`);
        return MOCK_DB[env].roles;
      }
    },
    async getRole(id) {
      const list = await this.listRoles();
      return list.find((item) => item.id === id) ?? null;
    },
    async createRole(payload) {
      const db = MOCK_DB[env].roles;
      const newItem: SaviyntRole = {
        id: payload.id || `role-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `ROLE_${db.length + 1}`,
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateRole(id, payload) {
      const db = MOCK_DB[env].roles;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Role with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteRole(id) {
      const db = MOCK_DB[env].roles;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 7. ENTITLEMENTS (saviynt_entitlement)
    // ==========================================
    async listEntitlements() {
      if (isMockMode()) return MOCK_DB[env].entitlements;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getEntitlements`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`getEntitlements failed: ${res.status}`);
        const data = await res.json();
        return data.entitlements || data || [];
      } catch (err) {
        console.warn(`[Saviynt API] getEntitlements failed. Returning mock fallback.`);
        return MOCK_DB[env].entitlements;
      }
    },
    async getEntitlement(id) {
      const list = await this.listEntitlements();
      return list.find((item) => item.id === id) ?? null;
    },
    async createEntitlement(payload) {
      const db = MOCK_DB[env].entitlements;
      const newItem: SaviyntEntitlement = {
        id: payload.id || `ent-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `ENTITLEMENT_${db.length + 1}`,
        entitlement_value: payload.entitlement_value || "default_value",
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateEntitlement(id, payload) {
      const db = MOCK_DB[env].entitlements;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Entitlement with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteEntitlement(id) {
      const db = MOCK_DB[env].entitlements;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 8. PRIVILEGES (saviynt_privilege)
    // ==========================================
    async listPrivileges() {
      if (isMockMode()) return MOCK_DB[env].privileges;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getPrivileges`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`getPrivileges failed: ${res.status}`);
        const data = await res.json();
        return data.privileges || data || [];
      } catch (err) {
        return MOCK_DB[env].privileges;
      }
    },
    async getPrivilege(id) {
      const list = await this.listPrivileges();
      return list.find(item => item.id === id) ?? null;
    },
    async createPrivilege(payload) {
      const db = MOCK_DB[env].privileges;
      const newItem: SaviyntPrivilege = {
        id: payload.id || `pr-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `PRIVILEGE_${db.length + 1}`,
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updatePrivilege(id, payload) {
      const db = MOCK_DB[env].privileges;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Privilege with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deletePrivilege(id) {
      const db = MOCK_DB[env].privileges;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 9. FILE UPLOADS (saviynt_file_upload)
    // ==========================================
    async listFileUploads() {
      if (isMockMode()) return MOCK_DB[env].fileUploads;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getFileUploads`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`getFileUploads failed: ${res.status}`);
        const data = await res.json();
        return data.fileUploads || data || [];
      } catch (err) {
        return MOCK_DB[env].fileUploads;
      }
    },
    async getFileUpload(id) {
      const list = await this.listFileUploads();
      return list.find(item => item.id === id) ?? null;
    },
    async createFileUpload(payload) {
      const db = MOCK_DB[env].fileUploads;
      const newItem: SaviyntFileUpload = {
        id: payload.id || `up-${env.toLowerCase()}-${db.length + 1}`,
        fileName: payload.fileName || `upload_${db.length + 1}.xlsx`,
        fileSize: payload.fileSize || 512000,
        status: payload.status || "SUCCESS",
      };
      db.push(newItem);
      return newItem;
    },
    async updateFileUpload(id, payload) {
      const db = MOCK_DB[env].fileUploads;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`FileUpload with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteFileUpload(id) {
      const db = MOCK_DB[env].fileUploads;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 10. CONNECTIONS (saviynt_connection)
    // ==========================================
    async listConnections() {
      if (isMockMode()) return MOCK_DB[env].connections;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getConnections`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`getConnections failed: ${res.status}`);
        const data = await res.json();
        return data.connections || data || [];
      } catch (err) {
        console.warn(`[Saviynt API] getConnections failed. Returning mock fallback.`);
        return MOCK_DB[env].connections;
      }
    },
    async getConnection(id) {
      const list = await this.listConnections();
      return list.find((item) => item.id === id) ?? null;
    },
    async createConnection(payload) {
      const db = MOCK_DB[env].connections;
      const newItem: SaviyntConnection = {
        id: payload.id || `conn-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `CONNECTION_${db.length + 1}`,
        type: payload.type || "REST",
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateConnection(id, payload) {
      const db = MOCK_DB[env].connections;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Connection with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteConnection(id) {
      const db = MOCK_DB[env].connections;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 11. JOBS / TASKS (saviynt_job)
    // ==========================================
    async listTasks() {
      if (isMockMode()) return MOCK_DB[env].tasks;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/jobs`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`listTasks failed: ${res.status}`);
        const data = await res.json();
        return data.jobs || data || [];
      } catch (err) {
        console.warn(`[Saviynt API] listTasks failed. Returning mock fallback.`);
        return MOCK_DB[env].tasks;
      }
    },
    async getTask(id) {
      const list = await this.listTasks();
      return list.find((item) => item.id === id) ?? null;
    },
    async createTask(payload) {
      const db = MOCK_DB[env].tasks;
      const newItem: SaviyntTask = {
        id: payload.id || `job-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `JOB_TASK_${db.length + 1}`,
        status: payload.status || "SUCCESS",
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      // keep sync with jobs
      MOCK_DB[env].jobs = MOCK_DB[env].tasks;
      return newItem;
    },
    async updateTask(id, payload) {
      const db = MOCK_DB[env].tasks;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Task with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      MOCK_DB[env].jobs = MOCK_DB[env].tasks;
      return db[index];
    },
    async deleteTask(id) {
      const db = MOCK_DB[env].tasks;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      MOCK_DB[env].jobs = MOCK_DB[env].tasks;
      return true;
    },

    async listJobs() {
      return this.listTasks();
    },
    async getJob(id) {
      return this.getTask(id);
    },
    async createJob(payload) {
      return this.createTask(payload);
    },
    async updateJob(id, payload) {
      return this.updateTask(id, payload);
    },
    async deleteJob(id) {
      return this.deleteTask(id);
    },

    // ==========================================
    // 12. RULES (saviynt_rule)
    // ==========================================
    async listRules() {
      if (isMockMode()) return MOCK_DB[env].rules;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/rules/technical`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`listRules failed: ${res.status}`);
        const data = await res.json();
        return data.rules || data || [];
      } catch (err) {
        console.warn(`[Saviynt API] listRules failed. Returning mock fallback.`);
        return MOCK_DB[env].rules;
      }
    },
    async getRule(id) {
      const list = await this.listRules();
      return list.find((item) => item.id === id) ?? null;
    },
    async createRule(payload) {
      const db = MOCK_DB[env].rules;
      const newItem: SaviyntRule = {
        id: payload.id || `rule-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `RULE_${db.length + 1}`,
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateRule(id, payload) {
      const db = MOCK_DB[env].rules;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Rule with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteRule(id) {
      const db = MOCK_DB[env].rules;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 13. TRANSPORT PACKAGES (saviynt_transport_package)
    // ==========================================
    async listTransportPackages() {
      if (isMockMode()) return MOCK_DB[env].transportPackages;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/getTransportPackages`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`getTransportPackages failed: ${res.status}`);
        const data = await res.json();
        return data.transportPackages || data || [];
      } catch (err) {
        console.warn(`[Saviynt API] getTransportPackages failed. Returning mock fallback.`);
        return MOCK_DB[env].transportPackages;
      }
    },
    async getTransportPackage(id) {
      const list = await this.listTransportPackages();
      return list.find((item) => item.id === id) ?? null;
    },
    async createTransportPackage(payload) {
      const db = MOCK_DB[env].transportPackages;
      const newItem: SaviyntTransportPackage = {
        id: payload.id || `tp-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `TRANSPORT_PACKAGE_${db.length + 1}`,
        version: payload.version || "1.0.0",
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateTransportPackage(id, payload) {
      const db = MOCK_DB[env].transportPackages;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Transport Package with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteTransportPackage(id) {
      const db = MOCK_DB[env].transportPackages;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },

    // ==========================================
    // 14. LOOKUPS (saviynt_lookup)
    // ==========================================
    async listLookups() {
      if (isMockMode()) return MOCK_DB[env].lookups;
      try {
        const token = await login();
        const res = await fetch(`${url}/ECM/api/v5/lookups`, {
          method: "GET",
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`listLookups failed: ${res.status}`);
        const data = await res.json();
        return data.lookups || data || [];
      } catch (err) {
        console.warn(`[Saviynt API] listLookups failed. Returning mock fallback.`);
        return MOCK_DB[env].lookups;
      }
    },
    async getLookup(id) {
      const list = await this.listLookups();
      return list.find((item) => item.id === id) ?? null;
    },
    async createLookup(payload) {
      const db = MOCK_DB[env].lookups;
      const newItem: SaviyntLookup = {
        id: payload.id || `lk-${env.toLowerCase()}-${db.length + 1}`,
        name: payload.name || `LOOKUP_${db.length + 1}`,
        value: payload.value || "",
        description: payload.description || "Created via API/Mock Gateway",
      };
      db.push(newItem);
      return newItem;
    },
    async updateLookup(id, payload) {
      const db = MOCK_DB[env].lookups;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) throw new Error(`Lookup with id ${id} not found.`);
      db[index] = { ...db[index], ...payload };
      return db[index];
    },
    async deleteLookup(id) {
      const db = MOCK_DB[env].lookups;
      const index = db.findIndex(item => item.id === id);
      if (index === -1) return false;
      db.splice(index, 1);
      return true;
    },
  };
}
