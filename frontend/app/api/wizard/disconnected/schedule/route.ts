import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

// Path to the disconnected_schedule_settings.json inside app/lib/saviynt/
const isCloud = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
const settingsFilePath = isCloud
  ? "/tmp/disconnected_schedule_settings.json"
  : path.join(process.cwd(), "app/lib/saviynt/disconnected_schedule_settings.json");

function getScheduleStates(): Record<string, { cron: string; lastRun: string }> {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const data = fs.readFileSync(settingsFilePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read disconnected schedules file:", err);
  }
  return {
    "Billing_West_Portal": {
      cron: "*/5 * * * *", // default 5 minutes
      lastRun: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
    },
    "Legacy_HR_Directory": {
      cron: "*/15 * * * *", // default 15 minutes
      lastRun: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
    }
  };
}

function saveScheduleStates(states: Record<string, { cron: string; lastRun: string }>) {
  try {
    const dir = path.dirname(settingsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsFilePath, JSON.stringify(states, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write disconnected schedules file:", err);
  }
}

/**
 * Ensures schedule states exist for a connection name.
 */
function ensureScheduleState(connectionName: string, states: Record<string, { cron: string; lastRun: string }>) {
  if (!states[connectionName]) {
    states[connectionName] = {
      cron: "*/5 * * * *",
      lastRun: new Date(Date.now() - 120000).toISOString()
    };
    saveScheduleStates(states);
  }
}

/**
 * Calculates the next date matching a standard 5-field cron expression.
 */
export function getNextCronDate(cron: string, fromDate: Date): Date {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Must have exactly 5 fields (minute hour day_of_month month day_of_week).");
  }

  const parseField = (field: string, min: number, max: number): Set<number> => {
    const values = new Set<number>();
    const items = field.split(",");
    for (const item of items) {
      if (item === "*") {
        for (let i = min; i <= max; i++) values.add(i);
      } else if (item.startsWith("*/")) {
        const step = parseInt(item.substring(2), 10);
        if (isNaN(step) || step <= 0) throw new Error(`Invalid step step value: ${item}`);
        for (let i = min; i <= max; i += step) values.add(i);
      } else if (item.includes("-")) {
        const [startStr, endStr] = item.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
          throw new Error(`Invalid range: ${item}`);
        }
        for (let i = start; i <= end; i++) values.add(i);
      } else {
        const val = parseInt(item, 10);
        if (isNaN(val) || val < min || val > max) {
          throw new Error(`Invalid discrete value: ${item}`);
        }
        values.add(val);
      }
    }
    return values;
  };

  const minutes = parseField(parts[0], 0, 59);
  const hours = parseField(parts[1], 0, 23);
  const daysOfMonth = parseField(parts[2], 1, 31);
  const months = parseField(parts[3], 1, 12);
  const daysOfWeek = parseField(parts[4], 0, 7);

  if (daysOfWeek.has(7)) {
    daysOfWeek.add(0);
  }

  const checkDate = new Date(fromDate.getTime());
  checkDate.setSeconds(0);
  checkDate.setMilliseconds(0);
  checkDate.setMinutes(checkDate.getMinutes() + 1);

  const maxIterations = 365 * 24 * 60; // Up to 1 year in minutes
  for (let i = 0; i < maxIterations; i++) {
    const minVal = checkDate.getMinutes();
    const hourVal = checkDate.getHours();
    const domVal = checkDate.getDate();
    const monthVal = checkDate.getMonth() + 1; // JS Month is 0-11
    const dowVal = checkDate.getDay(); // Sunday is 0

    if (
      minutes.has(minVal) &&
      hours.has(hourVal) &&
      daysOfMonth.has(domVal) &&
      months.has(monthVal) &&
      daysOfWeek.has(dowVal)
    ) {
      return checkDate;
    }
    checkDate.setMinutes(checkDate.getMinutes() + 1);
  }

  throw new Error("No matching date found for cron expression in the next year.");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetConnection = searchParams.get("connectionName");

  const now = new Date();
  const states = getScheduleStates();
  
  if (targetConnection) {
    ensureScheduleState(targetConnection, states);
    const state = states[targetConnection];
    try {
      if (state.cron === "none") {
        return NextResponse.json({
          connectionName: targetConnection,
          cron: state.cron,
          lastRun: state.lastRun,
          nextRun: "N/A",
          now: now.toISOString(),
          secondsRemaining: 99999999
        });
      }
      const nextRunDate = getNextCronDate(state.cron, new Date(state.lastRun));
      const secondsRemaining = Math.max(0, Math.floor((nextRunDate.getTime() - now.getTime()) / 1000));
      return NextResponse.json({
        connectionName: targetConnection,
        cron: state.cron,
        lastRun: state.lastRun,
        nextRun: nextRunDate.toISOString(),
        now: now.toISOString(),
        secondsRemaining
      });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
  }

  // Generate overview list
  const schedules: Record<string, any> = {};
  const dueConnections: string[] = [];
  let minSeconds = 99999999;

  for (const name in states) {
    const state = states[name];
    try {
      if (state.cron === "none") {
        schedules[name] = {
          cron: state.cron,
          lastRun: state.lastRun,
          nextRun: "N/A",
          secondsRemaining: 99999999
        };
        continue;
      }
      const nextRunDate = getNextCronDate(state.cron, new Date(state.lastRun));
      const secondsRemaining = Math.max(0, Math.floor((nextRunDate.getTime() - now.getTime()) / 1000));
      
      schedules[name] = {
        cron: state.cron,
        lastRun: state.lastRun,
        nextRun: nextRunDate.toISOString(),
        secondsRemaining
      };

      if (secondsRemaining === 0) {
        dueConnections.push(name);
      }
      if (secondsRemaining < minSeconds) {
        minSeconds = secondsRemaining;
      }
    } catch (e: any) {
      schedules[name] = {
        cron: state.cron,
        lastRun: state.lastRun,
        error: e.message,
        secondsRemaining: 300
      };
    }
  }

  return NextResponse.json({
    schedules,
    dueConnections,
    now: now.toISOString(),
    secondsRemaining: dueConnections.length > 0 ? 0 : (minSeconds === 99999999 ? 300 : minSeconds)
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const connectionName = body.connectionName || "Billing_West_Portal";
    const states = getScheduleStates();
    ensureScheduleState(connectionName, states);

    if (body.action === "complete_run") {
      states[connectionName].lastRun = new Date().toISOString();
      saveScheduleStates(states);
      const state = states[connectionName];
      
      if (state.cron === "none") {
        return NextResponse.json({
          success: true,
          message: `Scheduled execution run for '${connectionName}' marked complete.`,
          connectionName,
          lastRun: state.lastRun,
          nextRun: "N/A"
        });
      }
      const nextRunDate = getNextCronDate(state.cron, new Date(state.lastRun));
      
      return NextResponse.json({
        success: true,
        message: `Scheduled execution run for '${connectionName}' marked complete.`,
        connectionName,
        lastRun: state.lastRun,
        nextRun: nextRunDate.toISOString()
      });
    }

    if (typeof body.cron === "string") {
      const cronStr = body.cron.trim();
      
      // Validate cron expression unless it is "none"
      if (cronStr !== "none") {
        try {
          getNextCronDate(cronStr, new Date());
        } catch (err: any) {
          return NextResponse.json(
            { error: `Invalid cron format: ${err.message}` },
            { status: 400 }
          );
        }
      }

      states[connectionName].cron = cronStr;
      saveScheduleStates(states);
      const state = states[connectionName];
      
      if (state.cron === "none") {
        return NextResponse.json({
          success: true,
          message: `Interval updated for '${connectionName}' to cron: ${cronStr}`,
          connectionName,
          cron: state.cron,
          lastRun: state.lastRun,
          nextRun: "N/A",
          secondsRemaining: 99999999
        });
      }
      const nextRunDate = getNextCronDate(state.cron, new Date(state.lastRun));

      return NextResponse.json({
        success: true,
        message: `Interval updated for '${connectionName}' to cron: ${cronStr}`,
        connectionName,
        cron: state.cron,
        lastRun: state.lastRun,
        nextRun: nextRunDate.toISOString(),
        secondsRemaining: Math.max(0, Math.floor((nextRunDate.getTime() - new Date().getTime()) / 1000))
      });
    }

    return NextResponse.json({ error: "Invalid parameters." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
