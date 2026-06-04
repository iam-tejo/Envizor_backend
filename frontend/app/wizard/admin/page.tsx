"use client";

import { useState, useEffect } from "react";
import Day0Shell from "../day0/Day0Shell";

type ApprovalRequest = {
  id: string;
  timestamp: string;
  username: string;
  env: string;
  files: Record<string, string>;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

type AccessRequest = {
  id: string;
  timestamp: string;
  username: string;
  tileId: string;
  tileName: string;
  requestedRole: string;
  justification: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isJit?: boolean;
  jitDuration?: number;
};

type UserProfile = {
  username: string;
  fullName: string;
  email: string;
  role: string;
  desc: string;
  isRegistered?: boolean;
};

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState<"roles" | "queue" | "access_requests">("roles");
  
  // Custom roles overrides and registered users lists
  const [customRoles, setCustomRoles] = useState<Record<string, string>>({});
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

  // Active session profile state
  const [activeUserName, setActiveUserName] = useState<string>("user");
  const [activeUserRole, setActiveUserRole] = useState<string>("BasicUser");
  
  // Approval queues
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);

  // Selected Role for assigned-user visual lookup Catalog
  const [selectedRoleCatalog, setSelectedRoleCatalog] = useState<string | null>(null);

  // Staged HCL inspection modal triggers
  const [selectedReq, setSelectedReq] = useState<ApprovalRequest | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState("");

  const simulationProfiles = [
    { username: "admin", fullName: "System SuperAdmin", email: "admin@envizor.internal", defaultRole: "SuperAdmin", desc: "Highest workspace administrative privileges" },
  ];

  const availableRoles = [
    "SuperAdmin",
    "DEV_Admin",
    "PRE_Admin",
    "PROD_Admin",
    "BasicUser",
  ];

  const roleDefinitions = [
    { key: "SuperAdmin", label: "🛡️ Super Admin", desc: "Global root administrative privileges, manages roles, acts as approver." },
    { key: "DEV_Admin", label: "🛠️ DEV Admin", desc: "Access to DEV workspace explorer, and read/write DEV workspace or tenants." },
    { key: "PRE_Admin", label: "✨ PRE Admin", desc: "Access to PRE workspace explorer, and read/write PRE workspace or tenants." },
    { key: "PROD_Admin", label: "🚀 PROD Admin", desc: "Access to PROD workspace explorer, and read/write PROD workspace or tenants." },
    { key: "BasicUser", label: "🌱 Basic User", desc: "Default registered account. Restricts access to public welcome guides only." },
  ];

  // Combined Directory mapping accounts dynamically
  const accounts: UserProfile[] = [
    ...simulationProfiles.map((p) => {
      const currentRole = customRoles[p.username.toLowerCase()] || p.defaultRole;
      return {
        username: p.username,
        fullName: p.fullName,
        email: p.email,
        role: currentRole,
        desc: p.desc,
      };
    }),
    ...registeredUsers.map((u) => {
      const currentRole = customRoles[u.username.toLowerCase()] || u.role || "BasicUser";
      return {
        username: u.username,
        fullName: u.fullName || "Registered User",
        email: u.email || `${u.username}@company.com`,
        role: currentRole,
        desc: "Self-registered profile",
        isRegistered: true,
      };
    }),
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "user";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setActiveUserName(user);
      setActiveUserRole(latestRole);

      // Load custom roles overrides
      const savedRoles = localStorage.getItem("envizor_custom_roles");
      if (savedRoles) {
        setCustomRoles(JSON.parse(savedRoles));
      }

      // Load registered accounts
      const savedReg = localStorage.getItem("envizor_registered_users");
      if (savedReg) {
        setRegisteredUsers(JSON.parse(savedReg));
      }

      // Load PROD baseline approvals
      const savedReqs = localStorage.getItem("envizor_approval_requests");
      if (savedReqs) {
        setRequests(JSON.parse(savedReqs));
      }

      // Load Access requests
      const savedAccess = localStorage.getItem("envizor_access_requests");
      if (savedAccess) {
        setAccessRequests(JSON.parse(savedAccess));
      }
    }
  }, []);

  function handleRoleChange(user: string, newRole: string) {
    const isSuperAdmin = activeUserRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN";
    if (!isSuperAdmin) {
      alert("🛡️ Access Denied: Only SuperAdmin accounts are authorized to re-allocate user roles.");
      return;
    }
    const normalizedRole = 
      newRole === "DEV_Admin" ? "DEV Admin" :
      newRole === "PRE_Admin" ? "PRE Admin" :
      newRole === "PROD_Admin" ? "PROD Admin" :
      newRole;

    const updatedRoles = { ...customRoles, [user.toLowerCase()]: normalizedRole };
    setCustomRoles(updatedRoles);
    localStorage.setItem("envizor_custom_roles", JSON.stringify(updatedRoles));

    // If it's a registered user, also sync their main profile role
    const matchedReg = registeredUsers.find((r) => r.username.toLowerCase() === user.toLowerCase());
    if (matchedReg) {
      const updatedList = registeredUsers.map((r) =>
        r.username.toLowerCase() === user.toLowerCase() ? { ...r, role: normalizedRole } : r
      );
      setRegisteredUsers(updatedList);
      localStorage.setItem("envizor_registered_users", JSON.stringify(updatedList));
    }

    // If downgraded to BasicUser, reset all tile permissions to default
    if (normalizedRole === "BasicUser") {
      const perms = localStorage.getItem("envizor_user_permissions");
      if (perms) {
        const permsMap = JSON.parse(perms);
        permsMap[user.toLowerCase()] = ["tile-know-more"];
        localStorage.setItem("envizor_user_permissions", JSON.stringify(permsMap));
      }
    }
  }

  function handleResetRoles() {
    const isSuperAdmin = activeUserRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN";
    if (!isSuperAdmin) {
      alert("🛡️ Access Denied: Only SuperAdmin accounts are authorized to reset roles.");
      return;
    }
    setCustomRoles({});
    localStorage.removeItem("envizor_custom_roles");

    // Reset registered users roles back to BasicUser
    const updatedList = registeredUsers.map((r) => ({ ...r, role: "BasicUser" }));
    setRegisteredUsers(updatedList);
    localStorage.setItem("envizor_registered_users", JSON.stringify(updatedList));

    // Reset permissions
    localStorage.removeItem("envizor_user_permissions");
    alert("Registry and custom roles have been reset to defaults.");
  }

  function handleDeleteUser(user: string) {
    const isSuperAdmin = activeUserRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN";
    if (!isSuperAdmin) {
      alert("🛡️ Access Denied: Only SuperAdmin accounts are authorized to delete users.");
      return;
    }
    const confirm = window.confirm(`Are you sure you want to delete the registered account "${user}"?`);
    if (!confirm) return;

    const updatedList = registeredUsers.filter((r) => r.username.toLowerCase() !== user.toLowerCase());
    setRegisteredUsers(updatedList);
    localStorage.setItem("envizor_registered_users", JSON.stringify(updatedList));

    // Cleanup role override
    const updatedRoles = { ...customRoles };
    delete updatedRoles[user.toLowerCase()];
    setCustomRoles(updatedRoles);
    localStorage.setItem("envizor_custom_roles", JSON.stringify(updatedRoles));
  }

  // --- ACCESS REQUEST DECISION FLOWS ---
  
  function handleApproveAccess(req: AccessRequest) {
    const isSuperAdmin = activeUserRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN";
    if (!isSuperAdmin) {
      alert("🛡️ Access Denied: Only SuperAdmin accounts are authorized to approve requests.");
      return;
    }
    // 0. If this is a temporal Just-in-Time (JIT) privilege elevation request
    if (req.isJit && req.jitDuration) {
      const baseRole = customRoles[req.username.toLowerCase()] || "BasicUser";
      const expiresAt = Date.now() + req.jitDuration * 60 * 1000;
      
      const jitData = localStorage.getItem("envizor_jit_access");
      const jitMap = jitData ? JSON.parse(jitData) : {};
      jitMap[req.username.toLowerCase()] = {
        targetRole: req.requestedRole,
        expiresAt,
        approvedAt: Date.now(),
        durationMins: req.jitDuration,
        baseRole: baseRole
      };
      
      localStorage.setItem("envizor_jit_access", JSON.stringify(jitMap));
    }

    // 1. Grant environment role
    const updatedRoles = { ...customRoles, [req.username.toLowerCase()]: req.requestedRole };
    setCustomRoles(updatedRoles);
    localStorage.setItem("envizor_custom_roles", JSON.stringify(updatedRoles));

    // 2. Grant tile permission
    const perms = localStorage.getItem("envizor_user_permissions");
    const permsMap = perms ? JSON.parse(perms) : {};
    const userPerms = permsMap[req.username.toLowerCase()] || ["tile-know-more"];
    if (!userPerms.includes(req.tileId)) {
      userPerms.push(req.tileId);
    }
    permsMap[req.username.toLowerCase()] = userPerms;
    localStorage.setItem("envizor_user_permissions", JSON.stringify(permsMap));

    // 3. Sync registered user profile
    const updatedRegList = registeredUsers.map((r) =>
      r.username.toLowerCase() === req.username.toLowerCase() ? { ...r, role: req.requestedRole } : r
    );
    setRegisteredUsers(updatedRegList);
    localStorage.setItem("envizor_registered_users", JSON.stringify(updatedRegList));

    // 4. Update request status to APPROVED
    const updatedReqs = accessRequests.map((r) =>
      r.id === req.id ? { ...r, status: "APPROVED" as const } : r
    );
    setAccessRequests(updatedReqs);
    localStorage.setItem("envizor_access_requests", JSON.stringify(updatedReqs));

    // Dispatch global storage event to synchronize layouts and chatbot instances
    window.dispatchEvent(new Event("storage"));

    alert(`Successfully approved ${req.username}'s request! Granted tile permission and role ${req.requestedRole}.`);
  }

  function handleRejectAccess(req: AccessRequest) {
    const isSuperAdmin = activeUserRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN";
    if (!isSuperAdmin) {
      alert("🛡️ Access Denied: Only SuperAdmin accounts are authorized to reject requests.");
      return;
    }
    const updatedReqs = accessRequests.map((r) =>
      r.id === req.id ? { ...r, status: "REJECTED" as const } : r
    );
    setAccessRequests(updatedReqs);
    localStorage.setItem("envizor_access_requests", JSON.stringify(updatedReqs));
  }

  function handleClearAccessQueue() {
    setAccessRequests([]);
    localStorage.removeItem("envizor_access_requests");
  }

  // --- PROD BASELINE COMPILATION DECISION FLOWS ---

  // --- PROD BASELINE COMPILATION DECISION FLOWS ---

  async function handleApprove(req: ApprovalRequest) {
    const isSuperAdmin = activeUserRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN";
    if (!isSuperAdmin) {
      alert("🛡️ Access Denied: Only SuperAdmin accounts are authorized to approve release deployments.");
      return;
    }
    setLoading(true);
    setLogs(`🚀 Initializing approval sequence for Request ${req.id}...\n`);

    try {
      const writeTf = async (fullPath: string, content: string) => {
        await fetch(`/api/env/PROD/write`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullPath, content })
        });
      };

      let currentLogs = `🚀 Initializing approval sequence for Request ${req.id}...\n\n`;
      let totalCreated = 0;

      for (const [filePath, hclContent] of Object.entries(req.files)) {
        currentLogs += `[Disk Write] saviynt_resource.${filePath}: Creating...\n`;
        setLogs(currentLogs);

        await writeTf(filePath, hclContent);

        currentLogs += `[Disk Write] saviynt_resource.${filePath}: Creation complete ✓\n`;
        setLogs(currentLogs);
        totalCreated++;
      }

      currentLogs += `\n📦 Synchronizing GitOps remote repositories...\n`;
      setLogs(currentLogs);

      try {
        await fetch("/api/day0/workspace-settings/push", { method: "POST" });
        currentLogs += `✅ Git remote push complete! Staged changes committed successfully.\n`;
      } catch (pushErr: any) {
        currentLogs += `⚠️ Git remote push warning: ${pushErr.message || pushErr}\n`;
      }

      currentLogs += `\n🎉 Request APPROVED & Deployed! Resources: ${totalCreated} created.\n`;
      setLogs(currentLogs);

      // Update state
      const updatedReqs = requests.map((r) =>
        r.id === req.id ? { ...r, status: "APPROVED" as const } : r
      );
      setRequests(updatedReqs);
      localStorage.setItem("envizor_approval_requests", JSON.stringify(updatedReqs));
    } catch (e: any) {
      setLogs((prev) => prev + `\n❌ Deploy failed: ${e.message || e}\n`);
    } finally {
      setLoading(false);
    }
  }

  function handleReject(req: ApprovalRequest) {
    const isSuperAdmin = activeUserRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN";
    if (!isSuperAdmin) {
      alert("🛡️ Access Denied: Only SuperAdmin accounts are authorized to reject release deployments.");
      return;
    }
    const updatedReqs = requests.map((r) =>
      r.id === req.id ? { ...r, status: "REJECTED" as const } : r
    );
    setRequests(updatedReqs);
    localStorage.setItem("envizor_approval_requests", JSON.stringify(updatedReqs));
  }

  function handleClearQueue() {
    setRequests([]);
    localStorage.removeItem("envizor_approval_requests");
  }

  const isSuperAdmin = activeUserRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN";

  return (
    <Day0Shell
      title="Admin & Roles Console"
      subtitle="Configure persistent workspace user access policies, roles privileges, and audit release approvals."
      backTo="/wizard/steps/welcome"
      widthClass="max-w-6xl"
    >
      <div className="flex flex-col gap-6 animate-fadeIn">
        
        {/* Zero-Trust Read-Only warning banner for non-SuperAdmins */}
        {!isSuperAdmin && (
          <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 backdrop-blur-md flex items-start gap-3 text-xs leading-relaxed text-amber-305">
            <span className="text-xl">🛡️</span>
            <div>
              <h4 className="font-extrabold uppercase tracking-wide">Read-Only Catalog Mode Active</h4>
              <p className="mt-1 text-slate-400 font-semibold">
                Your active role profile (<strong className="text-amber-400">{activeUserRole}</strong>) does not possess SuperAdmin status. 
                Under strict Zero-Trust security rules, you are authorized as read-only. Clicking approvals, rejecting change sets, or modifying registry roles is restricted.
              </p>
            </div>
          </div>
        )}
        
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850 max-w-xl select-none">
          <button
            onClick={() => setActiveTab("roles")}
            className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "roles"
                ? "bg-slate-900 text-slate-100 shadow-sm border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>👥</span> Users &amp; Roles Registry
          </button>
          
          <button
            onClick={() => setActiveTab("access_requests")}
            className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "access_requests"
                ? "bg-slate-900 text-slate-100 shadow-sm border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🔑</span> Access Requests
            {accessRequests.filter((r) => r.status === "PENDING").length > 0 && (
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("queue")}
            className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "queue"
                ? "bg-slate-900 text-slate-100 shadow-sm border border-slate-800"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>📥</span> PROD Approvals
            {requests.filter((r) => r.status === "PENDING").length > 0 && (
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>
        </div>

        {/* TAB 1: USERS & ROLES REGISTRY */}
        {activeTab === "roles" && (
          <div className="space-y-6">
            
            {/* Roles Membership Catalog Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-100 mb-1">🛡️ Clickable Roles Catalog</h3>
              <p className="text-[11px] text-slate-400 mb-3">Click on any role card to see the full list of users currently holding that assigned privilege scope.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
                {roleDefinitions.map((role) => {
                  const assignedCount = accounts.filter((a) => {
                    const normA = a.role.replace(/\s+|_/g, "").toUpperCase();
                    const normRole = role.key.replace(/\s+|_/g, "").toUpperCase();
                    return normA === normRole;
                  }).length;
                  const isSelected = selectedRoleCatalog === role.key;
                  return (
                    <div
                      key={role.key}
                      onClick={() => setSelectedRoleCatalog(isSelected ? null : role.key)}
                      className={`border rounded-xl p-3.5 text-left cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? "bg-sky-650/20 border-sky-500 shadow-lg shadow-sky-500/10 scale-[1.02]"
                          : "bg-slate-900/60 border-slate-850 hover:border-slate-700 hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[11.5px] font-extrabold text-slate-250">{role.label}</span>
                        <span className={`text-[8.5px] font-extrabold px-1.5 py-0.2 rounded border uppercase scale-90 ${
                          assignedCount > 0 
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40 font-black"
                            : "bg-slate-950 text-slate-500 border-slate-800"
                        }`}>
                          {assignedCount} {assignedCount === 1 ? "User" : "Users"}
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-400 leading-normal mt-2.5 font-medium line-clamp-2 h-7" title={role.desc}>{role.desc}</p>
                      
                      <div className="mt-2 text-[8px] font-extrabold text-sky-400 text-right uppercase tracking-wider flex items-center justify-end gap-1">
                        <span>{isSelected ? "📖 Click to hide members" : "🔍 Click to view members"}</span>
                        <span>↳</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clicked Role Assigned-Users visual Catalog overlay */}
            {selectedRoleCatalog && (
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/5 p-4 animate-fadeIn space-y-3">
                <div className="flex justify-between items-center border-b border-sky-900/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🛡️</span>
                    <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                      Accounts assigned to role: <strong className="text-slate-100">{selectedRoleCatalog}</strong>
                    </h4>
                  </div>
                  <button 
                    onClick={() => setSelectedRoleCatalog(null)}
                    className="text-[9.5px] font-extrabold text-sky-400 hover:text-white transition cursor-pointer bg-sky-900/10 border border-sky-850 px-2 py-0.5 rounded uppercase"
                  >
                    Close Catalog View ✕
                  </button>
                </div>

                <div className="max-h-[220px] overflow-y-auto pr-1">
                  {accounts.filter((a) => {
                    const normA = a.role.replace(/\s+|_/g, "").toUpperCase();
                    const normRole = selectedRoleCatalog.replace(/\s+|_/g, "").toUpperCase();
                    return normA === normRole;
                  }).length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-[11px] font-mono select-none">
                      No user accounts currently holding the "{selectedRoleCatalog}" role privilege.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {accounts
                        .filter((a) => {
                          const normA = a.role.replace(/\s+|_/g, "").toUpperCase();
                          const normRole = selectedRoleCatalog.replace(/\s+|_/g, "").toUpperCase();
                          return normA === normRole;
                        })
                        .map((user) => (
                          <div 
                            key={user.username}
                            className="bg-slate-950/70 border border-slate-850 rounded-xl p-3 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-extrabold text-slate-150">{user.username}</span>
                                {user.isRegistered && (
                                  <span className="text-[7.5px] uppercase tracking-wider text-sky-400 bg-sky-950/20 border border-sky-900/35 px-1 py-0.2 rounded font-extrabold">Registered</span>
                                )}
                              </div>
                              <div className="text-[11.5px] font-bold text-slate-350 mt-1">{user.fullName}</div>
                              <div className="text-[10px] text-slate-450 font-mono mt-0.5 break-all">{user.email}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Users Table Registry Section */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-slate-100">👥 Accounts Directory</h3>
                  <p className="text-[11px] text-slate-400">View and persistent re-allocate workspace roles across all available developer profiles and registered accounts.</p>
                </div>
              </div>

              <div className="rounded-xl border bg-slate-950/70 overflow-hidden select-none" style={{ borderColor: "var(--border)" }}>
                <div className="grid grid-cols-[160px_180px_220px_160px_1fr] text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/60 p-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <span>Username</span>
                  <span>Full Name</span>
                  <span>Email Address</span>
                  <span>Assigned Role</span>
                  <span className="text-right">Actions Scope</span>
                </div>
                
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {accounts.map((acc) => {
                    return (
                      <div key={acc.username} className="grid grid-cols-[160px_180px_220px_160px_1fr] items-center p-3 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-slate-350 font-bold">{acc.username}</span>
                          {acc.isRegistered && (
                            <span className="text-[8px] uppercase tracking-wider text-sky-400 bg-sky-950/20 border border-sky-900/35 px-1 py-0.2 rounded w-fit font-extrabold select-none">
                              Registered
                            </span>
                          )}
                        </div>
                        
                        <span className="text-slate-300 font-medium truncate pr-4">{acc.fullName}</span>
                        <span className="text-slate-400 font-mono truncate pr-4" title={acc.email}>{acc.email}</span>

                        <div className="pr-4">
                          <select
                            value={
                              acc.role.replace(/\s+|_/g, "").toUpperCase() === "DEVADMIN" ? "DEV_Admin" :
                              acc.role.replace(/\s+|_/g, "").toUpperCase() === "PREADMIN" ? "PRE_Admin" :
                              acc.role.replace(/\s+|_/g, "").toUpperCase() === "PRODADMIN" ? "PROD_Admin" :
                              acc.role
                            }
                            disabled={!isSuperAdmin}
                            onChange={(e) => handleRoleChange(acc.username, e.target.value)}
                            className={`bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-sky-400 font-extrabold focus:outline-none focus:border-sky-500 w-full ${isSuperAdmin ? "cursor-pointer" : "cursor-not-allowed opacity-60"}`}
                          >
                            {availableRoles.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex justify-end pr-1.5">
                          {acc.isRegistered ? (
                            <button
                              onClick={() => handleDeleteUser(acc.username)}
                              disabled={!isSuperAdmin}
                              className={`px-2.5 py-1 rounded border text-[9px] font-bold uppercase transition ${
                                isSuperAdmin 
                                  ? "border-red-900/40 bg-red-955/15 hover:bg-red-900/20 text-red-400 cursor-pointer"
                                  : "border-slate-850 bg-slate-900 text-slate-500 opacity-40 cursor-not-allowed"
                              }`}
                            >
                              🗑️ Delete User
                            </button>
                          ) : (
                            <span className="text-[8px] text-slate-400 bg-slate-900/60 border border-slate-800/80 px-2 py-0.5 rounded font-mono uppercase tracking-wider font-extrabold select-none">
                              SYSTEM PROFILE
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: ACCESS REQUESTS QUEUE */}
        {activeTab === "access_requests" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-100">User Access Role Request Approvals Queue</h3>
                <p className="text-[11px] text-slate-400">Review, audit, and approve role upgrades for registered basic accounts.</p>
              </div>
              {accessRequests.length > 0 && (
                <button
                  onClick={handleClearAccessQueue}
                  className="px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase hover:border-red-500 hover:text-red-400 transition cursor-pointer"
                  style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                >
                  Clear Request History
                </button>
              )}
            </div>

            {accessRequests.length === 0 ? (
              <div className="text-center py-20 border rounded-xl bg-slate-950/60" style={{ borderColor: "var(--border)" }}>
                <span className="text-4xl">🔑</span>
                <p className="text-xs text-slate-550 mt-2 font-semibold">No role requests currently submitted.</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-slate-950/70 overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <div className="grid grid-cols-[100px_120px_100px_140px_110px_1fr] text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/60 p-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <span>Request ID</span>
                  <span>Date &amp; Time</span>
                  <span>User</span>
                  <span>Target Tile</span>
                  <span>Status</span>
                  <span className="text-right">Actions / Scope Details</span>
                </div>

                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {accessRequests.map((req) => (
                    <div key={req.id} className="grid grid-cols-[100px_120px_100px_140px_110px_1fr] items-center p-3 text-xs">
                      <span className="font-mono text-sky-400 font-extrabold">{req.id}</span>
                      <span className="text-slate-405 text-[10.5px]">{new Date(req.timestamp).toLocaleString()}</span>
                      <span className="font-mono text-slate-205 font-bold">{req.username}</span>
                      <span className="text-slate-300 font-semibold">{req.tileName}</span>

                      <div>
                        {req.status === "PENDING" && (
                          <span className="text-[9px] font-extrabold uppercase bg-amber-955/40 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40 animate-pulse">PENDING</span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="text-[9px] font-extrabold uppercase bg-emerald-955/40 text-emerald-405 px-2 py-0.5 rounded border border-emerald-800/40">APPROVED</span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="text-[9px] font-extrabold uppercase bg-rose-955/40 text-rose-455 px-2 py-0.5 rounded border border-rose-800/40">REJECTED</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pl-4 gap-2">
                        <div className="flex flex-col text-left text-[11px] leading-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sky-300 font-extrabold">{req.requestedRole}</span>
                            {req.isJit && (
                              <span className="text-[8px] font-black uppercase bg-amber-550/15 border border-amber-500/35 text-amber-400 px-1.5 py-0.2 rounded animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                                ⚡ JUST-IN-TIME ({req.jitDuration}m)
                              </span>
                            )}
                          </div>
                          <span className="text-slate-500 italic mt-0.5 truncate max-w-[150px]" title={req.justification}>Reason: "{req.justification}"</span>
                        </div>

                        <div className="flex gap-2">
                          {req.status === "PENDING" && (
                            isSuperAdmin ? (
                              <>
                                <button
                                  onClick={() => handleApproveAccess(req)}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectAccess(req)}
                                  className="px-3 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase text-rose-400 border-rose-800/40 bg-rose-950/10 hover:bg-rose-900/20 transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[9.5px] bg-slate-900 border border-slate-805 text-slate-550 font-bold px-2.5 py-1 rounded select-none flex items-center gap-1 uppercase tracking-wide">
                                🛡️ Read Only
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROD DEPLOYMENT APPROVALS */}
        {activeTab === "queue" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-100">PROD Release Pipeline Approvals Queue</h3>
                <p className="text-[11px] text-slate-400">Review, inspect, and approve/reject baseline publications targeting the PROD environment directory.</p>
              </div>
              {requests.length > 0 && (
                <button
                  onClick={handleClearQueue}
                  className="px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase hover:border-red-500 hover:text-red-400 transition cursor-pointer"
                  style={{ backgroundColor: "var(--bg-panel)", borderColor: "var(--border)" }}
                >
                  Clear Queue History
                </button>
              )}
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-20 border rounded-xl bg-slate-950/60" style={{ borderColor: "var(--border)" }}>
                <span className="text-4xl">📥</span>
                <p className="text-xs text-slate-500 mt-2 font-semibold">No write requests currently present in the approval queue.</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-slate-950/70 overflow-hidden" style={{ borderColor: "var(--border)" }}>
                <div className="grid grid-cols-[100px_130px_100px_100px_100px_1fr] text-[10px] font-bold uppercase tracking-wider text-slate-505 bg-slate-900/60 p-3 border-b" style={{ borderColor: "var(--border)" }}>
                  <span>Request ID</span>
                  <span>Date &amp; Time</span>
                  <span>Submitting User</span>
                  <span>Environment</span>
                  <span>Status</span>
                  <span className="text-right">Actions</span>
                </div>
                
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {requests.map((req) => (
                    <div key={req.id} className="grid grid-cols-[100px_130px_100px_100px_100px_1fr] items-center p-3 text-xs">
                      <span className="font-mono text-sky-400 font-extrabold">{req.id}</span>
                      <span className="text-slate-400 text-[10.5px]">{new Date(req.timestamp).toLocaleString()}</span>
                      <span className="font-mono text-slate-300 font-bold">{req.username}</span>
                      <span className="text-slate-400 font-extrabold uppercase">{req.env}</span>
                      
                      <div>
                        {req.status === "PENDING" && (
                          <span className="text-[9px] font-extrabold uppercase bg-amber-955/40 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40 animate-pulse">PENDING</span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="text-[9px] font-extrabold uppercase bg-emerald-955/40 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40">APPROVED</span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="text-[9px] font-extrabold uppercase bg-rose-955/40 text-rose-450 px-2 py-0.5 rounded border border-rose-800/40">REJECTED</span>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedReq(req);
                            setShowInspector(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border text-[10px] font-bold uppercase bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300 transition cursor-pointer"
                        >
                          🔍 Inspect Changes ({Object.keys(req.files).length})
                        </button>
                        
                        {req.status === "PENDING" && (
                          <div className="flex gap-2">
                            {isSuperAdmin ? (
                              <>
                                <button
                                  onClick={() => handleApprove(req)}
                                  disabled={loading}
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-[1.02] transition cursor-pointer disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(req)}
                                  disabled={loading}
                                  className="px-3 py-1.5 rounded-lg border text-[10px] font-extrabold uppercase text-rose-400 border-rose-800/40 bg-rose-950/10 hover:bg-rose-900/20 transition cursor-pointer disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[9.5px] bg-slate-900 border border-slate-805 text-slate-550 font-bold px-2.5 py-1 rounded select-none flex items-center gap-1 uppercase tracking-wide">
                                🛡️ Read Only
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* LOG TERMINAL STREAM */}
        {logs && (
          <div className="rounded-xl border p-4 shadow-inner flex flex-col h-[200px] overflow-hidden" style={{ backgroundColor: "#0b0f19", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between border-b pb-2 mb-2" style={{ borderColor: "#1e293b" }}>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-505 font-mono">
                Approval deployment log output streams
              </span>
              {loading && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
            </div>
            <pre 
              className="flex-1 text-[10.5px] font-mono text-slate-355 leading-normal overflow-y-auto space-y-1 whitespace-pre-wrap select-text"
              ref={(el) => {
                if (el) el.scrollTop = el.scrollHeight;
              }}
            >
              {logs}
            </pre>
          </div>
        )}

      </div>

      {/* DETAILED INSPECTION MODAL */}
      {showInspector && selectedReq && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn" style={{ backgroundColor: "rgba(0,0,0,0.65)" }}>
          <div 
            className="border p-6 rounded-2xl max-w-2xl w-full shadow-2xl relative flex flex-col transition-colors mx-4"
            style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-1">
                <div className="text-[9px] font-extrabold uppercase tracking-widest text-sky-400">
                  Request Detail &amp; Config Audit
                </div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <span>📋</span> Inspect Files: Request {selectedReq.id}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setShowInspector(false);
                  setSelectedReq(null);
                }}
                className="text-xs hover:text-white transition cursor-pointer text-slate-400 font-bold border rounded-full h-6 w-6 flex items-center justify-center hover:bg-slate-900"
                style={{ borderColor: "var(--border)" }}
              >
                ✕
              </button>
            </div>

            {/* List of files */}
            <div className="py-4 space-y-3">
              <p className="text-[11px] text-slate-400">
                The following baseline configuration blocks are staged inside this request, submitted by <strong className="text-slate-200">{selectedReq.username}</strong>:
              </p>

              <div className="rounded-xl border p-3 bg-slate-950/70 max-h-[300px] overflow-y-auto" style={{ borderColor: "var(--border)" }}>
                <div className="space-y-2">
                  {Object.keys(selectedReq.files).map((filePath) => (
                    <div 
                      key={filePath}
                      className="border-b border-slate-900 pb-2 mb-2 last:border-0 last:mb-0 last:pb-0"
                    >
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
                        <span>{filePath}</span>
                        <span className="text-[8px] bg-sky-950 text-sky-350 px-1 py-0.2 rounded uppercase border border-sky-900/35">HCL BLOCK</span>
                      </div>
                      
                      <pre className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg mt-1.5 overflow-x-auto text-[10px] font-mono text-slate-400 leading-normal max-h-36">
                        {selectedReq.files[filePath]}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-4 flex justify-end gap-3" style={{ borderColor: "var(--border)" }}>
              <button 
                onClick={() => {
                  setShowInspector(false);
                  setSelectedReq(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 transition cursor-pointer"
                style={{ borderColor: "var(--border)" }}
              >
                Close Inspector
              </button>
              {selectedReq.status === "PENDING" && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedReq);
                      setShowInspector(false);
                    }}
                    className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-[1.02] transition cursor-pointer"
                  >
                    Approve Request
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </Day0Shell>
  );
}
