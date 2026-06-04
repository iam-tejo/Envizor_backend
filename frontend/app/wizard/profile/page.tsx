"use client";

import { useState, useEffect } from "react";
import Day0Shell from "../day0/Day0Shell";

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

export default function ProfilePage() {
  const [userName, setUserName] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [currentRole, setCurrentRole] = useState<string>("BasicUser");
  const [userAvatar, setUserAvatar] = useState<string>("👤");

  // JIT request states
  const [requestedRole, setRequestedRole] = useState<string>("PROD_Admin");
  const [jitDuration, setJitDuration] = useState<number>(15);
  const [justification, setJustification] = useState<string>("");
  const [requestSubmitted, setRequestSubmitted] = useState<boolean>(false);

  // Active user access requests history
  const [myRequests, setMyRequests] = useState<AccessRequest[]>([]);
  const [activeJit, setActiveJit] = useState<{
    targetRole: string;
    expiresAt: number;
    approvedAt: number;
    durationMins: number;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<string>("");
  const [progressPct, setProgressPct] = useState<number>(100);

  // Hydrate user and storage data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "admin";
      setUserName(user);

      // Find user details from registered registry
      const registeredData = localStorage.getItem("envizor_registered_users");
      const registeredUsers = registeredData ? JSON.parse(registeredData) : [];
      const matched = registeredUsers.find(
        (u: any) => u.username.toLowerCase() === user.toLowerCase()
      );

      if (matched) {
        setFullName(matched.fullName || "Registered User");
        setEmailAddress(matched.email || `${user}@company.com`);
      } else {
        // Fallback for admin or unpopulated registrations
        setFullName(user === "admin" ? "System SuperAdmin" : "Developer Account");
        setEmailAddress(`${user}@envizor.internal`);
      }

      // Sync role overrides
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole =
        rolesMap[user.toLowerCase()] ||
        sessionStorage.getItem("envizor_user_role") ||
        (user === "admin" ? "SuperAdmin" : "BasicUser");
      setCurrentRole(latestRole);

      // Fetch requests queue
      const savedRequests = localStorage.getItem("envizor_access_requests");
      if (savedRequests) {
        const parsed = JSON.parse(savedRequests) as AccessRequest[];
        setMyRequests(parsed.filter((r) => r.username.toLowerCase() === user.toLowerCase()));
      }
      // Hydrate avatar
      const savedAvatar = localStorage.getItem(`envizor_user_avatar_${user.toLowerCase()}`) || "👤";
      setUserAvatar(savedAvatar);
    }
  }, [requestSubmitted]);

  const handleSelectDefaultAvatar = (emoji: string) => {
    if (!userName) return;
    try {
      const storageKey = `envizor_user_avatar_${userName.toLowerCase()}`;
      localStorage.setItem(storageKey, emoji);
      setUserAvatar(emoji);
      
      // Dispatch custom event to notify layout & chatbot
      window.dispatchEvent(new CustomEvent("envizorAvatarChanged"));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error(e);
      alert("Failed to update avatar.");
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userName) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      alert("Please select an image file under 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        try {
          const storageKey = `envizor_user_avatar_${userName.toLowerCase()}`;
          localStorage.setItem(storageKey, base64);
          setUserAvatar(base64);

          // Dispatch custom event to notify layout & chatbot
          window.dispatchEvent(new CustomEvent("envizorAvatarChanged"));
          window.dispatchEvent(new Event("storage"));
        } catch (err) {
          console.error(err);
          alert("Failed to save custom avatar image.");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Keep countdown ticking
  useEffect(() => {
    if (!userName) return;

    const tick = () => {
      try {
        const jitData = localStorage.getItem("envizor_jit_access");
        if (!jitData) {
          setActiveJit(null);
          return;
        }

        const jitMap = JSON.parse(jitData);
        const userJit = jitMap[userName.toLowerCase()];

        if (!userJit) {
          setActiveJit(null);
          return;
        }

        const now = Date.now();
        const diffMs = userJit.expiresAt - now;

        if (diffMs <= 0) {
          setActiveJit(null);
          setTimeLeft("");
          setProgressPct(0);
        } else {
          setActiveJit(userJit);

          // Format countdown
          const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);

          // Calculate visual progress bar percentage
          const totalDurationMs = userJit.durationMins * 60 * 1000;
          const elapsedMs = now - userJit.approvedAt;
          const pct = Math.max(0, Math.min(100, 100 - (elapsedMs / totalDurationMs) * 100));
          setProgressPct(pct);
        }
      } catch (err) {
        console.error("Failed to parse JIT access:", err);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [userName, currentRole]);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!justification.trim()) {
      alert("Please provide a valid business justification for elevated JIT access.");
      return;
    }

    try {
      const savedRequests = localStorage.getItem("envizor_access_requests");
      const currentQueue = savedRequests ? JSON.parse(savedRequests) : [];

      const newRequest: AccessRequest = {
        id: `JIT-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        username: userName,
        tileId: "tile-terraform-wizard",
        tileName: "DevOps Terraform Wizard (JIT)",
        requestedRole: requestedRole,
        justification: justification,
        status: "PENDING",
        isJit: true,
        jitDuration: jitDuration,
      };

      currentQueue.push(newRequest);
      localStorage.setItem("envizor_access_requests", JSON.stringify(currentQueue));

      setJustification("");
      setRequestSubmitted((prev) => !prev);
      alert(`JIT privileged role upgrade requested successfully. Request ID: ${newRequest.id}. Please contact SuperAdmin for quick approval.`);
    } catch (e) {
      console.error(e);
      alert("Failed to submit request.");
    }
  };

  const hasPendingJit = myRequests.some((r) => r.status === "PENDING" && r.isJit);

  return (
    <Day0Shell
      title="User Identity & PAM Dashboard"
      subtitle="Verify account privileges, inspect role scopes, and request temporal Just-In-Time (JIT) production access."
      backTo="/wizard/steps/welcome"
      widthClass="max-w-5xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
        
        {/* LEFT COLUMN: User Card & Active Session */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Identity Profile Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-5 relative overflow-hidden select-none">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-16 w-16 rounded-full border border-sky-900 bg-slate-900 overflow-hidden flex items-center justify-center text-3xl shadow-inner relative shrink-0">
                {userAvatar.startsWith("data:image") ? (
                  <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{userAvatar}</span>
                )}
                <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-emerald-500 border-2 border-slate-950 shadow-[0_0_6px_rgba(16,185,129,0.5)] z-10" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-100">{fullName}</h3>
                <p className="text-[10px] font-mono text-slate-450 mt-0.5">{emailAddress}</p>
              </div>

              <div className="w-full border-t border-slate-850/60 my-2" />

              <div className="w-full text-left space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Username:</span>
                  <span className="font-mono font-bold text-slate-200">{userName}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Default Role:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-450 uppercase">
                    {userName === "admin" ? "SuperAdmin" : "BasicUser"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs border-t border-slate-850/60 pt-2.5">
                  <span className="text-slate-400">Current Assigned Role:</span>
                  <span className="px-2 py-0.5 rounded bg-sky-950/30 border border-sky-900/40 text-[10.5px] font-extrabold text-sky-450 tracking-wide uppercase shadow-sm">
                    {currentRole}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active JIT Session Meter */}
          {activeJit ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5 space-y-4">
              <div className="flex items-center gap-1.5 font-black uppercase text-[10.5px] text-amber-450 animate-pulse">
                <span>⚡ Temporal Privileges Active</span>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Assigned Role Scope</div>
                <div className="text-sm font-extrabold text-amber-300 uppercase tracking-wider">{activeJit.targetRole}</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400 font-semibold uppercase">Session Countdown</span>
                  <span className="font-mono text-amber-250 text-sm font-black tracking-widest bg-black/40 px-2 py-0.5 rounded-lg border border-amber-900/30">
                    {timeLeft}
                  </span>
                </div>

                {/* Meter progress bar */}
                <div className="h-2 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative shadow-inner">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000 relative"
                    style={{ width: `${progressPct}%` }}
                  >
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                  </div>
                </div>

                <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                  <span>Expired</span>
                  <span>{progressPct.toFixed(0)}% Time Left</span>
                  <span>Original</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 leading-relaxed border-t border-amber-900/20 pt-3">
                ⚠️ Your access privilege elevates write capabilities on the Terraform Wizard explorer and environment baseline explorer maps. Upon reaching **00:00**, session access automatically terminates.
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-850 bg-slate-950/25 p-5 text-center text-slate-500 py-10 select-none">
              <span className="text-3xl">🛡️</span>
              <h4 className="text-[11px] font-bold uppercase tracking-wider mt-2 text-slate-400">No Elevated Session Active</h4>
              <p className="text-[9.5px] text-slate-500 mt-1 max-w-[180px] mx-auto leading-normal">You are logged in with default scopes. Submit the JIT request form to acquire privileged workspace rights.</p>
            </div>
          )}

          {/* Avatar Customization Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/65 p-5 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <span>🖼️</span> Customize Avatar
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Upload a profile picture or select a default developer icon.</p>
            </div>

            {/* Default Avatars Grid */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Select Default Icon</label>
              <div className="grid grid-cols-4 gap-2">
                {["💻", "🚀", "🛡️", "🤖", "👾", "🕶️", "🦊", "🐼"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelectDefaultAvatar(emoji)}
                    className={`h-9 w-9 rounded-lg border text-base flex items-center justify-center transition hover:bg-slate-900 active:scale-95 cursor-pointer ${
                      userAvatar === emoji
                        ? "border-sky-500 bg-sky-950/30 text-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.25)]"
                        : "border-slate-800 bg-slate-900/40 text-slate-350"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full border-t border-slate-850/60 my-2" />

            {/* Upload Custom Picture */}
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Upload Photo</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="profile-avatar-upload"
                />
                <label
                  htmlFor="profile-avatar-upload"
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 border border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 rounded-lg text-slate-400 hover:text-slate-200 text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all"
                >
                  <span>📤</span> Upload Image File
                </label>
              </div>
              <p className="text-[8px] text-slate-500 leading-normal text-center">
                Max size 500KB. Optimized &amp; saved locally.
              </p>
            </div>
          </div>

        </div>

        {/* MIDDLE/RIGHT COLUMN: JIT Privilege Request Form & Access History */}
        <div className="lg:col-span-2 space-y-6">

          {/* Just-In-Time Request Console Panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 space-y-4 relative">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>⚡</span> Request Just-In-Time (JIT) Admin Access
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Acquire time-bound role overrides to perform critical deployments or schema synchronization tests.</p>
            </div>

            {userName === "admin" ? (
              <div className="p-4 rounded-xl border border-sky-500/20 bg-sky-950/5 text-sky-400 text-xs leading-normal select-none">
                💡 **Global Admin Scope**: You are currently authenticated as the super-user account **admin** with static `SuperAdmin` permissions. JIT access overrides are not required.
              </div>
            ) : activeJit ? (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs leading-normal">
                ⚡ **Active privileged session running**: You currently possess elevated **{activeJit.targetRole}** privileges. Please wait for this session to expire before submitting a subsequent JIT access request.
              </div>
            ) : hasPendingJit ? (
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs leading-normal">
                ⏳ **Request pending audit**: You have an active JIT upgrade request in the queue. Please contact the SuperAdmin to review and approve the request.
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Role upgrade picker */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Privileged Role</label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value="PROD_Admin">PROD Admin (Write &amp; Push PROD)</option>
                      <option value="PRE_Admin">PRE Admin (Write &amp; Push PRE)</option>
                      <option value="DEV_Admin">DEV Admin (Write &amp; Push DEV)</option>
                    </select>
                  </div>

                  {/* Duration Slider Picker */}
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Temporal Session Duration</label>
                    <select
                      value={jitDuration}
                      onChange={(e) => setJitDuration(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-amber-400 font-black focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      <option value={5}>⚡ 5 Minutes (Verification testing)</option>
                      <option value={15}>⚡ 15 Minutes (Staged migration)</option>
                      <option value={30}>⚡ 30 Minutes (Comprehensive audit)</option>
                      <option value={60}>⚡ 1 Hour (Extended maintenance)</option>
                    </select>
                  </div>
                </div>

                {/* Business Justification */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Business justification &amp; reason</label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    placeholder="e.g. Syncing entitlement drift on PROD tenant and applying baseline configurations to resolve audit ticket #9421."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 min-h-[70px] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-sky-500 via-sky-600 to-indigo-650 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer shadow-md"
                >
                  🚀 Submit JIT Privilege Request
                </button>
              </form>
            )}
          </div>

          {/* Access Requests History Audit */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>📋</span> Access Audit &amp; Request History
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Audit log of your temporal privilege requests and approvals state.</p>
            </div>

            {myRequests.length === 0 ? (
              <div className="text-center py-10 border border-slate-850 rounded-xl bg-slate-950/20 text-xs text-slate-500 select-none">
                No access requests history recorded.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-850 bg-slate-950/60 overflow-hidden select-none">
                <div className="grid grid-cols-[100px_130px_100px_1fr] text-[9.5px] font-black uppercase tracking-wider text-slate-500 bg-slate-900/50 p-2.5 border-b border-slate-850">
                  <span>Req ID</span>
                  <span>Requested At</span>
                  <span>Scope Role</span>
                  <span className="text-right">Audit Status</span>
                </div>

                <div className="divide-y divide-slate-850">
                  {myRequests.slice().reverse().map((req) => (
                    <div key={req.id} className="grid grid-cols-[100px_130px_100px_1fr] items-center p-2.5 text-xs text-slate-350">
                      <span className="font-mono font-bold text-sky-400">{req.id}</span>
                      <span className="text-[10px]">{new Date(req.timestamp).toLocaleString()}</span>
                      
                      <div className="flex flex-col text-left">
                        <span className="text-[10.5px] font-extrabold uppercase text-slate-200">{req.requestedRole}</span>
                        {req.isJit && (
                          <span className="text-[8px] font-bold text-amber-400">⚡ JIT ({req.jitDuration}m)</span>
                        )}
                      </div>

                      <div className="flex justify-end">
                        {req.status === "PENDING" && (
                          <span className="text-[9.5px] font-black uppercase bg-amber-950/40 text-amber-400 px-2 py-0.5 rounded border border-amber-800/40 animate-pulse">PENDING</span>
                        )}
                        {req.status === "APPROVED" && (
                          <span className="text-[9.5px] font-black uppercase bg-emerald-955/35 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40">APPROVED</span>
                        )}
                        {req.status === "REJECTED" && (
                          <span className="text-[9.5px] font-black uppercase bg-rose-955/35 text-rose-455 px-2 py-0.5 rounded border border-rose-800/40">REJECTED</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </Day0Shell>
  );
}
