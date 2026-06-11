import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

function writeDb(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Error writing users_db.json:", err);
    return false;
  }
}

export async function GET() {
  const db = readDb();
  
  // Apply custom role overrides dynamically
  const usersWithRoles = db.users.map((u: any) => {
    const override = db.customRoles[u.username.toLowerCase()];
    return {
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      role: override || u.role || "Stakeholders"
    };
  });

  return NextResponse.json(usersWithRoles);
}

export async function POST(req: Request) {
  try {
    const { users, customRoles, permissions } = await req.json();
    const db = readDb();

    if (users) db.users = users;
    if (customRoles) db.customRoles = customRoles;
    if (permissions) db.permissions = permissions;

    const success = writeDb(db);
    if (success) {
      return NextResponse.json({ success: true, message: "Server database synchronized successfully." });
    } else {
      return NextResponse.json({ success: false, message: "Failed to write database file." }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
