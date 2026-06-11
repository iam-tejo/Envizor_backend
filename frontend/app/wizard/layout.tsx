"use client";

import { useState, useEffect } from "react";
import RightDockedChatbot from "@/app/components/chatbot/RightDockedChatbot";
import ThemeToggle from "@/app/components/ThemeToggle";
import SideNavigationBar from "./components/SideNavigationBar";

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const [panelState, setPanelState] = useState<"standard" | "expanded" | "hidden" | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  // User details & roles states
  const [userRole, setUserRole] = useState<string>("Administrators");
  const [userName, setUserName] = useState<string>("admin");
  const [userAvatar, setUserAvatar] = useState<string>("👤");
  const [userPermissions, setUserPermissions] = useState<string[]>(["tile-know-more"]);

  // Mobile layout state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // JIT temporal session tracking states
  const [jitActive, setJitActive] = useState<boolean>(false);
  const [jitRole, setJitRole] = useState<string>("");
  const [jitTimeLeft, setJitTimeLeft] = useState<string>("");
  const [showJitModal, setShowJitModal] = useState<boolean>(false);
  const [lastJitRole, setLastJitRole] = useState<string>("");

  // Load from sessionStorage inside useEffect to avoid SSR mismatch
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAuth = sessionStorage.getItem("envizor_authenticated") === "true";
      if (!isAuth) {
        setAuthenticated(false);
        window.location.href = "/";
        return;
      }
      setAuthenticated(true);

      const saved = sessionStorage.getItem("envizor_panel_state") as any;
      const isMobile = window.innerWidth < 768;
      const defaultState = isMobile ? "hidden" : "standard";
      setPanelState(saved && ["standard", "expanded", "hidden"].includes(saved) ? saved : defaultState);

      const savedViewMode = sessionStorage.getItem("envizor_view_mode") as any;
      const initialViewMode = savedViewMode === "mobile" || savedViewMode === "desktop" ? savedViewMode : (isMobile ? "mobile" : "desktop");
      setViewMode(initialViewMode);

      const user = sessionStorage.getItem("envizor_username") || "admin";
      
      // Resolve up-to-date role from local storage overrides
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || (user === "admin" ? "Administrators" : "Stakeholders");
      
      // Sync immediately back into sessionStorage so all child pages share it
      sessionStorage.setItem("envizor_user_role", latestRole);
      
      setUserRole(latestRole);
      setUserName(user);

      const savedAvatar = localStorage.getItem(`envizor_user_avatar_${user.toLowerCase()}`) || "👤";
      setUserAvatar(savedAvatar);

      // Load user tile permissions from localStorage
      const allPerms = localStorage.getItem("envizor_user_permissions");
      const permsMap = allPerms ? JSON.parse(allPerms) : {};
      const userPerms = permsMap[user.toLowerCase()] || ["tile-know-more"];
      setUserPermissions(userPerms);

      // Check if there is an unresolved expired JIT modal notification pending
      const expiredModalRole = sessionStorage.getItem("envizor_jit_expired_modal");
      if (expiredModalRole) {
        setLastJitRole(expiredModalRole);
        setShowJitModal(true);
        sessionStorage.removeItem("envizor_jit_expired_modal");
      }
      
      // Delay dispatch slightly to ensure children listeners are ready
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("envizorViewModeChange", { detail: initialViewMode }));
      }, 150);
    }
  }, []);

  useEffect(() => {
    if (!userName) return;
    const handleAvatarChange = () => {
      const saved = localStorage.getItem(`envizor_user_avatar_${userName.toLowerCase()}`) || "👤";
      setUserAvatar(saved);

      const allPerms = localStorage.getItem("envizor_user_permissions");
      const permsMap = allPerms ? JSON.parse(allPerms) : {};
      const userPerms = permsMap[userName.toLowerCase()] || ["tile-know-more"];
      setUserPermissions(userPerms);
    };
    window.addEventListener("envizorAvatarChanged", handleAvatarChange);
    window.addEventListener("storage", handleAvatarChange);
    return () => {
      window.removeEventListener("envizorAvatarChanged", handleAvatarChange);
      window.removeEventListener("storage", handleAvatarChange);
    };
  }, [userName]);

  // Ticking countdown checker loop
  useEffect(() => {
    if (!userName || userName === "admin") return;

    const triggerDemotion = (expiredRoleName: string, baseRoleName: string) => {
      try {
        // 1. Wipe JIT active cache
        const jitData = localStorage.getItem("envizor_jit_access");
        if (jitData) {
          const jitMap = JSON.parse(jitData);
          delete jitMap[userName.toLowerCase()];
          localStorage.setItem("envizor_jit_access", JSON.stringify(jitMap));
        }

        // 2. Revert in custom_roles override mapping
        const customRolesData = localStorage.getItem("envizor_custom_roles") || "{}";
        const customRoles = JSON.parse(customRolesData);
        const targetBaseRole = baseRoleName === "BasicUser" ? "Stakeholders" : baseRoleName;
        customRoles[userName.toLowerCase()] = targetBaseRole;
        localStorage.setItem("envizor_custom_roles", JSON.stringify(customRoles));
 
        // 3. Clear the tile permissions granted during this JIT session
        const permsData = localStorage.getItem("envizor_user_permissions");
        const permsMap = permsData ? JSON.parse(permsData) : {};
        permsMap[userName.toLowerCase()] = ["tile-know-more"];
        localStorage.setItem("envizor_user_permissions", JSON.stringify(permsMap));

        // Sync changes to server database
        fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customRoles,
            permissions: permsMap
          })
        }).catch((err) => console.error("Error syncing JIT demotion to server:", err));

        // 4. Sync session storage role instantly
        sessionStorage.setItem("envizor_user_role", baseRoleName);
        setUserRole(baseRoleName);

        // 5. Store modal notification state in sessionStorage to survive a redirect/reload
        sessionStorage.setItem("envizor_jit_expired_modal", expiredRoleName);

        setJitActive(false);

        // 6. Dispatch events
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("envizorRoleChanged", { detail: baseRoleName }));

        // 7. Force instant redirect back to welcome page
        if (window.location.pathname !== "/wizard/steps/welcome") {
          window.location.href = "/wizard/steps/welcome";
        } else {
          // If already on welcome, show modal directly
          setLastJitRole(expiredRoleName);
          setShowJitModal(true);
          sessionStorage.removeItem("envizor_jit_expired_modal");
        }
      } catch (err) {
        console.error("Error during automatic PAM demotion:", err);
      }
    };

    const checkJit = () => {
      try {
        const jitData = localStorage.getItem("envizor_jit_access");
        if (!jitData) {
          setJitActive(false);
          return;
        }

        const jitMap = JSON.parse(jitData);
        const userJit = jitMap[userName.toLowerCase()];

        if (!userJit) {
          setJitActive(false);
          return;
        }

        const now = Date.now();
        const diffMs = userJit.expiresAt - now;

        if (diffMs <= 0) {
          triggerDemotion(userJit.targetRole, userJit.baseRole || "Stakeholders");
        } else {
          setJitActive(true);
          setJitRole(userJit.targetRole);

          const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
          const mins = Math.floor(totalSecs / 60);
          const secs = totalSecs % 60;
          setJitTimeLeft(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
        }
      } catch (err) {
        console.error("Error executing JIT expiration check:", err);
      }
    };

    checkJit();
    const timer = setInterval(checkJit, 1000);
    
    // Also listen to storage updates from other pages
    const syncStorage = () => checkJit();
    window.addEventListener("storage", syncStorage);

    return () => {
      clearInterval(timer);
      window.removeEventListener("storage", syncStorage);
    };
  }, [userName]);

  const handleStateChange = (state: "standard" | "expanded" | "hidden") => {
    setPanelState(state);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("envizor_panel_state", state);
    }
  };

  const changeViewMode = (mode: "desktop" | "mobile") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("envizor_view_mode", mode);
      window.dispatchEvent(new CustomEvent("envizorViewModeChange", { detail: mode }));
    }
  };

  // Prevent SSR render flashes and unauthorized page access
  if (authenticated === null || !authenticated || panelState === null) {
    return (
      <div
        className="flex h-screen w-screen overflow-hidden items-center justify-center"
        style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
      >
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <span className="w-8 h-8 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authenticating Handshake...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden relative"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Premium Top Navigation Bar */}
      <div 
        className="h-12 w-full flex items-center justify-between px-4 border-b z-50 backdrop-blur-md"
        style={{ 
          borderColor: "var(--border)", 
          backgroundColor: "var(--bg-panel)" 
        }}
      >
        {/* Left Side: Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          {viewMode === "mobile" && (
            <button
              onClick={() => setMobileSidebarOpen((prev) => !prev)}
              className="p-1 px-1.5 rounded hover:bg-slate-800/40 text-slate-350 transition cursor-pointer text-xs font-bold border border-slate-800 mr-1"
              title="Toggle Navigation Menu"
            >
              ☰ Menu
            </button>
          )}
          <img src="/envizor-robot.png" alt="Envizor" className="w-6 h-6 object-contain animate-pulse" />
          <span 
            className="text-[10px] font-black uppercase tracking-[0.2em] bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent cursor-pointer"
            onClick={() => window.location.href = "/wizard/steps/welcome"}
          >
            Envizor Suite
          </span>
        </div>

        {/* Center/Right Side: Controls */}
        <div className="flex items-center gap-4">

          {/* Active JIT Session Countdown */}
          {jitActive && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-500/35 bg-amber-500/5 text-[10px] font-bold text-amber-450 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse">
              <span>⚡ JIT:</span>
              <strong className="text-amber-300 font-extrabold uppercase">{jitRole}</strong>
              <span className="text-amber-500/60 font-medium">•</span>
              <span className="font-mono text-amber-250 tracking-wider text-[11px]">{jitTimeLeft} left</span>
            </div>
          )}

          {/* User Role Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] font-semibold text-slate-350">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-450 shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
            <span className="opacity-80">User:</span>
            <strong className="text-slate-100 font-extrabold">{userName}</strong>
            <span className="text-slate-500">•</span>
            <span className="text-[9px] bg-slate-950 text-sky-400 border border-sky-900/30 px-1.5 py-0.2 rounded font-extrabold">{userRole}</span>
            <span className="text-slate-500">•</span>
            <button
              onClick={() => window.location.href = "/wizard/profile"}
              title="View Profile / JIT Access"
              className="hover:text-sky-400 transition cursor-pointer text-[9px] font-extrabold uppercase ml-1 flex items-center gap-1.5 bg-transparent border-none outline-none"
            >
              <span className="h-4.5 w-4.5 rounded-full overflow-hidden flex items-center justify-center border border-slate-700 bg-slate-800 text-[10px] shrink-0">
                {userAvatar.startsWith("data:image") ? (
                  <img src={userAvatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{userAvatar}</span>
                )}
              </span> <span className="hidden sm:inline">Profile</span>
            </button>
            <span className="text-slate-500">•</span>
            <button
              onClick={() => {
                sessionStorage.removeItem("envizor_authenticated");
                sessionStorage.removeItem("envizor_user_role");
                sessionStorage.removeItem("envizor_username");
                window.location.href = "/";
              }}
              title="Logout / Switch User"
              className="hover:text-red-400 transition cursor-pointer text-[9px] font-extrabold uppercase ml-1 flex items-center gap-0.5 bg-transparent border-none outline-none"
            >
              <span>🚪</span> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          <span className="h-4 w-[1px]" style={{ backgroundColor: "var(--border)" }} />
          
          {/* Theme Control */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span style={{ color: "var(--text-muted)" }} className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">
              Theme
            </span>
          </div>

          <span className="h-4 w-[1px]" style={{ backgroundColor: "var(--border)" }} />

          {/* View Mode Switcher */}
          <div 
            className="flex items-center bg-black/45 p-0.5 rounded-lg border shadow-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <button
              onClick={() => changeViewMode("desktop")}
              className="px-2.5 py-1 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
              style={
                viewMode === "desktop"
                  ? { backgroundColor: "var(--accent)", color: "#ffffff" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <span>💻</span> <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => changeViewMode("mobile")}
              className="px-2.5 py-1 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
              style={
                viewMode === "mobile"
                  ? { backgroundColor: "var(--accent)", color: "#ffffff" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <span>📱</span> <span className="hidden sm:inline">Mobile View</span>
            </button>
          </div>

        </div>
      </div>

      {/* Split Panels Container */}
      <div className="flex flex-1 h-[calc(100vh-48px)] overflow-hidden relative">
        {/* Side Navigation Bar */}
        <SideNavigationBar
          userRole={userRole}
          userPermissions={userPermissions}
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          viewMode={viewMode}
        />

        {/* Left panel: Active Sub-pages/Wizard screens */}
        <div className={`h-full overflow-y-auto min-w-0 transition-all duration-300 ${panelState === "expanded" ? "w-0 hidden" : (panelState === "standard" && viewMode === "mobile") ? "w-0 hidden" : "w-full flex-1"}`}>
          {children}
        </div>

        {/* Right panel: Permanent Sticky AI Assistant Panel */}
        <div
          className={`
            h-full flex-shrink-0
            transition-all duration-300 flex flex-col overflow-hidden relative
            ${panelState === "standard" ? (viewMode === "mobile" ? "w-full" : "w-[430px]") : panelState === "expanded" ? "w-full" : "w-0"}
          `}
          style={{
            borderLeft: panelState !== "hidden" && panelState !== "expanded" ? "1px solid var(--border)" : "none",
            background: "var(--bg-panel)",
          }}
        >
          <RightDockedChatbot
            panelState={panelState}
            onChangePanelState={handleStateChange}
          />
        </div>
      </div>

      {/* Floating launcher bubble when chatbot is hidden */}
      {panelState === "hidden" && (
        <button
          onClick={() => handleStateChange("standard")}
          title="Open AI Assistant"
          className="
            fixed bottom-6 right-6 z-50
            h-12 w-12 rounded-full
            hover:scale-[1.1] active:scale-95 transition-all duration-300
            shadow-2xl flex items-center justify-center
            animate-fadeIn border border-white/10 cursor-pointer
            group hover:rotate-6
          "
          style={{
            background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
            boxShadow: "0 8px 24px var(--accent-glow)",
          }}
        >
          <img 
            src="/envizor-robot.png" 
            alt="Envizor Advisor" 
            className="w-7 h-7 object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)] group-hover:scale-105 transition-transform" 
          />
          {/* Active notification indicator dot */}
          <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-slate-900 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        </button>
      )}

      {/* Just-In-Time Expiration Warning Modal */}
      {showJitModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 overflow-hidden rounded-2xl border border-red-500/30 bg-slate-950/80 shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col items-center text-center gap-4">
            
            {/* Animated glowing alert icon */}
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/40 text-red-400 animate-bounce">
              <span className="text-3xl">⚠️</span>
              <span className="absolute inset-0 rounded-full border border-red-500/30 animate-ping opacity-75" />
            </div>

            <div className="flex flex-col gap-1.5">
              <h3 className="text-lg font-black uppercase tracking-wider text-slate-100">
                JIT Access Expired
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed px-2">
                Your elevated temporal privilege <strong className="text-red-400 font-extrabold uppercase">{lastJitRole}</strong> has expired. 
                Your role has been safely reverted to <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-350">Stakeholders</span>.
              </p>
            </div>

            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-slate-800 to-transparent my-1" />

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setShowJitModal(false)}
                className="w-full py-2.5 rounded-lg border border-red-500/30 hover:border-red-500/50 bg-red-955/20 hover:bg-red-900/30 text-red-200 hover:text-white text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer shadow-lg active:scale-95"
              >
                Acknowledge &amp; Close
              </button>
              
              <button
                onClick={() => {
                  setShowJitModal(false);
                  window.location.href = "/wizard/profile";
                }}
                className="w-full py-2 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer"
              >
                🔑 Request New Access
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
