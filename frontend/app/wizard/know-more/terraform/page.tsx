"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function TerraformPage() {
  const [activeTfResource, setActiveTfResource] = useState<string>("security_system");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("envizor_view_mode") as any;
      const isMobile = window.innerWidth < 768;
      setViewMode(saved === "mobile" || saved === "desktop" ? saved : (isMobile ? "mobile" : "desktop"));

      const handleViewModeChange = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        if (detail === "desktop" || detail === "mobile") {
          setViewMode(detail);
        }
      };
      window.addEventListener("envizorViewModeChange", handleViewModeChange);
      return () => window.removeEventListener("envizorViewModeChange", handleViewModeChange);
    }
  }, []);

  const TF_RESOURCES = [
    {
      key: "security_system",
      label: "Security System",
      icon: "🛡️",
      tfType: "saviynt_security_system",
      category: "Core Infrastructure",
      description: "Defines and manages top-level EIC Security Systems — the root containers for all endpoints, connections, and access policies.",
      apiEndpoint: "GET /ECM/api/v5/getSecuritySystems",
      hcl: `resource "saviynt_security_system" "hr_system" {
  name        = "HR_SYSTEM_DEV"
  description = "HR Security System for Development"
}`,
      attrs: ["name", "description"]
    },
    {
      key: "endpoint",
      label: "Endpoint",
      icon: "🔌",
      tfType: "saviynt_endpoint",
      category: "Core Infrastructure",
      description: "Manages EIC Endpoints — the secure API or database connection targets attached to a parent Security System.",
      apiEndpoint: "POST /ECM/api/v5/getEndpoints",
      hcl: `resource "saviynt_endpoint" "hr_endpoint" {
  name               = "HR_API_ENDPOINT"
  security_system_id = saviynt_security_system.hr_system.id
  description        = "HR API Endpoint"
}`,
      attrs: ["name", "security_system_id", "description"]
    },
    {
      key: "dynamic_attribute",
      label: "Dynamic Attribute",
      icon: "🏷️",
      tfType: "saviynt_dynamic_attribute",
      category: "Configuration",
      description: "Creates and manages custom schema dynamic attributes that extend EIC object definitions with additional metadata fields.",
      apiEndpoint: "POST /ECM/api/v5/getDynamicAttributes",
      hcl: `resource "saviynt_dynamic_attribute" "department_code" {
  name        = "department_code"
  value       = "HR-DEV"
  description = "Department code dynamic attribute"
}`,
      attrs: ["name", "value", "description"]
    },
    {
      key: "entitlement_type",
      label: "Entitlement Type",
      icon: "📋",
      tfType: "saviynt_entitlement_type",
      category: "Access Control",
      description: "Defines the classification type for entitlements — e.g. Active Directory Group, Database Role, or SAP Profile.",
      apiEndpoint: "POST /ECM/api/v5/getEntitlementTypes",
      hcl: `resource "saviynt_entitlement_type" "ad_group" {
  name        = "AD_Group"
  description = "Active Directory Group Entitlement"
}`,
      attrs: ["name", "description"]
    },
    {
      key: "enterprise_role",
      label: "Enterprise Role",
      icon: "👔",
      tfType: "saviynt_enterprise_role",
      category: "Access Control",
      description: "Business-level role bundles that group multiple fine-grained entitlements under a single organisational access construct.",
      apiEndpoint: "POST /ECM/api/v5/getEnterpriseRoles",
      hcl: `resource "saviynt_enterprise_role" "dev_engineer" {
  name        = "Enterprise_Dev_Engineer"
  description = "General Enterprise Role for dev engineers"
}`,
      attrs: ["name", "description"]
    },
    {
      key: "entitlement",
      label: "Entitlements",
      icon: "🎫",
      tfType: "saviynt_entitlement",
      category: "Access Control",
      description: "Fine-grained access permissions — the atomic unit of EIC access control — mapped to endpoints and security systems.",
      apiEndpoint: "POST /ECM/api/v5/getEntitlements",
      hcl: `resource "saviynt_entitlement" "read_access" {
  name              = "Dev_Read_Access"
  entitlement_value = "read-only"
  description       = "Read-only access entitlement"
}`,
      attrs: ["name", "entitlement_value", "description"]
    },
    {
      key: "privilege",
      label: "Privileges",
      icon: "⚡",
      tfType: "saviynt_privilege",
      category: "Access Control",
      description: "Elevated administrator or super-user privileges granted to power users above standard entitlement tiers.",
      apiEndpoint: "POST /ECM/api/v5/getPrivileges",
      hcl: `resource "saviynt_privilege" "admin_access" {
  name        = "admin_dashboard_access"
  description = "Access to admin developer portal"
}`,
      attrs: ["name", "description"]
    },
    {
      key: "file_upload",
      label: "File Upload",
      icon: "📁",
      tfType: "saviynt_file_upload",
      category: "Data Management",
      description: "Manages secure file upload operations — e.g. bulk user provisioning spreadsheets or SAP HR export CSV files.",
      apiEndpoint: "POST /ECM/api/v5/getFileUploads",
      hcl: `resource "saviynt_file_upload" "sap_users" {
  file_name = "sap_users_baseline.xlsx"
  file_size = 1048576
  status    = "SUCCESS"
}`,
      attrs: ["file_name", "file_size", "status"]
    },
    {
      key: "connection",
      label: "Connections",
      icon: "🔗",
      tfType: "saviynt_connection",
      category: "Core Infrastructure",
      description: "Defines and manages the underlying database, LDAP, REST, SAP, or Salesforce connection profiles used by endpoints.",
      apiEndpoint: "POST /ECM/api/v5/getConnections",
      hcl: `resource "saviynt_connection" "dev_db" {
  name        = "DEV_DB_CONN"
  type        = "Database"
  description = "Development DB Connection"
}`,
      attrs: ["name", "type", "description"]
    },
    {
      key: "job",
      label: "Jobs",
      icon: "⚙️",
      tfType: "saviynt_*_job_resource",
      category: "Automation",
      description: "Configures automated reconciliation, synchronisation, and data import jobs. Each application maps to a specific EIC job resource block type.",
      apiEndpoint: "GET /ECM/api/v5/jobs",
      hcl: `# Per-application job blocks — type is resolved generically:
resource "saviynt_application_data_import_job_resource" "hr_import" {
  name        = "HR_Data_Import"
  status      = "SUCCESS"
  description = "Daily HR data import reconcile job"
}

resource "saviynt_accounts_import_full_job_resource" "finance_accounts" {
  name        = "Finance_Accounts_Full_Sync"
  status      = "SUCCESS"
  description = "Full finance accounts synchronisation"
}

resource "saviynt_user_import_job_resource" "user_sync" {
  name        = "User_Identity_Sync"
  status      = "SUCCESS"
  description = "User identity synchronisation job"
}`,
      attrs: ["name", "status", "description", "jobType"]
    },
    {
      key: "transport_package",
      label: "Transport Packages",
      icon: "📦",
      tfType: "saviynt_export/import_transport_package_resource",
      category: "Deployment",
      description: "Cross-environment configuration promotion packages. Exports bundle EIC configs from source and Imports deploy them to target environments (DEV → PRE → PROD).",
      apiEndpoint: "POST /ECM/api/v5/getTransportPackages",
      hcl: `# EXPORT from source environment:
resource "saviynt_export_transport_package_resource" "billing_module_export" {
  name        = "Billing_Module_DEV"
  version     = "1.0.0"
  description = "Billing access configurations export package"
}

# IMPORT into target environment:
resource "saviynt_import_transport_package_resource" "billing_module_import" {
  name         = "Billing_Module_PRE"
  package_path = "./packages/Billing_Module_DEV.zip"
  description  = "Billing access configurations import into PRE"
}`,
      attrs: ["name", "version", "package_path", "description", "actionType"]
    }
  ];

  const JOB_TYPES = [
    { block: "saviynt_application_data_import_job_resource", use: "Import data from connected apps (SAP, Workday, etc.)" },
    { block: "saviynt_user_import_job_resource", use: "Synchronise user identities from HR or LDAP sources" },
    { block: "saviynt_accounts_import_full_job_resource", use: "Full account import — rebuilds entire account state" },
    { block: "saviynt_accounts_import_incremental_job_resource", use: "Incremental delta sync — only changed accounts" },
    { block: "saviynt_ecm_job_resource", use: "Enterprise Connection Manager generalised jobs" },
    { block: "saviynt_ecm_sap_user_job_resource", use: "SAP-specific ECM user provisioning jobs" },
    { block: "saviynt_schema_user_job_resource", use: "User schema reconciliation and normalisation" },
    { block: "saviynt_schema_account_job_resource", use: "Account schema reconciliation jobs" },
    { block: "saviynt_schema_role_job_resource", use: "Role schema reconciliation jobs" },
    { block: "saviynt_file_transfer_job_resource", use: "Secure file transfer and processing operations" },
    { block: "saviynt_ws_retry_job_resource", use: "Web service call retry handler" },
    { block: "saviynt_job_control_resource", use: "Global job scheduling and control configuration" }
  ];

  const selected = TF_RESOURCES.find(r => r.key === activeTfResource) || TF_RESOURCES[0];
  const categoryColors: Record<string,string> = {
    "Core Infrastructure": "#06b6d4",
    "Configuration": "#a78bfa",
    "Access Control": "#34d399",
    "Data Management": "#f59e0b",
    "Automation": "#f97316",
    "Deployment": "#ec4899"
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center px-4 md:px-6 py-12 relative overflow-hidden transition-all duration-300 ${
        viewMode === "mobile" ? "view-mode-mobile" : "view-mode-desktop"
      }`}
      style={{ background: "var(--bg-base)", color: "var(--text-primary)" }}
    >
      {/* Background Art Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ background: "var(--accent)" }}
        />
      </div>

      <div className="max-w-6xl w-full flex flex-col gap-8 relative z-10">
        
        {/* Back navigation header */}
        <div className="flex justify-between items-center">
          <Link
            href="/wizard/know-more"
            className="flex items-center gap-2 text-sm font-semibold transition hover:underline"
            style={{ color: "var(--accent)" }}
          >
            <span>←</span> Back to Know More Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Terraform Reference</span>
          </div>
        </div>

        {/* Hero title block */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-hover))",
              boxShadow: "0 4px 20px var(--accent-glow)"
            }}
          >
            <span className="text-2xl text-white">🔧</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Saviynt Terraform Reference
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            A complete browser for resources, attributes, jobs, and config blueprints supported by the Saviynt provider.
          </p>
        </div>

        {/* TAB 5: TERRAFORM PROVIDER REFERENCE */}
        <div className="space-y-8 animate-fadeIn">
          {/* Header banner */}
          <div className="rounded-2xl border p-6 text-center space-y-2" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.08))", borderColor: "rgba(124,58,237,0.3)" }}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">🔧</span>
              <h2 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>Saviynt Terraform Provider Reference</h2>
            </div>
            <p className="text-xs max-w-2xl mx-auto" style={{ color: "var(--text-secondary)" }}>
              The official <strong style={{color:"#a78bfa"}}>saviynt/saviynt</strong> Terraform provider manages <strong style={{color:"#34d399"}}>11 EIC resource types</strong> via declarative HCL blocks. Envizor autogenerates all these blocks from live tenant discovery.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {[
                { label: "Provider", val: "saviynt/saviynt" },
                { label: "Version", val: "≥ 0.3.4" },
                { label: "Terraform", val: "≥ 1.11" },
                { label: "Auth", val: "Ephemeral (5 min)" }
              ].map(b => (
                <div key={b.label} className="px-3 py-1.5 rounded-lg border text-[10px] font-mono" style={{ borderColor: "rgba(124,58,237,0.3)", background: "rgba(124,58,237,0.08)", color: "#a78bfa" }}>
                  <span className="text-slate-400">{b.label}: </span>{b.val}
                </div>
              ))}
            </div>
          </div>

          {/* Provider config block */}
          <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="text-base">⚙️</span>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#a78bfa" }}>Provider Configuration</h3>
            </div>
            <pre className="text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto" style={{ background: "#0f0f1a", color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", border: "1px solid rgba(124,58,237,0.2)" }}><code>{`terraform {
  required_providers {
    saviynt = {
      source  = "saviynt/saviynt"
      version = "~> 0.3"
    }
  }
}

provider "saviynt" {
  server_url = var.saviynt_url
  username   = var.saviynt_username  # Ephemeral — rotated every 5 min
  password   = var.saviynt_password  # Never hardcoded
}`}</code></pre>
            <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="text-sm">🔐</span>
              <p className="text-[11px]" style={{ color: "#fbbf24" }}><strong>Zero-Trust Ephemeral Auth:</strong> Envizor enforces a strict 5-minute session lifetime on all authentication tokens. Credentials are never hardcoded — they rotate automatically via environment variables or a secrets manager.</p>
            </div>
          </div>

          {/* Resource Browser */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.2)" }}>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>📚 Interactive Resource Browser — 11 Supported EIC Resources</h3>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>Click any resource to see its Terraform block, attributes, and API endpoint.</p>
            </div>
            <div className={`flex ${viewMode === "mobile" ? "flex-col" : ""}`}>
              {/* Sidebar resource list */}
              <div className={`flex ${viewMode === "mobile" ? "flex-row overflow-x-auto scrollbar-none gap-1 p-2" : "flex-col w-52 flex-shrink-0 border-r p-2 gap-1"}`} style={{ borderColor: "var(--border)" }}>
                {TF_RESOURCES.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setActiveTfResource(r.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-bold text-left transition-all duration-200 cursor-pointer ${viewMode === "mobile" ? "whitespace-nowrap flex-shrink-0" : "w-full"}`}
                    style={activeTfResource === r.key
                      ? { background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.35)" }
                      : { color: "var(--text-secondary)", border: "1px solid transparent" }
                    }
                  >
                    <span>{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>

              {/* Detail panel */}
              <div className="flex-1 p-5 space-y-4 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{selected.icon}</span>
                      <h4 className="text-base font-black" style={{ color: "var(--text-primary)" }}>{selected.label}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase" style={{ background: `${categoryColors[selected.category]}22`, color: categoryColors[selected.category], border: `1px solid ${categoryColors[selected.category]}44` }}>{selected.category}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{selected.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Terraform type:</span>
                  <code className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold" style={{ background: "rgba(124,58,237,0.12)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)" }}>{selected.tfType}</code>
                  <span className="text-[10px] font-bold uppercase text-slate-400">API:</span>
                  <code className="px-2.5 py-1 rounded-lg text-[11px] font-mono" style={{ background: "rgba(6,182,212,0.08)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}>{selected.apiEndpoint}</code>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selected.attrs.map(a => (
                    <span key={a} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: "rgba(52,211,153,0.08)", color: "#34d399", border: "1px solid rgba(52,211,153,0.2)" }}>{a}</span>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "var(--accent)" }}>Generated HCL Block</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: "rgba(52,211,153,0.1)", color: "#34d399" }}>✓ Production Ready</span>
                  </div>
                  <pre className="text-[11px] leading-relaxed rounded-xl p-4 overflow-x-auto" style={{ background: "#0a0a12", color: "#e2e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", border: "1px solid rgba(124,58,237,0.2)", maxHeight: "280px" }}>
                    <code>{selected.hcl}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Job Types Reference Table */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "#f97316" }}>Supported Job Resource Block Types</h3>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Jobs are created <strong style={{color:"var(--text-primary)"}}>per-application</strong>. The <code style={{color:"#a78bfa"}}>jobType</code> field resolves generically to the correct EIC block. Each application maps to one of the following Terraform resource types:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left p-2.5 font-black text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Terraform Block</th>
                    <th className="text-left p-2.5 font-black text-[10px] uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>Use Case</th>
                  </tr>
                </thead>
                <tbody>
                  {JOB_TYPES.map((j, i) => (
                    <tr key={j.block} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                      <td className="p-2.5">
                        <code className="text-[10px] font-mono" style={{ color: "#a78bfa" }}>{j.block}</code>
                      </td>
                      <td className="p-2.5" style={{ color: "var(--text-secondary)" }}>{j.use}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transport Package flow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(236,72,153,0.3)" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">📤</span>
                <h3 className="text-sm font-black" style={{ color: "#ec4899" }}>Export Transport Package</h3>
              </div>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Packages EIC configuration from a source environment (e.g. DEV) into a versioned <code>.zip</code> artifact.</p>
              <pre className="text-[11px] rounded-xl p-3 overflow-x-auto" style={{ background: "#0a0a12", color: "#e2e8f0", fontFamily: "monospace", border: "1px solid rgba(236,72,153,0.2)" }}><code>{`resource "saviynt_export_transport_package_resource" "billing_dev" {
  name        = "Billing_Module_DEV"
  version     = "1.0.0"
  description = "Export billing config from DEV"
}`}</code></pre>
            </div>
            <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: "var(--bg-surface)", borderColor: "rgba(34,211,153,0.3)" }}>
              <div className="flex items-center gap-2">
                <span className="text-lg">📥</span>
                <h3 className="text-sm font-black" style={{ color: "#34d399" }}>Import Transport Package</h3>
              </div>
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>Deploys a packaged artifact into a target environment (e.g. PRE or PROD). Uses <code>package_path</code> to locate the <code>.zip</code>.</p>
              <pre className="text-[11px] rounded-xl p-3 overflow-x-auto" style={{ background: "#0a0a12", color: "#e2e8f0", fontFamily: "monospace", border: "1px solid rgba(34,211,153,0.2)" }}><code>{`resource "saviynt_import_transport_package_resource" "billing_pre" {
  name         = "Billing_Module_PRE"
  package_path = "./packages/Billing_Module_DEV.zip"
  description  = "Deploy billing config to PRE"
}`}</code></pre>
            </div>
          </div>

          {/* How Terraform behaves with Saviynt */}
          <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>🧠 How Terraform Behaves with Saviynt EIC</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: "🔍", title: "Plan Phase", color: "#06b6d4", desc: "Terraform queries the live EIC tenant via REST APIs, compares state with your \`.tfstate\` file, and prints a dry-run diff of what will change — zero modifications made." },
                { icon: "✅", title: "Apply Phase", color: "#34d399", desc: "After plan approval, Terraform calls EIC write APIs to create, update, or delete resources. State is written back to \`.tfstate\` for future drift detection." },
                { icon: "🔄", title: "State Drift", color: "#f59e0b", desc: "If someone modifies EIC directly via portal, the next \`terraform plan\` shows the drift. Envizor catches this before Terraform even runs and flags it visually." }
              ].map(item => (
                <div key={item.title} className="p-4 rounded-xl border space-y-2" style={{ background: `${item.color}08`, borderColor: `${item.color}22` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-xs font-black" style={{ color: item.color }}>{item.title}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl border" style={{ background: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}>
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                <strong style={{color:"#a78bfa"}}>Lifecycle summary:</strong> <code style={{color:"#06b6d4"}}>terraform init</code> → downloads the saviynt provider plugin → <code style={{color:"#06b6d4"}}>terraform plan</code> → reads live EIC state and diffs against baseline → <code style={{color:"#34d399"}}>terraform apply</code> → writes approved changes to EIC → <code style={{color:"#f59e0b"}}>terraform destroy</code> → removes managed resources. Envizor automates the init→plan→apply loop inside its DevOps pipeline wizard.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
