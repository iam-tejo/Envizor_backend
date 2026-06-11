"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { isTileLockedForRole } from "@/app/lib/roleConfig";

interface SubPage {
  name: string;
  href: string;
}

interface NavSection {
  id: string | null; // null means always unlocked
  title: string;
  icon: string;
  href: string;
  subPages?: SubPage[];
}

interface SideNavigationBarProps {
  userRole: string;
  userPermissions: string[];
  isOpenMobile: boolean;
  onCloseMobile?: () => void;
  viewMode: "desktop" | "mobile";
}

export default function SideNavigationBar({
  userRole,
  userPermissions,
  isOpenMobile,
  onCloseMobile,
  viewMode,
}: SideNavigationBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Sidebar expanded/collapsed state for desktop
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Resolve initial collapse state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCollapse = localStorage.getItem("envizor_sidebar_collapsed");
      setIsCollapsed(savedCollapse === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    if (typeof window !== "undefined") {
      localStorage.setItem("envizor_sidebar_collapsed", String(nextState));
    }
  };

  // Check if tile/navigation section is locked for the current user
  const isTileLocked = (tileId: string | null) => {
    if (!tileId) return false;
    return isTileLockedForRole(userRole, tileId, userPermissions);
  };

  const navSections: NavSection[] = [
    {
      id: null,
      title: "Welcome Hub",
      icon: "🏠",
      href: "/wizard/steps/welcome",
    },
    {
      id: "tile-know-more",
      title: "Know More",
      icon: "ℹ️",
      href: "/wizard/know-more",
      subPages: [
        { name: "Dashboard", href: "/wizard/know-more" },
        { name: "Mission & Purpose", href: "/wizard/know-more/mission" },
        { name: "Process Walkthrough", href: "/wizard/know-more/process" },
        { name: "Manual vs. Envizor", href: "/wizard/know-more/vs-manual" },
        { name: "Key Capabilities", href: "/wizard/know-more/capabilities" },
        { name: "Terraform Reference", href: "/wizard/know-more/terraform" },
        { name: "Disconnected Apps", href: "/wizard/know-more/disconnected-onboarding" },
        { name: "Agent GitOps CD", href: "/wizard/know-more/agent-deployment" },
        { name: "FAQs", href: "/wizard/know-more/faq" },
      ],
    },
    {
      id: "tile-day0-setup",
      title: "Day 0 Setup",
      icon: "⚙️",
      href: "/wizard/day0-setup",
    },
    {
      id: "tile-iga-explorer",
      title: "IGA Tenants Explorer",
      icon: "🔍",
      href: "/wizard/day0",
      subPages: [
        { name: "Dashboard", href: "/wizard/day0" },
        { name: "Environment Discovery", href: "/wizard/day0/discovery" },
        { name: "Compare Environments", href: "/wizard/day0/diff" },
        { name: "Saviynt API Usage", href: "/wizard/day0/api-usage" },
      ],
    },
    {
      id: "tile-workspace-explorer",
      title: "Workspace Explorer",
      icon: "📁",
      href: "/wizard/explorer",
      subPages: [
        { name: "Dashboard", href: "/wizard/explorer" },
        { name: "Discovery & Pull", href: "/wizard/explorer/discovery" },
        { name: "Schema Registry", href: "/wizard/explorer/schema-registry" },
        { name: "Compare Workspaces", href: "/wizard/explorer/compare" },
      ],
    },
    {
      id: "tile-terraform-wizard",
      title: "DevOps Wizard",
      icon: "🚀",
      href: "/wizard/home",
      subPages: [
        { name: "Control Panel", href: "/wizard/home" },
        { name: "Deploy to Saviynt", href: "/wizard/push" },
        { name: "Sync - Selection", href: "/wizard/steps/source-workspace" },
      ],
    },
    {
      id: "tile-connected-app",
      title: "Connected App JSON",
      icon: "🔌",
      href: "/wizard/connected-app",
      subPages: [
        { name: "Dashboard", href: "/wizard/connected-app" },
        { name: "Connected App Playpen", href: "/wizard/connected-app/playpen" },
      ],
    },
    {
      id: "tile-disconnected-app-onboarding",
      title: "Disconnected Apps",
      icon: "⚡",
      href: "/wizard/disconnected-onboarding",
    },
    {
      id: "tile-analytics",
      title: "Analytics & Insights",
      icon: "📊",
      href: "/wizard/analytics",
    },
    {
      id: "tile-ai-agent",
      title: "AI Agent Console",
      icon: "🧠",
      href: "/wizard/agent",
    },
    {
      id: "tile-deploy-agent",
      title: "Deploy through Agent",
      icon: "🤖",
      href: "/wizard/deploy-agent",
    },
  ];

  // Extra administrative/profile options
  const adminSections: NavSection[] = [
    {
      id: "admin-console",
      title: "Admin Console",
      icon: "⚙️",
      href: "/wizard/admin",
    },
    {
      id: "backend-detail",
      title: "Backend Code Detail",
      icon: "📊",
      href: "/wizard/backend-detail",
    },
    {
      id: "profile",
      title: "My Profile",
      icon: "👤",
      href: "/wizard/profile",
    },
  ];

  const filteredAdminSections = adminSections.filter((sec) => {
    if (sec.id === "profile") return true;
    const roles = userRole.split(",").map((r) => r.trim().toUpperCase());
    return roles.some((r) => r === "ADMINISTRATORS" || r === "SUPERADMIN" || r === "DEV OPS");
  });

  const isPathActive = (path: string) => {
    if (path === "/wizard") return pathname === "/wizard";
    return pathname === path || pathname.startsWith(path + "/");
  };

  // Expand parent sections automatically if any of their subpages are currently active
  useEffect(() => {
    const updatedExpanded: Record<string, boolean> = { ...expandedSections };
    let changed = false;

    navSections.forEach((section) => {
      if (section.subPages) {
        const hasActiveSubPage = section.subPages.some((sp) => pathname === sp.href || pathname.startsWith(sp.href + "?"));
        if (hasActiveSubPage && !expandedSections[section.title]) {
          updatedExpanded[section.title] = true;
          changed = true;
        }
      }
    });

    if (changed) {
      setExpandedSections(updatedExpanded);
    }
  }, [pathname]);

  const handleToggleSection = (sectionTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const handleLinkClick = (e: React.MouseEvent, sec: NavSection, href: string) => {
    const locked = isTileLocked(sec.id);
    if (locked) {
      e.preventDefault();
      // Redirect to welcome steps with requestAccess query param
      router.push(`/wizard/steps/welcome?requestAccess=${sec.id}`);
      if (onCloseMobile) onCloseMobile();
    } else {
      if (onCloseMobile) onCloseMobile();
    }
  };

  const isSectionExpanded = (sectionTitle: string) => {
    return !!expandedSections[sectionTitle];
  };

  // Mobile layout vs Desktop layout class definitions
  const isMobileView = viewMode === "mobile";
  
  if (isMobileView && !isOpenMobile) {
    return null;
  }

  return (
    <>
      {/* Sidebar background overlay on mobile */}
      {isMobileView && isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-[90] md:hidden backdrop-blur-sm transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <div
        className={`
          h-full border-r flex flex-col justify-between transition-all duration-300 z-[95] select-none flex-shrink-0
          ${isMobileView ? "fixed left-0 top-12 bottom-0 w-[260px] shadow-2xl" : ""}
          ${!isMobileView ? (isCollapsed ? "w-16" : "w-[260px]") : ""}
        `}
        style={{
          backgroundColor: "var(--bg-panel)",
          borderColor: "var(--border)",
        }}
      >
        {/* Main Navigation Scroll Area */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin">
          
          {/* Header Title (only when expanded and not collapsed) */}
          {!isCollapsed && (
            <div className="px-3 mb-4 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                Navigation Wizard
              </span>
              {/* Desktop toggle collapse button */}
              {!isMobileView && (
                <button
                  onClick={toggleCollapse}
                  className="p-1 rounded border hover:bg-slate-800/40 transition cursor-pointer text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  title="Collapse Sidebar"
                >
                  ◀
                </button>
              )}
            </div>
          )}

          {/* Desktop expand button when collapsed */}
          {isCollapsed && !isMobileView && (
            <div className="flex justify-center mb-4">
              <button
                onClick={toggleCollapse}
                className="p-1.5 rounded-full border hover:bg-slate-800/40 transition cursor-pointer text-xs"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                title="Expand Sidebar"
              >
                ▶
              </button>
            </div>
          )}

          <div className="space-y-1">
            {navSections.map((sec) => {
              const active = isPathActive(sec.href);
              const locked = isTileLocked(sec.id);
              const hasSubPages = !!sec.subPages && sec.subPages.length > 0;
              const expanded = isSectionExpanded(sec.title);

              // Gated styling
              const itemStyles = active
                ? {
                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                    borderLeft: "3px solid var(--accent)",
                    color: "var(--text-primary)",
                  }
                : {
                    color: locked ? "var(--text-muted)" : "var(--text-secondary)",
                  };

              return (
                <div key={sec.title} className="relative group/item">
                  
                  {/* Tooltip for collapsed mode */}
                  {isCollapsed && !isMobileView && (
                    <div className="sidebar-tooltip">
                      <div className="font-extrabold flex items-center gap-1">
                        <span>{sec.title}</span>
                        {locked && <span className="text-[9px] text-red-400">🔒 Gated</span>}
                      </div>
                      {hasSubPages && (
                        <div className="text-[10px] text-slate-400 mt-1 border-t border-slate-700/50 pt-1 space-y-0.5">
                          {sec.subPages?.map((sp) => (
                            <div key={sp.name} className={pathname === sp.href ? "text-sky-400 font-bold" : ""}>
                              • {sp.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Parent Link Row */}
                  <Link
                    href={sec.href}
                    onClick={(e) => handleLinkClick(e, sec, sec.href)}
                    className={`
                      sidebar-item flex items-center justify-between rounded-lg py-2 px-3
                      text-xs font-semibold hover:bg-slate-800/25 transition-all cursor-pointer
                      ${locked ? "opacity-75 hover:opacity-100" : ""}
                    `}
                    style={itemStyles}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-sm flex-shrink-0">{sec.icon}</span>
                      {(!isCollapsed || isMobileView) && (
                        <span className="truncate font-semibold tracking-wide">
                          {sec.title}
                        </span>
                      )}
                    </div>

                    {(!isCollapsed || isMobileView) && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {locked && (
                          <span className="text-[10px]" title="Role Privilege Required">
                            🔒
                          </span>
                        )}
                        {hasSubPages && (
                          <button
                            onClick={(e) => handleToggleSection(sec.title, e)}
                            className="p-0.5 rounded hover:bg-slate-700/30 transition text-[9px] leading-none text-slate-400 font-bold"
                          >
                            {expanded ? "▼" : "▶"}
                          </button>
                        )}
                      </div>
                    )}
                  </Link>

                  {/* Subpages Drawer (Accordion) */}
                  {hasSubPages && expanded && (!isCollapsed || isMobileView) && (
                    <div
                      className="ml-6.5 mt-1 border-l pl-2.5 space-y-1"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {sec.subPages?.map((sub) => {
                        const subActive = pathname === sub.href || pathname.startsWith(sub.href + "?");
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            onClick={(e) => handleLinkClick(e, sec, sub.href)}
                            className={`
                              block py-1.5 px-2 rounded-md text-[10.5px] font-medium transition cursor-pointer
                              hover:bg-slate-800/15 hover:text-white
                              ${subActive ? "text-sky-400 font-bold bg-sky-950/10" : "text-slate-400"}
                            `}
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t" style={{ borderColor: "var(--border)" }} />

          {/* Administrative / Profile Links */}
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Admin Console &amp; Profile
              </span>
            )}
            
            {filteredAdminSections.map((sec) => {
              const active = isPathActive(sec.href);
              
              return (
                <Link
                  key={sec.title}
                  href={sec.href}
                  className={`
                    sidebar-item flex items-center gap-2.5 rounded-lg py-2 px-3
                    text-xs font-semibold hover:bg-slate-800/25 transition cursor-pointer
                  `}
                  style={
                    active
                      ? {
                          backgroundColor: "rgba(59, 130, 246, 0.12)",
                          borderLeft: "3px solid var(--accent)",
                          color: "var(--text-primary)",
                        }
                      : { color: "var(--text-secondary)" }
                  }
                >
                  <span className="text-sm flex-shrink-0">{sec.icon}</span>
                  {(!isCollapsed || isMobileView) && (
                    <span className="truncate font-semibold tracking-wide">
                      {sec.title}
                    </span>
                  )}
                  {isCollapsed && !isMobileView && (
                    <div className="sidebar-tooltip">
                      <span className="font-extrabold">{sec.title}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

        </div>

        {/* Sidebar Footer (User session details or Quick Status) */}
        {(!isCollapsed || isMobileView) && (
          <div
            className="p-3 border-t text-[9.5px] text-center"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "rgba(0,0,0,0.15)",
            }}
          >
            <div className="font-bold text-slate-400">
              🔒 Envizor Secure Client
            </div>
            <div className="text-slate-500 mt-0.5">
              Role Profile: <strong className="text-sky-400 uppercase">{userRole}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Styled custom tooltip rules */}
      <style jsx global>{`
        .sidebar-tooltip {
          visibility: hidden;
          position: absolute;
          left: 105%;
          top: 50%;
          transform: translateY(-50%);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.35rem 0.6rem;
          border-radius: 0.5rem;
          font-size: 0.7rem;
          white-space: nowrap;
          z-index: 999;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -2px rgba(0,0,0,0.15);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease-in-out, transform 0.15s ease-in-out;
        }
        .group\/item:hover .sidebar-tooltip {
          visibility: visible;
          opacity: 1;
          transform: translateY(-50%) translateX(4px);
        }
      `}</style>
    </>
  );
}
