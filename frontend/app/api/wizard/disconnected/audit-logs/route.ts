import { NextResponse } from "next/server";
import { readAuditLogs, saveAuditLogs, AuditLogRun } from "@/app/lib/saviynt/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const logs = readAuditLogs();
    // Return newest runs first
    const sorted = [...logs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return NextResponse.json({ logs: sorted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetSystem, status, tasksProcessed, type, logs: runLogs, cron, nextRun } = body;

    const newRun: AuditLogRun = {
      id: `run-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      targetSystem: targetSystem || "Unknown Target",
      status: status || "SUCCESS",
      tasksProcessed: typeof tasksProcessed === "number" ? tasksProcessed : 0,
      type: type || "MANUAL",
      cron: cron || "N/A",
      nextRun: nextRun || "N/A",
      logs: Array.isArray(runLogs) ? runLogs : []
    };

    const currentLogs = readAuditLogs();
    currentLogs.push(newRun);
    saveAuditLogs(currentLogs);

    return NextResponse.json({ success: true, run: newRun });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
