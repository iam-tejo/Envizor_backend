export const AVAILABLE_ROLES = [
  "Administrators",
  "Dev Ops",
  "Developers",
  "Business Analysts",
  "Product Owner",
  "Testers",
  "Stakeholders"
] as const;

export type UserRole = (typeof AVAILABLE_ROLES)[number];

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  "ADMINISTRATORS": [
    "tile-know-more",
    "tile-day0-setup",
    "tile-iga-explorer",
    "tile-workspace-explorer",
    "tile-terraform-wizard",
    "tile-connected-app",
    "tile-disconnected-app-onboarding",
    "tile-analytics",
    "tile-ai-agent",
    "tile-deploy-agent"
  ],
  "DEV OPS": [
    "tile-know-more",
    "tile-day0-setup",
    "tile-iga-explorer",
    "tile-workspace-explorer",
    "tile-terraform-wizard",
    "tile-connected-app",
    "tile-disconnected-app-onboarding",
    "tile-analytics",
    "tile-ai-agent",
    "tile-deploy-agent"
  ],
  "DEVELOPERS": [
    "tile-know-more",
    "tile-day0-setup",
    "tile-iga-explorer",
    "tile-workspace-explorer",
    "tile-terraform-wizard",
    "tile-connected-app",
    "tile-disconnected-app-onboarding",
    "tile-analytics"
  ],
  "BUSINESS ANALYSTS": [
    "tile-know-more",
    "tile-connected-app",
    "tile-analytics"
  ],
  "PRODUCT OWNER": [
    "tile-know-more",
    "tile-iga-explorer",
    "tile-analytics"
  ],
  "TESTERS": [
    "tile-know-more",
    "tile-workspace-explorer",
    "tile-analytics"
  ],
  "STAKEHOLDERS": [
    "tile-know-more",
    "tile-analytics"
  ]
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  "Administrators": "Global administrative privileges. Full CRUD access and approval rights.",
  "Dev Ops": "Technical operations, deployment releases, agent configurations, and HCL code push.",
  "Developers": "Onboarding apps, configuring workspaces, mapping details, and exploring configurations.",
  "Business Analysts": "Onboard connected app endpoints and execute analytical insights dashboard queries.",
  "Product Owner": "Review drift reconciliation logs, inspect IGA explorer, and view stats.",
  "Testers": "Drift auditing, workspace baseline exploring, and running analytics queries.",
  "Stakeholders": "Ecosystem overview know-more guides and viewing analytical user stats."
};

/**
 * Checks if a specific tile is locked for the user's role(s).
 * If a user holds multiple roles (comma-separated), their permissions are merged.
 */
export function isTileLockedForRole(
  roleString: string,
  tileId: string,
  explicitPermissions: string[] = []
): boolean {
  if (tileId === "tile-know-more") return false;
  if (!roleString) return true;

  // Split comma-separated roles and normalize them
  const roles = roleString
    .split(",")
    .map((r) => r.trim().toUpperCase());

  // Administrators or SuperAdmin bypass all locks
  if (roles.some((r) => r === "ADMINISTRATORS" || r === "SUPERADMIN")) {
    return false;
  }

  // Merge permissions across all roles the user possesses
  const mergedPermissions = new Set<string>();
  roles.forEach((r) => {
    const permissions = ROLE_PERMISSIONS[r] || [];
    permissions.forEach((perm) => mergedPermissions.add(perm));
  });

  if (mergedPermissions.has(tileId)) {
    return false;
  }

  // Fallback: Check if explicitly granted via access approval
  if (explicitPermissions.includes(tileId)) {
    return false;
  }

  return true;
}
