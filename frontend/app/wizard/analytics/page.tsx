"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Day0Shell from "../day0/Day0Shell";

// Table schemas based on the Saviynt Identity Cloud Database Schema Guide
type SchemaField = { name: string; type: string; desc: string };
type TableSchemaMap = Record<string, { desc: string; columns: SchemaField[] }>;

const TABLE_SCHEMAS: TableSchemaMap = {
  users: {
    desc: "Stores all the details pertaining to users/identities in the Saviynt Identity Repository.",
    columns: [
      { name: "id", type: "bigint(20)", desc: "Primary key of the users table (USERKEY)." },
      { name: "username", type: "varchar(255)", desc: "Unique login username of the identity." },
      { name: "displayname", type: "varchar(255)", desc: "Full display name of the user." },
      { name: "email", type: "varchar(255)", desc: "Official email address of the employee." },
      { name: "city", type: "varchar(255)", desc: "City location where the identity belongs." },
      { name: "companyname", type: "varchar(255)", desc: "Company organization entity label." },
      { name: "statuskey", type: "bigint(20)", desc: "Saviynt status code: '1' indicates Active user, '0' Inactive." },
      { name: "costcenter", type: "varchar(255)", desc: "Cost center identifier mapped to the identity." },
      { name: "enabled", type: "bit(1)", desc: "Active flag: '1' allows system login, '0' blocks login." }
    ]
  },
  accounts: {
    desc: "Holds reconciled accounts imported from connected third-party systems.",
    columns: [
      { name: "id", type: "bigint(20)", desc: "Primary key of the accounts table (ACCOUNTKEY)." },
      { name: "accountID", type: "varchar(255)", desc: "Unique account identifier/login on target application." },
      { name: "accountclass", type: "varchar(255)", desc: "Account security grouping: e.g. Standard, Privileged, Service." },
      { name: "accounttype", type: "varchar(255)", desc: "Operational account type description." },
      { name: "displayName", type: "varchar(255)", desc: "User-friendly display label of the target account." },
      { name: "endpointkey", type: "bigint(20)", desc: "Foreign key mapping to the endpoints table." },
      { name: "status", type: "varchar(255)", desc: "Target status: '1' is Active, '2' is Inactive." }
    ]
  },
  user_accounts: {
    desc: "Associates user identity profiles to reconciled target application accounts.",
    columns: [
      { name: "userkey", type: "bigint(20)", desc: "Foreign key referencing users(id)." },
      { name: "accountkey", type: "bigint(20)", desc: "Foreign key referencing accounts(id)." }
    ]
  },
  roles: {
    desc: "Defines Saviynt roles used to control enterprise permissions and entitlements.",
    columns: [
      { name: "id", type: "bigint(20)", desc: "Primary key of the roles table (ROLEKEY)." },
      { name: "authority", type: "varchar(255)", desc: "Name of the role (e.g. HR Specialist, Security Admin)." },
      { name: "roledescription", type: "varchar(255)", desc: "Textual details outlining role access scope." },
      { name: "statuskey", type: "bigint(20)", desc: "Active state: '1' is Enabled, '0' is Disabled." }
    ]
  },
  user_savroles: {
    desc: "Maps user identity profiles directly to granted enterprise administrative roles.",
    columns: [
      { name: "userkey", type: "bigint(20)", desc: "Foreign key mapping to users(id)." },
      { name: "rolekey", type: "bigint(20)", desc: "Foreign key mapping to roles(id)." }
    ]
  },
  entitlement_values: {
    desc: "Stores unique entitlement access properties (e.g. AD Groups, SAP Permissions).",
    columns: [
      { name: "id", type: "bigint(20)", desc: "Primary key (ENTITLEMENT_VALUEKEY)." },
      { name: "access", type: "varchar(255)", desc: "Access level value name (e.g. Sales-Read, Admin-Full)." },
      { name: "description", type: "longtext", desc: "Compliance description explaining entitlement access." },
      { name: "entclass", type: "varchar(255)", desc: "Classification type: Group, Role, Permission." }
    ]
  },
  account_entitlements1: {
    desc: "Maps target user accounts to their granted entitlement values/groups.",
    columns: [
      { name: "id", type: "bigint(20)", desc: "Primary key (ACCENTKEY)." },
      { name: "accountkey", type: "bigint(20)", desc: "Foreign key mapping to accounts(id)." },
      { name: "entitlement_valuekey", type: "bigint(20)", desc: "Foreign key mapping to entitlement_values(id)." }
    ]
  },
  endpoints: {
    desc: "Stores connected applications instances (target systems).",
    columns: [
      { name: "id", type: "bigint(20)", desc: "Primary key (ENDPOINTKEY)." },
      { name: "endpointname", type: "varchar(255)", desc: "Label of the target system (e.g. Salesforce_PROD)." },
      { name: "description", type: "varchar(255)", desc: "Text details about system usage scope." }
    ]
  },
  arstasks: {
    desc: "Compliance tasks tracking automated target provisioning and reconciliation jobs.",
    columns: [
      { name: "id", type: "bigint(20)", desc: "Primary key (TASKKEY)." },
      { name: "accountKey", type: "bigint(20)", desc: "Foreign key mapping to accounts(id)." },
      { name: "accountName", type: "varchar(255)", desc: "Account label target of provisioning action." },
      { name: "status", type: "varchar(255)", desc: "Task status: '3' is Success, '8' is Provisioning Error." },
      { name: "comments", type: "longtext", desc: "Detailed execution log or error comments." }
    ]
  }
};

// Seed relational data based on guide requirements
const DUMMY_DB: Record<string, any[]> = {
  users: [
    { id: 1, username: "jdoe", displayname: "John Doe", email: "jdoe@saviynt.com", city: "Los Angeles", companyname: "Saviynt Inc.", statuskey: 1, costcenter: "IT-101", enabled: 1 },
    { id: 2, username: "asmith", displayname: "Alice Smith", email: "asmith@saviynt.com", city: "Houston", companyname: "Saviynt Inc.", statuskey: 1, costcenter: "HR-202", enabled: 1 },
    { id: 3, username: "bjohnson", displayname: "Bob Johnson", email: "bjohnson@saviynt.com", city: "New York", companyname: "Saviynt Partner", statuskey: 1, costcenter: "FIN-303", enabled: 1 },
    { id: 4, username: "mwilliams", displayname: "Michael Williams", email: "mwilliams@saviynt.com", city: "Chicago", companyname: "Saviynt Inc.", statuskey: 1, costcenter: "IT-101", enabled: 1 },
    { id: 5, username: "kbrown", displayname: "Karen Brown", email: "kbrown@saviynt.com", city: "Miami", companyname: "Saviynt Inc.", statuskey: 1, costcenter: "MKT-404", enabled: 1 }
  ],
  accounts: [
    { id: 101, accountID: "SF_JDOE", accountclass: "Standard", accounttype: "User", displayName: "John Doe (Salesforce)", endpointkey: 501, status: "1" },
    { id: 102, accountID: "AD_ASMITH", accountclass: "Standard", accounttype: "User", displayName: "Alice Smith (AD)", endpointkey: 502, status: "1" },
    { id: 103, accountID: "SAP_BJOHNSON", accountclass: "Privileged", accounttype: "Admin", displayName: "Bob Johnson (SAP)", endpointkey: 503, status: "2" },
    { id: 104, accountID: "SF_MWILLIAMS", accountclass: "Standard", accounttype: "User", displayName: "Michael Williams (Salesforce)", endpointkey: 501, status: "1" },
    { id: 105, accountID: "ORPHAN_AD_ACC", accountclass: "Service", accounttype: "Service", displayName: "AD Legacy Backup Acc", endpointkey: 502, status: "1" }
  ],
  user_accounts: [
    { userkey: 1, accountkey: 101 },
    { userkey: 2, accountkey: 102 },
    { userkey: 3, accountkey: 103 },
    { userkey: 4, accountkey: 104 }
  ],
  roles: [
    { id: 301, authority: "Enterprise Administrator", roledescription: "Global tenant management permissions", statuskey: 1 },
    { id: 302, authority: "Compliance Auditor", roledescription: "Read-only access for compliance audit logs", statuskey: 1 },
    { id: 303, authority: "HR Manager", roledescription: "Manage employee on/offboarding tasks", statuskey: 1 }
  ],
  user_savroles: [
    { userkey: 1, rolekey: 301 },
    { userkey: 2, rolekey: 303 },
    { userkey: 4, rolekey: 302 }
  ],
  entitlement_values: [
    { id: 401, access: "Salesforce_Lead_Write", description: "Enables creating and updating Salesforce leads", entclass: "Permission" },
    { id: 402, access: "ActiveDirectory_Domain_Admins", description: "Full admin access to Corporate AD Controllers", entclass: "Group" },
    { id: 403, access: "SAP_Payroll_Schema_Read", description: "Provides read access to internal payroll modules", entclass: "Role" }
  ],
  account_entitlements1: [
    { id: 901, accountkey: 101, entitlement_valuekey: 401 },
    { id: 902, accountkey: 102, entitlement_valuekey: 402 },
    { id: 903, accountkey: 103, entitlement_valuekey: 403 }
  ],
  endpoints: [
    { id: 501, endpointname: "Salesforce_PROD", description: "Salesforce Cloud Production Instance" },
    { id: 502, endpointname: "ActiveDirectory_Corp", description: "Active Directory Corporate DC" },
    { id: 503, endpointname: "SAP_ERP_Staging", description: "SAP ERP Financials Staging System" }
  ],
  arstasks: [
    { id: 801, accountKey: 101, accountName: "SF_JDOE", status: "3", comments: "Salesforce provisioning completed successfully." },
    { id: 802, accountKey: 102, accountName: "AD_ASMITH", status: "3", comments: "Active Directory account generated." },
    { id: 803, accountKey: 103, accountName: "SAP_BJOHNSON", status: "8", comments: "Provisioning Error: Connection timeout to SAP ERP." }
  ]
};

// Sleek pre-compiled SQL queries from Schema Guide
type PreQuery = { name: string; description: string; sql: string };
const PRE_QUERIES: PreQuery[] = [
  {
    name: "1. Identities & Enterprise Mapped Roles",
    description: "Lists all Saviynt employee identities and their mapped administrative roles. Demonstrates left joins.",
    sql: `SELECT u.username, u.displayname, u.email, r.authority AS role_name, r.roledescription\nFROM users u\nLEFT JOIN user_savroles ur ON u.id = ur.userkey\nLEFT JOIN roles r ON ur.rolekey = r.id`
  },
  {
    name: "2. Reconciled Orphan Accounts Audit",
    description: "Locates accounts imported from target applications that have no correlated owner identity in the core repository.",
    sql: `SELECT a.accountID, a.displayName AS account_label, ep.endpointname, ua.userkey\nFROM accounts a\nLEFT JOIN user_accounts ua ON a.id = ua.accountkey\nLEFT JOIN users u ON ua.userkey = u.id\nLEFT JOIN endpoints ep ON a.endpointkey = ep.id\nWHERE ua.userkey IS NULL`
  },
  {
    name: "3. User Entitlement Access Mapping",
    description: "Resolves full identities mapped through accounts directly to Active Directory / Salesforce entitlement groups.",
    sql: `SELECT u.username, a.accountID, ev.access AS entitlement_value, ev.entclass, ep.endpointname\nFROM users u\nINNER JOIN user_accounts ua ON u.id = ua.userkey\nINNER JOIN accounts a ON ua.accountkey = a.id\nINNER JOIN account_entitlements1 ae ON a.id = ae.accountkey\nINNER JOIN entitlement_values ev ON ae.entitlement_valuekey = ev.id\nINNER JOIN endpoints ep ON a.endpointkey = ep.id`
  },
  {
    name: "4. Failed Provisioning Task Logs",
    description: "Pulls operational failed tasks from the ARS queue and joins them with accounts configurations.",
    sql: `SELECT t.id AS task_id, t.accountName, a.accountclass, t.comments, t.status\nFROM arstasks t\nINNER JOIN accounts a ON t.accountKey = a.id\nWHERE t.status = '8'`
  }
];

export default function AnalyticsPage() {
  const [activeTable, setActiveTable] = useState("users");
  const [explorerTab, setExplorerTab] = useState<"schema" | "data">("schema");

  // Chatbot states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Main query compiler states
  const [sqlQuery, setSqlQuery] = useState(PRE_QUERIES[0].sql);
  const [queryLatency, setQueryLatency] = useState<number | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [history, setHistory] = useState<string[]>([PRE_QUERIES[0].sql]);

  // Execute query on mount
  useEffect(() => {
    runSQLQuery(PRE_QUERIES[0].sql);
  }, []);

  // AI Natural English NLP framer
  function generateQueryFromEnglish() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    setAiExplanation(null);

    setTimeout(() => {
      const lower = aiPrompt.toLowerCase();
      let sql = "";
      let explanation = "";

      if (lower.includes("active and inactive") || lower.includes("active users and inactive accounts") || lower.includes("active users who are active and inactive accounts") || lower.includes("users who are active and inactive accounts")) {
        sql = `SELECT u.username\nFROM users u, user_accounts ua, accounts a\nWHERE u.statuskey = 1\n  AND a.status = '2'\n  AND u.id = ua.userkey\n  AND a.id = ua.accountkey;`;
        explanation = "Parsed request for active employee users having inactive target accounts. Formulated legacy MySQL Cartesian product join filtering users where statuskey = 1 and accounts where status = '2'.";
      } else if (lower.includes("orphan") || lower.includes("unmapped") || lower.includes("without owner") || lower.includes("no owner")) {
        sql = `SELECT a.accountID, a.displayName AS account_label, ep.endpointname\nFROM accounts a\nLEFT JOIN user_accounts ua ON a.id = ua.accountkey\nLEFT JOIN users u ON ua.userkey = u.id\nLEFT JOIN endpoints ep ON a.endpointkey = ep.id\nWHERE ua.userkey IS NULL;`;
        explanation = "Parsed 'orphan' / 'unmapped' accounts. Performed LEFT JOIN from accounts, joining user_accounts and testing where userkey IS NULL to detect accounts with no mapped owner.";
      } else if (lower.includes("roles") || lower.includes("savroles") || lower.includes("admin roles") || lower.includes("authority")) {
        sql = `SELECT u.username, u.displayname, u.email, r.authority AS role_name\nFROM users u\nLEFT JOIN user_savroles ur ON u.id = ur.userkey\nLEFT JOIN roles r ON ur.rolekey = r.id;`;
        explanation = "Identified request for employee administrative roles. Formulated LEFT JOIN across users, user_savroles, and roles tables.";
      } else if (lower.includes("entitlement") || lower.includes("group") || lower.includes("permission") || lower.includes("access")) {
        sql = `SELECT u.username, a.accountID, ev.access AS entitlement_value, ep.endpointname\nFROM users u\nINNER JOIN user_accounts ua ON u.id = ua.userkey\nINNER JOIN accounts a ON ua.accountkey = a.id\nINNER JOIN account_entitlements1 ae ON a.id = ae.accountkey\nINNER JOIN entitlement_values ev ON ae.entitlement_valuekey = ev.id\nINNER JOIN endpoints ep ON a.endpointkey = ep.id;`;
        explanation = "Mapped access queries. Generated multiple INNER JOIN handshakes from users through account mappings and account_entitlements to access entitlement_values.";
      } else if (lower.includes("fail") || lower.includes("failed") || lower.includes("task") || lower.includes("error") || lower.includes("arstasks")) {
        sql = `SELECT t.id AS task_id, t.accountName, a.accountclass, t.comments\nFROM arstasks t\nINNER JOIN accounts a ON t.accountKey = a.id\nWHERE t.status = '8';`;
        explanation = "Parsed request for provisioning errors. Searched arstasks table where status code equals '8' (Failed) joined with account metadata.";
      } else if (lower.includes("active users") || lower.includes("statuskey = 1") || lower.includes("active identity")) {
        sql = `SELECT id, username, displayname, email, city, statuskey\nFROM users\nWHERE statuskey = 1;`;
        explanation = "Formulated users lookup filtered by statuskey = 1 to select active employee identities.";
      } else if (lower.includes("inactive users") || lower.includes("disabled users")) {
        sql = `SELECT id, username, displayname, email, city, statuskey\nFROM users\nWHERE statuskey = 0;`;
        explanation = "Formulated users lookup filtered by statuskey = 0 for inactive employee profiles.";
      } else if (lower.includes("los angeles") || lower.includes("la users")) {
        sql = `SELECT id, username, displayname, email, city\nFROM users\nWHERE city = 'Los Angeles';`;
        explanation = "Generated users lookup filtered by city attribute matching 'Los Angeles'.";
      } else if (lower.includes("houston")) {
        sql = `SELECT id, username, displayname, email, city\nFROM users\nWHERE city = 'Houston';`;
        explanation = "Generated users lookup filtered by city matching 'Houston'.";
      } else if (lower.includes("all users") || lower.includes("list users") || lower.includes("identities")) {
        sql = `SELECT id, username, displayname, email, enabled\nFROM users;`;
        explanation = "Standard SELECT projection of core attributes from the users table.";
      } else if (lower.includes("all accounts") || lower.includes("target accounts")) {
        sql = `SELECT id, accountID, displayName, status\nFROM accounts;`;
        explanation = "Standard SELECT projection of reconciled accounts.";
      } else {
        // Generics SELECT
        sql = `SELECT id, username, displayname, email\nFROM users\nLIMIT 3;`;
        explanation = "I framed a legacy-compatible SELECT from the core 'users' table. Describe your query (e.g., 'orphan accounts' or 'user roles') for a more targeted frame!";
      }

      setAiResult(sql);
      setAiExplanation(explanation);
      setAiLoading(false);
    }, 800);
  }

  // Inject generated query straight to editor
  function applyAiQuery() {
    if (!aiResult) return;
    setSqlQuery(aiResult);
    runSQLQuery(aiResult);
  }

  // Relational evaluation compiler
  function runSQLQuery(queryStr: string) {
    setQueryError(null);
    setQueryResults([]);
    const start = performance.now();

    try {
      // CTE constraint check: older MySQL versions where CTEs are NOT supported
      if (/\bWITH\b/i.test(queryStr)) {
        throw new Error("❌ MySQL Syntax Error: Common Table Expressions (CTEs) are not supported on this older MySQL/MariaDB schema engine. Please rewrite your query using subqueries or standard JOIN operations.");
      }

      // Check if query is empty or not SELECT
      const trimmed = queryStr.trim().replace(/\s+/g, " ");
      if (!trimmed) {
        throw new Error("Query is empty.");
      }
      if (!/^SELECT/i.test(trimmed)) {
        throw new Error("MySQL Driver Constraint: Only read-only 'SELECT' queries are allowed inside the Analytics Dashboard.");
      }

      // Match query mapping helper (highly clean lightweight parser matching typical Schema joins)
      let results: any[] = [];
      const lower = trimmed.toLowerCase();

      // Query 0: Active users with inactive target accounts (statuskey = 1 and status = 2)
      if (lower.includes("statuskey = 1") && lower.includes("status = '2'")) {
        results = [];
        DUMMY_DB.users.forEach(u => {
          if (u.statuskey === 1) {
            const uas = DUMMY_DB.user_accounts.filter(ua => ua.userkey === u.id);
            uas.forEach(ua => {
              const a = DUMMY_DB.accounts.find(acc => acc.id === ua.accountkey);
              if (a && a.status === "2") {
                results.push({
                  username: u.username
                });
              }
            });
          }
        });
      }
      // Query 1: Users & Roles LEFT JOIN user_savroles & roles
      else if (lower.includes("user_savroles") && lower.includes("roles")) {
        results = DUMMY_DB.users.map(u => {
          const ur = DUMMY_DB.user_savroles.find(x => x.userkey === u.id);
          const r = ur ? DUMMY_DB.roles.find(x => x.id === ur.rolekey) : null;
          return {
            username: u.username,
            displayname: u.displayname,
            email: u.email,
            role_name: r ? r.authority : "NULL",
            roledescription: r ? r.roledescription : "NULL"
          };
        });
      } 
      // Query 2: Orphan Accounts
      else if (lower.includes("user_accounts") && lower.includes("ua.userkey is null")) {
        results = DUMMY_DB.accounts
          .map(a => {
            const ua = DUMMY_DB.user_accounts.find(x => x.accountkey === a.id);
            const u = ua ? DUMMY_DB.users.find(x => x.id === ua.userkey) : null;
            const ep = DUMMY_DB.endpoints.find(x => x.id === a.endpointkey);
            return {
              accountID: a.accountID,
              account_label: a.displayName,
              endpointname: ep ? ep.endpointname : "NULL",
              userkey: u ? String(u.id) : "NULL"
            };
          })
          .filter(x => x.userkey === "NULL");
      }
      // Query 3: Multi-join users, accounts, entitlement_values, endpoints
      else if (lower.includes("account_entitlements1") && lower.includes("entitlement_values")) {
        results = [];
        DUMMY_DB.users.forEach(u => {
          const uas = DUMMY_DB.user_accounts.filter(ua => ua.userkey === u.id);
          uas.forEach(ua => {
            const a = DUMMY_DB.accounts.find(acc => acc.id === ua.accountkey);
            if (a) {
              const aes = DUMMY_DB.account_entitlements1.filter(ae => ae.accountkey === a.id);
              aes.forEach(ae => {
                const ev = DUMMY_DB.entitlement_values.find(v => v.id === ae.entitlement_valuekey);
                const ep = DUMMY_DB.endpoints.find(x => x.id === a.endpointkey);
                if (ev) {
                  results.push({
                    username: u.username,
                    accountID: a.accountID,
                    entitlement_value: ev.access,
                    entclass: ev.entclass,
                    endpointname: ep ? ep.endpointname : "NULL"
                  });
                }
              });
            }
          });
        });
      }
      // Query 4: Failed Tasks
      else if (lower.includes("arstasks") && lower.includes("status = '8'")) {
        results = DUMMY_DB.arstasks
          .filter(t => t.status === "8")
          .map(t => {
            const a = DUMMY_DB.accounts.find(acc => acc.id === t.accountKey);
            return {
              task_id: t.id,
              accountName: t.accountName,
              accountclass: a ? a.accountclass : "NULL",
              comments: t.comments,
              status: "8 (Failed)"
            };
          });
      }
      // Simple table query fallback: e.g. SELECT * FROM users
      else {
        let matchedTable = "";
        for (const tableName of Object.keys(DUMMY_DB)) {
          if (lower.includes(`from ${tableName}`)) {
            matchedTable = tableName;
            break;
          }
        }

        if (matchedTable) {
          results = DUMMY_DB[matchedTable].map(row => {
            const flat: Record<string, any> = {};
            Object.entries(row).forEach(([k, v]) => {
              flat[k] = v;
            });
            return flat;
          });
          
          if (lower.includes("where enabled = 1") && matchedTable === "users") {
            results = results.filter(x => x.enabled === 1);
          } else if (lower.includes("where statuskey = 1") && matchedTable === "users") {
            results = results.filter(x => x.statuskey === 1);
          } else if (lower.includes("where statuskey = 0") && matchedTable === "users") {
            results = results.filter(x => x.statuskey === 0);
          } else if (lower.includes("where city = 'los angeles'") && matchedTable === "users") {
            results = results.filter(x => x.city.toLowerCase() === "los angeles");
          } else if (lower.includes("where city = 'houston'") && matchedTable === "users") {
            results = results.filter(x => x.city.toLowerCase() === "houston");
          } else if (lower.includes("where status = '1'") && matchedTable === "accounts") {
            results = results.filter(x => x.status === "1");
          }
          
          if (lower.includes("limit 1")) {
            results = results.slice(0, 1);
          } else if (lower.includes("limit 2")) {
            results = results.slice(0, 2);
          } else if (lower.includes("limit 3")) {
            results = results.slice(0, 3);
          }
        } else {
          throw new Error("❌ SQL Engine Parser Error: This simplified query debugger only interprets SELECT statements, INNER/LEFT joins, and filters involving pre-seeded tables. Try selecting one of our interactive Schema templates or asking the AI Assistant!");
        }
      }

      setQueryResults(results);
      if (!history.includes(queryStr)) {
        setHistory([queryStr, ...history.slice(0, 9)]);
      }
    } catch (err: any) {
      setQueryError(err.message);
    } finally {
      const duration = performance.now() - start;
      setQueryLatency(parseFloat(duration.toFixed(2)));
    }
  }

  // Export Results to CSV
  function exportCSV() {
    if (queryResults.length === 0) return;
    const headers = Object.keys(queryResults[0]).join(",");
    const rows = queryResults.map(row => 
      Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "envizor_analytics_report.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Filtered rows calculation
  const getFilteredResults = () => {
    if (!searchFilter.trim()) return queryResults;
    const search = searchFilter.toLowerCase().trim();
    return queryResults.filter(row => 
      Object.values(row).some(v => String(v).toLowerCase().includes(search))
    );
  };

  const filtered = getFilteredResults();
  const resultKeys = filtered.length > 0 ? Object.keys(filtered[0]) : [];

  return (
    <Day0Shell
      title="Saviynt Analytics & Insights Workstation"
      subtitle="Interact with the Legacy SQL Query Sandbox. Build and verify operational governance queries grounded on official Saviynt Database Schema Guide."
      backTo="/wizard/steps/welcome"
      widthClass="max-w-7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 min-h-[600px]">
        
        {/* LEFT COLUMN: SCHEMA GUIDE & AI CHATBOT ASSISTANT */}
        <div className="flex flex-col gap-5">
          
          {/* SCHEMA EXPLORER CARD */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-4 shadow-lg"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            <span
              className="text-xs font-bold uppercase tracking-wider block pb-2"
              style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
            >
              Schema Explorer
            </span>

            {/* Table Selectors */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {Object.keys(TABLE_SCHEMAS).map((tableName) => (
                <button
                  key={tableName}
                  onClick={() => setActiveTable(tableName)}
                  className="text-[10px] px-2 py-1 rounded transition font-mono border"
                  style={{
                    background: activeTable === tableName ? "var(--tag-bg)" : "transparent",
                    color: activeTable === tableName ? "var(--success)" : "var(--text-muted)",
                    borderColor: activeTable === tableName ? "var(--success)" : "var(--border-subtle)",
                  }}
                >
                  {tableName}
                </button>
              ))}
            </div>

            {/* Table Schema details card */}
            <div
              className="rounded-xl p-3 space-y-2 text-xs flex flex-col justify-between"
              style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}
            >
              <div>
                <div className="font-bold font-mono text-[11px] mb-1" style={{ color: "var(--text-primary)" }}>
                  Table: <span style={{ color: "var(--accent)" }}>{activeTable}</span>
                </div>
                <p className="text-[9.5px] leading-normal mb-3" style={{ color: "var(--text-secondary)" }}>
                  {TABLE_SCHEMAS[activeTable].desc}
                </p>

                {/* Sub-tab columns or raw preview */}
                <div className="flex gap-2 pb-2 mb-2 text-[10px] font-bold" style={{ borderBottom: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setExplorerTab("schema")}
                    className="px-2 py-0.5 rounded transition"
                    style={{
                      background: explorerTab === "schema" ? "var(--bg-elevated)" : "transparent",
                      color: explorerTab === "schema" ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    Columns ({TABLE_SCHEMAS[activeTable].columns.length})
                  </button>
                  <button
                    onClick={() => setExplorerTab("data")}
                    className="px-2 py-0.5 rounded transition"
                    style={{
                      background: explorerTab === "data" ? "var(--bg-elevated)" : "transparent",
                      color: explorerTab === "data" ? "var(--accent)" : "var(--text-muted)",
                    }}
                  >
                    Raw Data ({DUMMY_DB[activeTable].length})
                  </button>
                </div>
              </div>

              {/* Toggle Content */}
              <div className="overflow-auto max-h-[180px] min-h-[120px] pr-1">
                {explorerTab === "schema" ? (
                  <div className="space-y-2">
                    {TABLE_SCHEMAS[activeTable].columns.map((c) => (
                      <div key={c.name} className="text-[10px] pb-1" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <div className="flex justify-between font-mono">
                          <span className="font-bold" style={{ color: "var(--code-text)" }}>{c.name}</span>
                          <span className="text-[8.5px]" style={{ color: "var(--text-muted)" }}>{c.type}</span>
                        </div>
                        <div className="text-[9px] mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>{c.desc}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {DUMMY_DB[activeTable].map((row, idx) => (
                      <pre
                        key={idx}
                        className="text-[9px] font-mono p-2 rounded overflow-auto whitespace-pre leading-relaxed"
                        style={{ background: "var(--code-bg)", border: "1px solid var(--border)", color: "var(--code-text)" }}
                      >
                        {JSON.stringify(row, null, 2)}
                      </pre>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI SQL ASSISTANT ADVISOR CHATBOT */}
          <div
            className="rounded-2xl p-4 flex flex-col gap-3 shadow-lg"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            <span
              className="text-xs font-bold uppercase tracking-wider block pb-2"
              style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
            >
              🧠 AI SQL Assistant
            </span>
            <span className="text-[9.5px] leading-normal" style={{ color: "var(--text-secondary)" }}>
              Ask in plain English what governance insights you want, and Envizor will generate a CTE-free, legacy MySQL query.
            </span>

            <div className="space-y-2 text-xs">
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Find all orphan accounts"
                className="w-full rounded px-2.5 py-1.5 focus:outline-none"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                }}
              />

              <button
                onClick={generateQueryFromEnglish}
                disabled={aiLoading || !aiPrompt.trim()}
                className="w-full py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #9333ea, #7c3aed)" }}
              >
                {aiLoading ? "🪄 Framing MySQL Query..." : "🪄 Formulate Query"}
              </button>
            </div>

            {/* Generated AI Query Box */}
            {aiResult && (
              <div
                className="p-3 rounded-xl space-y-2.5 text-xs"
                style={{ border: "1px solid var(--border)", background: "var(--tag-bg)" }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold font-mono" style={{ color: "var(--code-text)" }}>GENERATED SQL</span>
                  <button
                    onClick={applyAiQuery}
                    className="text-[9.5px] font-bold hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    📝 Copy to Console &amp; Run
                  </button>
                </div>
                
                <pre
                  className="text-[9.5px] font-mono p-2 rounded overflow-auto max-h-[100px] leading-relaxed"
                  style={{ background: "var(--code-bg)", border: "1px solid var(--border)", color: "var(--code-text)" }}
                >
                  {aiResult}
                </pre>

                {aiExplanation && (
                  <p
                    className="text-[9.5px] leading-relaxed italic mt-1.5 pt-1.5"
                    style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}
                  >
                    <strong>Advisor note:</strong> {aiExplanation}
                  </p>
                )}
              </div>
            )}
          </div>
          
        </div>

        {/* CENTER & BOTTOM: EDITOR & VISUALIZATION */}
        <div className="flex flex-col gap-6">
          
          {/* Query Console Card */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4 shadow-xl"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            <div
              className="flex justify-between items-center pb-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <span style={{ color: "var(--success)" }}>📟</span> Legacy SQL Query Compiler
              </span>
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider"
                  style={{
                    background: "rgba(245,158,11,0.1)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245,158,11,0.3)",
                  }}
                >
                  ⚠️ CTE Disabled Engine
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute top-2.5 right-2.5 flex gap-2 opacity-30 group-hover:opacity-100 transition z-20">
                  <button
                    onClick={() => setSqlQuery("")}
                    className="px-2.5 py-1 rounded text-[10px]"
                    style={{
                      background: "var(--bg-elevated)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Clear
                  </button>
                </div>

                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl p-4 font-mono text-[11px] focus:outline-none leading-normal resize-none"
                  placeholder="SELECT * FROM users WHERE enabled = 1;"
                  style={{
                    background: "var(--code-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--code-text)",
                  }}
                />
              </div>

              <div className="flex justify-between gap-3 text-xs items-center">
                {queryLatency !== null && (
                  <div className="font-mono text-[10.5px]" style={{ color: "var(--text-muted)" }}>
                    Latency: <span className="font-semibold" style={{ color: "var(--accent)" }}>{queryLatency} ms</span>
                  </div>
                )}
                
                <button
                  onClick={() => runSQLQuery(sqlQuery)}
                  disabled={!sqlQuery.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold text-white transition shadow-lg active:translate-y-0.5 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, var(--success), #16a34a)",
                    boxShadow: "0 4px 20px rgba(16,185,129,0.2)",
                  }}
                >
                  ⚡ Execute SQL Query
                </button>
              </div>
            </div>
          </div>

          {/* Outputs & Results Screen */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4 shadow-xl flex-1"
            style={{ background: "var(--bg-panel)", border: "1px solid var(--border)" }}
          >
            <div
              className="flex justify-between items-center pb-3 flex-wrap gap-2"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-mono" style={{ color: "var(--text-primary)" }}>QUERY LOG RESULTS</span>
                {filtered.length > 0 && (
                  <span
                    className="px-2 py-0.5 rounded text-[9.5px] font-bold font-mono"
                    style={{
                      background: "var(--tag-bg)",
                      color: "var(--tag-text)",
                      border: "1px solid var(--accent)",
                    }}
                  >
                    {filtered.length} row{filtered.length > 1 ? "s" : ""} returned
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {queryResults.length > 0 && (
                  <>
                    <input
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Search results..."
                      className="rounded-lg px-2.5 py-1 text-[10.5px] focus:outline-none"
                      style={{
                        background: "var(--bg-base)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    />
                    <button
                      onClick={exportCSV}
                      className="px-2.5 py-1 rounded text-[10px] flex items-center gap-1 font-semibold"
                      style={{
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      CSV Export
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Error console or Table output */}
            <div className="flex-1 min-h-[220px] overflow-auto">
              {queryError ? (
                <div
                  className="p-4 rounded-xl text-xs font-mono leading-relaxed space-y-2"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "var(--danger)" }}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <span>⚠️</span> COMPILER COMPILE WARNING
                  </div>
                  <p className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{queryError}</p>
                </div>
              ) : filtered.length > 0 ? (
                <div
                  className="rounded-xl overflow-hidden text-[10.5px]"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr
                        className="font-bold font-mono text-[9px] uppercase tracking-wider"
                        style={{
                          borderBottom: "1px solid var(--border)",
                          background: "var(--bg-elevated)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {resultKeys.map((k) => (
                          <th key={k} className="p-2.5">{k}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row, idx) => (
                        <tr
                          key={idx}
                          className="transition-colors"
                          style={{ borderBottom: "1px solid var(--border-subtle)" }}
                        >
                          {resultKeys.map((k) => {
                            const val = row[k];
                            let color = "var(--text-primary)";
                            if (k === "status" && String(val).includes("Failed")) color = "var(--danger)";
                            else if (k === "status" && String(val).includes("3")) color = "var(--success)";
                            else if (k === "enabled" && val === 1) color = "var(--success)";
                            else if (k === "enabled" && val === 0) color = "var(--text-muted)";
                            else if (k === "role_name" && val !== "NULL") color = "var(--accent)";
                            else if (k === "entitlement_value") color = "var(--code-text)";
                            return (
                              <td
                                key={k}
                                className="p-2.5 font-mono break-all"
                                style={{ color }}
                              >
                                {val === 1 && k === "enabled" ? "1 (true)" : val === 0 && k === "enabled" ? "0 (false)" : String(val)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className="h-full flex flex-col items-center justify-center p-8 text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span className="text-3xl opacity-40 mb-2">📊</span>
                  <span className="text-[11px] font-mono leading-normal max-w-sm">
                    Enter SELECT queries on database tables, perform traditional subjoins, and hit Execute to examine interactive operational audits.
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </Day0Shell>
  );
}
