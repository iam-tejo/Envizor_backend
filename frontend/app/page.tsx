"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ThemeToggle from "./components/ThemeToggle";

export default function LoginPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const router = useRouter();

  // Clear previous credentials on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("envizor_authenticated");
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const u = username.trim().toLowerCase();
    const p = password;

    if (isRegister) {
      if (!fullName.trim() || !email.trim() || !username.trim() || !password) {
        setError("All fields are required.");
        setLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        setLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      const builtIn = ["admin"];
      if (builtIn.includes(u)) {
        setError("Username is reserved for simulation testing.");
        setLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      const registered = localStorage.getItem("envizor_registered_users");
      const usersList = registered ? JSON.parse(registered) : [];
      if (usersList.some((x: any) => x.username.toLowerCase() === u)) {
        setError("Username is already taken.");
        setLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // Add to registered list in localStorage
      usersList.push({
        fullName: fullName.trim(),
        email: email.trim(),
        username: username.trim(),
        password: p,
        role: "Stakeholders"
      });
      localStorage.setItem("envizor_registered_users", JSON.stringify(usersList));

      // Add default tile permissions
      const perms = localStorage.getItem("envizor_user_permissions");
      const permsMap = perms ? JSON.parse(perms) : {};
      permsMap[username.trim().toLowerCase()] = ["tile-know-more"];
      localStorage.setItem("envizor_user_permissions", JSON.stringify(permsMap));

      // Sync registration to server JSON database
      const customRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = customRoles ? JSON.parse(customRoles) : {};
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: usersList,
          customRoles: rolesMap,
          permissions: permsMap
        })
      }).catch((err) => console.error("Error syncing registration to server:", err));

      setTimeout(() => {
        setSuccessMessage("Account created successfully! You can now log in.");
        setIsRegister(false);
        setConfirmPassword("");
        setFullName("");
        setEmail("");
        setLoading(false);
      }, 800);
      return;
    }

    let role: string | null = null;
    let actualUsername = username.trim();

    if (u === "admin" && p === "envizor-super") {
      role = "Administrators";
    } else {
      // Check registered users
      const registered = localStorage.getItem("envizor_registered_users");
      const usersList = registered ? JSON.parse(registered) : [];
      const matched = usersList.find((x: any) => x.username.toLowerCase() === u && x.password === p);
      if (matched) {
        role = matched.role || "Stakeholders";
      }
    }

    if (role) {
      setTimeout(() => {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("envizor_authenticated", "true");
          sessionStorage.setItem("envizor_username", actualUsername);

          // Check for any role re-assignments configured by SuperAdmin
          const overriddenRoles = localStorage.getItem("envizor_custom_roles");
          const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
          const finalRole = rolesMap[actualUsername.toLowerCase()] || role;

          sessionStorage.setItem("envizor_user_role", finalRole);

          // Sync database state on login
          const registered = localStorage.getItem("envizor_registered_users");
          const perms = localStorage.getItem("envizor_user_permissions");
          fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              users: registered ? JSON.parse(registered) : null,
              customRoles: rolesMap,
              permissions: perms ? JSON.parse(perms) : null
            })
          }).catch((err) => console.error("Error syncing login to server:", err));
        }
        router.push("/wizard/steps/welcome");
      }, 800);
    } else {
      setTimeout(() => {
        setError("Invalid credentials. Try another account or register below.");
        setLoading(false);
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }, 600);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 relative overflow-hidden select-none"
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* ── Background Art Layer ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Scattered Terraform Code */}
        <img
          src="/bg_terraform_code.png"
          alt=""
          className="absolute -top-10 -left-10 w-[550px] opacity-[0.07] select-none"
          style={{ mixBlendMode: "screen" }}
        />
        {/* Scattered AI neural structures */}
        <img
          src="/bg_ai_neural.png"
          alt=""
          className="absolute -bottom-10 -right-10 w-[550px] opacity-[0.07] select-none"
          style={{ mixBlendMode: "screen" }}
        />
        {/* Subtle center accent halo */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-15"
          style={{ background: "var(--accent)" }}
        />
      </div>

      {/* Floating Theme Selector top-left */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <span style={{ color: "var(--text-muted)" }} className="text-xs hidden md:inline">
          Preview Theme
        </span>
      </div>

      {/* Login Box */}
      <div
        className={`max-w-md w-full rounded-3xl p-8 border shadow-2xl relative z-10 transition-all duration-300 ${shake ? "animate-shake" : ""
          }`}
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--border)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)"
        }}
      >
        <div className="flex flex-col items-center mb-6">
          {/* Hex Shield Nexus Logo */}
          <div
            className="relative mb-4"
            style={{ filter: "drop-shadow(0 0 16px var(--accent-glow))" }}
          >
            <img
              src="/envizor-logo.png"
              alt="Envizor Logo"
              className="w-24 h-24 object-contain select-none"
              style={{ mixBlendMode: "screen" }}
            />
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-center" style={{ color: "var(--text-primary)" }}>
            {isRegister ? "Create Envizor Account" : "Sign In to Envizor"}
          </h2>
          <p className="text-xs text-center mt-1 text-center" style={{ color: "var(--text-secondary)" }}>
            Environment Visual Orchestration &amp; Automated Governance Hub
          </p>

          {/* Login / Register Tab Switcher */}
          <div className="mt-4 flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-900 w-full select-none">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition cursor-pointer ${!isRegister ? "bg-sky-600 text-white font-black" : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition cursor-pointer ${isRegister ? "bg-sky-600 text-white font-black" : "text-slate-400 hover:text-slate-200"
                }`}
            >
              Register
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {isRegister && (
            <>
              <div className="space-y-1 animate-fadeIn">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm font-semibold transition bg-slate-950/40 text-slate-100"
                  style={{
                    borderColor: "var(--border)",
                    outline: "none",
                    caretColor: "var(--accent)"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              <div className="space-y-1 animate-fadeIn">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border text-sm font-semibold transition bg-slate-950/40 text-slate-100"
                  style={{
                    borderColor: "var(--border)",
                    outline: "none",
                    caretColor: "var(--accent)"
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Username
            </label>
            <input
              type="text"
              required
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm font-semibold transition bg-slate-950/40 text-slate-100"
              style={{
                borderColor: "var(--border)",
                outline: "none",
                caretColor: "var(--accent)"
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border text-sm font-semibold transition bg-slate-950/40 text-slate-100"
              style={{
                borderColor: "var(--border)",
                outline: "none",
                caretColor: "var(--accent)"
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {isRegister && (
            <div className="space-y-1 animate-fadeIn">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Confirm Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border text-sm font-semibold transition bg-slate-950/40 text-slate-100"
                style={{
                  borderColor: "var(--border)",
                  outline: "none",
                  caretColor: "var(--accent)"
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-semibold text-center animate-fadeIn">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold text-center animate-fadeIn">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-2"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              boxShadow: "0 4px 16px var(--accent-glow)"
            }}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isRegister ? "Creating Account..." : "Decrypting Workspace..."}</span>
              </div>
            ) : (
              isRegister ? "Register Account" : "Secure Handshake"
            )}
          </button>
        </form>

        {/* Credentials request footnote */}
        <div className="mt-6 pt-4 border-t border-slate-900 text-center">
          <div className="text-[10px] text-slate-400 leading-relaxed">
            🔒 Envizor Secure Gateway active.<br />Please log in with your verified system identity or register a new workspace profile.
          </div>
        </div>
      </div>

      {/* Styled custom CSS animation rules for shake and fadeIn */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
}
