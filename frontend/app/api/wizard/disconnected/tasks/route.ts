import { NextResponse } from "next/server";
import { readTasks, saveTasks, readAuditLogs, saveAuditLogs, DisconnectedTask, AuditLogRun } from "@/app/lib/saviynt/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    const tasks = readTasks();

    if (taskId) {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        return NextResponse.json({ error: `Task ${taskId} not found.` }, { status: 404 });
      }
      return NextResponse.json({
        id: task.id,
        status: task.status,
        targetSystem: task.targetSystem,
        operation: task.operation,
        accountName: task.accountName,
        details: task.details
      });
    }

    return NextResponse.json({ tasks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, action, connectionName, operation, accountName, details } = body;
    const tasks = readTasks();

    // Support implicit action="create" if action is not provided but creation fields are present
    const resolvedAction = action || (operation && accountName ? "create" : null);

    if (resolvedAction === "create") {
      const id = taskId || `TASK-${Math.floor(1000 + Math.random() * 9000)}`;
      
      const targetSystem = connectionName === "Billing_West_Portal" 
        ? "Legacy Billing Portal" 
        : (connectionName === "Legacy_HR_Directory" ? "Legacy HR Database" : (connectionName || body.targetSystem || "Legacy Portal"));

      const existingIndex = tasks.findIndex((t) => t.id === id);
      const newTask: DisconnectedTask = {
        id,
        targetSystem,
        operation: operation || "PROVISION",
        accountName: accountName || "unknown",
        details: details || `Operation: ${operation || "PROVISION"}, Account: ${accountName || "unknown"}`,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIndex > -1) {
        // Update existing task and set back to pending
        tasks[existingIndex] = {
          ...tasks[existingIndex],
          ...newTask,
          createdAt: tasks[existingIndex].createdAt || newTask.createdAt
        };
      } else {
        tasks.push(newTask);
      }

      saveTasks(tasks);
      return NextResponse.json({ success: true, task: tasks.find(t => t.id === id) });
    }

    if (resolvedAction === "reset") {
      const updatedTasks = tasks.map((t) => ({ 
        ...t, 
        status: "PENDING" as const,
        updatedAt: new Date().toISOString()
      }));
      saveTasks(updatedTasks);
      return NextResponse.json({ success: true, tasks: updatedTasks });
    }

    if (resolvedAction === "execute_all") {
      const logs: string[] = [
        `[AGENT] Bulk reconciling pending provisioning tasks from Saviynt...`,
        `[AGENT] Connecting to target legacy system gateways using provided credentials...`
      ];

      const filterSystem = connectionName === "Billing_West_Portal" 
        ? "Legacy Billing Portal" 
        : (connectionName === "Legacy_HR_Directory" ? "Legacy HR Database" : null);

      let processedCount = 0;
      const updatedTasks = tasks.map((task) => {
        const matchesSystem = !filterSystem || task.targetSystem === filterSystem;
        if (task.status === "PENDING" && matchesSystem) {
          logs.push(`[AGENT] [${task.id}] Processing ${task.operation} for account ${task.accountName}...`);
          logs.push(`[AGENT] [${task.id}] Simulating UI elements navigation...`);
          logs.push(`[AGENT] [${task.id}] Operation completed successfully inside target system.`);
          processedCount++;
          return {
            ...task,
            status: "COMPLETED" as const,
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      });

      logs.push(`[AGENT] Confirming execution status of all resolved tasks back to Saviynt analytic registry...`);
      logs.push(`[AGENT] Triggering incremental account and access import sync jobs inside Saviynt...`);
      logs.push(`[AGENT] All tasks successfully completed and imported!`);

      saveTasks(updatedTasks);

      // Save to Audit Logs
      const newRun: AuditLogRun = {
        id: `run-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        targetSystem: connectionName || "Bulk Execution",
        status: "SUCCESS",
        tasksProcessed: processedCount,
        type: "MANUAL",
        cron: "N/A",
        nextRun: "N/A",
        logs
      };

      const auditLogs = readAuditLogs();
      auditLogs.push(newRun);
      saveAuditLogs(auditLogs);

      return NextResponse.json({
        success: true,
        tasks: updatedTasks,
        logs
      });
    }

    if (resolvedAction === "execute") {
      const taskIndex = tasks.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) {
        return NextResponse.json({ error: `Task ${taskId} not found.` }, { status: 404 });
      }

      const task = tasks[taskIndex];
      const logs = [
        `[AGENT] Reconciling task ${taskId} from Saviynt analytic report...`,
        `[AGENT] Connecting to legacy system for account ${task.accountName}...`,
        `[AGENT] Performing operation: ${task.operation} (${task.details})...`,
        `[AGENT] Emulating browser inputs & form submission...`,
        `[AGENT] Operation completed inside target system.`,
        `[AGENT] Confirming task completion to Saviynt APIs...`,
        `[AGENT] Running incremental account and access import sync...`,
        `[AGENT] Synchronization completed.`
      ];

      tasks[taskIndex] = {
        ...task,
        status: "COMPLETED" as const,
        updatedAt: new Date().toISOString()
      };

      saveTasks(tasks);

      // Save to Audit Logs
      const newRun: AuditLogRun = {
        id: `run-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toISOString(),
        targetSystem: connectionName || task.targetSystem,
        status: "SUCCESS",
        tasksProcessed: 1,
        type: "MANUAL",
        cron: "N/A",
        nextRun: "N/A",
        logs
      };

      const auditLogs = readAuditLogs();
      auditLogs.push(newRun);
      saveAuditLogs(auditLogs);

      return NextResponse.json({
        success: true,
        tasks,
        logs
      });
    }

    return NextResponse.json({ error: "Invalid action parameter or missing required fields." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
