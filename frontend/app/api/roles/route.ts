import { NextResponse } from "next/server";
import { AVAILABLE_ROLES, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from "@/app/lib/roleConfig";

export async function GET() {
  const rolesList = AVAILABLE_ROLES.map((role) => ({
    role: role,
    description: ROLE_DESCRIPTIONS[role] || "",
    allowedTiles: ROLE_PERMISSIONS[role.toUpperCase()] || []
  }));

  return NextResponse.json(rolesList);
}
