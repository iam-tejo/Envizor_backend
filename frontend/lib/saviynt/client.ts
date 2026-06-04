// lib/saviynt/client.ts
export type EnvName = "DEV" | "PRE" | "PROD";

export interface SaviyntSecuritySystem {
  id: string;
  name: string;
  description?: string;
}

export interface SaviyntEndpoint {
  id: string;
  name: string;
  securitySystemId: string;
}

export interface SaviyntConnection {
  id: string;
  name: string;
  type: string;
}

export interface SaviyntClient {
  env: EnvName;
  listSecuritySystems(): Promise<SaviyntSecuritySystem[]>;
  listEndpoints(): Promise<SaviyntEndpoint[]>;
  listConnections(): Promise<SaviyntConnection[]>;
  getSecuritySystem(id: string): Promise<SaviyntSecuritySystem | null>;
  getEndpoint(id: string): Promise<SaviyntEndpoint | null>;
  getConnection(id: string): Promise<SaviyntConnection | null>;
}

// Simple in‑memory mock data
const MOCK_DATA: Record<
  EnvName,
  {
    securitySystems: SaviyntSecuritySystem[];
    endpoints: SaviyntEndpoint[];
    connections: SaviyntConnection[];
  }
> = {
  DEV: {
    securitySystems: [
      { id: "SS_DEV_HR", name: "HR_DEV", description: "HR system DEV" },
      { id: "SS_DEV_SF", name: "Salesforce_DEV", description: "SFDC DEV" },
    ],
    endpoints: [
      { id: "EP_DEV_HR_API", name: "HR_API_DEV", securitySystemId: "SS_DEV_HR" },
    ],
    connections: [
      { id: "CONN_DEV_DB", name: "DEV_DB_CONN", type: "JDBC" },
    ],
  },
  PRE: {
    securitySystems: [
      { id: "SS_PRE_HR", name: "HR_PRE", description: "HR system PRE" },
    ],
    endpoints: [],
    connections: [],
  },
  PROD: {
    securitySystems: [
      { id: "SS_PROD_HR", name: "HR_PROD", description: "HR system PROD" },
    ],
    endpoints: [],
    connections: [],
  },
};

export function createSaviyntClient(env: EnvName): SaviyntClient {
  const data = MOCK_DATA[env];

  return {
    env,
    async listSecuritySystems() {
      return data.securitySystems;
    },
    async listEndpoints() {
      return data.endpoints;
    },
    async listConnections() {
      return data.connections;
    },
    async getSecuritySystem(id: string) {
      return data.securitySystems.find((s) => s.id === id) ?? null;
    },
    async getEndpoint(id: string) {
      return data.endpoints.find((e) => e.id === id) ?? null;
    },
    async getConnection(id: string) {
      return data.connections.find((c) => c.id === id) ?? null;
    },
  };
}
