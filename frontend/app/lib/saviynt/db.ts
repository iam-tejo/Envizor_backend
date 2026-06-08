import fs from "fs";
import path from "path";

// Define file paths
const ROOT_DIR = process.cwd().endsWith("frontend") ? process.cwd() : path.join(process.cwd(), "frontend");
const LIB_DIR = path.join(ROOT_DIR, "app/lib/saviynt");
const TASKS_PATH = path.join(LIB_DIR, "disconnected_tasks.json");
const AUDIT_LOGS_PATH = path.join(LIB_DIR, "disconnected_audit_logs.json");
const ARCHIVE_DIR = path.join(LIB_DIR, "archive");

// Types
export interface DisconnectedTask {
  id: string;
  targetSystem: string;
  operation: string;
  accountName: string;
  details: string;
  status: "PENDING" | "COMPLETED";
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLogRun {
  id: string;
  timestamp: string;
  targetSystem: string;
  status: "SUCCESS" | "FAILED";
  tasksProcessed: number;
  type: "SCHEDULED" | "MANUAL";
  cron: string;
  nextRun: string;
  logs: string[];
}

// Default Data
const DEFAULT_TASKS: DisconnectedTask[] = [
  {
    id: "TASK-8802",
    targetSystem: "Legacy Billing Portal",
    operation: "CREATE_ACCOUNT",
    accountName: "jdoe@company.com",
    details: "Role: Billing Analyst, Status: ACTIVE",
    status: "PENDING",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: "TASK-8803",
    targetSystem: "Legacy Billing Portal",
    operation: "ADD_ACCESS",
    accountName: "jdoe@company.com",
    details: "Privilege: Invoice_Editor",
    status: "PENDING",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: "TASK-8804",
    targetSystem: "Legacy HR Database",
    operation: "DISABLE_ACCOUNT",
    accountName: "asmith@company.com",
    details: "Status: TERMINATED",
    status: "PENDING",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: "TASK-8805",
    targetSystem: "Legacy Billing Portal",
    operation: "REMOVE_ACCESS",
    accountName: "rkumar@company.com",
    details: "Privilege: Admin_Dashboard",
    status: "PENDING",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_AUDIT_LOGS: AuditLogRun[] = [
  {
    id: "run-9901",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    targetSystem: "Billing_West_Portal",
    status: "SUCCESS",
    tasksProcessed: 3,
    type: "SCHEDULED",
    cron: "*/5 * * * *",
    nextRun: new Date(Date.now() + 180000).toISOString(),
    logs: [
      "[AGENT] Connecting to Saviynt connection profile metadata...",
      "[AGENT] Resolving connection credentials for profile 'Billing_West_Portal'...",
      "[SUCCESS] Credentials retrieved securely (Strategy A: Decrypted from Saviynt Connection properties).",
      "[AGENT] Target Portal URL: https://billing-portal-west.company.internal/admin",
      "[AGENT] Initiating secure browser workspace emulation...",
      "[AGENT] Entering retrieved credentials for administrator user 'agent_billing_west'...",
      "[AGENT] Verification successful. Authenticated.",
      "[AGENT] Extracting user directories and groups database...",
      "[AGENT] Discovered 24 active accounts and 8 security groups/roles.",
      "[AGENT] Saving extracted attributes to CSV buffer...",
      "[AGENT] Uploading CSV baselines to Saviynt connection profile 'Billing_West_Portal'...",
      "[AGENT] Invoking Saviynt API to execute Import Job...",
      "[SUCCESS] Job created successfully! Job ID: job-dev-1, Status: SUCCESS",
      "[AGENT] Import job successfully launched. Data synchronization completed!",
      "[AGENT] [TASK-8802] Processing CREATE_ACCOUNT for account jdoe@company.com...",
      "[AGENT] [TASK-8802] Simulating UI elements navigation...",
      "[AGENT] [TASK-8802] Operation completed successfully inside target system.",
      "[AGENT] [TASK-8803] Processing ADD_ACCESS for account jdoe@company.com...",
      "[AGENT] [TASK-8803] Simulating UI elements navigation...",
      "[AGENT] [TASK-8803] Operation completed successfully inside target system.",
      "[AGENT] [TASK-8805] Processing REMOVE_ACCESS for account rkumar@company.com...",
      "[AGENT] [TASK-8805] Simulating UI elements navigation...",
      "[AGENT] [TASK-8805] Operation completed successfully inside target system."
    ]
  },
  {
    id: "run-9902",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    targetSystem: "Legacy_HR_Directory",
    status: "SUCCESS",
    tasksProcessed: 1,
    type: "SCHEDULED",
    cron: "*/15 * * * *",
    nextRun: new Date(Date.now() + 600000).toISOString(),
    logs: [
      "[AGENT] Connecting to Saviynt connection profile metadata...",
      "[AGENT] Resolving connection credentials for profile 'Legacy_HR_Directory'...",
      "[SUCCESS] Credentials retrieved securely (Strategy A: Decrypted from Saviynt Connection properties).",
      "[AGENT] Target Portal URL: https://hr-directory-internal.company.internal/auth",
      "[AGENT] Initiating secure browser workspace emulation...",
      "[AGENT] Entering retrieved credentials for administrator user 'agent_hr_directory'...",
      "[AGENT] Verification successful. Authenticated.",
      "[AGENT] Extracting user directories and groups database...",
      "[AGENT] Discovered 15 active accounts and 4 security groups/roles.",
      "[AGENT] Saving extracted attributes to CSV buffer...",
      "[AGENT] Uploading CSV baselines to Saviynt connection profile 'Legacy_HR_Directory'...",
      "[AGENT] Invoking Saviynt API to execute Import Job...",
      "[SUCCESS] Job created successfully! Job ID: job-hr-1, Status: SUCCESS",
      "[AGENT] Import job successfully launched. Data synchronization completed!"
    ]
  }
];

// Helper to ensure base directories exist
function ensureDirs() {
  if (!fs.existsSync(LIB_DIR)) {
    fs.mkdirSync(LIB_DIR, { recursive: true });
  }
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }
}

// General helper to read JSON file safely
function readJsonFile<T>(filePath: string, defaultValue: T): T {
  ensureDirs();
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data) as T;
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
    return defaultValue;
  }
}

// General helper to write JSON file safely
function writeJsonFile<T>(filePath: string, data: T) {
  ensureDirs();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

// Archive helper
function archiveRecords<T>(archiveBaseName: string, records: T[]) {
  if (records.length === 0) return;
  
  ensureDirs();
  const dateStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const archivePath = path.join(ARCHIVE_DIR, `${archiveBaseName}_${dateStr}.json`);
  
  let existingArchive: T[] = [];
  if (fs.existsSync(archivePath)) {
    try {
      const existingData = fs.readFileSync(archivePath, "utf8");
      existingArchive = JSON.parse(existingData) as T[];
    } catch (e) {
      console.error(`Error reading existing archive ${archivePath}:`, e);
    }
  }
  
  const updatedArchive = [...existingArchive, ...records];
  fs.writeFileSync(archivePath, JSON.stringify(updatedArchive, null, 2), "utf8");
  console.log(`Archived ${records.length} records to ${archivePath}`);
}

// Tasks API
export function readTasks(): DisconnectedTask[] {
  return readJsonFile<DisconnectedTask[]>(TASKS_PATH, DEFAULT_TASKS);
}

export function saveTasks(tasks: DisconnectedTask[]) {
  // Sort tasks: keep all pending, sort completed by updatedAt or createdAt (newest first)
  const pending = tasks.filter(t => t.status === "PENDING");
  const completed = tasks.filter(t => t.status === "COMPLETED");
  
  // Sort completed tasks descending by updatedAt (or createdAt)
  completed.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });
  
  let activeCompleted = completed;
  let toArchive: DisconnectedTask[] = [];
  
  // Prune completed to latest 100
  if (completed.length > 100) {
    activeCompleted = completed.slice(0, 100);
    toArchive = completed.slice(100);
  }
  
  // Save active tasks (pending first, then recent completed)
  const activeTasks = [...pending, ...activeCompleted];
  writeJsonFile<DisconnectedTask[]>(TASKS_PATH, activeTasks);
  
  // Archive pruned tasks
  if (toArchive.length > 0) {
    // Reverse archive array to store oldest first
    archiveRecords<DisconnectedTask>("disconnected_tasks", toArchive.reverse());
  }
}

// Audit Logs API
export function readAuditLogs(): AuditLogRun[] {
  return readJsonFile<AuditLogRun[]>(AUDIT_LOGS_PATH, DEFAULT_AUDIT_LOGS);
}

export function saveAuditLogs(logs: AuditLogRun[]) {
  // Sort logs by timestamp (newest first)
  const sortedLogs = [...logs].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  let activeLogs = sortedLogs;
  let toArchive: AuditLogRun[] = [];
  
  // Limit to latest 50 runs
  if (sortedLogs.length > 50) {
    activeLogs = sortedLogs.slice(0, 50);
    toArchive = sortedLogs.slice(50);
  }
  
  writeJsonFile<AuditLogRun[]>(AUDIT_LOGS_PATH, activeLogs);
  
  // Archive pruned logs
  if (toArchive.length > 0) {
    // Reverse archive array to store oldest first
    archiveRecords<AuditLogRun>("disconnected_audit_logs", toArchive.reverse());
  }
}
