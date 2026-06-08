// lib/envizor/wizardKnowledge.ts

export interface WizardStepInfo {
  name: string;
  purpose: string;
  assistantHelp: string[];
}

export const WizardKnowledge = {
  overview: `
The Envizor Platform comprises three core wizard flows designed to simplify and automate Saviynt IGA infrastructure deployment:

1. 🌟 **Day-0 Tenant Migration & Discovery Wizard**: Used to scan active environments, compare configuration drifts across DEV, PRE, and PROD, generate baseline modular Terraform workspaces, and perform environment alignments.
2. 🛠️ **Day-N Standard Configuration Wizard**: Used to configure, package, upload, and deploy fresh endpoints, connections, security systems, accounts, entitlements, groups, roles, and background jobs.
3. 🔌 **Disconnected Application Onboarding**: For applications that CANNOT be connected via live API to Saviynt. This module vaults credentials securely, runs an autonomous background agent (ScheduledAgentService.java) that periodically pulls data from the disconnected app on a per-application cron schedule, reconciles differences against Saviynt provisioning tasks, and uploads flat-file data to close the governance gap. Each application has its own schedule, and all runs are logged in a split audit log with separate tabs for "Scans & Uploads" and "Reconcile Operations".
  `,

  steps: {
    // ----------------------------------------------------
    // Day-0 Wizard Steps
    // ----------------------------------------------------
    environmentSelection: {
      name: "Environment Selection (Day-0)",
      purpose: `
The Target Environment Selection stage establishes the active boundary for all downstream discovery and automated workspace compilation. It defines the secure connection profile targeting your Saviynt development, staging, or production tenants. Once targeted, Envizor checks local configurations and live schemas, establishing a workspace structure tailored to your chosen environment.
      `,
      assistantHelp: [
        "🔍 How does Envizor detect my active Saviynt tenant?",
        "⚙️ What is the difference between target environments in IGA?",
        "📂 How do I map my local workspace directory safely?",
        "Predict next step"
      ]
    },

    tenantDiscovery: {
      name: "Tenant Discovery (Day-0)",
      purpose: `
Tenant Discovery performs a complete, deep inspect of your active Saviynt environment. It extracts active configuration metadata from the live environment including:
• **Roles**: Active identity roles and user assignments.
• **Entitlements**: Fine-grained privilege key-values.
• **Endpoints / Connections**: Connected target systems (AD, Epic, Salesforce, etc.).
• **Security Systems**: Security configurations.
• **Tasks / Rules**: Active background jobs and governance rule mappings.
This step is critical because it captures the live, non-code environment configurations so Envizor can safely convert them into clean, repeatable Terraform code.
      `,
      assistantHelp: [
        "🕵️ What live endpoints and metadata does discovery fetch?",
        "🔑 Why do I need to scan DEV roles and entitlements?",
        "🏗️ How does Envizor translate live objects to Terraform resource blocks?",
        "Show role lineage details"
      ]
    },

    environmentComparison: {
      name: "Compare Environments (Day-0)",
      purpose: `
Environment Comparison provides an intelligent, side-by-side visualization of drift between two tenants (e.g. comparing DEV and PRE staging). It scans metadata to separate changes into actionable categories:
• **Only in Left**: Configured in source but missing in target.
• **Only in Right**: Configured in target but missing in source.
• **Different**: Items with identical names but differing attribute values.
• **Same**: Perfectly aligned configurations.
This gives you complete visibility into unsynced changes before promoting any infrastructure modules.
      `,
      assistantHelp: [
        "⚡ How is configuration drift measured across tenants?",
        "🚨 What should I do if a role exists only in DEV?",
        "🔀 How do I resolve attribute-level configuration mismatches?",
        "🛡️ Is it safe to overwrite target configurations directly?"
      ]
    },

    terraformGeneration: {
      name: "Terraform Generation (Day-0)",
      purpose: `
Terraform Generation auto-compiles your live discovery configurations into pure, declarative HCL modules. The output is structured according to enterprise standards, dividing items into isolated modules and exposing environment bindings in root variables.
It structures files cleanly:
• Root configuration: \`main.tf\`, \`variables.tf\`, \`outputs.tf\`, and \`provider.tf\`.
• Sub-modules: /modules/saviynt_[object-type]/ containing specific resource definitions (e.g., \`[resource_name].tf\`) and variables.
This architecture isolates changes and prevents configuration sprawl.
      `,
      assistantHelp: [
        "📂 Explain the generated modular file layout",
        "🔒 How are sensitive credentials and variables handled?",
        "🛠️ How do I dry-run the generated main.tf?",
        "⚠️ Is this generated configuration safe to apply immediately?"
      ]
    },

    summary: {
      name: "Summary & Workspace Review (Day-0)",
      purpose: `
The Summary and Workspace Review stage is your deployment preparation check. It inspects all generated code syntax, verifies variable binds, and checks output logs. It acts as a safety gate, ensuring that the generated modules compile perfectly and are fully prepared to run safe \`terraform plan\` commands.
      `,
      assistantHelp: [
        "📊 Show me a summary of the compiled modules",
        "🤖 How do I dry-run a local terraform plan?",
        "🔧 How do I import pre-existing infrastructure into state?",
        "🏁 What are the final checklist items before deploy?"
      ]
    },

    // ----------------------------------------------------
    // Day-N Main Wizard Steps
    // ----------------------------------------------------
    welcome: {
      name: "Welcome Screen (Day-N)",
      purpose: `
Welcome to the Day-N Configuration Wizard! While Day-0 is designed to baseline and compare existing tenant states, the Day-N flow is your active creation utility. Use it to configure fresh, declarative connections, package applications for target deployments, upload flat files, or trigger live background synchronization jobs.
      `,
      assistantHelp: [
        "✨ What is the difference between Day-0 and Day-N wizard flows?",
        "📖 Explain standard creation vs package migration",
        "🛫 How do I begin configuring a new resource?"
      ]
    },

    operationSelection: {
      name: "Operation Selection (Day-N)",
      purpose: `
Operation Selection sets your execution pattern. Select the mode of operation to run. Supported actions include:
• **STANDARD**: Creating fresh IGA resources (endpoints, roles, accounts).
• **IMPORT**: Configuring import packages and source mapping files.
• **EXPORT**: Packaging configuration modules for backup or migration.
• **FILE UPLOAD**: Mass uploading raw flat files for bulk object imports.
• **RUN JOBS**: Scheduling and kicking off background data synchronization tasks.
      `,
      assistantHelp: [
        "💡 When should I choose STANDARD vs IMPORT/EXPORT?",
        "📁 How does the flat-file bulk upload mapping work?",
        "⏱️ What background synchronization jobs can I execute?",
        "🔄 Explain import configurations and source files"
      ]
    },

    objectTypeSelection: {
      name: "Object Type Selection (Day-N)",
      purpose: `
Object Type Selection defines the targets of your configuration. You can select single or multiple entities to configure in a single batch. Supported types include Endpoint, Connection, Security System, Account, Entitlement, Group, Role, and Application. Envizor will dynamically adjust your form steps depending on your selection (e.g. connections require hostname details, roles require risk/owner definitions).
      `,
      assistantHelp: [
        "🔌 Explain Endpoint vs Connection structures",
        "🔐 How are security systems and accounts linked?",
        "👥 What are fine-grained entitlements and groups?",
        "🎖️ Can I select and configure multiple resource types at once?"
      ]
    },

    dynamicFormInputs: {
      name: "Dynamic Input Forms (Day-N)",
      purpose: `
Dynamic Input Forms are responsive wizards customized for your exact selected resources. They guide you cleanly through naming and tagging (Metadata), specifying protocol details and ports (Attributes), defining mapping sources (Import Config), and declaring environment-specific settings (Custom Labels) in a clean, logical sequence.
      `,
      assistantHelp: [
        "📝 What is the difference between metadata and attributes?",
        "🎨 How do custom label properties work?",
        "🔗 How do I configure active import mappings?",
        "⏭️ How do I proceed to the next item in my batch?"
      ]
    },

    reviewAndDryRun: {
      name: "Review & Dry Run (Day-N)",
      purpose: `
The Review and Dry Run stage compiles all of your dynamic form inputs, verifies them against Saviynt-compatible schemas, and outputs clean Terraform files inside your workspace. This ensures your configurations compile successfully without needing a manual trial-and-error approach.
      `,
      assistantHelp: [
        "🛡️ How does Envizor validate form inputs before code generation?",
        "📝 How can I preview the raw HCL before saving?",
        "🚀 What is the final process to execute standard configs?"
      ]
    },

    // ----------------------------------------------------
    // Disconnected Application Onboarding Module
    // ----------------------------------------------------
    disconnectedOnboarding: {
      name: "Disconnected Application Onboarding",
      purpose: `
The Disconnected Application Onboarding module solves the enterprise challenge of applications that CANNOT be natively connected to Saviynt via a live API connector. Examples include legacy mainframe systems, on-premises HR systems behind firewalls, or COTS apps with read-only databases.

The module operates in three phases:

**Phase 1 — Target Application Profile**
Register the disconnected application with:
- Application name and description
- Connection type (REST / JDBC / SFTP / File-based)
- Secure vault credentials stored using AES-256 encryption (Strategy A — browser-side vault). No credentials are transmitted in plaintext. The vault key is derived from the user's session token.

**Phase 2 — Schedule & Synchronize**
Configure a per-application cron schedule (e.g. every 15 minutes, hourly, daily at 2am). The schedule is stored in the Next.js API at /api/wizard/disconnected/schedule.
- The Spring Boot service ScheduledAgentService.java polls this endpoint every 5 seconds via @Scheduled(fixedDelay=5000).
- When an app's scheduled window arrives, the agent triggers the sync flow: pulls data from the disconnected app, normalizes it to a Saviynt-compatible flat-file format, uploads it via the Saviynt File Upload API, and writes an audit record.
- Each application has its own independent schedule. Changing the schedule for App A does not affect App B.
- The UI shows the next scheduled run timestamp and the cron config rendered as human-readable English (e.g. "Every 30 minutes" instead of "*/30 * * * *").

**Phase 3 — Audit Log Review**
All agent executions are logged and split into two sub-tabs:
- **Scans & Uploads tab**: Flat-file upload operations — when data was pulled, normalized, and uploaded to Saviynt. Columns: Application, Target Connection, Status, Timestamp, Records Uploaded, Next Run, Cron Config (English).
- **Reconcile Operations tab**: Saviynt provisioning task reconciliation — when the agent compared the app's current identity data against provisioned state in Saviynt, identified discrepancies, and created/updated provisioning tasks. Columns: Application, Target Connection, Status, Timestamp, Tasks Created, Tasks Updated, Discrepancies Found, Next Run.

Both tabs support:
- **Free-text search** by target connection name
- **Column sorting** by clicking any column header (ascending/descending toggle)
      `,
      assistantHelp: [
        "🔌 What types of disconnected applications does Envizor support?",
        "🔒 How are credentials stored securely without a backend vault?",
        "⏰ How does the background agent scheduling work per application?",
        "📊 What is the difference between a Scan/Upload and a Reconcile operation?",
        "🤖 How does ScheduledAgentService.java trigger synchronization runs?",
        "📋 How do I search and sort the audit log entries?",
        "🔁 What happens if a synchronization fails mid-run?",
        "🗓️ How do I change the sync schedule for a specific application?"
      ]
    }
  } as Record<string, WizardStepInfo>,

  architecture: {
    disconnectedOnboarding: {
      description: "The Disconnected Application Onboarding module bridges the gap between applications that have no live Saviynt API connector and the Envizor IGA governance platform. It uses a combination of browser-side credential vaulting, a Spring Boot scheduled polling service, and a Next.js API layer to autonomously synchronize identity data.",
      javaServices: [
        {
          name: "ScheduledAgentService.java",
          path: "src/main/java/terraform/backend/services/ScheduledAgentService.java",
          description: "Spring @Service annotated with @Scheduled(fixedDelay=5000). Polls GET /api/wizard/disconnected/schedule every 5 seconds. For each registered application, checks if the current time has passed the 'nextRun' timestamp. If yes, triggers the synchronization flow: calls POST /api/wizard/disconnected/onboard to execute the data pull and upload, then POSTs an audit record to /api/wizard/disconnected/audit-logs and calculates the next scheduled run time based on the app's cron expression."
        }
      ],
      apiRoutes: [
        {
          path: "/api/wizard/disconnected/schedule",
          methods: ["GET", "POST"],
          description: "GET: Returns all registered application schedules as JSON array, each entry containing appId, appName, cronExpression, cronEnglish (human-readable), nextRun (ISO timestamp), and lastRun. POST: Updates the schedule for a specific application given appId and newCronExpression. Called by ScheduledAgentService.java every 5 seconds (GET) and by the UI when the user confirms a schedule change (POST)."
        },
        {
          path: "/api/wizard/disconnected/onboard",
          methods: ["POST"],
          description: "Registers a new disconnected application profile. Body: { appName, connectionType, targetUrl, vaultedCredentialRef, description }. Returns the generated appId and initial schedule config. Also invoked by ScheduledAgentService when triggering a sync run to execute the actual data pull-and-upload operation."
        },
        {
          path: "/api/wizard/disconnected/audit-logs",
          methods: ["GET", "POST"],
          description: "GET: Retrieves paginated audit log entries for all applications. Supports query params: type (scans|reconcile), appId, targetConnection, sortBy, sortDir. POST: Appends a new audit record when ScheduledAgentService completes a run. Body includes: appId, runType (scan|reconcile), status, recordsProcessed, tasksCreated, tasksUpdated, discrepanciesFound, durationMs."
        },
        {
          path: "/api/wizard/disconnected/tasks",
          methods: ["GET"],
          description: "Returns pending and completed Saviynt provisioning tasks generated by reconciliation engine runs. Used by the Reconcile Operations audit tab to show task-level detail. Supports filtering by appId and status (pending|completed|failed)."
        }
      ]
    }
  },

  navigation: {
    routes: {
      // Day-0 routes
      environmentSelection: "/wizard/day0/environment",
      tenantDiscovery: "/wizard/day0/discovery",
      environmentComparison: "/wizard/day0/diff",
      terraformGeneration: "/wizard/day0/generate",
      summary: "/wizard/day0/summary",
      
      // Day-N routes
      welcome: "/wizard/steps/welcome",
      operationSelection: "/wizard/steps/operation",
      objectTypeSelection: "/wizard/steps/object-type",
      dynamicFormInputs: "/wizard/steps/dynamic",
      reviewAndDryRun: "/wizard/steps/review",

      // Disconnected Onboarding routes
      disconnectedOnboarding: "/wizard/disconnected-onboarding",
      disconnectedScheduleApi: "/api/wizard/disconnected/schedule",
      disconnectedAuditLogsApi: "/api/wizard/disconnected/audit-logs",
      disconnectedOnboardApi: "/api/wizard/disconnected/onboard",
      disconnectedTasksApi: "/api/wizard/disconnected/tasks"
    } as Record<string, string>
  }
};
