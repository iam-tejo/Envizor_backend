// lib/envizor/knowledgeGraph.ts

export const LKG = {
  saviynt: {
    tenant: ["applications", "roles", "accounts"],
    application: ["entitlements", "accounts"],
    role: ["entitlements"],
    entitlement: [],
    account: [],
  },

  terraform: {
    module: ["variables", "resources"],
    resource: ["attributes"],
    variable: [],
    provider: ["workspace"],
  },

  wizard: {
    "Environment Selection": ["Tenant Discovery"],
    "Tenant Discovery": ["Object Selection"],
    "Object Selection": ["Terraform Generator"],
    "Terraform Generator": ["Deployment"],
    Deployment: [],
  },
};

export function getDependencies(node: string): string[] {
  if (node in LKG.saviynt) {
    return LKG.saviynt[node as keyof typeof LKG.saviynt];
  }
  if (node in LKG.terraform) {
    return LKG.terraform[node as keyof typeof LKG.terraform];
  }
  if (node in LKG.wizard) {
    return LKG.wizard[node as keyof typeof LKG.wizard];
  }
  return [];
}
