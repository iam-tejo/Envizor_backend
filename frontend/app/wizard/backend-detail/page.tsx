"use client";

import { useState } from "react";
import Day0Shell from "../day0/Day0Shell";

type FileDetail = {
  name: string;
  path: string;
  layer: "java-backend" | "frontend-page" | "api-route" | "lib" | "store" | "component" | "config" | "root";
  role: string;
  keyFunctions: { name: string; desc: string }[];
  details: string;
};

const FILE_REGISTRY: FileDetail[] = [
  // ─── JAVA BACKEND ───────────────────────────────────────────────────────────
  {
    name: "BackEndApplication.java",
    path: "src/main/java/terraform/backend/BackEndApplication.java",
    layer: "java-backend",
    role: "Spring Boot entry point — bootstraps the entire embedded Tomcat server and triggers component scanning.",
    keyFunctions: [
      { name: "main(String[] args)", desc: "Calls SpringApplication.run(), starting the embedded Tomcat server on port 8080 and enabling auto-wiring of all @Service and @RestController beans." }
    ],
    details: "This is the root bootstrap class for the Java backend. The @SpringBootApplication annotation enables component scanning across all sub-packages (controller, services, models, state), auto-configures the Jackson JSON serializer, and initializes the Spring context with sensible defaults including embedded Tomcat, CORS, and validation support."
  },
  {
    name: "WizardController.java",
    path: "src/main/java/terraform/backend/controller/WizardController.java",
    layer: "java-backend",
    role: "Spring @RestController — maps all inbound HTTP REST requests from the Next.js frontend to the correct service layer methods.",
    keyFunctions: [
      { name: "POST /wizard/workspace", desc: "Receives the active workspace folder path string and persists it to both WizardStateManager and WizardService so that generated files know the file system target directory." },
      { name: "POST /wizard/environment", desc: "Receives the chosen environment name (e.g. 'dev', 'uat', 'prod') and stores it in the active WizardState session." },
      { name: "POST /wizard/object-types", desc: "Receives the list of selected resource types (e.g. 'entitlements', 'accounts') and registers them for subsequent template compilation steps." },
      { name: "POST /wizard/preview", desc: "Receives the full ObjectSelection[] payload, triggers WizardService.generate() in dry-run mode (no disk writes), and returns the in-memory generated file map as JSON for the live preview panel." },
      { name: "POST /wizard/generate", desc: "Same as preview but also calls WizardService.writeToWorkspace() to flush all generated .tf files to the configured workspace folder on disk." },
      { name: "POST /wizard/reset", desc: "Wipes the active WizardState via WizardStateManager.reset(), clearing all session variables and allowing a fresh start." }
    ],
    details: "Acts as the single gateway between the Next.js frontend and the Java service layer. All REST endpoint paths are prefixed with /wizard. The controller deserializes incoming JSON bodies using Jackson into ObjectSelection POJO arrays, delegates business logic to WizardService, and serializes WizardState objects back as JSON responses. Cross-Origin Resource Sharing (CORS) is configured here to allow requests from the Next.js dev server on port 3000."
  },
  {
    name: "WizardService.java",
    path: "src/main/java/terraform/backend/services/WizardService.java",
    layer: "java-backend",
    role: "Core HCL generation engine — contains all Terraform template strings and the full resource compilation logic.",
    keyFunctions: [
      { name: "generate(List<ObjectSelection>)", desc: "Main orchestration entry point. Loops over selections, identifies their operation mode (STANDARD / IMPORT / EXPORT / TRANSPORT), and routes them to the appropriate template builder method." },
      { name: "generateStandardResource(type, name, attrs)", desc: "Builds a full Terraform resource block string for standard object types (entitlements, accounts, roles, endpoints, user_groups, applications, security_systems, schedule_jobs) using a static inline HCL template." },
      { name: "generateImportResource(type, name, zipFile)", desc: "Builds a Terraform module block that references a local ZIP file for bulk importing objects into a Saviynt tenant." },
      { name: "generateExportResource(type, name, zipFile)", desc: "Builds a Terraform data source block and local_file resource that packages extracted configuration data into ZIP archives for export." },
      { name: "generateTransportArtefacts(artefacts[])", desc: "Iterates over TransportArtefact objects and generates nested module blocks for transporting configuration artefacts between Saviynt tenants." },
      { name: "writeToWorkspace()", desc: "Iterates the in-memory generatedFiles map (filename → HCL string) and writes each entry to the file system under the configured workspace directory path." },
      { name: "normalizeType(rawType)", desc: "Converts user-facing type labels (e.g. 'usergroup', 'schedulejob') to canonical Terraform resource type names (e.g. 'user_groups', 'schedule_jobs') via the static TYPE_MAP." }
    ],
    details: "This is the largest and most critical Java class. It maintains an in-memory Map<String,String> of generated file name to HCL content, builds providers.tf, variables.tf, outputs.tf, and main.tf headers, then appends resource blocks. The TYPE_MAP constant normalizes singular/plural, snake_case/camelCase input variations from the UI. All Terraform template strings are defined as Java text blocks, making them easy to review and extend. The class is annotated @Service and auto-wired into WizardController."
  },
  {
    name: "WizardState.java",
    path: "src/main/java/terraform/backend/models/WizardState.java",
    layer: "java-backend",
    role: "Java DTO (Data Transfer Object) — serializable session model holding the wizard's current runtime configuration.",
    keyFunctions: [
      { name: "getWorkspace() / setWorkspace(String)", desc: "Accesses the file system path of the active Terraform workspace directory." },
      { name: "getEnvironment() / setEnvironment(String)", desc: "Accesses the deployment environment label (dev / uat / prod)." },
      { name: "getObjectTypes() / setObjectTypes(List<String>)", desc: "Accesses the list of selected Saviynt object types for this generation session." },
      { name: "getLogs() / addLog(String)", desc: "Maintains an append-only list of generation step log messages returned in the API response for display in the UI." },
      { name: "getGeneratedFiles()", desc: "Returns the map of filename to HCL content for the preview panel rendering." }
    ],
    details: "Automatically serialized and deserialized by Jackson to/from JSON. All REST endpoints that return state information use this object as their response body. Kept deliberately flat and simple to ensure clean JSON serialization with no circular references."
  },
  {
    name: "WizardStateManager.java",
    path: "src/main/java/terraform/backend/state/WizardStateManager.java",
    layer: "java-backend",
    role: "Singleton state holder — provides a shared, application-scoped WizardState instance across the Spring context.",
    keyFunctions: [
      { name: "get()", desc: "Returns the current singleton WizardState instance. Initializes a new one lazily if none exists." },
      { name: "reset()", desc: "Nullifies the current WizardState, effectively clearing all session variables when the user restarts the wizard." }
    ],
    details: "Implements a simple static field pattern to persist a WizardState across multiple HTTP requests within the same JVM session. Annotated @Component so Spring manages its lifecycle. In a multi-user production environment, this should be replaced with Spring's @SessionScope to isolate state per browser session."
  },
  {
    name: "ObjectSelection.java",
    path: "src/main/java/terraform/backend/models/ObjectSelection.java",
    layer: "java-backend",
    role: "JSON binding model — represents a single user-configured resource object from the wizard review screen.",
    keyFunctions: [
      { name: "getType()", desc: "Returns the canonical Saviynt resource type (e.g. 'entitlements', 'accounts', 'roles')." },
      { name: "getName()", desc: "Returns the user-defined resource name used as the Terraform resource block identifier." },
      { name: "getOperation()", desc: "Returns the operation mode string: STANDARD, IMPORT, EXPORT, or TRANSPORT, which routes to different template generators in WizardService." },
      { name: "getAttributes()", desc: "Returns a Map<String,String> of dynamic attributes (e.g. host, port, protocol, securitySystemName) injected into the HCL template strings." },
      { name: "getArtefacts()", desc: "Returns a List<TransportArtefact> used exclusively when operation mode is TRANSPORT." }
    ],
    details: "Deserialized automatically by Jackson from the JSON request body sent by the Next.js frontend to /wizard/preview and /wizard/generate endpoints. The attributes map drives dynamic HCL template interpolation — all user-entered form values pass through this object."
  },
  {
    name: "TransportArtefact.java",
    path: "src/main/java/terraform/backend/models/TransportArtefact.java",
    layer: "java-backend",
    role: "Nested model for transport operation mode — represents a single configuration artefact to be transported between Saviynt tenants.",
    keyFunctions: [
      { name: "getType()", desc: "Saviynt configuration type for the transport item (e.g. AnalyticsConfig, AccessProfileConfig)." },
      { name: "getName()", desc: "Human-readable label for the transport artefact resource block in Terraform." },
      { name: "getZipFileName()", desc: "Filename of the ZIP package containing the exported configuration data (e.g. AnalyticsConfig.zip)." }
    ],
    details: "Only populated and used when an ObjectSelection's operation field is set to 'TRANSPORT'. The parent ObjectSelection.getArtefacts() returns a list of these objects, each generating an individual Terraform module block via WizardService.generateTransportArtefacts()."
  },
  {
    name: "ScheduledAgentService.java",
    path: "src/main/java/terraform/backend/services/ScheduledAgentService.java",
    layer: "java-backend",
    role: "Autonomous background polling service — drives the disconnected application onboarding synchronization scheduler.",
    keyFunctions: [
      { name: "@Scheduled(fixedDelay=5000) pollSchedules()", desc: "Runs every 5 seconds. Calls GET /api/wizard/disconnected/schedule on the Next.js server to fetch all registered application schedules. For each app whose nextRun timestamp has passed, triggers the synchronization flow." },
      { name: "triggerSync(appId, appName, connectionType)", desc: "Executes the sync for a specific disconnected application: calls POST /api/wizard/disconnected/onboard to pull data, then calls POST /api/wizard/disconnected/audit-logs to record the audit entry with outcome (status, recordsProcessed, durationMs)." },
      { name: "calculateNextRun(cronExpression)", desc: "Parses the application's cron expression and computes the next scheduled execution timestamp using a lightweight cron evaluator." }
    ],
    details: "This service is the heart of the autonomous disconnected onboarding flow. By polling the schedule API every 5 seconds rather than relying on an internal @Scheduled cron, it remains in sync with schedule changes made in the UI without requiring a service restart. Thread-safe because each application's sync is checked sequentially in the poll loop. In a production multi-node deployment, a distributed lock (Redis or DB-based) should guard against duplicate runs across replicas."
  },
  // ─── FRONTEND PAGES ─────────────────────────────────────────────────────────
  {
    name: "app/page.tsx",
    path: "frontend/app/page.tsx",
    layer: "frontend-page",
    role: "Root landing page — renders the Envizor product homepage with hero sections, feature cards, and navigation to the wizard.",
    keyFunctions: [
      { name: "Default export component", desc: "Renders the full marketing homepage including hero banner, feature highlights, and CTA buttons linking to /wizard/home." }
    ],
    details: "The primary landing page served at the root URL (/). Contains static marketing content, product feature sections, and a prominent call-to-action directing users into the wizard flow at /wizard/home. Styled with Tailwind CSS utility classes."
  },
  {
    name: "app/layout.tsx",
    path: "frontend/app/layout.tsx",
    layer: "frontend-page",
    role: "Root Next.js layout — defines the HTML document shell, font imports, and global metadata for all pages.",
    keyFunctions: [
      { name: "RootLayout({ children })", desc: "Wraps all pages in the HTML/body element, applies global CSS, loads Google Fonts, and sets the default metadata title and description." }
    ],
    details: "Applied to every page automatically by Next.js App Router. Contains the <html lang> attribute, viewport meta, and the global CSS import. Does not render any navigation chrome — that is handled by the wizard layout."
  },
  {
    name: "wizard/layout.tsx",
    path: "frontend/app/wizard/layout.tsx",
    layer: "frontend-page",
    role: "Wizard shell layout — renders the persistent top navigation header, sidebar, and page chrome for all wizard sub-pages.",
    keyFunctions: [
      { name: "WizardLayout({ children })", desc: "Renders the shared top navigation bar with product logo, primary nav links (Home, Explorer, Analytics, Agent Console, Backend Code Detail), and wraps all child wizard pages in the layout shell." }
    ],
    details: "The largest layout file in the frontend. Every page inside /wizard/* inherits this layout. It contains all the primary navigation tab definitions and controls which sub-route is currently active using Next.js usePathname(). Adding new top-level navigation tabs requires modifying this file."
  },
  {
    name: "wizard/home/page.tsx",
    path: "frontend/app/wizard/home/page.tsx",
    layer: "frontend-page",
    role: "Wizard home dashboard — the first screen users see inside the wizard, providing entry points to all wizard flows.",
    keyFunctions: [
      { name: "Default page component", desc: "Renders feature cards, quick-start action buttons, and links to the wizard step flow, pull, push, and explorer sections." }
    ],
    details: "Acts as the hub of the wizard product. Users are directed here after signing in. Shows status of active workspaces, available actions, and key navigation shortcuts."
  },
  {
    name: "wizard/steps/page.tsx",
    path: "frontend/app/wizard/steps/page.tsx",
    layer: "frontend-page",
    role: "Wizard step flow container — hosts the multi-step configuration wizard with environment, object-type, attributes, and review steps.",
    keyFunctions: [
      { name: "StepsPage component", desc: "Renders the wizard stepper UI, manages step navigation (next/back), and coordinates form submissions at the final review step to /wizard/generate." }
    ],
    details: "This is the core wizard interaction page. Uses the useWizardStore Zustand store to buffer form inputs across steps. On the final step, assembles the full ObjectSelection[] payload and dispatches it to the Spring Boot backend API."
  },
  {
    name: "wizard/agent/page.tsx",
    path: "frontend/app/wizard/agent/page.tsx",
    layer: "frontend-page",
    role: "AI Agent Console — interactive chat interface for the Envizor intelligent agent with automated build validation.",
    keyFunctions: [
      { name: "AgentConsolePage component", desc: "Renders the chat UI, dispatches messages to the /api/agent route, renders streaming responses, and shows the Staged Diff tab with automated build validation results." },
      { name: "buildValidationStatus state", desc: "Tracks the current state of the automated compile check (idle / validating / success / error) triggered after staging changes." }
    ],
    details: "The agent console uses Server-Sent Events (SSE) streaming via the /api/agent route for real-time responses. The Staged Diff tab automatically triggers a background npm run build to validate that any code changes staged by the agent compile cleanly. Shows a live validation badge with error details if compilation fails."
  },
  {
    name: "wizard/backend-detail/page.tsx",
    path: "frontend/app/wizard/backend-detail/page.tsx",
    layer: "frontend-page",
    role: "Backend Code Detail dashboard — this very page. Provides a comprehensive multi-tab reference of every file in the workspace.",
    keyFunctions: [
      { name: "BackendDetailDashboard component", desc: "Renders three tabs: System Flow Architecture, Full File Registry, and Step-to-Controller Mapping. Allows browsing every layer of the codebase with detailed descriptions." }
    ],
    details: "Designed for developer onboarding and architectural review. The File Registry tab lists every file across Java backend, frontend pages, API routes, lib utilities, Zustand store, components, and config files with their purpose, key functions, and implementation details."
  },
  {
    name: "wizard/explorer/page.tsx",
    path: "frontend/app/wizard/explorer/page.tsx",
    layer: "frontend-page",
    role: "Workspace Explorer — allows browsing the contents of the active Terraform workspace directory, viewing generated .tf files.",
    keyFunctions: [
      { name: "ExplorerPage component", desc: "Calls /api/explorer to list workspace files and renders a file tree with syntax-highlighted .tf content previews." }
    ],
    details: "Provides a read-only file browser for the generated Terraform workspace. Users can inspect the exact HCL output that WizardService generated before running terraform apply."
  },
  {
    name: "wizard/pull/page.tsx",
    path: "frontend/app/wizard/pull/page.tsx",
    layer: "frontend-page",
    role: "Pull configuration page — pulls existing Saviynt tenant configurations down into local Terraform HCL files.",
    keyFunctions: [
      { name: "PullPage component", desc: "Connects to the Saviynt tenant API via /api/wizard/pull, downloads existing security configurations, and generates corresponding Terraform resource blocks." }
    ],
    details: "Enables reverse-engineering of existing Saviynt environments into IaC. Users specify the tenant credentials and select which resource types to pull — the system generates matching .tf files representing the live state."
  },
  {
    name: "wizard/push/page.tsx",
    path: "frontend/app/wizard/push/page.tsx",
    layer: "frontend-page",
    role: "Push / publish page — commits generated Terraform files to the configured Git repository branch.",
    keyFunctions: [
      { name: "PushPage component", desc: "Triggers the /api/wizard/push endpoint to commit and push staged .tf files to the configured Azure DevOps or GitHub remote repository branch." }
    ],
    details: "Provides the Git publishing step of the workflow. After generation, users can stage changes and push them directly to a remote branch. Requires the GITHUB_TOKEN or ADO_TOKEN environment variable to be configured."
  },
  {
    name: "wizard/analytics/page.tsx",
    path: "frontend/app/wizard/analytics/page.tsx",
    layer: "frontend-page",
    role: "Analytics dashboard — visualizes usage metrics, generation history, and workspace statistics.",
    keyFunctions: [
      { name: "AnalyticsPage component", desc: "Renders charts and summary cards showing generation counts, object type distributions, and operation mode breakdowns." }
    ],
    details: "Provides observability into how the wizard is being used. Displays historical generation activity, most commonly used object types, and workspace utilization statistics."
  },
  {
    name: "wizard/day0/page.tsx",
    path: "frontend/app/wizard/day0/page.tsx",
    layer: "frontend-page",
    role: "Day-0 Setup page — guides users through initial environment setup including workspace configuration and credential entry.",
    keyFunctions: [
      { name: "Day0Page component", desc: "Renders the initial onboarding checklist for setting up a new Saviynt Terraform workspace environment." }
    ],
    details: "Displayed to first-time users or when no workspace is configured. Walks through workspace path setup, Saviynt tenant URL entry, and connection testing before entering the main wizard flow."
  },
  {
    name: "wizard/connected-app/page.tsx",
    path: "frontend/app/wizard/connected-app/page.tsx",
    layer: "frontend-page",
    role: "Connected Application configuration page — manages Saviynt connected application onboarding details.",
    keyFunctions: [
      { name: "ConnectedAppPage component", desc: "Renders forms for configuring Saviynt connected application attributes and maps them to Terraform resource blocks." }
    ],
    details: "Specialized wizard page for configuring connected application security systems in Saviynt. Allows entry of application-specific attributes that flow into the HCL template generation."
  },
  {
    name: "wizard/disconnected-onboarding/page.tsx",
    path: "frontend/app/wizard/disconnected-onboarding/page.tsx",
    layer: "frontend-page",
    role: "Disconnected Application Onboarding console — manages registration, scheduling, and audit log review for applications without a live Saviynt API connector.",
    keyFunctions: [
      { name: "DisconnectedOnboardingPage component", desc: "Top-level page with three sections: (1) Target Application Profile form to register a new disconnected app with credential vaulting, (2) Agent Schedule panel showing per-app cron config with human-readable English labels and a Confirm Schedule button, (3) Agent Background Execution Runs Log with two sub-tabs." },
      { name: "Scans & Uploads tab", desc: "Displays flat-file upload audit records with columns: Application, Target Connection, Status, Timestamp, Records Uploaded, Next Run, Cron Config. Supports free-text search by target connection and ascending/descending sort by clicking column headers." },
      { name: "Reconcile Operations tab", desc: "Displays Saviynt provisioning task reconciliation records with columns: Application, Target Connection, Status, Timestamp, Tasks Created, Tasks Updated, Discrepancies Found, Next Run. Same search and sort capabilities." },
      { name: "vaultCredentials(appProfile)", desc: "Encrypts the entered credentials using AES-256 and stores the ciphertext in localStorage under a session-derived key. The plaintext never leaves the browser." },
      { name: "handleConfirmSchedule(appId)", desc: "POSTs the selected cron expression to /api/wizard/disconnected/schedule and triggers a UI refresh of the audit log next-run column." }
    ],
    details: "The most feature-rich page in the disconnected onboarding module. The credential vaulting uses Strategy A (browser-side AES-256) — no credentials are sent to any backend server. The schedule panel shows each registered application as its own row with an independent dropdown to pick frequency and a Confirm Schedule button. The audit log panels use local state sorting and filtering without server-side pagination, making them instant to interact with."
  },
  {
    name: "wizard/profile/page.tsx",
    path: "frontend/app/wizard/profile/page.tsx",
    layer: "frontend-page",
    role: "User profile page — displays current user session details and workspace preferences.",
    keyFunctions: [
      { name: "ProfilePage component", desc: "Renders current user information and allows updating workspace path and environment preferences." }
    ],
    details: "Provides account-level settings management. Changes made here persist to the Zustand store and are submitted to the backend session via the /wizard/workspace and /wizard/environment endpoints."
  },
  // ─── API ROUTES ─────────────────────────────────────────────────────────────
  {
    name: "api/agent/route.ts",
    path: "frontend/app/api/agent/route.ts",
    layer: "api-route",
    role: "Next.js API Route — the server-side handler for the Envizor AI agent chat, streaming responses via Server-Sent Events.",
    keyFunctions: [
      { name: "POST handler", desc: "Receives chat message history, loads system prompt context (including full workspace architecture knowledge), and streams the AI response back to the client." },
      { name: "System prompt context loader", desc: "Embeds the full Step-to-Controller mapping, Java class architecture descriptions, and wizard knowledge into the AI system prompt so the agent can answer codebase-specific questions accurately." },
      { name: "Local rule fallback engine", desc: "Checks incoming messages against known keyword patterns (e.g. 'explain how code works', 'show class triggers') and returns pre-baked architectural blueprint answers without an AI call." }
    ],
    details: "The core of the intelligent agent feature. Uses streaming to progressively render the agent's response in the chat UI. The system prompt contains a comprehensive description of the entire wizard codebase architecture, making the agent aware of all Java classes, REST endpoints, and frontend flows. The local fallback engine ensures key architecture questions are answered instantly even offline."
  },
  {
    name: "api/wizard/pull/route.ts",
    path: "frontend/app/api/wizard/pull/route.ts",
    layer: "api-route",
    role: "Pull API Route — calls the Spring Boot backend /wizard/generate endpoint to pull Saviynt tenant configurations into local HCL.",
    keyFunctions: [
      { name: "POST handler", desc: "Proxies the pull request from the frontend to the Java backend, passing tenant URL, credentials, and selected resource types." }
    ],
    details: "Acts as a Next.js BFF (Backend for Frontend) proxy to the Java service. Keeps Saviynt API credentials server-side and forwards structured pull requests to the Spring Boot generation engine."
  },
  {
    name: "api/wizard/push/route.ts",
    path: "frontend/app/api/wizard/push/route.ts",
    layer: "api-route",
    role: "Push API Route — commits generated .tf files to the configured Git repository via the GitHub or Azure DevOps API.",
    keyFunctions: [
      { name: "POST handler", desc: "Reads generated files from the workspace path, uses the ADO_TOKEN or GITHUB_TOKEN environment variable to authenticate, and pushes changes to the configured remote repository branch." }
    ],
    details: "Handles the Git commit and push step server-side using environment variable credentials, avoiding exposure of PATs to the browser. Supports both GitHub and Azure DevOps remote URLs."
  },
  {
    name: "api/workspaces/route.ts",
    path: "frontend/app/api/workspaces/route.ts",
    layer: "api-route",
    role: "Workspaces list API — returns the list of available Terraform workspace directories for the Explorer page.",
    keyFunctions: [
      { name: "GET handler", desc: "Reads the WORKSPACE_PATH environment variable, lists subdirectories, and returns them as JSON for the workspace selector dropdown." }
    ],
    details: "Used by the Workspace Explorer and wizard home page to populate the workspace selection dropdown. Scans the file system path configured via the WORKSPACE_PATH environment variable."
  },
  {
    name: "api/env/route.ts",
    path: "frontend/app/api/env/route.ts",
    layer: "api-route",
    role: "Environment variables API — safely exposes non-secret environment configuration values to the frontend.",
    keyFunctions: [
      { name: "GET handler", desc: "Returns safe, non-sensitive environment configuration values (e.g. backend URL, workspace path) to the client." }
    ],
    details: "Acts as a controlled bridge for client-accessible environment values. Never exposes secret tokens — only non-sensitive configuration like the Java backend base URL and workspace root path."
  },
  {
    name: "api/wizard/disconnected/schedule/route.ts",
    path: "frontend/app/api/wizard/disconnected/schedule/route.ts",
    layer: "api-route",
    role: "Disconnected App Schedule API — manages per-application sync schedules. Polled every 5 seconds by the Spring Boot ScheduledAgentService.",
    keyFunctions: [
      { name: "GET handler", desc: "Returns all registered application schedules as a JSON array. Each entry contains appId, appName, cronExpression, cronEnglish (human-readable English), nextRun (ISO timestamp), lastRun, and connectionType. Called by ScheduledAgentService.java every 5 seconds." },
      { name: "POST handler", desc: "Updates the cron schedule for a specific application (by appId). Recalculates and persists the new nextRun timestamp. Also supports POST from ScheduledAgentService to update the lastRun and nextRun after a completed sync." }
    ],
    details: "The schedule state is persisted in a JSON file on the Next.js server filesystem (/tmp/disconnected-schedules.json in development). This allows the Java polling service to always read the latest schedule even after UI changes without requiring a service restart. In production, this should be replaced with a database-backed store."
  },
  {
    name: "api/wizard/disconnected/onboard/route.ts",
    path: "frontend/app/api/wizard/disconnected/onboard/route.ts",
    layer: "api-route",
    role: "Disconnected App Registration & Sync Trigger API — registers new applications and triggers data synchronization runs.",
    keyFunctions: [
      { name: "POST handler (registration)", desc: "Registers a new disconnected application profile: appName, connectionType, targetUrl, vaultedCredentialRef, description. Generates a UUID appId, initializes a default 15-minute schedule, and persists the profile to the schedule store." },
      { name: "POST handler (sync trigger)", desc: "When called by ScheduledAgentService with an existing appId, executes the actual synchronization: fetches data from the disconnected app's endpoint using the vaulted credentials, normalizes the identity data to Saviynt flat-file CSV format, and uploads it via the Saviynt File Upload API." }
    ],
    details: "Dual-purpose route. The registration flow (from the UI form) creates a new app profile and returns the appId. The sync trigger flow (from ScheduledAgentService) uses the stored connectionType and credential reference to perform the actual data extraction and upload. Distinguishes between these two use cases by checking whether the request body contains an existing appId."
  },
  {
    name: "api/wizard/disconnected/audit-logs/route.ts",
    path: "frontend/app/api/wizard/disconnected/audit-logs/route.ts",
    layer: "api-route",
    role: "Disconnected App Audit Log API — manages agent execution logs persisted to disk.",
    keyFunctions: [
      { name: "GET handler", desc: "Reads and returns audit log entries from the local JSON file database manager. Supports search filtering and column sorting." },
      { name: "POST handler", desc: "Appends a new agent background or API-triggered run log entry to the active audit log file, automatically checking rotation limits." }
    ],
    details: "Reads and writes execution log records securely on-disk via db.ts. Rotated older entries are automatically archived to timestamped files to prevent disk bloating."
  },
  {
    name: "api/wizard/disconnected/tasks/route.ts",
    path: "frontend/app/api/wizard/disconnected/tasks/route.ts",
    layer: "api-route",
    role: "Saviynt Provisioning Tasks API — manages pending and completed tickets inside the push-model queue.",
    keyFunctions: [
      { name: "GET handler", desc: "Returns provisioning tasks filtered by status, or queries a single task by taskId query parameter." },
      { name: "POST handler", desc: "Handles action: 'create' to register a new ticket in the queue, and action: 'execute' to invoke target app write operations via emulator scraping." }
    ],
    details: "Implements the core ticketing endpoint. Tasks are registered in PENDING status, executed by the emulator client, and updated to COMPLETED with stdout execution logs."
  },
  {
    name: "api/wizard/disconnected/import/route.ts",
    path: "frontend/app/api/wizard/disconnected/import/route.ts",
    layer: "api-route",
    role: "On-demand Import Trigger API — executes legacy data scrapes and triggers EIC import jobs on-demand.",
    keyFunctions: [
      { name: "POST handler", desc: "Receives connectionName, invokes the browser emulator to scrape target data, normalizes it to CSV, and uploads it to Saviynt, writing execution history to audit logs." }
    ],
    details: "Exposes the new HTTP REST trigger endpoint for Saviynt or other external clients. Triggers asynchronous browser scraping, pushes live changes immediately back to the tenant, and handles full logging via db.ts."
  },
  // ─── LIB UTILITIES ──────────────────────────────────────────────────────────
  {
    name: "lib/wizard/useWizardStore.ts",
    path: "frontend/lib/wizard/useWizardStore.ts",
    layer: "lib",
    role: "Zustand custom hook — provides typed access to the wizard's Zustand state store with selector optimizations.",
    keyFunctions: [
      { name: "useWizardStore(selector)", desc: "Returns a reactive slice of wizard store state. Components re-render only when their selected slice changes, avoiding unnecessary re-renders." }
    ],
    details: "The primary way wizard UI components read and write shared state. All multi-step form data (environment, object types, attributes, workspace path) is stored here and survives page navigations within the wizard flow."
  },
  {
    name: "lib/wizard/wizardSchema.ts",
    path: "frontend/lib/wizard/wizardSchema.ts",
    layer: "lib",
    role: "Zod validation schema definitions — defines the type-safe validation schemas for all wizard form inputs.",
    keyFunctions: [
      { name: "wizardSchema", desc: "Root Zod schema covering all wizard step fields including workspace, environment, objectTypes, and attribute key-value maps." },
      { name: "objectSelectionSchema", desc: "Zod schema for a single ObjectSelection object (type, name, operation, attributes)." }
    ],
    details: "Ensures all user inputs are validated client-side before submission to the backend. Provides type inference so TypeScript components get full auto-complete and compile-time safety on wizard form values."
  },
  {
    name: "lib/wizard/wizardSteps.ts",
    path: "frontend/lib/wizard/wizardSteps.ts",
    layer: "lib",
    role: "Step definitions — declares the ordered list of wizard steps with their labels, icons, and route paths.",
    keyFunctions: [
      { name: "WIZARD_STEPS array", desc: "Static array of step definition objects (id, label, icon, path) that drives the stepper UI component and breadcrumb navigation." }
    ],
    details: "Single source of truth for the wizard's step sequence. Adding, removing, or reordering wizard steps requires updating this file. The stepper UI component reads this array to render step indicators and navigation buttons."
  },
  {
    name: "lib/wizard/useWizardSteps.ts",
    path: "frontend/lib/wizard/useWizardSteps.ts",
    layer: "lib",
    role: "Step navigation hook — manages the current active step index and provides next/back navigation logic.",
    keyFunctions: [
      { name: "useWizardSteps()", desc: "Returns currentStep, totalSteps, goNext(), goBack(), and canProceed() based on Zustand store validation state." }
    ],
    details: "Encapsulates all step navigation logic in a single hook, keeping step-aware components clean. Validates whether the user can advance based on required field completion before enabling the Next button."
  },
  {
    name: "lib/wizard/attributeKeys.ts",
    path: "frontend/lib/wizard/attributeKeys.ts",
    layer: "lib",
    role: "Attribute key definitions — maps each Saviynt object type to its required and optional HCL attribute keys.",
    keyFunctions: [
      { name: "ATTRIBUTE_KEYS map", desc: "Returns the list of attribute field names (e.g. 'host', 'port', 'securitySystemName') for a given object type, driving dynamic form field generation." }
    ],
    details: "This file is what makes the attribute forms dynamic. When a user selects 'endpoints' as an object type, this map determines which form inputs are shown. Adding a new attribute for a type only requires editing this file."
  },
  {
    name: "lib/wizard/terraformBuilder.ts",
    path: "frontend/lib/wizard/terraformBuilder.ts",
    layer: "lib",
    role: "Client-side Terraform HCL builder — generates lightweight HCL preview strings in the browser for instant feedback.",
    keyFunctions: [
      { name: "buildPreview(selections)", desc: "Converts the in-memory ObjectSelection array into HCL preview strings for display in the live preview panel without making a backend call." }
    ],
    details: "Provides a client-side equivalent of part of WizardService's generation logic for instant UI previews. Does not write to the file system — that is exclusively the Java backend's responsibility."
  },
  {
    name: "lib/wizard/validation.ts",
    path: "frontend/lib/wizard/validation.ts",
    layer: "lib",
    role: "Custom validation utility functions — provides reusable field-level validation helpers used across wizard forms.",
    keyFunctions: [
      { name: "isValidWorkspacePath(path)", desc: "Validates that the entered workspace path is a non-empty absolute path string." },
      { name: "isValidResourceName(name)", desc: "Validates resource names conform to Terraform identifier rules (alphanumeric, hyphens, underscores only)." }
    ],
    details: "Supplements the Zod schema validation with imperative validation functions for cases requiring custom logic (e.g. path format checking, reserved keyword detection)."
  },
  {
    name: "lib/wizard/header.tsx",
    path: "frontend/lib/wizard/header.tsx",
    layer: "lib",
    role: "Reusable wizard section header component — renders a consistent title, subtitle, and icon header for wizard step pages.",
    keyFunctions: [
      { name: "WizardHeader({ title, subtitle, icon })", desc: "Renders a styled header block used at the top of each wizard step page." }
    ],
    details: "Keeps the visual language consistent across all wizard steps. Any step page that needs a title/subtitle header imports this component instead of duplicating the header HTML."
  },
  {
    name: "lib/saviynt/client.ts",
    path: "frontend/lib/saviynt/client.ts",
    layer: "lib",
    role: "Saviynt API client — provides typed fetch wrapper functions for all calls to the Saviynt tenant REST APIs.",
    keyFunctions: [
      { name: "fetchSaviyntResource(url, type, token)", desc: "Makes an authenticated GET request to the Saviynt tenant API for a given resource type, returning typed JSON response data." },
      { name: "testSaviyntConnection(url, token)", desc: "Performs a lightweight ping to the Saviynt tenant to validate that the URL and token are correct before beginning a pull operation." }
    ],
    details: "Centralizes all Saviynt API communication. All authentication headers (Basic Auth or Bearer token) are assembled here. The base URL and credentials are passed in from the wizard store so this client is stateless."
  },
  {
    name: "lib/saviynt/db.ts",
    path: "frontend/app/lib/saviynt/db.ts",
    layer: "lib",
    role: "Local JSON file database manager — provides persistence, reading, writing, and automatic rotation/archiving for tasks and audit logs.",
    keyFunctions: [
      { name: "readTasks() / writeTasks(tasks)", desc: "Reads and writes tasks list from/to the local disk file disconnected_tasks.json." },
      { name: "readAuditLogs() / writeAuditLogs(logs)", desc: "Reads and writes execution audit log records from/to disconnected_audit_logs.json." },
      { name: "addTask(task)", desc: "Appends a new task to the queue and runs the auto-archiving checklist." },
      { name: "addAuditLog(log)", desc: "Appends a new execution log entry and checks for auto-archiving thresholds." },
      { name: "archiveTasks() / archiveAuditLogs()", desc: "Enforces rotation thresholds. Rotates completed tasks (&gt;100) and audit logs (&gt;50 runs) to timestamped files under the archive/ directory." }
    ],
    details: "Serves as the database controller for disconnected onboarding operations, replacing module-level state variables with file-based persistence. Guarantees safe reads, writes, and caps active collection sizes for compliance."
  },
  {
    name: "lib/saviynt/toTerraform.ts",
    path: "frontend/lib/saviynt/toTerraform.ts",
    layer: "lib",
    role: "Saviynt API response transformer — converts raw Saviynt REST API JSON payloads into ObjectSelection objects for HCL generation.",
    keyFunctions: [
      { name: "saviyntToTerraform(type, apiResponse)", desc: "Maps a Saviynt API list response for a given resource type into an array of ObjectSelection objects ready for submission to the Java generation backend." }
    ],
    details: "This is the translation layer for the Pull feature. Raw Saviynt data has different field names and structures than what WizardService expects. This module normalizes the API response into the canonical ObjectSelection model."
  },
  {
    name: "lib/saviynt/artefacts.ts",
    path: "frontend/lib/saviynt/artefacts.ts",
    layer: "lib",
    role: "Artefact type definitions and helper utilities for Saviynt transport configuration packages.",
    keyFunctions: [
      { name: "ARTEFACT_TYPES", desc: "Constant list of all supported Saviynt transport artefact type names (e.g. AnalyticsConfig, AccessProfileConfig)." }
    ],
    details: "Provides the valid artefact type names used to populate the transport artefact selection UI and validate that only known artefact types are submitted to the Java backend."
  },
  {
    name: "lib/terraform/commands.ts",
    path: "frontend/lib/terraform/commands.ts",
    layer: "lib",
    role: "Terraform CLI command builder — generates shell command strings for init, plan, apply, and validate operations.",
    keyFunctions: [
      { name: "buildInitCommand(workspacePath)", desc: "Returns the full terraform init shell command string for the given workspace path." },
      { name: "buildApplyCommand(workspacePath, autoApprove)", desc: "Returns the terraform apply command string with optional -auto-approve flag." }
    ],
    details: "Provides a typed, testable interface for Terraform CLI command construction. Used by the agent console and build validation runner to execute Terraform operations against the configured workspace."
  },
  {
    name: "lib/terraform/files.ts",
    path: "frontend/lib/terraform/files.ts",
    layer: "lib",
    role: "Terraform file utilities — reads and parses .tf files from the workspace directory for display in the Explorer page.",
    keyFunctions: [
      { name: "readWorkspaceFiles(path)", desc: "Recursively reads all .tf files from the given workspace directory and returns their filename and content as an array." },
      { name: "parseTerraformBlocks(hcl)", desc: "Parses raw HCL string content to extract resource block names and types for the Explorer tree view." }
    ],
    details: "Server-side only (runs in Next.js API routes). Uses Node.js fs module to read workspace files. Never runs in the browser — called from API routes and passed to the client as pre-parsed JSON."
  },
  {
    name: "lib/terraform/workspace.ts",
    path: "frontend/lib/terraform/workspace.ts",
    layer: "lib",
    role: "Workspace management utilities — provides helpers for workspace path resolution and directory validation.",
    keyFunctions: [
      { name: "resolveWorkspacePath(input)", desc: "Resolves a relative or absolute input path to the canonical absolute workspace directory path." },
      { name: "validateWorkspaceExists(path)", desc: "Checks that the workspace directory exists and is readable before submitting to the backend." }
    ],
    details: "Used by API routes and wizard store actions to validate and normalize workspace paths before operations are performed. Prevents confusing errors caused by typos or missing directories."
  },
  {
    name: "lib/envizor/brain.ts",
    path: "frontend/lib/envizor/brain.ts",
    layer: "lib",
    role: "Envizor Agent core brain — the main orchestration engine for the AI agent's reasoning, intent processing, and response generation.",
    keyFunctions: [
      { name: "processMessage(history, message)", desc: "Main entry point for the agent. Runs intent detection, loads relevant context from the knowledge graph, and assembles the prompt for the AI model." },
      { name: "buildSystemPrompt(context)", desc: "Assembles the full system prompt by combining the base wizard knowledge, workspace state, and retrieved knowledge graph snippets." }
    ],
    details: "The largest file in the Envizor lib. Acts as the central reasoning hub — routing incoming messages through intent detection, knowledge retrieval, and response generation. All AI model calls pass through this module."
  },
  {
    name: "lib/envizor/intentDetector.ts",
    path: "frontend/lib/envizor/intentDetector.ts",
    layer: "lib",
    role: "Intent classifier — detects the user's intent from a chat message to route it to the correct agent handler.",
    keyFunctions: [
      { name: "detectIntent(message)", desc: "Returns an IntentType enum value (e.g. CODE_EXPLAIN, GENERATE_TERRAFORM, DRIFT_ANALYSIS, GENERAL_QUERY) based on keyword and pattern matching." }
    ],
    details: "Rules-based intent classifier that runs before any AI call. Enables instant, deterministic responses for well-defined query types (e.g. code architecture questions) without consuming AI quota."
  },
  {
    name: "lib/envizor/wizardKnowledge.ts",
    path: "frontend/lib/envizor/wizardKnowledge.ts",
    layer: "lib",
    role: "Wizard knowledge base — static structured knowledge about the entire wizard codebase embedded into the AI agent's context.",
    keyFunctions: [
      { name: "WIZARD_KNOWLEDGE object", desc: "Large static object containing descriptions of every major component, data flow, and integration point in the wizard, formatted for injection into the AI system prompt." }
    ],
    details: "This file is what makes the agent aware of the codebase without needing to read source files at runtime. It is the primary knowledge source for architecture, code structure, and integration questions."
  },
  {
    name: "lib/envizor/knowledgeGraph.ts",
    path: "frontend/lib/envizor/knowledgeGraph.ts",
    layer: "lib",
    role: "Knowledge graph engine — manages a semantic graph of entities and relationships for contextual knowledge retrieval.",
    keyFunctions: [
      { name: "queryGraph(topic)", desc: "Returns the most relevant knowledge graph nodes for a given query topic." }
    ],
    details: "Provides structured retrieval of specific knowledge items rather than injecting the entire knowledge base into every prompt. Reduces token consumption and improves response precision."
  },
  {
    name: "lib/envizor/greetingEngine.ts",
    path: "frontend/lib/envizor/greetingEngine.ts",
    layer: "lib",
    role: "Greeting and context-setting engine — generates personalized, context-aware opening messages for the agent console.",
    keyFunctions: [
      { name: "generateGreeting(context)", desc: "Returns a context-aware greeting message based on the current wizard state, time of day, and user activity." }
    ],
    details: "Provides a premium first-impression experience when the agent console loads. Greetings reference the active workspace, current step, and recent activity to feel genuinely helpful rather than generic."
  },
  {
    name: "lib/envizor/driftAnalyzer.ts",
    path: "frontend/lib/envizor/driftAnalyzer.ts",
    layer: "lib",
    role: "Drift analysis engine — compares live Saviynt tenant state with generated Terraform HCL to identify configuration drift.",
    keyFunctions: [
      { name: "analyzeDrift(tenantState, terraformState)", desc: "Compares two state objects and returns a list of drift items describing resources that exist in one state but not the other." }
    ],
    details: "Enables the agent to answer questions like 'what has changed in the tenant since I last ran terraform apply?' by comparing fetched API state against the local workspace .tf files."
  },
  {
    name: "lib/envizor/suggestionEngine.ts",
    path: "frontend/lib/envizor/suggestionEngine.ts",
    layer: "lib",
    role: "Proactive suggestion generator — produces contextual next-step suggestions displayed in the agent console UI.",
    keyFunctions: [
      { name: "generateSuggestions(context)", desc: "Returns an array of suggested follow-up prompts or actions based on the current wizard state and recent agent conversation." }
    ],
    details: "Populates the quick-action suggestion chips displayed below the agent input box. Makes the agent feel proactive by anticipating what the user might want to do next."
  },
  {
    name: "lib/diffEngine2.ts",
    path: "frontend/lib/diffEngine2.ts",
    layer: "lib",
    role: "Text diff engine — computes line-by-line diffs between original and modified file contents for the Staged Diff panel.",
    keyFunctions: [
      { name: "computeDiff(original, modified)", desc: "Returns an array of DiffLine objects (type: added | removed | unchanged, content: string) for rendering the side-by-side diff view." }
    ],
    details: "Powers the Staged Diff tab in the agent console, showing exactly what lines the agent added, removed, or modified in any edited workspace file. Uses a simple LCS-based diff algorithm."
  },
  {
    name: "lib/stagingManager.ts",
    path: "frontend/lib/stagingManager.ts",
    layer: "lib",
    role: "Staging manager — tracks which agent-proposed file edits are staged for commit, enabling review-before-apply workflows.",
    keyFunctions: [
      { name: "stageChange(filePath, newContent)", desc: "Adds a proposed file change to the staging buffer." },
      { name: "clearStaging()", desc: "Removes all staged changes, discarding agent edits." },
      { name: "getStagedChanges()", desc: "Returns all currently staged file changes for display in the diff panel." }
    ],
    details: "Implements a Git-like staging area for agent-proposed code edits. Users can review all proposed changes in the Staged Diff tab before applying them to the actual workspace files."
  },
  {
    name: "lib/patchEngine.ts",
    path: "frontend/lib/patchEngine.ts",
    layer: "lib",
    role: "Patch applicator — applies staged diff patches to workspace files, writing accepted agent edits to disk.",
    keyFunctions: [
      { name: "applyPatch(filePath, patch)", desc: "Writes the patched file content to disk, replacing the original file with the agent's proposed changes." }
    ],
    details: "Called when the user clicks 'Apply Changes' in the agent console. Reads the staged changes from stagingManager and writes them to the actual workspace file paths via a server-side API route."
  },
  {
    name: "lib/envizorSync.ts",
    path: "frontend/lib/envizorSync.ts",
    layer: "lib",
    role: "Envizor sync utility — synchronizes the frontend wizard state with the Java backend session state.",
    keyFunctions: [
      { name: "syncState(store)", desc: "Reads the current Zustand store values and dispatches the appropriate /wizard/workspace and /wizard/environment POST calls to align the backend session." }
    ],
    details: "Called on app mount and after significant state changes to ensure the Java backend's WizardState is always in sync with the frontend Zustand store. Prevents stale session errors."
  },
  // ─── ZUSTAND STORE ──────────────────────────────────────────────────────────
  {
    name: "store/wizardstore.ts",
    path: "frontend/app/store/wizardstore.ts",
    layer: "store",
    role: "Zustand global wizard store — defines the complete shared state shape and all actions for the wizard session.",
    keyFunctions: [
      { name: "useWizardStore", desc: "The primary Zustand store hook. Holds workspace, environment, objectSelections, formData, currentStep, and all setter actions." },
      { name: "setWorkspace(path)", desc: "Updates the active workspace path in the store and triggers a backend sync." },
      { name: "addSelection(selection)", desc: "Appends a new ObjectSelection to the selections array." },
      { name: "resetStore()", desc: "Resets all store fields to their initial values, used on wizard restart." }
    ],
    details: "The central client-side state container. All wizard step components read from and write to this store. Persisted to sessionStorage so state survives hot reloads during development. The store's selections array is what gets serialized and sent to the Java backend at the generate step."
  },
  // ─── SHARED COMPONENTS ──────────────────────────────────────────────────────
  {
    name: "components/MeetEnvizorAssistant.tsx",
    path: "frontend/components/MeetEnvizorAssistant.tsx",
    layer: "component",
    role: "Full-screen meet-the-assistant onboarding modal — introduces the Envizor AI agent to new users with an animated walkthrough.",
    keyFunctions: [
      { name: "MeetEnvizorAssistant({ onDismiss })", desc: "Renders an animated modal presenting the agent's capabilities with dismiss and 'Start Chat' CTAs." }
    ],
    details: "Shown once per user session to introduce the AI agent. Contains animated capability showcases and capability descriptions. Dismissed state is stored in localStorage to avoid re-showing on subsequent sessions."
  },
  {
    name: "components/ChatbotFloatingButton.tsx",
    path: "frontend/components/ChatbotFloatingButton.tsx",
    layer: "component",
    role: "Floating chat launcher button — persistent bottom-right button that opens the agent console from any wizard page.",
    keyFunctions: [
      { name: "ChatbotFloatingButton()", desc: "Renders the animated floating action button that navigates to /wizard/agent when clicked." }
    ],
    details: "Ensures users have quick access to the AI agent from any screen in the wizard. Includes a pulsing animation to draw attention and a tooltip explaining its purpose."
  },
  {
    name: "components/CodePreview.tsx",
    path: "frontend/components/CodePreview.tsx",
    layer: "component",
    role: "Syntax-highlighted code block renderer — renders HCL, JSON, or TypeScript content with line numbers and copy button.",
    keyFunctions: [
      { name: "CodePreview({ code, language })", desc: "Renders the provided code string with syntax highlighting using Prism.js and a clipboard copy button." }
    ],
    details: "Used across multiple pages (Explorer, agent console diff view, preview panel) for consistent, readable code display. Supports hcl, json, and typescript language modes."
  },
  // ─── ROOT CONFIG FILES ───────────────────────────────────────────────────────
  {
    name: "pom.xml",
    path: "pom.xml",
    layer: "config",
    role: "Maven build configuration — defines all Java backend dependencies, plugins, and build lifecycle for the Spring Boot service.",
    keyFunctions: [
      { name: "Dependencies block", desc: "Declares spring-boot-starter-web, spring-boot-starter-test, jackson-databind, and other required JARs pulled from Maven Central." },
      { name: "spring-boot-maven-plugin", desc: "Enables ./mvnw clean package to produce a self-contained executable JAR with embedded Tomcat." }
    ],
    details: "The build descriptor for the Java backend. All Java dependency management flows through this file. Running ./mvnw clean package -DskipTests produces the saviynt-terraform-backend-*.jar file that is launched in production containers."
  },
  {
    name: "frontend/package.json",
    path: "frontend/package.json",
    layer: "config",
    role: "Node.js package manifest — declares all frontend NPM dependencies and defines the build, dev, start, and lint scripts.",
    keyFunctions: [
      { name: "npm run dev", desc: "Starts the Next.js development server with hot module replacement on port 3000." },
      { name: "npm run build", desc: "Compiles the Next.js application into optimized production bundles in the .next directory." },
      { name: "npm run start", desc: "Starts the Next.js production server serving the pre-built .next bundles." }
    ],
    details: "Defines all NPM dependencies including next, react, react-dom, zustand, zod, tailwindcss, and all type packages. The scripts section is the primary interface for building and running the frontend."
  },
  {
    name: "frontend/next.config.ts",
    path: "frontend/next.config.ts",
    layer: "config",
    role: "Next.js configuration — sets framework-level options including API proxy rewrites, environment variable exposure, and build settings.",
    keyFunctions: [
      { name: "rewrites()", desc: "Proxies /api/backend/* requests to http://localhost:8080/* so the frontend can call the Java backend without CORS issues in development." }
    ],
    details: "Critical for development: the rewrite rule makes the Java backend API available at the same origin as the Next.js dev server. In production containers, both services run on the same host so CORS headers in WizardController handle it directly."
  },
  {
    name: "frontend/tailwind.config.js",
    path: "frontend/tailwind.config.js",
    layer: "config",
    role: "Tailwind CSS configuration — defines the content paths, theme extensions, and custom design tokens used across the UI.",
    keyFunctions: [
      { name: "theme.extend", desc: "Extends Tailwind with custom color tokens, animation keyframes, and font size scales used throughout the wizard UI components." }
    ],
    details: "All custom styling that goes beyond Tailwind defaults (custom dark slate palettes, glow animations, font pairings) is defined here. Changes here affect every component that uses those design tokens."
  },
  {
    name: "frontend/tsconfig.json",
    path: "frontend/tsconfig.json",
    layer: "config",
    role: "TypeScript compiler configuration — sets strict mode, module resolution, and path aliases for the frontend codebase.",
    keyFunctions: [
      { name: "paths aliases", desc: "Defines @/* as a shorthand for the frontend root directory, enabling clean absolute imports across the codebase." }
    ],
    details: "Enforces strict TypeScript type checking across all frontend files. The paths configuration is essential — without it, the @/lib/... and @/components/... import aliases would not resolve."
  },
  {
    name: "vercel.json",
    path: "vercel.json",
    layer: "config",
    role: "Vercel deployment configuration — sets the build output directory and API route function regions for Vercel hosting.",
    keyFunctions: [
      { name: "builds config", desc: "Points Vercel to the frontend directory as the Next.js application root for cloud deployment." }
    ],
    details: "Used when deploying the frontend to Vercel. Configures the build command, output directory, and any environment-specific settings for the Vercel platform. Not needed for Docker container deployments."
  },
  {
    name: "saviynt_api.json",
    path: "saviynt_api.json",
    layer: "root",
    role: "Saviynt REST API specification — a comprehensive 7MB OpenAPI/Postman collection documenting all Saviynt tenant API endpoints.",
    keyFunctions: [
      { name: "Full API reference", desc: "Documents every REST endpoint available in the Saviynt platform including request schemas, response formats, authentication methods, and example payloads." }
    ],
    details: "Used as the reference source for implementing the Saviynt API client (lib/saviynt/client.ts) and for populating the agent's knowledge base about Saviynt API capabilities. Not loaded at runtime — referenced during development only."
  }
];

type StepMapping = {
  step: string;
  uiFile: string;
  endpoint: string;
  callsClass: string;
  action: string;
};

const STEP_MAPPINGS: StepMapping[] = [
  {
    step: "1. Welcome / Reset",
    uiFile: "wizard/steps/welcome/page.tsx",
    endpoint: "POST /wizard/reset",
    callsClass: "WizardController → WizardStateManager.reset()",
    action: "Wipes the backend WizardState session. Zustand store is also cleared via resetStore(). Ensures a completely clean slate before the user re-enters configuration."
  },
  {
    step: "2. Workspace Setup",
    uiFile: "wizard/day0/page.tsx",
    endpoint: "POST /wizard/workspace",
    callsClass: "WizardController → WizardStateManager → WizardService.setWorkspace()",
    action: "Saves the selected workspace directory path to both the backend WizardState and the WizardService instance. This path is where generated .tf files will be written."
  },
  {
    step: "3. Environment Selection",
    uiFile: "wizard/environment/page.tsx",
    endpoint: "POST /wizard/environment",
    callsClass: "WizardController → WizardState.setEnvironment()",
    action: "Stores the chosen deployment environment label (dev / uat / prod) in the backend session. Used in Terraform variable declarations."
  },
  {
    step: "4. Object Type Selection",
    uiFile: "app/object-types/page.tsx",
    endpoint: "POST /wizard/object-types",
    callsClass: "WizardController → WizardState.setObjectTypes()",
    action: "Registers which Saviynt resource types (entitlements, accounts, roles, endpoints, user_groups, etc.) will be targeted in this generation session."
  },
  {
    step: "5. Attribute Configuration",
    uiFile: "wizard/steps/StepDynamic.tsx",
    endpoint: "None (Zustand buffering)",
    callsClass: "useWizardStore → formData map",
    action: "All attribute key-value pairs entered in dynamic forms (driven by lib/wizard/attributeKeys.ts) are buffered in the Zustand store. No backend call until Review."
  },
  {
    step: "6. Preview (Dry Run)",
    uiFile: "wizard/steps/StepReview.tsx",
    endpoint: "POST /wizard/preview",
    callsClass: "WizardController → WizardService.generate() [dry run]",
    action: "Sends the full ObjectSelection[] payload. Backend runs the complete HCL template compilation in-memory without writing to disk. Returns the generated file map as JSON for the live preview panel."
  },
  {
    step: "7. Generate (Write to Disk)",
    uiFile: "wizard/steps/StepReview.tsx",
    endpoint: "POST /wizard/generate",
    callsClass: "WizardController → WizardService.generate() + writeToWorkspace()",
    action: "Same as preview but also calls writeToWorkspace(), flushing all generated .tf files to the configured workspace directory on the host file system."
  },
  {
    step: "8. Pull from Tenant",
    uiFile: "wizard/pull/page.tsx",
    endpoint: "POST /api/wizard/pull (Next.js BFF) → Saviynt API",
    callsClass: "lib/saviynt/client.ts → toTerraform.ts → WizardService.generate()",
    action: "Fetches live resource configurations from the Saviynt tenant API, transforms them via toTerraform.ts into ObjectSelection format, then generates matching HCL files."
  },
  {
    step: "9. Push to Git",
    uiFile: "wizard/push/page.tsx",
    endpoint: "POST /api/wizard/push (Next.js BFF)",
    callsClass: "lib/terraform/files.ts → GitHub / Azure DevOps API",
    action: "Reads generated files from the workspace directory and commits/pushes them to the configured remote Git repository branch using the ADO_TOKEN or GITHUB_TOKEN environment variable."
  },
  {
    step: "10. Agent Console",
    uiFile: "wizard/agent/page.tsx",
    endpoint: "POST /api/agent (streaming SSE)",
    callsClass: "lib/envizor/brain.ts → intentDetector → AI model",
    action: "Processes user chat messages through intent detection, knowledge graph retrieval, and AI model streaming. Proposed code changes are staged via stagingManager.ts and reviewed in the Staged Diff tab before applying."
  },
  {
    step: "11. Disconnected App Onboarding",
    uiFile: "wizard/disconnected-onboarding/page.tsx",
    endpoint: "POST /api/wizard/disconnected/onboard → GET/POST /api/wizard/disconnected/schedule",
    callsClass: "ScheduledAgentService.java → /api/wizard/disconnected/audit-logs",
    action: "User registers a disconnected app via the Target Application Profile form (credentials AES-256 vaulted). Selects per-app cron schedule and clicks Confirm Schedule (POSTs to /schedule). Spring Boot ScheduledAgentService polls /schedule every 5 seconds; when nextRun passes it calls /onboard (sync trigger), which pulls data from the app, uploads to Saviynt, then POSTs an audit record. Results appear in the Scans & Uploads and Reconcile Operations audit sub-tabs."
  }
];

const LAYER_CONFIG: Record<FileDetail["layer"], { label: string; color: string; icon: string }> = {
  "java-backend":  { label: "Java Backend",        color: "text-amber-400",   icon: "☕" },
  "frontend-page": { label: "Frontend Pages",      color: "text-sky-400",    icon: "🖥️" },
  "api-route":     { label: "API Routes",          color: "text-pink-400",   icon: "🔌" },
  "lib":           { label: "Lib / Utilities",     color: "text-emerald-400", icon: "🔧" },
  "store":         { label: "Zustand Store",       color: "text-violet-400", icon: "💾" },
  "component":     { label: "Shared Components",   color: "text-cyan-400",   icon: "🧩" },
  "config":        { label: "Config Files",        color: "text-orange-400", icon: "⚙️" },
  "root":          { label: "Root Files",          color: "text-rose-400",   icon: "📦" },
};

const LAYERS = Object.keys(LAYER_CONFIG) as FileDetail["layer"][];

export default function BackendDetailDashboard() {
  const [activeTab, setActiveTab] = useState<"architecture" | "files" | "mapping">("architecture");
  const [activeLayer, setActiveLayer] = useState<FileDetail["layer"] | "all">("all");
  const [selectedFile, setSelectedFile] = useState<string>(FILE_REGISTRY[0].name);

  const filteredFiles = activeLayer === "all"
    ? FILE_REGISTRY
    : FILE_REGISTRY.filter(f => f.layer === activeLayer);

  const currentFileData = FILE_REGISTRY.find(f => f.name === selectedFile);

  return (
    <Day0Shell
      title="Backend Architecture & Code Details"
      subtitle="Comprehensive reference for every file in the workspace — Java backend, frontend pages, API routes, lib utilities, and config."
      backTo="/wizard/steps/welcome"
      widthClass="max-w-7xl"
    >
      <div className="flex flex-col gap-6 animate-fadeIn text-slate-200">

        {/* Navigation Tabs */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800 gap-2 select-none shrink-0">
          {[
            { id: "architecture" as const, label: "🧬 System Flow" },
            { id: "files" as const,        label: "📂 Full File Registry" },
            { id: "mapping" as const,      label: "📊 Step-to-Controller Mapping" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-pink-950/30 text-pink-400 border border-pink-800/40 shadow-inner"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: ARCHITECTURE FLOW */}
        {activeTab === "architecture" && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative shadow-2xl flex flex-col gap-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <div>
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">IGA Wizard System Flow</h3>
              <p className="text-xs text-slate-400 mt-1">End-to-end data propagation from user inputs through to Terraform workspace files.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-6 px-4 bg-slate-900/40 rounded-xl border border-slate-800">
              {[
                { icon: "🖥️", color: "text-pink-400",    label: "Next.js UI Steps",      desc: "User triggers wizard buttons, fills forms, selects environment and object types." },
                { icon: "💾", color: "text-sky-400",     label: "Zustand Store",         desc: "Buffers selections and form data in browser memory across all wizard steps." },
                { icon: "🔌", color: "text-amber-400",   label: "REST Endpoints",        desc: "WizardController maps incoming JSON payloads to the service layer methods." },
                { icon: "☕", color: "text-emerald-400", label: "WizardService",         desc: "Normalizes types, interpolates HCL template strings, and builds the file map." },
                { icon: "📁", color: "text-purple-400",  label: "Workspace Files",       desc: "Writes providers.tf, variables.tf, main.tf, and resource modules to disk." },
              ].map((node, i, arr) => (
                <div key={i} className="contents">
                  <div className="flex flex-col items-center text-center p-4 bg-slate-950 rounded-xl border border-slate-800 shadow-md">
                    <span className="text-2xl mb-2">{node.icon}</span>
                    <strong className={`text-xs font-bold uppercase ${node.color}`}>{node.label}</strong>
                    <span className="text-[10px] text-slate-400 mt-1 leading-relaxed">{node.desc}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="hidden md:flex items-center justify-center text-pink-500/60 font-bold text-lg">➔</div>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: "🌐", color: "text-cyan-400", title: "Saviynt Tenant (Discovery)", desc: "Spring Boot calls Saviynt REST APIs during Pull to discover existing resource configurations and convert them into Terraform HCL." },
                { icon: "🗂️", color: "text-blue-400",  title: "Azure DevOps / GitHub (Git Push)", desc: "After generation, the Push step commits all .tf files to the configured remote repository branch using PAT authentication." },
                { icon: "📦", color: "text-violet-400", title: "Terraform Registry (Provider Download)", desc: "During terraform init, the CLI downloads the official saviynt/saviynt provider binary from registry.terraform.io." },
              ].map((card, i) => (
                <div key={i} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-2">
                  <span className="text-lg">{card.icon}</span>
                  <strong className={`text-xs font-bold uppercase ${card.color}`}>{card.title}</strong>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: FULL FILE REGISTRY */}
        {activeTab === "files" && (
          <div className="flex flex-col gap-4">

            {/* Layer filter pills */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveLayer("all")}
                className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  activeLayer === "all"
                    ? "bg-pink-950/40 text-pink-400 border-pink-700/50"
                    : "text-slate-400 border-slate-700 hover:border-slate-500"
                }`}
              >
                All ({FILE_REGISTRY.length})
              </button>
              {LAYERS.map(layer => {
                const cfg = LAYER_CONFIG[layer];
                const count = FILE_REGISTRY.filter(f => f.layer === layer).length;
                return (
                  <button
                    key={layer}
                    onClick={() => setActiveLayer(layer)}
                    className={`text-[10px] font-bold uppercase px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      activeLayer === layer
                        ? "bg-slate-800 border-slate-600 text-slate-100"
                        : "text-slate-400 border-slate-700 hover:border-slate-500"
                    }`}
                  >
                    {cfg.icon} {cfg.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[500px]">

              {/* File Sidebar */}
              <div className="md:col-span-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 overflow-y-auto max-h-[620px]">
                <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-wider mb-3 border-b border-slate-800 pb-2">
                  {filteredFiles.length} Files
                </h4>
                <div className="flex flex-col gap-0.5">
                  {filteredFiles.map(f => {
                    const cfg = LAYER_CONFIG[f.layer];
                    return (
                      <button
                        key={f.name}
                        onClick={() => setSelectedFile(f.name)}
                        className={`text-left py-2 px-3 rounded-lg transition-all cursor-pointer ${
                          selectedFile === f.name
                            ? "bg-pink-950/30 border-l-2 border-pink-500"
                            : "hover:bg-slate-900/40"
                        }`}
                      >
                        <span className={`text-[10px] font-bold ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                        <p className={`text-[11px] font-semibold mt-0.5 ${selectedFile === f.name ? "text-pink-300" : "text-slate-300"}`}>
                          {f.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File Detail Panel */}
              <div className="md:col-span-8 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-5 relative overflow-y-auto max-h-[620px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />

                {currentFileData ? (
                  <>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase ${LAYER_CONFIG[currentFileData.layer].color}`}>
                          {LAYER_CONFIG[currentFileData.layer].icon} {LAYER_CONFIG[currentFileData.layer].label}
                        </span>
                      </div>
                      <code className="text-[9px] font-mono text-slate-500 block">{currentFileData.path}</code>
                      <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide mt-1.5">{currentFileData.name}</h3>
                      <p className="text-xs text-pink-400/90 font-medium mt-1 leading-relaxed">{currentFileData.role}</p>
                    </div>

                    <div className="border-t border-slate-900 pt-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Responsibility & Implementation Details</h4>
                      <p className="text-xs text-slate-350 leading-relaxed">{currentFileData.details}</p>
                    </div>

                    <div className="border-t border-slate-900 pt-4">
                      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3">Key Functions & Methods</h4>
                      <div className="space-y-2.5">
                        {currentFileData.keyFunctions.map((fn, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col gap-1.5">
                            <code className="text-[10.5px] text-pink-300 font-mono font-semibold leading-snug">{fn.name}</code>
                            <span className="text-[10.5px] text-slate-400 leading-relaxed">{fn.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center">
                    <span className="text-3xl mb-2">📂</span>
                    <p className="text-xs">Select a file from the directory to view its detailed description.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STEP-TO-CONTROLLER MAPPING */}
        {activeTab === "mapping" && (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative shadow-2xl overflow-x-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">Wizard Step → Controller Trigger Map</h3>
              <p className="text-xs text-slate-400 mt-1">Full trace of every wizard step, the REST endpoint it triggers, and the Java classes it calls.</p>
            </div>
            <table className="w-full text-left border-collapse text-xs mt-4">
              <thead>
                <tr className="border-b-2 border-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3 w-[12%]">Step</th>
                  <th className="py-2.5 px-3 w-[18%]">UI File</th>
                  <th className="py-2.5 px-3 text-pink-400 w-[20%]">REST Endpoint</th>
                  <th className="py-2.5 px-3 text-sky-400 w-[20%]">Class Chain</th>
                  <th className="py-2.5 px-3">Action Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 font-mono text-[11px]">
                {STEP_MAPPINGS.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/35 transition-colors align-top">
                    <td className="py-3 px-3 font-semibold text-slate-200 font-sans">{m.step}</td>
                    <td className="py-3 px-3 text-slate-400">{m.uiFile}</td>
                    <td className="py-3 px-3 text-pink-300 font-semibold">{m.endpoint}</td>
                    <td className="py-3 px-3 text-sky-300">{m.callsClass}</td>
                    <td className="py-3 px-3 text-slate-300 font-sans tracking-normal leading-relaxed">{m.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </Day0Shell>
  );
}
