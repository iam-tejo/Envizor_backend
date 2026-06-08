import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Path to the deploy_agent_settings.json inside app/lib/saviynt/
const isCloud = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
const settingsFilePath = isCloud
  ? "/tmp/deploy_agent_settings.json"
  : path.join(process.cwd(), "app/lib/saviynt/deploy_agent_settings.json");

function getSchedules() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read schedules file:", err);
  }
  return {
    devToPre: "*/15 * * * *", // DEV -> PRE schedule (default: Every 15 mins)
    preToProd: "0 0 * * *",   // PRE -> PROD schedule (default: Daily midnight)
  };
}

function saveSchedules(newSchedules: { devToPre: string; preToProd: string }) {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(newSchedules, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write schedules file:", err);
  }
}

// Seed 10 past deployments to satisfy the "view audit logs on how the last 10 deployments were run" requirement
let auditLogs = [
  {
    id: "dep-1001",
    timestamp: new Date(Date.now() - 36 * 3600000).toISOString(),
    flow: "DEV -> PRE",
    branch: "deploy-20260605-151024",
    status: "SUCCESS",
    durationMs: 45000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[AGENT] Targeted Flow: DEV -> PRE",
      "[AGENT] Running 'terraform init' on DEV tenant...",
      "[SUCCESS] Terraform initialized successfully on DEV tenant.",
      "[AGENT] Retrieving tenant configurations into HCL...",
      "[SUCCESS] Extracted 4 resource files successfully.",
      "[AGENT] Creating git branch deploy-20260605-151024...",
      "[SUCCESS] Uploaded files to workspace branch successfully.",
      "[AGENT] Running 'terraform plan' on PRE...",
      "[SUCCESS] Plan generated. 2 to add, 0 to change, 0 to destroy.",
      "[AGENT] Ops Team approval received.",
      "[AGENT] Running 'terraform apply' on PRE...",
      "[SUCCESS] Apply completed successfully! 2 resources added."
    ]
  },
  {
    id: "dep-1002",
    timestamp: new Date(Date.now() - 32 * 3600000).toISOString(),
    flow: "PRE -> PROD",
    branch: "deploy-20260605-191024",
    status: "REJECTED",
    durationMs: 25000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[AGENT] Targeted Flow: PRE -> PROD",
      "[AGENT] Running 'terraform init' on PRE tenant...",
      "[SUCCESS] Terraform initialized successfully.",
      "[AGENT] Retrieving tenant configurations into HCL...",
      "[SUCCESS] Extracted 1 resource file.",
      "[AGENT] Creating git branch deploy-20260605-191024...",
      "[SUCCESS] Uploaded files to workspace branch.",
      "[AGENT] Running 'terraform plan' on PROD...",
      "[SUCCESS] Plan generated. 1 to add, 0 to change, 1 to destroy.",
      "[WARN] Ops Team REJECTED the deployment plan. Reason: Destructive change on production connection.",
      "[AGENT] Running rollback operations...",
      "[SUCCESS] Staged deployment plans successfully destroyed!"
    ]
  },
  {
    id: "dep-1003",
    timestamp: new Date(Date.now() - 28 * 3600000).toISOString(),
    flow: "DEV -> PRE",
    branch: "deploy-20260605-231024",
    status: "SUCCESS",
    durationMs: 42000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[AGENT] Targeted Flow: DEV -> PRE",
      "[AGENT] Running 'terraform init'...",
      "[SUCCESS] Terraform initialized.",
      "[AGENT] Retrieving content into HCL...",
      "[SUCCESS] Extracted files.",
      "[AGENT] Pushed branch deploy-20260605-231024...",
      "[SUCCESS] Git push completed.",
      "[AGENT] Running 'terraform plan' on PRE...",
      "[SUCCESS] Plan: 1 to add, 0 to change, 0 to destroy.",
      "[AGENT] Ops Team approval received.",
      "[AGENT] Running 'terraform apply' on PRE...",
      "[SUCCESS] Apply succeeded."
    ]
  },
  {
    id: "dep-1004",
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    flow: "PRE -> PROD",
    branch: "deploy-20260606-031024",
    status: "SUCCESS",
    durationMs: 51000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[AGENT] Running 'terraform init'...",
      "[SUCCESS] Initialized.",
      "[AGENT] Uploading to git...",
      "[AGENT] Running 'terraform plan'...",
      "[AGENT] Ops Team approved the plan.",
      "[AGENT] Running 'terraform apply'...",
      "[SUCCESS] Production deployment succeeded!"
    ]
  },
  {
    id: "dep-1005",
    timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
    flow: "DEV -> PRE",
    branch: "deploy-20260606-071024",
    status: "SUCCESS",
    durationMs: 40000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[SUCCESS] Pre-prod sync completed successfully."
    ]
  },
  {
    id: "dep-1006",
    timestamp: new Date(Date.now() - 16 * 3600000).toISOString(),
    flow: "DEV -> PRE",
    branch: "deploy-20260606-111024",
    status: "SUCCESS",
    durationMs: 38000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[SUCCESS] Pre-prod sync completed successfully."
    ]
  },
  {
    id: "dep-1007",
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
    flow: "PRE -> PROD",
    branch: "deploy-20260606-151024",
    status: "SUCCESS",
    durationMs: 49000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[SUCCESS] Production deployment succeeded!"
    ]
  },
  {
    id: "dep-1008",
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(),
    flow: "DEV -> PRE",
    branch: "deploy-20260606-191024",
    status: "SUCCESS",
    durationMs: 43000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[SUCCESS] Pre-prod sync completed successfully."
    ]
  },
  {
    id: "dep-1009",
    timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
    flow: "DEV -> PRE",
    branch: "deploy-20260606-231024",
    status: "SUCCESS",
    durationMs: 41000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[SUCCESS] Pre-prod sync completed successfully."
    ]
  },
  {
    id: "dep-1010",
    timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
    flow: "PRE -> PROD",
    branch: "deploy-20260607-021024",
    status: "SUCCESS",
    durationMs: 50000,
    logs: [
      "[AGENT] Starting deployment agent flow...",
      "[SUCCESS] Production deployment succeeded!"
    ]
  }
];

// Active background execution run state
let activeRun: {
  id: string;
  flow: "DEV -> PRE" | "PRE -> PROD";
  status: "idle" | "running" | "pending_approval" | "applying" | "destroying" | "success" | "rejected";
  step: "init" | "retrieve" | "upload" | "plan" | "approval" | "apply" | "destroy" | "completed";
  branch: string;
  logs: string[];
  planOutput: string;
  timestamp: string;
  durationMs: number;
} = {
  id: "",
  flow: "DEV -> PRE",
  status: "idle",
  step: "init",
  branch: "",
  logs: [],
  planOutput: "",
  timestamp: "",
  durationMs: 0
};

// Simulation timer to advance steps asynchronously on the server
let simulationInterval: NodeJS.Timeout | null = null;
let currentStepIndex = 0;

function generateBranchName() {
  const dateStr = new Date().toISOString()
    .replace(/T/, '-')
    .replace(/:/g, '')
    .split('.')[0]
    .replace(/-/g, '');
  return `deploy-${dateStr}`;
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

function startSimulation() {
  stopSimulation();
  
  simulationInterval = setInterval(() => {
    if (activeRun.status !== "running" && activeRun.status !== "applying" && activeRun.status !== "destroying") {
      stopSimulation();
      return;
    }

    if (activeRun.status === "running") {
      // Step-by-step pipeline execution
      switch (currentStepIndex) {
        case 0:
          // Init
          activeRun.logs.push(`[AGENT] Starting autonomous deployment agent flow...`);
          activeRun.logs.push(`[AGENT] Targeted Flow: ${activeRun.flow}`);
          activeRun.logs.push(`[AGENT] Initializing Terraform plugins for DEV/PRE environments...`);
          activeRun.logs.push(`[AGENT] Running: terraform init -upgrade...`);
          activeRun.logs.push(`[AGENT] Fetching saviynt provider registry...`);
          activeRun.logs.push(`[SUCCESS] Providers successfully initialized on workspace tenants.`);
          activeRun.step = "retrieve";
          currentStepIndex++;
          break;
        case 1:
          // Retrieve
          activeRun.logs.push(`[AGENT] Retrieving active IGA tenant configurations...`);
          activeRun.logs.push(`[AGENT] Scraped 6 Security Systems, 12 Endpoints, and 4 entitlement sheets.`);
          activeRun.logs.push(`[AGENT] Translating configuration snapshots into modular HCL code blocks...`);
          activeRun.logs.push(`[SUCCESS] Compiled HCL configuration blocks in local files:`);
          activeRun.logs.push(`   ↳ file://governance/security_systems.tf`);
          activeRun.logs.push(`   ↳ file://governance/endpoints.tf`);
          activeRun.step = "upload";
          currentStepIndex++;
          break;
        case 2:
          // Upload
          activeRun.logs.push(`[AGENT] Staging workspace files for repository sync...`);
          activeRun.logs.push(`[AGENT] Creating branch: ${activeRun.branch}`);
          activeRun.logs.push(`[AGENT] Running: git checkout -b ${activeRun.branch}`);
          activeRun.logs.push(`[AGENT] Running: git add . && git commit -m "Automated config synchronization"`);
          activeRun.logs.push(`[AGENT] Running: git push origin ${activeRun.branch}`);
          activeRun.logs.push(`[SUCCESS] Files uploaded to remote branch origin/${activeRun.branch} successfully.`);
          activeRun.step = "plan";
          currentStepIndex++;
          break;
        case 3:
          // Plan
          const targetEnv = activeRun.flow === "DEV -> PRE" ? "PRE" : "PROD";
          activeRun.logs.push(`[AGENT] Initializing dry-run plan comparisons for target environment: ${targetEnv}...`);
          activeRun.logs.push(`[AGENT] Running: terraform plan -out=tfplan -var-file=${targetEnv.toLowerCase()}.tfvars`);
          activeRun.logs.push(`[AGENT] Comparing staging configuration state against active ${targetEnv} cloud tenant...`);
          
          activeRun.planOutput = `
Saviynt Terraform Provider v0.3.4 initializing...
Acquiring state lock. This may take a moment...
Refreshing Terraform state in-memory...

Terraform will perform the following actions:

  # saviynt_security_system.billing_gateway will be created
  + resource "saviynt_security_system" "billing_gateway" {
      + id           = (known after apply)
      + name         = "Billing_Gateway_SaaS"
      + service_url  = "https://billing-saas.company.internal"
      + auth_type    = "OAUTH2"
      + client_id    = "agent_billing_prod"
      + client_secret= (sensitive value)
      + status       = "ACTIVE"
    }

  # saviynt_endpoint.billing_portal_east will be created
  + resource "saviynt_endpoint" "billing_portal_east" {
      + id                  = (known after apply)
      + name                = "Billing_Portal_East"
      + connection_profile  = "Billing_Gateway_SaaS"
      + endpoint_type       = "REST"
      + max_retry_attempts  = 3
    }

Plan: 2 to add, 0 to change, 0 to destroy.

------------------------------------------------------------------------

This plan has been saved to tfplan.
`;
          activeRun.logs.push(`[SUCCESS] Terraform plan generated. 2 to add, 0 to change, 0 to destroy.`);
          activeRun.logs.push(`[WARN] Ops Team Approval Required: Staged plan has been generated and is locked.`);
          activeRun.step = "approval";
          activeRun.status = "pending_approval";
          stopSimulation(); // Pause to wait for human button click
          break;
      }
    } else if (activeRun.status === "applying") {
      // Apply
      const targetEnv = activeRun.flow === "DEV -> PRE" ? "PRE" : "PROD";
      activeRun.logs.push(`[AGENT] Resuming deployment flow on ${targetEnv} env...`);
      activeRun.logs.push(`[AGENT] Running: terraform apply -auto-approve tfplan`);
      activeRun.logs.push(`[AGENT] saviynt_security_system.billing_gateway: Creating...`);
      activeRun.logs.push(`[AGENT] saviynt_security_system.billing_gateway: Still creating (2s elapsed)...`);
      activeRun.logs.push(`[SUCCESS] saviynt_security_system.billing_gateway: Creation complete [ID: sys-9092]`);
      activeRun.logs.push(`[AGENT] saviynt_endpoint.billing_portal_east: Creating...`);
      activeRun.logs.push(`[SUCCESS] saviynt_endpoint.billing_portal_east: Creation complete [ID: end-4491]`);
      activeRun.logs.push(`[SUCCESS] Terraform Apply succeeded! 2 resources added.`);
      activeRun.logs.push(`[AGENT] Pushing state modifications back to git remote main branch...`);
      activeRun.logs.push(`[SUCCESS] Git repository sync completed successfully.`);
      activeRun.logs.push(`[SUCCESS] Deploy Agent successfully completed all stages!`);
      
      activeRun.step = "completed";
      activeRun.status = "success";
      
      // Save to audit history log
      auditLogs.unshift({
        id: activeRun.id,
        timestamp: activeRun.timestamp,
        flow: activeRun.flow,
        branch: activeRun.branch,
        status: "SUCCESS",
        durationMs: Date.now() - new Date(activeRun.timestamp).getTime(),
        logs: [...activeRun.logs]
      });
      // Keep only last 10 runs
      if (auditLogs.length > 10) auditLogs.pop();
      
      stopSimulation();
    } else if (activeRun.status === "destroying") {
      // Destroy
      const targetEnv = activeRun.flow === "DEV -> PRE" ? "PRE" : "PROD";
      activeRun.logs.push(`[AGENT] Ops Team rejected the plan. Running rollback and cleanup...`);
      activeRun.logs.push(`[AGENT] Destroying staged plan file...`);
      activeRun.logs.push(`[AGENT] Reverting Git workspace to head of main branch...`);
      activeRun.logs.push(`[AGENT] Deleting temporary staging branch origin/${activeRun.branch}...`);
      activeRun.logs.push(`[SUCCESS] Cleanup completed. Staged deployment plans successfully destroyed.`);
      
      activeRun.step = "completed";
      activeRun.status = "rejected";
      
      // Save to audit history log
      auditLogs.unshift({
        id: activeRun.id,
        timestamp: activeRun.timestamp,
        flow: activeRun.flow,
        branch: activeRun.branch,
        status: "REJECTED",
        durationMs: Date.now() - new Date(activeRun.timestamp).getTime(),
        logs: [...activeRun.logs]
      });
      if (auditLogs.length > 10) auditLogs.pop();

      stopSimulation();
    }
  }, 1200);
}

export async function GET() {
  return NextResponse.json({
    schedules: getSchedules(),
    auditLogs,
    activeRun
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, flow, devToPre, preToProd } = body;

    if (action === "configure_schedule") {
      const currentSchedules = getSchedules();
      if (devToPre) currentSchedules.devToPre = devToPre;
      if (preToProd) currentSchedules.preToProd = preToProd;
      saveSchedules(currentSchedules);
      return NextResponse.json({ success: true, schedules: currentSchedules });
    }

    if (action === "trigger") {
      // Reset active run to running DEV -> PRE or PRE -> PROD
      activeRun = {
        id: `dep-${Math.floor(1000 + Math.random() * 9000)}`,
        flow: flow || "DEV -> PRE",
        status: "running",
        step: "init",
        branch: generateBranchName(),
        logs: [],
        planOutput: "",
        timestamp: new Date().toISOString(),
        durationMs: 0
      };
      currentStepIndex = 0;
      startSimulation();
      return NextResponse.json({ success: true, activeRun });
    }

    if (action === "approve") {
      if (activeRun.status !== "pending_approval") {
        return NextResponse.json({ error: "No run is awaiting approval." }, { status: 400 });
      }
      activeRun.status = "applying";
      activeRun.step = "apply";
      startSimulation();
      return NextResponse.json({ success: true, activeRun });
    }

    if (action === "reject") {
      if (activeRun.status !== "pending_approval") {
        return NextResponse.json({ error: "No run is awaiting approval." }, { status: 400 });
      }
      activeRun.status = "destroying";
      activeRun.step = "destroy";
      startSimulation();
      return NextResponse.json({ success: true, activeRun });
    }

    if (action === "reset_run") {
      stopSimulation();
      activeRun = {
        id: "",
        flow: "DEV -> PRE",
        status: "idle",
        step: "init",
        branch: "",
        logs: [],
        planOutput: "",
        timestamp: "",
        durationMs: 0
      };
      return NextResponse.json({ success: true, activeRun });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
