"use client";

import React, { useState, useEffect, useRef } from "react";
import Day0Shell from "../day0/Day0Shell";
import { saviyntService } from "@/app/lib/saviynt/service";

export default function DisconnectedOnboardingPage() {
  const [url, setUrl] = useState("https://billing-portal.company.internal/admin");
  const [username, setUsername] = useState("admin_billing");
  const [password, setPassword] = useState("••••••••••••");
  const [createConnection, setCreateConnection] = useState(true);
  const [appName, setAppName] = useState("Billing_East_Portal");

  // Wizard Stepper State
  const [currentStep, setCurrentStep] = useState(1);
  const stepsList = [
    { number: 1, name: "Scraper Settings", desc: "Credentials & URLs", icon: "💻" },
    { number: 2, name: "Extraction Rules", desc: "Target UI Elements", icon: "📋" },
    { number: 3, name: "Onboard Connection", desc: "Run Scan & Imports", icon: "📡" },
    { number: 4, name: "Provision Queue", desc: "Automate & Reconcile", icon: "⚡" }
  ];

  // Step 2: Access Extraction Rules States
  const [accountRowSelector, setAccountRowSelector] = useState("table.users-list tr");
  const [usernameSelector, setUsernameSelector] = useState("td.email");
  const [roleBadgeSelector, setRoleBadgeSelector] = useState("span.badge-role");
  const [extractionTimeout, setExtractionTimeout] = useState(8);
  const [scrapeDeepPages, setScrapeDeepPages] = useState(true);

  // Disconnected Connections dropdown states
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>("new");
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  // Top-level View Tab states
  const [mainTab, setMainTab] = useState<"operations" | "history">("operations");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [scheduleConfig, setScheduleConfig] = useState<any>(null);
  const [auditSubTab, setAuditSubTab] = useState<"upload" | "reconcile">("upload");
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string>("timestamp");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Per-application scheduler state
  const [selectedScheduleConn, setSelectedScheduleConn] = useState<string>("Billing_West_Portal");
  const [selectedFreqOption, setSelectedFreqOption] = useState<string>("*/5 * * * *");
  const [customCronText, setCustomCronText] = useState<string>("");
  const [cronError, setCronError] = useState<string | null>(null);
  const [cronSuccess, setCronSuccess] = useState<boolean>(false);

  // Schedule picked during new-app onboarding
  const [onboardingCron, setOnboardingCron] = useState<string>("*/15 * * * *");
  const [onboardingCustomCron, setOnboardingCustomCron] = useState<string>("");

  // AI Agent Terminal states
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[AGENT] Standing by. Awaiting legacy credentials form submission...`
  ]);
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);

  // Provisioning Queue states
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [userRole, setUserRole] = useState("BasicUser");
  const [userName, setUserName] = useState("admin");

  const [guideExpanded, setGuideExpanded] = useState(true);

  // Load Draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const draft = localStorage.getItem("envizor_disconnected_draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.url) setUrl(parsed.url);
          if (parsed.username) setUsername(parsed.username);
          if (parsed.appName) setAppName(parsed.appName);
          if (parsed.selectedConnectionId) setSelectedConnectionId(parsed.selectedConnectionId);
          if (parsed.createConnection !== undefined) setCreateConnection(parsed.createConnection);
          
          if (parsed.accountRowSelector) setAccountRowSelector(parsed.accountRowSelector);
          if (parsed.usernameSelector) setUsernameSelector(parsed.usernameSelector);
          if (parsed.roleBadgeSelector) setRoleBadgeSelector(parsed.roleBadgeSelector);
          if (parsed.extractionTimeout !== undefined) setExtractionTimeout(parsed.extractionTimeout);
          if (parsed.scrapeDeepPages !== undefined) setScrapeDeepPages(parsed.scrapeDeepPages);
          
          if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep);
        } catch (e) {
          console.error("Failed to load disconnected onboarding draft", e);
        }
      }
    }
  }, []);

  // Save Draft to localStorage whenever inputs change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const draft = {
        url,
        username,
        appName,
        selectedConnectionId,
        createConnection,
        accountRowSelector,
        usernameSelector,
        roleBadgeSelector,
        extractionTimeout,
        scrapeDeepPages,
        currentStep
      };
      localStorage.setItem("envizor_disconnected_draft", JSON.stringify(draft));
    }
  }, [
    url,
    username,
    appName,
    selectedConnectionId,
    createConnection,
    accountRowSelector,
    usernameSelector,
    roleBadgeSelector,
    extractionTimeout,
    scrapeDeepPages,
    currentStep
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("envizor_guide_disconnected");
      if (stored === "false") {
        setGuideExpanded(false);
      }
    }
  }, []);

  const toggleGuide = () => {
    const newVal = !guideExpanded;
    setGuideExpanded(newVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("envizor_guide_disconnected", String(newVal));
    }
  };

  async function loadConnections() {
    try {
      setConnectionsLoading(true);
      const searchParams = new URLSearchParams(window.location.search);
      const env = searchParams.get("env") || sessionStorage.getItem("envizor_baseline_env") || "DEV";
      const allConns = await saviyntService.list(env as any, "connection");
      const disconnectedConns = allConns.filter((c: any) => c.type === "Disconnected");
      setConnections(disconnectedConns);
    } catch (err) {
      console.error("Failed to load connections:", err);
    } finally {
      setConnectionsLoading(false);
    }
  }

  function handleConnectionSelect(connId: string) {
    setSelectedConnectionId(connId);
    if (connId === "new") {
      setUrl("https://billing-portal.company.internal/admin");
      setUsername("admin_billing");
      setPassword("");
      setAppName("Billing_East_Portal");
      setCreateConnection(true);
    } else {
      const conn = connections.find((c) => c.id === connId);
      if (conn) {
        if (conn.name === "Billing_West_Portal") {
          setUrl("https://billing-portal-west.company.internal/admin");
          setUsername("agent_billing_west");
          setAppName("Billing_West_Portal");
        } else {
          setUrl("https://hr-directory-internal.company.internal/auth");
          setUsername("agent_hr_directory");
          setAppName("Legacy_HR_Directory");
        }
        setPassword("••••••••••••");
        setCreateConnection(false);
      }
    }
  }

  async function loadAuditLogs() {
    try {
      setAuditLogsLoading(true);
      const res = await fetch("/api/wizard/disconnected/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs ?? []);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setAuditLogsLoading(false);
    }
  }

  async function loadScheduleConfig() {
    try {
      const res = await fetch("/api/wizard/disconnected/schedule");
      if (res.ok) {
        const data = await res.json();
        setScheduleConfig(data);
      }
    } catch (err) {
      console.error("Failed to load schedule config:", err);
    }
  }

  async function handleCronChange(connectionName: string, cronExpr: string) {
    setCronError(null);
    setCronSuccess(false);
    try {
      const res = await fetch("/api/wizard/disconnected/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionName, cron: cronExpr })
      });
      if (res.ok) {
        const data = await res.json();
        setCronSuccess(true);
        hasInitializedRef.current = false;
        loadScheduleConfig();
      } else {
        const data = await res.json();
        setCronError(data.error || "Failed to validate/update cron schedule.");
      }
    } catch (err: any) {
      setCronError(err.message || "Failed to update schedule.");
    }
  }

  function formatCountdown(seconds: number | undefined) {
    if (seconds === undefined) return "Calculating...";
    if (seconds >= 9999999) return "No Active Schedule";
    if (seconds <= 0) return "Running Agent Loop...";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s remaining`;
  }

  function translateCronToEnglish(cron: string): string {
    if (!cron) return "—";
    if (cron === "Manual" || cron === "N/A" || cron === "Manual Scan" || cron === "none") return "No Schedule (Manual Only)";
    
    const trimmed = cron.trim();
    if (trimmed === "*/1 * * * *") return "Every 1 minute";
    if (trimmed === "*/2 * * * *") return "Every 2 minutes";
    if (trimmed === "*/5 * * * *") return "Every 5 minutes";
    if (trimmed === "*/15 * * * *") return "Every 15 minutes";
    if (trimmed === "*/30 * * * *") return "Every 30 minutes";
    if (trimmed === "0 * * * *") return "Hourly";
    if (trimmed === "0 0 * * *") return "Daily at Midnight";
    
    const matchMin = trimmed.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
    if (matchMin) {
      return `Every ${matchMin[1]} minutes`;
    }
    
    const matchHour = trimmed.match(/^0\s+\*\/(\d+)\s+\*\s+\*\s+\*$/);
    if (matchHour) {
      return `Every ${matchHour[1]} hours`;
    }
    
    return `Custom: ${trimmed}`;
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "admin";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setUserRole(latestRole);
      setUserName(user);
      
      loadTasks();
      loadConnections();
      loadAuditLogs();
      loadScheduleConfig();

      // Countdown tick loop (every 1 second)
      const tickTimer = setInterval(() => {
        setScheduleConfig((prev: any) => {
          if (!prev) return null;
          
          const updatedSchedules = { ...prev.schedules };
          let minSeconds = 99999999;
          let hasDue = false;

          for (const name in updatedSchedules) {
            const currentSeconds = updatedSchedules[name].secondsRemaining;
            const updatedSeconds = Math.max(0, currentSeconds - 1);
            updatedSchedules[name] = {
              ...updatedSchedules[name],
              secondsRemaining: updatedSeconds
            };
            if (updatedSeconds === 0 && currentSeconds === 1) {
              hasDue = true;
            }
            if (updatedSeconds < minSeconds) {
              minSeconds = updatedSeconds;
            }
          }

          if (hasDue) {
            setTimeout(() => {
              loadAuditLogs();
              loadTasks();
              loadScheduleConfig();
            }, 1800);
          }

          return {
            ...prev,
            schedules: updatedSchedules,
            secondsRemaining: minSeconds === 99999999 ? 0 : minSeconds
          };
        });
      }, 1000);

      // Periodically sync schedule config state with API (every 5 seconds)
      const syncTimer = setInterval(() => {
        loadScheduleConfig();
      }, 5000);

      return () => {
        clearInterval(tickTimer);
        clearInterval(syncTimer);
      };
    }
  }, []);

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (scheduleConfig && scheduleConfig.schedules && scheduleConfig.schedules[selectedScheduleConn]) {
      const currentCron = scheduleConfig.schedules[selectedScheduleConn].cron;
      const standardCrons = ["none", "*/1 * * * *", "*/2 * * * *", "*/5 * * * *", "*/15 * * * *", "*/30 * * * *", "0 * * * *", "0 0 * * *"];
      
      if (!hasInitializedRef.current) {
        if (standardCrons.includes(currentCron)) {
          setSelectedFreqOption(currentCron);
          setCustomCronText("");
        } else {
          setSelectedFreqOption("custom");
          setCustomCronText(currentCron);
        }
        hasInitializedRef.current = true;
      }
      setCronError(null);
      setCronSuccess(false);
    }
  }, [selectedScheduleConn, scheduleConfig]);

  useEffect(() => {
    hasInitializedRef.current = false;
  }, [selectedScheduleConn]);

  useEffect(() => {
    // Scroll terminal to bottom
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [terminalLogs]);

  async function loadTasks() {
    try {
      setTasksLoading(true);
      const res = await fetch("/api/wizard/disconnected/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  }

  async function handleOnboard(e: React.FormEvent) {
    e.preventDefault();
    setOnboardLoading(true);
    setSuccessInfo(null);
    setTerminalLogs([`[AGENT] Starting application onboarding workflow...`]);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const env = searchParams.get("env") || sessionStorage.getItem("envizor_baseline_env") || "DEV";
      
      const connectionName = selectedConnectionId === "new" ? appName : connections.find((c) => c.id === selectedConnectionId)?.name;

      const res = await fetch("/api/wizard/disconnected/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url, 
          username, 
          password, 
          createConnection, 
          env, 
          connectionName,
          isNewOnboarding: selectedConnectionId === "new"
        })
      });

      if (res.ok) {
        const data = await res.json();
        
        // Stream logs with timeouts to make it look highly active and premium
        for (let i = 0; i < data.logs.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 200));
          setTerminalLogs((prev) => [...prev, data.logs[i]]);
        }

        setSuccessInfo({
          scrapedAccountsCount: data.scrapedAccountsCount,
          scrapedAccessCount: data.scrapedAccessCount,
          connectionProfile: data.connectionProfile,
          jobId: data.jobId,
          jobStatus: data.jobStatus
        });

        // ── Auto-register the import schedule chosen during onboarding ──
        if (selectedConnectionId === "new") {
          const chosenCron = onboardingCron === "custom" ? onboardingCustomCron.trim() : onboardingCron;
          if (chosenCron) {
            try {
              await fetch("/api/wizard/disconnected/schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ connectionName: data.connectionProfile || connectionName, cron: chosenCron })
              });
              loadScheduleConfig();
              setTerminalLogs((prev) => [...prev, `[SCHEDULER] Import schedule registered: ${translateCronToEnglish(chosenCron)}`]);
            } catch (schedErr) {
              console.error("Failed to register schedule:", schedErr);
            }
          }
        }

        // Register in audit history logs
        await fetch("/api/wizard/disconnected/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetSystem: data.connectionProfile,
            status: "SUCCESS",
            tasksProcessed: 0,
            type: selectedConnectionId === "new" ? "NEW_ONBOARD" : "MANUAL_SCAN",
            logs: data.logs
          })
        }).then(() => loadAuditLogs())
          .catch((err) => console.error("Failed to post audit log:", err));

        // Reload connections if we onboarded a new connection
        if (selectedConnectionId === "new") {
          loadConnections();
        }
      } else {
        const data = await res.json();
        setTerminalLogs((prev) => [...prev, `[ERROR] Onboarding failed: ${data.error || "Server error"}`]);
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [...prev, `[ERROR] Request failed: ${err.message || err}`]);
    } finally {
      setOnboardLoading(false);
    }
  }

  async function handleExecuteTask(taskId: string) {
    setTasksLoading(true);
    setTerminalLogs((prev) => [...prev, `[AGENT] Received request to reconcile task ${taskId}...`]);

    try {
      const res = await fetch("/api/wizard/disconnected/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action: "execute" })
      });

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);

        for (let i = 0; i < data.logs.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 100));
          setTerminalLogs((prev) => [...prev, data.logs[i]]);
        }

        // Register in audit logs
        await fetch("/api/wizard/disconnected/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetSystem: "Legacy Portal",
            status: "SUCCESS",
            tasksProcessed: 1,
            type: "MANUAL_RECONCILE",
            logs: data.logs
          })
        }).then(() => loadAuditLogs())
          .catch((err) => console.error("Failed to post audit log:", err));
      } else {
        const data = await res.json();
        setTerminalLogs((prev) => [...prev, `[ERROR] Task execution failed: ${data.error || "Server error"}`]);
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [...prev, `[ERROR] Execution request failed: ${err.message || err}`]);
    } finally {
      setTasksLoading(false);
    }
  }

  async function handleExecuteAll() {
    setTasksLoading(true);
    setTerminalLogs((prev) => [...prev, `[AGENT] Received request to reconcile all pending tasks...`]);

    try {
      const res = await fetch("/api/wizard/disconnected/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "execute_all" })
      });

      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);

        const pendingCount = tasks.filter((t) => t.status === "PENDING").length;
        for (let i = 0; i < data.logs.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 80));
          setTerminalLogs((prev) => [...prev, data.logs[i]]);
        }

        // Register in audit logs
        await fetch("/api/wizard/disconnected/audit-logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetSystem: "Legacy Gateways (Bulk)",
            status: "SUCCESS",
            tasksProcessed: pendingCount,
            type: "BULK_RECONCILE",
            logs: data.logs
          })
        }).then(() => loadAuditLogs())
          .catch((err) => console.error("Failed to post audit log:", err));
      } else {
        const data = await res.json();
        setTerminalLogs((prev) => [...prev, `[ERROR] Bulk execution failed: ${data.error || "Server error"}`]);
      }
    } catch (err: any) {
      setTerminalLogs((prev) => [...prev, `[ERROR] Bulk execution request failed: ${err.message || err}`]);
    } finally {
      setTasksLoading(false);
    }
  }

  async function handleResetTasks() {
    try {
      setTasksLoading(true);
      const res = await fetch("/api/wizard/disconnected/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" })
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks ?? []);
        setTerminalLogs((prev) => [...prev, `[AGENT] Tasks status queue successfully reset back to PENDING.`]);
      }
    } catch (err) {
      console.error("Failed to reset tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return <span className="text-slate-650 ml-1 font-mono text-[9px]">↕</span>;
    return sortDirection === "asc" ? <span className="text-sky-400 ml-1 font-mono text-[9px]">▲</span> : <span className="text-sky-400 ml-1 font-mono text-[9px]">▼</span>;
  };

  const filteredLogs = auditLogs
    .filter((run) => {
      // Step 1: Filter by Sub-tab Type
      if (auditSubTab === "upload") {
        return ["NEW_ONBOARD", "MANUAL_SCAN", "SCHEDULED"].includes(run.type);
      } else {
        return ["MANUAL_RECONCILE", "BULK_RECONCILE", "SCHEDULED"].includes(run.type);
      }
    })
    .filter((run) => {
      // Step 2: Filter by Search Query (Target Connection)
      if (!auditSearchQuery.trim()) return true;
      const query = auditSearchQuery.toLowerCase();
      const target = run.targetSystem.toLowerCase().replace(/_/g, " ");
      const rawTarget = run.targetSystem.toLowerCase();
      return target.includes(query) || rawTarget.includes(query);
    })
    .sort((a, b) => {
      // Step 3: Sort by sortField / sortDirection
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === "timestamp") {
        valA = new Date(a.timestamp).getTime();
        valB = new Date(b.timestamp).getTime();
      } else if (sortField === "nextRun") {
        const nextA = scheduleConfig?.schedules?.[a.targetSystem]?.nextRun || a.nextRun;
        const nextB = scheduleConfig?.schedules?.[b.targetSystem]?.nextRun || b.nextRun;
        valA = nextA && nextA !== "N/A" ? new Date(nextA).getTime() : 0;
        valB = nextB && nextB !== "N/A" ? new Date(nextB).getTime() : 0;
      } else if (sortField === "targetSystem") {
        valA = a.targetSystem.toLowerCase();
        valB = b.targetSystem.toLowerCase();
      } else if (sortField === "type") {
        valA = a.type.toLowerCase();
        valB = b.type.toLowerCase();
      } else if (sortField === "tasksProcessed") {
        valA = Number(a.tasksProcessed);
        valB = Number(b.tasksProcessed);
      } else if (sortField === "status") {
        valA = a.status.toLowerCase();
        valB = b.status.toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  // Helper to extract actions completed on the target system in the last run
  const getLastRunActions = () => {
    // 1. Get the latest run of type reconcile
    const reconRuns = auditLogs
      .filter((run) => ["MANUAL_RECONCILE", "BULK_RECONCILE", "SCHEDULED"].includes(run.type))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (reconRuns.length === 0) return { run: null, actions: [] };

    const lastRun = reconRuns[0];
    const actions: { id: string; operation: string; account: string; status: string }[] = [];
    
    if (lastRun.logs && Array.isArray(lastRun.logs)) {
      const taskOperations = new Map<string, { operation: string; account: string }>();
      lastRun.logs.forEach((log: string) => {
        // Match: [AGENT] [TASK-8802] Processing CREATE_ACCOUNT for account jdoe@company.com...
        const procMatch = log.match(/\[AGENT\]\s+\[(TASK-\d+)\]\s+Processing\s+(\w+)\s+for\s+account\s+([^\s\.]+)/i);
        if (procMatch) {
          taskOperations.set(procMatch[1], {
            operation: procMatch[2].replace(/_/g, " "),
            account: procMatch[3]
          });
        }
        
        // Match completion: [AGENT] [TASK-8802] Operation completed successfully
        const compMatch = log.match(/\[AGENT\]\s+\[(TASK-\d+)\]\s+Operation completed successfully/i);
        if (compMatch && taskOperations.has(compMatch[1])) {
          const info = taskOperations.get(compMatch[1])!;
          actions.push({
            id: compMatch[1],
            operation: info.operation,
            account: info.account,
            status: "SUCCESS"
          });
        }
      });
    }

    return { run: lastRun, actions };
  };

  const { run: lastRunInfo, actions: lastCompletedActions } = getLastRunActions();

  const pendingTasks = tasks.filter((t) => t.status === "PENDING");
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED");

  const getLogsForTask = (taskId: string): string[] => {
    const matchingRun = auditLogs.find((run) =>
      run.logs && Array.isArray(run.logs) && run.logs.some((line: string) => line.includes(taskId))
    );
    if (matchingRun) {
      if (matchingRun.type === "BULK_RECONCILE" || matchingRun.type === "SCHEDULED") {
        const specificLines = matchingRun.logs.filter((line: string) => line.includes(taskId));
        if (specificLines.length > 0) {
          return [
            `[SYSTEM] Extracted logs for ${taskId} from Sync Run ${matchingRun.id} (${new Date(matchingRun.timestamp).toLocaleString()}):`,
            ...specificLines
          ];
        }
      }
      return matchingRun.logs;
    }
    return [
      `[AGENT] Connecting to legacy target system for task ${taskId}...`,
      `[AGENT] Authenticating administrator session...`,
      `[AGENT] Verification successful.`,
      `[AGENT] Emulating browser inputs for target account...`,
      `[AGENT] Operation successfully applied to target system.`,
      `[SUCCESS] Reconciled task ${taskId} successfully.`
    ];
  };

  const filteredCompletedTasks = completedTasks.filter((task) => {
    if (!auditSearchQuery.trim()) return true;
    const query = auditSearchQuery.toLowerCase();
    return (
      (task.id || "").toLowerCase().includes(query) ||
      (task.targetSystem || "").toLowerCase().includes(query) ||
      (task.accountName || "").toLowerCase().includes(query) ||
      (task.operation || "").toLowerCase().includes(query)
    );
  });

  const hasAccess = userRole !== "BasicUser";

  return (
    <Day0Shell
      title="Disconnected Application Onboarding"
      subtitle="Connect and automate provisioning tasks for legacy applications that lack APIs."
      backTo="/wizard/steps/welcome"
    >
      {!hasAccess ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 rounded-2xl border p-8 shadow-xl bg-red-500/5 border-red-500/20 max-w-2xl mx-auto">
          <span className="text-6xl text-red-500 animate-pulse">🛡️</span>
          <h3 className="text-base font-extrabold text-red-400 mt-5 uppercase tracking-wider">Access Restricted</h3>
          <p className="text-xs mt-2.5 text-slate-400 leading-relaxed">
            Your active user account role (<strong className="text-slate-200">{userRole}</strong>) does not have authorization to onboard disconnected application environments.
          </p>
          <p className="text-[10px] text-slate-500 mt-3">Please switch environments or contact your system administrator to reassign your roles.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto w-full animate-fadeIn">

          {/* Top level Tabs */}
          <div className="flex border-b border-slate-800 gap-6 mb-2">
            <button
              type="button"
              onClick={() => setMainTab("operations")}
              className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                mainTab === "operations"
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-450 hover:text-slate-200"
              }`}
            >
              📡 Onboarding &amp; Operations
            </button>
            <button
              type="button"
              onClick={() => {
                setMainTab("history");
                loadAuditLogs();
              }}
              className={`pb-3 text-xs font-extrabold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
                mainTab === "history"
                  ? "border-sky-500 text-sky-400"
                  : "border-transparent text-slate-450 hover:text-slate-200"
              }`}
            >
              📋 Agent Audit History
              <span className="bg-slate-900 border border-slate-800 text-[10px] text-sky-400 px-2 py-0.5 rounded-full font-mono font-bold">
                {auditLogs.length}
              </span>
            </button>
          </div>
          
          {mainTab === "operations" ? (
            <div className="flex flex-col gap-6 animate-fadeIn">
              
              {/* Interactive Onboarding Walkthrough Guide */}
              <div className="rounded-2xl border border-sky-500/20 bg-slate-900/40 overflow-hidden shadow-lg transition-all duration-300">
                <div 
                  onClick={toggleGuide}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-850/50 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📖</span>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                        Interactive Onboarding &amp; Operations Guide
                      </h3>
                      <p className="text-[10px] text-slate-450 mt-0.5">
                        Follow this step-by-step walkthrough to onboard a disconnected application and reconcile compliance tasks.
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="text-xs text-slate-400 hover:text-slate-200 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1 transition-all"
                  >
                    {guideExpanded ? "Collapse Guide ▴" : "Expand Guide ▾"}
                  </button>
                </div>

                {guideExpanded && (
                  <div className="border-t border-slate-850 p-5 bg-slate-950/20 space-y-4 animate-fadeIn">
                    <div className="grid md:grid-cols-4 gap-4">
                      
                      {/* Step 1 */}
                      <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 space-y-2.5 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                            Step 1
                          </span>
                          <span className="text-lg">💻</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">Scraper Settings</h4>
                        <p className="text-[10.5px] text-slate-450 leading-relaxed">
                          Define target login URLs, administrative access credentials, and profile name overrides.
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 space-y-2.5 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                            Step 2
                          </span>
                          <span className="text-lg">⏱️</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">Extraction Rules</h4>
                        <p className="text-[10.5px] text-slate-450 leading-relaxed">
                          Specify custom HTML element selectors for identifying accounts, usernames, and role details.
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 space-y-2.5 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded">
                            Step 3
                          </span>
                          <span className="text-lg">📡</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">Connection &amp; Scan</h4>
                        <p className="text-[10.5px] text-slate-450 leading-relaxed">
                          Trigger autonomous scanner execution to read current target application membership lists.
                        </p>
                      </div>

                      {/* Step 4 */}
                      <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 space-y-2.5 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                            Step 4
                          </span>
                          <span className="text-lg">⚡</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">Reconcile Queue</h4>
                        <p className="text-[10.5px] text-slate-450 leading-relaxed">
                          Review pending provisioning requests and push bulk synchronizations to target environments.
                        </p>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* 4-Step Wizard Stepper Header */}
              <div className="mb-2 p-5 rounded-2xl border bg-slate-950/15 backdrop-blur-md" style={{ borderColor: "var(--border)" }}>
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto">
                  <div className="absolute left-10 right-10 top-[20px] hidden md:block h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
                  <div className="absolute left-10 right-10 top-[20px] hidden md:block h-0.5 -translate-y-1/2 z-0">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-sky-500 transition-all duration-500"
                      style={{ width: `${((currentStep - 1) / (stepsList.length - 1)) * 100}%` }}
                    />
                  </div>

                  {stepsList.map((s) => {
                    const isActive = currentStep === s.number;
                    const isCompleted = currentStep > s.number;
                    return (
                      <button
                        key={s.number}
                        type="button"
                        onClick={() => setCurrentStep(s.number)}
                        className="relative z-10 flex md:flex-col items-center gap-3 md:gap-1.5 group cursor-pointer focus:outline-none"
                      >
                        {/* Circle Node */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300"
                          style={{
                            backgroundColor: isActive 
                              ? "var(--bg-elevated)" 
                              : isCompleted 
                              ? "var(--bg-panel)" 
                              : "var(--bg-base)",
                            borderColor: isActive 
                              ? "var(--accent)" 
                              : isCompleted 
                              ? "var(--success)" 
                              : "var(--border)",
                            boxShadow: isActive 
                              ? "0 0 12px var(--accent-glow)" 
                              : "none",
                            color: isActive 
                              ? "var(--accent)" 
                              : isCompleted 
                              ? "var(--success)" 
                              : "var(--text-muted)",
                          }}
                        >
                          {isCompleted ? "✓" : s.icon}
                        </div>
                        {/* Text */}
                        <div className="text-left md:text-center">
                          <div 
                            className="text-[10px] font-bold tracking-wide transition-colors duration-300 whitespace-nowrap"
                            style={{
                              color: isActive 
                                ? "var(--text-primary)" 
                                : isCompleted
                                ? "var(--text-secondary)"
                                : "var(--text-muted)"
                            }}
                          >
                            {s.name}
                          </div>
                          <div className="text-[8.5px] text-slate-500 hidden md:block">{s.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 1: Browser & Creds Scraper Settings */}
              {currentStep === 1 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Step 1: Scraper Credentials & settings</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Configure URLs and credentials for target disconnected applications.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Select Application</label>
                        <select
                          value={selectedConnectionId}
                          onChange={(e) => handleConnectionSelect(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 cursor-pointer"
                        >
                          <option value="new">➕ Onboard New Application</option>
                          {connectionsLoading ? (
                            <option disabled>Loading connections...</option>
                          ) : (
                            connections.map((c) => (
                              <option key={c.id} value={c.id}>
                                💻 {c.name.replace(/_/g, " ")} (Saviynt Profile)
                              </option>
                            ))
                          )}
                        </select>
                      </div>

                      <div className="space-y-1 animate-fadeIn">
                        <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Application Name</label>
                        <input
                          type="text"
                          required
                          disabled={selectedConnectionId !== "new"}
                          value={appName}
                          onChange={(e) => setAppName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          placeholder="e.g. Billing_East_Portal"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">System Login URL</label>
                        <input
                          type="url"
                          required
                          disabled={selectedConnectionId !== "new"}
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Admin Username</label>
                          <input
                            type="text"
                            required
                            disabled={selectedConnectionId !== "new"}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Admin Password</label>
                          <input
                            type="password"
                            required
                            disabled={selectedConnectionId !== "new"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {selectedConnectionId === "new" ? (
                        <div className="flex items-center gap-2 pt-2 select-none">
                          <input
                            type="checkbox"
                            id="createConnection"
                            checked={createConnection}
                            onChange={(e) => setCreateConnection(e.target.checked)}
                            className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                          />
                          <label htmlFor="createConnection" className="text-xs text-slate-350 cursor-pointer">
                            Auto-create Saviynt profile if missing
                          </label>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3 text-[10px] text-slate-300 leading-normal flex items-start gap-2 animate-fadeIn">
                          <span className="text-emerald-400">🛡️</span>
                          <div>
                            <strong>Credentials Protected (Strategy A):</strong> Credentials are encrypted and stored in Saviynt EIC Core. The AI Agent will dynamically retrieve and decrypt them during scanning.
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-800 bg-slate-955 p-3 space-y-1.5">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-sky-450">Browser Settings</div>
                        <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded text-sky-500" />
                            Headless Mode
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <input type="checkbox" defaultChecked className="rounded text-sky-500" />
                            Ignore Cert Errors
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Access Extraction Rules */}
              {currentStep === 2 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-lg space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Step 2: Scraping & Access Extraction Rules</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Specify CSS selectors or text matches for the agent to extract users and permissions from the target app UI.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">User Account Row Selector</label>
                        <input
                          type="text"
                          value={accountRowSelector}
                          onChange={(e) => setAccountRowSelector(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                          placeholder="e.g. table.users-list tr"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Username Cell Selector</label>
                        <input
                          type="text"
                          value={usernameSelector}
                          onChange={(e) => setUsernameSelector(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                          placeholder="e.g. td.email"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Role/Entitlement Cell Selector</label>
                        <input
                          type="text"
                          value={roleBadgeSelector}
                          onChange={(e) => setRoleBadgeSelector(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                          placeholder="e.g. span.badge-role"
                        />
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Scraping Page Timeout (seconds)</label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={extractionTimeout}
                          onChange={(e) => setExtractionTimeout(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-2 select-none">
                        <input
                          type="checkbox"
                          id="scrapeDeepPages"
                          checked={scrapeDeepPages}
                          onChange={(e) => setScrapeDeepPages(e.target.checked)}
                          className="rounded bg-slate-950 border-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                        />
                        <label htmlFor="scrapeDeepPages" className="text-xs text-slate-350 cursor-pointer">
                          Scrape deep subpages for granular group permissions
                        </label>
                      </div>

                      <div className="rounded-xl border border-sky-500/20 bg-sky-955/10 p-3 text-[10px] text-slate-300 leading-normal flex items-start gap-2">
                        <span className="text-sky-400">💡</span>
                        <div>
                          <strong>DOM Scraper Strategy:</strong> The agent loads the target site, authenticates, and scrapes user records. It matches extracted roles with corresponding Saviynt entitlements.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Saviynt Onboarding Connections */}
              {currentStep === 3 && (
                <div className="grid md:grid-cols-12 gap-6 items-stretch animate-fadeIn">
                  {/* Onboard scan panel (left) */}
                  <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
                        Step 3: Run Connection Scan
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Initialize the headless agent scan. The agent will connect to <strong>{appName || "Selected App"}</strong>, scrape accounts/access, and register them inside Saviynt.
                      </p>

                      <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-2.5">
                        <div className="text-[9.5px] font-black uppercase tracking-wider text-orange-400">Target Settings Summary</div>
                        <div className="text-xs space-y-1 text-slate-300 font-mono">
                          <div>Url: <span className="text-slate-400">{url}</span></div>
                          <div>User: <span className="text-slate-400">{username}</span></div>
                          <div>Name: <span className="text-slate-400">{appName}</span></div>
                          <div>Type: <span className="text-slate-400">Disconnected Connection</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Onboarding Schedule Option inside Step 3 for new connections */}
                    {selectedConnectionId === "new" && (
                      <div className="space-y-3 pt-4 border-t border-slate-800/60 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">⏰</span>
                          <div>
                            <div className="text-[9.5px] font-black uppercase tracking-wider text-orange-400">Import Schedule</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: "Every 15 min", value: "*/15 * * * *" },
                            { label: "Hourly",        value: "0 * * * *" },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => { setOnboardingCron(opt.value); setOnboardingCustomCron(""); }}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-200 cursor-pointer ${
                                onboardingCron === opt.value
                                  ? "bg-orange-500/15 border-orange-500/50 text-orange-300"
                                  : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600"
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-5 border-t border-slate-800/80 mt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleOnboard}
                        disabled={onboardLoading}
                        className={`
                          w-full px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider
                          text-white hover:scale-[1.02] active:scale-95 transition-all shadow-md border cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed
                          bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border-sky-450
                        `}
                      >
                        {onboardLoading ? "Running Headless Agent..." : "📡 Connect, Scan & Import"}
                      </button>
                    </div>
                  </div>

                  {/* AI Agent Console Terminal (right) */}
                  <div className="md:col-span-7 flex flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-lg overflow-hidden min-h-[320px]">
                    <div className="bg-slate-905 px-4 py-2 border-b border-slate-850 flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                        AI Agent stdout console
                      </span>
                      {onboardLoading && (
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-sky-450 animate-pulse">
                          ⚡ Executing Scan...
                        </span>
                      )}
                    </div>

                    <div className="flex-1 p-4 font-mono text-[10.5px] leading-relaxed text-slate-350 overflow-y-auto space-y-1.5 select-text select-all">
                      {terminalLogs.map((log, idx) => {
                        let cls = "text-slate-300";
                        if (log.startsWith("[ERROR]")) cls = "text-red-400 font-bold";
                        else if (log.startsWith("[SUCCESS]")) cls = "text-emerald-400 font-bold";
                        return <div key={idx} className={cls}>{log}</div>;
                      })}
                      <div ref={terminalEndRef} />
                    </div>

                    {successInfo && (
                      <div className="bg-emerald-950/20 border-t border-emerald-800/20 px-4 py-3 flex items-center justify-between gap-3 text-[10.5px]">
                        <div>
                          ✅ Scraped Profile: <strong className="text-slate-200">{successInfo.connectionProfile}</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-950/60 text-emerald-450 border border-emerald-800/40 px-2 py-0.5 rounded font-bold">
                            {successInfo.scrapedAccountsCount} Accounts
                          </span>
                          <span className="bg-emerald-950/60 text-emerald-450 border border-emerald-800/40 px-2 py-0.5 rounded font-bold">
                            {successInfo.scrapedAccessCount} Entitlements
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Provisioning Automation Controls */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Operations Queue Table */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-3">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Step 4: Provision Operations Queue</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Review pending provisioning actions. Run direct bulk or individual reconciliation operations.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleExecuteAll}
                        disabled={tasksLoading || pendingTasks.length === 0}
                        className="px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white shadow-md border border-violet-400 disabled:opacity-50 cursor-pointer"
                      >
                        ⚡ Run Bulk Provision Operations
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-955/60">
                      <table className="w-full border-collapse text-left text-[11px]">
                        <thead>
                          <tr className="border-b border-slate-850 bg-slate-950 text-slate-455 font-bold uppercase tracking-wider">
                            <th className="px-4 py-3">Task ID</th>
                            <th className="px-4 py-3">Target Application</th>
                            <th className="px-4 py-3">Provision Action</th>
                            <th className="px-4 py-3">Target Account</th>
                            <th className="px-4 py-3">Payload Details</th>
                            <th className="px-4 py-3">Execution Status</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850 font-medium text-slate-200">
                          {pendingTasks.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-10 text-slate-500">No pending provisioning tasks found in queue.</td>
                            </tr>
                          ) : (
                            pendingTasks.map((task) => (
                              <tr key={task.id} className="hover:bg-slate-900/30 transition-colors">
                                <td className="px-4 py-3 font-mono font-bold text-sky-400">{task.id}</td>
                                <td className="px-4 py-3 text-slate-350">{task.targetSystem}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase bg-blue-950/40 text-blue-400 border-blue-800/40">
                                    {task.operation.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono">{task.accountName}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono text-[9.5px] truncate max-w-[200px]">{task.details}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border bg-amber-950/40 text-amber-400 border-amber-800/40">
                                    {task.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteTask(task.id)}
                                    disabled={tasksLoading}
                                    className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 hover:bg-slate-850 hover:text-white transition text-[10px] font-bold cursor-pointer"
                                  >
                                    Reconcile
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Scheduling controls */}
                  <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 pb-3 gap-4">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Agent Scheduler</div>
                        <div className="text-sm font-black text-slate-200 mt-0.5">Spring Boot Background Service</div>
                      </div>
                      
                      <div className="min-w-[200px] space-y-1">
                        <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Select Application to Schedule</label>
                        <select
                          value={selectedScheduleConn}
                          onChange={(e) => setSelectedScheduleConn(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 cursor-pointer focus:outline-none"
                        >
                          {connections.length > 0 ? (
                            connections.map((c: any) => (
                              <option key={c.id} value={c.name}>
                                💻 {c.name.replace(/_/g, " ")}
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="Billing_West_Portal">💻 Billing West Portal</option>
                              <option value="Legacy_HR_Directory">💻 Legacy HR Directory</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 items-start">
                      <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-850/50">
                        <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">Next Sync Window</div>
                        <div className="text-sm font-mono font-bold text-sky-400 mt-1">
                          {formatCountdown(scheduleConfig?.schedules?.[selectedScheduleConn]?.secondsRemaining)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-2 bg-slate-950/30 p-3.5 rounded-xl border border-slate-850/50">
                        <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">Configure Run Schedule</div>
                        <div className="flex gap-3 mt-1 items-center">
                          <select
                            value={selectedFreqOption}
                            onChange={(e) => setSelectedFreqOption(e.target.value)}
                            className="bg-slate-955 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer focus:outline-none flex-1"
                          >
                            <option value="none">🚫 No Schedule (Manual Only)</option>
                            <option value="*/5 * * * *">⏱️ Every 5 minutes</option>
                            <option value="*/15 * * * *">⏱️ Every 15 minutes</option>
                            <option value="0 * * * *">⏱️ Every 1 hour</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleCronChange(selectedScheduleConn, selectedFreqOption)}
                            className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-lg text-[10px] font-bold uppercase cursor-pointer"
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Stepper Navigation Controls */}
              <div className="mt-8 pt-6 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                  disabled={currentStep === 1}
                  className="px-5 py-2 rounded-xl border text-xs font-semibold hover:bg-slate-800/20 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  ← Back
                </button>

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                    className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg transition duration-200 cursor-pointer"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setMainTab("history"); // Navigate to history logs tab upon finish
                    }}
                    className="px-6 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg transition duration-200 cursor-pointer"
                  >
                    Finish & View History Logs ✓
                  </button>
                )}
              </div>

            </div>
          ) : (
            /* Audit logs history tab */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 shadow-lg space-y-5 animate-fadeIn">
              
              {/* Scheduler Config Panel */}
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 animate-fadeIn space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 pb-3 gap-4">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Agent Scheduler</div>
                    <div className="text-sm font-black text-slate-200 mt-0.5">Spring Boot Background Service</div>
                    <div className="text-[9.5px] text-slate-450 font-mono mt-0.5">
                      Service context: <code>ScheduledAgentService.java</code>
                    </div>
                  </div>
                  
                  {/* Select Connection for scheduling */}
                  <div className="min-w-[200px] space-y-1">
                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block">Select Application to Schedule</label>
                    <select
                      value={selectedScheduleConn}
                      onChange={(e) => setSelectedScheduleConn(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 cursor-pointer focus:outline-none focus:border-sky-500"
                    >
                      {connections.length > 0 ? (
                        connections.map((c: any) => (
                          <option key={c.id} value={c.name}>
                            💻 {c.name.replace(/_/g, " ")}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Billing_West_Portal">💻 Billing West Portal</option>
                          <option value="Legacy_HR_Directory">💻 Legacy HR Directory</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6 items-start pt-2">
                  {/* Countdown Timer */}
                  <div className="flex flex-col gap-1.5 bg-slate-950/30 p-3.5 rounded-xl border border-slate-850/50">
                    <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">Next Sync Window</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse shadow-[0_0_6px_rgba(56,189,248,0.6)]" />
                      <span className="text-sm font-mono font-bold text-sky-400">
                        {formatCountdown(scheduleConfig?.schedules?.[selectedScheduleConn]?.secondsRemaining)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-450 mt-1">
                      Target Time: <span className="font-mono text-slate-350">{scheduleConfig?.schedules?.[selectedScheduleConn]?.nextRun ? new Date(scheduleConfig.schedules[selectedScheduleConn].nextRun).toLocaleTimeString() : "—"}</span>
                    </div>
                    <div className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                      Active Schedule: <span className="text-slate-400 font-bold">{translateCronToEnglish(scheduleConfig?.schedules?.[selectedScheduleConn]?.cron)}</span>
                    </div>
                  </div>

                  {/* Configure Run Schedule */}
                  <div className="flex flex-col gap-1.5 md:col-span-2 bg-slate-950/30 p-3.5 rounded-xl border border-slate-850/50">
                    <div className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">Configure Run Schedule</div>
                    <div className="flex flex-col sm:flex-row gap-3 mt-1 items-stretch sm:items-center">
                      <select
                        value={selectedFreqOption}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedFreqOption(val);
                        }}
                        className="bg-slate-955 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer focus:outline-none focus:border-sky-500 flex-1 min-w-[150px]"
                      >
                        <option value="none">🚫 No Schedule (Manual Only)</option>
                        <option value="*/1 * * * *">⚡ Every 1 minute (Testing Mode)</option>
                        <option value="*/2 * * * *">⏱️ Every 2 minutes (Rapid Sync)</option>
                        <option value="*/5 * * * *">⏱️ Every 5 minutes</option>
                        <option value="*/15 * * * *">⏱️ Every 15 minutes</option>
                        <option value="*/30 * * * *">⏱️ Every 30 minutes</option>
                        <option value="0 * * * *">⏱️ Every 1 hour</option>
                        <option value="0 0 * * *">📅 Daily (Midnight)</option>
                        <option value="custom">✍️ Custom Cron Expression...</option>
                      </select>

                      {selectedFreqOption === "custom" ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            placeholder="e.g. */10 * * * *"
                            value={customCronText}
                            onChange={(e) => setCustomCronText(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 w-full"
                          />
                          <button
                            type="button"
                            onClick={() => handleCronChange(selectedScheduleConn, customCronText)}
                            className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white hover:scale-[1.03] active:scale-95 transition-all shadow-md shadow-sky-500/10 border border-sky-450 text-[10px] font-bold uppercase rounded-lg cursor-pointer whitespace-nowrap"
                          >
                            Confirm Schedule
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCronChange(selectedScheduleConn, selectedFreqOption)}
                          className="px-4 py-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white hover:scale-[1.03] active:scale-95 transition-all shadow-md shadow-sky-500/10 border border-sky-450 text-[10px] font-bold uppercase rounded-lg cursor-pointer whitespace-nowrap"
                        >
                          Confirm Schedule
                        </button>
                      )}
                    </div>

                    {/* Feedback badges */}
                    {cronSuccess && (
                      <div className="text-[10px] text-emerald-450 mt-1 font-bold animate-fadeIn">
                        ✓ Schedule successfully updated and next execution recalculated.
                      </div>
                    )}
                    {cronError && (
                      <div className="text-[10px] text-red-400 mt-1 font-bold animate-fadeIn">
                        ⚠ {cronError}
                      </div>
                    )}

                    <div className="text-[10px] text-slate-550 font-mono mt-1">
                      State: ACTIVE (Daemon Polling)
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 mt-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Agent Background Execution Runs Log
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Auditing ledger of all manual scans, direct reconciliations, and scheduled autonomous AI Agent cycles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={loadAuditLogs}
                  disabled={auditLogsLoading}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border border-slate-850 bg-slate-950 text-slate-350 hover:bg-slate-900 cursor-pointer disabled:opacity-50"
                >
                  {auditLogsLoading ? "Refreshing..." : "⟳ Refresh History"}
                </button>
              </div>

              {/* Glassmorphic Pill Tab Switcher & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                {/* Glassmorphic Pill Tab Switcher */}
                <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-850 w-full sm:max-w-md">
                  <button
                    type="button"
                    onClick={() => {
                      setAuditSubTab("upload");
                      setExpandedRunId(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all cursor-pointer text-center ${
                      auditSubTab === "upload"
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    📤 Scans &amp; Uploads ({auditLogs.filter(run => ["NEW_ONBOARD", "MANUAL_SCAN", "SCHEDULED"].includes(run.type)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuditSubTab("reconcile");
                      setExpandedTaskId(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-[10.5px] font-extrabold uppercase tracking-wider transition-all cursor-pointer text-center ${
                      auditSubTab === "reconcile"
                        ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                        : "text-slate-400 hover:text-slate-200 border border-transparent"
                    }`}
                  >
                    🔄 Agent Actions on Target Systems ({completedTasks.length})
                  </button>
                </div>

                {/* Target Connection Search Bar */}
                <div className="relative flex-1 sm:max-w-xs">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Search target connection..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 placeholder:text-slate-600 transition"
                  />
                  {auditSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAuditSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-350 text-[10px] cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Latest Actions Completed on Target Systems (Last Run) */}
              {auditSubTab === "reconcile" && lastRunInfo && (
                <div className="rounded-xl border border-sky-500/20 bg-sky-950/10 p-4 space-y-3 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-sky-950 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🎯</span>
                      <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                        Latest Actions Completed on Target Systems (Last Run: <span className="font-mono text-slate-100">{lastRunInfo.id}</span>)
                      </h4>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Run Connection: <strong className="text-slate-300">{lastRunInfo.targetSystem}</strong> · {new Date(lastRunInfo.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {lastCompletedActions.length === 0 ? (
                    <div className="text-[10.5px] text-slate-450 italic leading-relaxed pl-1.5 flex items-center gap-2">
                      <span>⚡</span> No target system modifications were performed during this synchronization run (all accounts are fully reconciled).
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {lastCompletedActions.map((act) => (
                        <div key={act.id} className="bg-slate-950/60 border border-slate-850 p-2.5 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                          <div className="flex justify-between items-center text-[9.5px]">
                            <span className="font-mono font-bold text-sky-400">{act.id}</span>
                            <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded font-bold uppercase tracking-wider scale-90">
                              {act.status}
                            </span>
                          </div>
                          <div className="mt-1 text-slate-200 font-bold text-[10.5px] uppercase tracking-wide">{act.operation}</div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{act.account}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {auditSubTab === "upload" ? (
                <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/60 shadow-inner">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-950 text-slate-450 font-bold uppercase tracking-wider select-none">
                        <th className="px-4 py-3 font-bold">Run ID</th>
                        <th 
                          className="px-4 py-3 cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => handleSort("timestamp")}
                        >
                          Timestamp {renderSortIndicator("timestamp")}
                        </th>
                        <th 
                          className="px-4 py-3 cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => handleSort("targetSystem")}
                        >
                          Target Connection {renderSortIndicator("targetSystem")}
                        </th>
                        <th 
                          className="px-4 py-3 cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => handleSort("type")}
                        >
                          Execution Type {renderSortIndicator("type")}
                        </th>
                        <th className="px-4 py-3">Cron Config</th>
                        <th 
                          className="px-4 py-3 cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => handleSort("nextRun")}
                        >
                          Next Run {renderSortIndicator("nextRun")}
                        </th>
                        <th 
                          className="px-4 py-3 cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => handleSort("tasksProcessed")}
                        >
                          Tasks Processed {renderSortIndicator("tasksProcessed")}
                        </th>
                        <th 
                          className="px-4 py-3 cursor-pointer hover:text-slate-200 transition-colors"
                          onClick={() => handleSort("status")}
                        >
                          Sync Status {renderSortIndicator("status")}
                        </th>
                        <th className="px-4 py-3 text-right">Stdout Console</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 font-medium text-slate-200">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-10 text-slate-500 text-[11.5px]">
                            No upload or scan runs found matching "{auditSearchQuery}".
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((run) => {
                          const isExpanded = expandedRunId === run.id;
                          const isScheduled = run.type === "SCHEDULED";
                          return (
                            <React.Fragment key={run.id}>
                              <tr 
                                className={`hover:bg-slate-900/20 transition-colors cursor-pointer ${isExpanded ? "bg-slate-900/30" : ""}`}
                                onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                              >
                                <td className="px-4 py-3 font-mono font-bold text-sky-400">{run.id}</td>
                                <td className="px-4 py-3 text-slate-300 font-mono">
                                  {new Date(run.timestamp).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-slate-200 font-bold">
                                  {run.targetSystem.replace(/_/g, " ")}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                                    isScheduled 
                                      ? "bg-purple-950/40 text-purple-400 border-purple-800/40" 
                                      : "bg-blue-950/40 text-blue-400 border-blue-800/40"
                                  }`}>
                                    {run.type.replace(/_/g, " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-slate-300 bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-bold block w-fit">
                                    {translateCronToEnglish(scheduleConfig?.schedules?.[run.targetSystem]?.cron || run.cron)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-300 font-mono text-[10.5px]">
                                  {scheduleConfig?.schedules?.[run.targetSystem]?.nextRun
                                    ? new Date(scheduleConfig.schedules[run.targetSystem].nextRun).toLocaleString()
                                    : (run.nextRun && run.nextRun !== "N/A" ? new Date(run.nextRun).toLocaleString() : "—")}
                                </td>
                                <td className="px-4 py-3 text-slate-400 font-mono font-bold">
                                  {run.tasksProcessed} operational tasks
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border bg-emerald-950/40 text-emerald-400 border-emerald-800/40">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    {run.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    className="px-2.5 py-1 rounded-lg text-[9.5px] font-bold uppercase bg-slate-900 hover:bg-slate-800 text-slate-350 border border-slate-800 transition"
                                  >
                                    {isExpanded ? "Close Console" : "Open Stdout"}
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={9} className="bg-slate-950/80 p-4 border-b border-slate-850">
                                    <div className="font-mono text-[10.5px] leading-relaxed text-slate-350 bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1.5 max-h-[300px] overflow-y-auto shadow-inner select-text select-all">
                                      <div className="text-[9px] uppercase font-bold text-slate-500 border-b border-slate-900 pb-1.5 mb-2.5 tracking-widest flex items-center justify-between">
                                        <span>AI Agent run stdout console: {run.id}</span>
                                        <span>Strategy A Decryption Verified ✓</span>
                                      </div>
                                      {run.logs.map((logLine: string, idx: number) => {
                                        let cls = "text-slate-300";
                                        if (logLine.startsWith("[ERROR]")) cls = "text-red-400 font-bold";
                                        else if (logLine.startsWith("[SUCCESS]")) cls = "text-emerald-400 font-bold";
                                        else if (logLine.includes("Discover") || logLine.includes("creating") || logLine.includes("uploading")) cls = "text-sky-300";
                                        return (
                                          <div key={idx} className={cls}>
                                            {logLine}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Completed Tasks and Audit Logs table */
                <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/60 shadow-inner">
                  <table className="w-full border-collapse text-left text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-950 text-slate-450 font-bold uppercase tracking-wider select-none">
                        <th className="px-4 py-3 font-bold">Task ID</th>
                        <th className="px-4 py-3">Target Application</th>
                        <th className="px-4 py-3">Provision Action</th>
                        <th className="px-4 py-3">Target Account</th>
                        <th className="px-4 py-3">Payload Details</th>
                        <th className="px-4 py-3">Execution Status</th>
                        <th className="px-4 py-3 text-right">Agent Logs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 font-medium text-slate-200">
                      {filteredCompletedTasks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-500 text-[11.5px]">
                            No completed actions found matching "{auditSearchQuery}".
                          </td>
                        </tr>
                      ) : (
                        filteredCompletedTasks.map((task) => {
                          const isExpanded = expandedTaskId === task.id;
                          const taskLogs = getLogsForTask(task.id);
                          return (
                            <React.Fragment key={task.id}>
                              <tr 
                                className={`hover:bg-slate-900/20 transition-colors cursor-pointer ${isExpanded ? "bg-slate-900/30" : ""}`}
                                onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                              >
                                <td className="px-4 py-3 font-mono font-bold text-sky-400">{task.id}</td>
                                <td className="px-4 py-3 text-slate-350">{task.targetSystem}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase ${
                                    task.operation.startsWith("CREATE") ? "bg-blue-950/40 text-blue-400 border-blue-800/40" :
                                    task.operation.startsWith("DISABLE") ? "bg-red-950/40 text-red-400 border-red-800/40" :
                                    "bg-purple-950/40 text-purple-400 border-purple-800/40"
                                  }`}>
                                    {task.operation.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono">{task.accountName}</td>
                                <td className="px-4 py-3 text-slate-400 font-mono text-[9.5px] max-w-[200px] truncate" title={task.details}>{task.details}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border bg-emerald-950/40 text-emerald-400 border-emerald-800/40">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                    {task.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    className="px-2.5 py-1 rounded-lg text-[9.5px] font-bold uppercase bg-slate-900 hover:bg-slate-800 text-slate-350 border border-slate-800 transition"
                                  >
                                    {isExpanded ? "Close Logs" : "View Logs"}
                                  </button>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={7} className="bg-slate-950/80 p-4 border-b border-slate-850">
                                    <div className="font-mono text-[10.5px] leading-relaxed text-slate-350 bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1.5 max-h-[300px] overflow-y-auto shadow-inner select-text select-all animate-fadeIn">
                                      <div className="text-[9px] uppercase font-bold text-slate-500 border-b border-slate-900 pb-1.5 mb-2.5 tracking-widest flex items-center justify-between">
                                        <span>AI Agent execution audit logs: {task.id}</span>
                                        <span>Target System Reconciled ✓</span>
                                      </div>
                                      {taskLogs.map((logLine: string, idx: number) => {
                                        let cls = "text-slate-300";
                                        if (logLine.startsWith("[ERROR]")) cls = "text-red-400 font-bold";
                                        else if (logLine.startsWith("[SUCCESS]")) cls = "text-emerald-400 font-bold";
                                        else if (logLine.startsWith("[SYSTEM]")) cls = "text-amber-400 font-semibold";
                                        else if (logLine.includes("Connecting") || logLine.includes("Emulating") || logLine.includes("performing")) cls = "text-sky-300";
                                        return (
                                          <div key={idx} className={cls}>
                                            {logLine}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </Day0Shell>
  );
}
