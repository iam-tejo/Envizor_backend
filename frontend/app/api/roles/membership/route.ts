import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { AVAILABLE_ROLES } from "@/app/lib/roleConfig";

const dbPath = path.join(process.cwd(), "app/lib/users_db.json");

function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      return { users: [], customRoles: {}, permissions: {} };
    }
    const data = fs.readFileSync(dbPath, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading users_db.json:", err);
    return { users: [], customRoles: {}, permissions: {} };
  }
}

export async function GET() {
  const db = readDb();
  
  // Initialize membership map for each available role
  const membership: Record<string, string[]> = {};
  AVAILABLE_ROLES.forEach((role) => {
    membership[role] = [];
  });

  // Group users by their role (including split handling for comma-separated multiple roles)
  db.users.forEach((u: any) => {
    const override = db.customRoles[u.username.toLowerCase()];
    const roleString = override || u.role || "Stakeholders";

    const userRoles = roleString.split(",").map((r: string) => r.trim());
    userRoles.forEach((roleName: string) => {
      // Find matching case-insensitive role from available roles
      const matchedRole = AVAILABLE_ROLES.find(
        (r) => r.toLowerCase() === roleName.toLowerCase()
      );
      if (matchedRole) {
        if (!membership[matchedRole].includes(u.username)) {
          membership[matchedRole].push(u.username);
        }
      } else {
        // Fallback for custom or unlisted roles
        if (!membership[roleName]) {
          membership[roleName] = [];
        }
        if (!membership[roleName].includes(u.username)) {
          membership[roleName].push(u.username);
        }
      }
    });
  });

  return NextResponse.json(membership);
}
