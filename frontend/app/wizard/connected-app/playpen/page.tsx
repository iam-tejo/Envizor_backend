"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Day0Shell from "../../day0/Day0Shell";

type AttributeRow = {
  prop: string;
  path: string;
  type: string;
};

export default function PlaypenPage() {
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Active sandbox configurations
  const [sandboxEndpoint, setSandboxEndpoint] = useState<"auth" | "recon" | "create" | "update" | "disable" | "addAccess" | "custom">("auth");
  const [sandboxUrl, setSandboxUrl] = useState("");
  const [sandboxMethod, setSandboxMethod] = useState<"GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "DELETE">("POST");
  const [sandboxHeaders, setSandboxHeaders] = useState("");
  const [sandboxBody, setSandboxBody] = useState("");
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);

  // Load from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("saviynt_connected_app_config");
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig(parsed);
      }
    } catch (e) {
      console.error("Failed to load connected app state", e);
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  // Sync state when config or chosen endpoint updates
  useEffect(() => {
    if (!config) return;
    if (sandboxEndpoint === "custom") return;

    const {
      authUrl,
      authMethod,
      accessTokenLocation,
      authType,
      grantType,
      clientId,
      clientSecret,
      username,
      password,
      serviceUrl,
      reconPath,
      reconMethod,
      authHeaderName,
      tokenType,
      createPath,
      createMethod,
      createPayload,
      updatePath,
      updateMethod,
      updatePayload,
      disablePath,
      disableMethod,
      disablePayload,
      addAccessPath,
      addAccessMethod,
      addAccessPayload
    } = config;

    if (sandboxEndpoint === "auth") {
      setSandboxUrl(authUrl || "");
      setSandboxMethod((authMethod as any) || "POST");
      const defaultHeaders = accessTokenLocation === "header" 
        ? { "Content-Type": "application/json" } 
        : { "Content-Type": "application/x-www-form-urlencoded" };
      setSandboxHeaders(JSON.stringify(defaultHeaders, null, 2));
      
      const defaultBody = authType === "oauth2" 
        ? { grant_type: grantType, client_id: clientId, client_secret: clientSecret } 
        : { username, password };
      setSandboxBody(JSON.stringify(defaultBody, null, 2));
    } else if (sandboxEndpoint === "recon") {
      setSandboxUrl((serviceUrl || "") + (reconPath || ""));
      setSandboxMethod((reconMethod as any) || "GET");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Accept": "application/json"
      }, null, 2));
      setSandboxBody("");
    } else if (sandboxEndpoint === "create") {
      setSandboxUrl((serviceUrl || "") + (createPath || ""));
      setSandboxMethod((createMethod as any) || "POST");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Content-Type": "application/json"
      }, null, 2));
      setSandboxBody(createPayload);
    } else if (sandboxEndpoint === "update") {
      setSandboxUrl((serviceUrl || "") + (updatePath || ""));
      setSandboxMethod((updateMethod as any) || "PATCH");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Content-Type": "application/json"
      }, null, 2));
      setSandboxBody(updatePayload);
    } else if (sandboxEndpoint === "disable") {
      setSandboxUrl((serviceUrl || "") + (disablePath || ""));
      setSandboxMethod((disableMethod as any) || "PATCH");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Content-Type": "application/json"
      }, null, 2));
      setSandboxBody(disablePayload);
    } else if (sandboxEndpoint === "addAccess") {
      setSandboxUrl((serviceUrl || "") + (addAccessPath || ""));
      setSandboxMethod((addAccessMethod as any) || "POST");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Content-Type": "application/json"
      }, null, 2));
      setSandboxBody(addAccessPayload);
    }
  }, [sandboxEndpoint, config]);

  // Execute request via server-side proxy
  async function executeSandboxRequest() {
    setSandboxLoading(true);
    setSandboxResponse(null);
    try {
      let parsedHeaders = {};
      if (sandboxHeaders) {
        try {
          parsedHeaders = JSON.parse(sandboxHeaders);
        } catch (e) {
          throw new Error("Invalid request headers JSON format.");
        }
      }
      
      let parsedBody = sandboxBody;
      if (sandboxBody && typeof sandboxBody === "string") {
        try {
          parsedBody = JSON.parse(sandboxBody);
        } catch {
          // Send as raw string
        }
      }

      const res = await fetch("/api/wizard/connected-app/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: sandboxUrl,
          method: sandboxMethod,
          headers: parsedHeaders,
          body: parsedBody
        })
      });

      const data = await res.json();
      setSandboxResponse(data);
    } catch (err: any) {
      setSandboxResponse({
        ok: false,
        status: 500,
        statusText: "Client Request Failure",
        body: { error: err.message }
      });
    } finally {
      setSandboxLoading(false);
    }
  }

  // Compile standard Postman/Bruno Collection exporter
  function exportPostmanCollection() {
    if (!config) return;
    const {
      appName,
      authType,
      authUrl,
      authMethod,
      grantType,
      clientId,
      clientSecret,
      username,
      password,
      serviceUrl,
      reconEnabled,
      reconPath,
      reconMethod,
      authHeaderName,
      tokenType,
      createEnabled,
      createPath,
      createMethod,
      createPayload,
      updateEnabled,
      updatePath,
      updateMethod,
      updatePayload,
      disableEnabled,
      disablePath,
      disableMethod,
      disablePayload,
      addAccessEnabled,
      addAccessPath,
      addAccessMethod,
      addAccessPayload
    } = config;

    const formattedUrl = (urlStr: string) => {
      try {
        const u = new URL(urlStr);
        return {
          raw: urlStr,
          protocol: u.protocol.replace(":", ""),
          host: u.hostname.split("."),
          path: u.pathname.split("/").filter(Boolean),
          query: Array.from(u.searchParams.entries()).map(([key, value]) => ({ key, value }))
        };
      } catch {
        return {
          raw: urlStr,
          protocol: "https",
          host: ["api", "example", "com"],
          path: urlStr.split("/").filter(Boolean)
        };
      }
    };

    const items: any[] = [];

    // 1. Auth
    if (authType === "oauth2" && authUrl) {
      items.push({
        name: "1. Authentication Handshake (OAuth2)",
        request: {
          method: authMethod || "POST",
          header: [{ key: "Content-Type", value: "application/x-www-form-urlencoded" }],
          body: {
            mode: "urlencoded",
            urlencoded: [
              { key: "grant_type", value: grantType },
              { key: "client_id", value: clientId },
              { key: "client_secret", value: clientSecret }
            ]
          },
          url: formattedUrl(authUrl)
        }
      });
    } else if (authType === "Basic") {
      items.push({
        name: "1. Authentication Handshake (Basic Auth Example)",
        request: {
          method: "GET",
          header: [{ key: "Authorization", value: `Basic {{basic_auth_base64_token}}` }],
          url: formattedUrl(serviceUrl || "https://api.example.com")
        }
      });
    }

    // 2. Recon
    if (reconEnabled && reconPath) {
      items.push({
        name: "2. Account Reconciliation (Fetch Accounts)",
        request: {
          method: reconMethod || "GET",
          header: [
            { key: authHeaderName || "Authorization", value: `${tokenType || "Bearer"} {{access_token}}` },
            { key: "Accept", value: "application/json" }
          ],
          url: formattedUrl((serviceUrl || "") + reconPath)
        }
      });
    }

    // 3. Create
    if (createEnabled && createPath) {
      items.push({
        name: "3. Create Account (Provisioning)",
        request: {
          method: createMethod || "POST",
          header: [
            { key: authHeaderName || "Authorization", value: `${tokenType || "Bearer"} {{access_token}}` },
            { key: "Content-Type", value: "application/json" }
          ],
          body: { mode: "raw", raw: createPayload },
          url: formattedUrl((serviceUrl || "") + createPath)
        }
      });
    }

    // 4. Update
    if (updateEnabled && updatePath) {
      items.push({
        name: "4. Update Account",
        request: {
          method: updateMethod || "PATCH",
          header: [
            { key: authHeaderName || "Authorization", value: `${tokenType || "Bearer"} {{access_token}}` },
            { key: "Content-Type", value: "application/json" }
          ],
          body: { mode: "raw", raw: updatePayload },
          url: formattedUrl((serviceUrl || "") + updatePath)
        }
      });
    }

    // 5. Disable
    if (disableEnabled && disablePath) {
      items.push({
        name: "5. Disable/Lock Account",
        request: {
          method: disableMethod || "PATCH",
          header: [
            { key: authHeaderName || "Authorization", value: `${tokenType || "Bearer"} {{access_token}}` },
            { key: "Content-Type", value: "application/json" }
          ],
          body: { mode: "raw", raw: disablePayload },
          url: formattedUrl((serviceUrl || "") + disablePath)
        }
      });
    }

    // 6. Add Access
    if (addAccessEnabled && addAccessPath) {
      items.push({
        name: "6. Grant Access / Add Entitlement",
        request: {
          method: addAccessMethod || "POST",
          header: [
            { key: authHeaderName || "Authorization", value: `${tokenType || "Bearer"} {{access_token}}` },
            { key: "Content-Type", value: "application/json" }
          ],
          body: { mode: "raw", raw: addAccessPayload },
          url: formattedUrl((serviceUrl || "") + addAccessPath)
        }
      });
    }

    const collection = {
      info: {
        _postman_id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "saviynt-wizard-app-collection-" + Math.floor(Math.random() * 100000),
        name: `${appName || "Saviynt"} API Collection`,
        description: `Exported API testing suite for ${appName || "Saviynt Connected App"}. Suitable for import into Postman or Bruno.`,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: items
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(appName || "Saviynt").replace(/\s+/g, "_")}_postman_collection.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Handle placeholders for non-API types
  const isApiType = config ? (config.appType === "REST" || config.appType === "SCIM") : true;

  if (loadingConfig) {
    return (
      <Day0Shell
        title="Saviynt API Integration Playpen"
        subtitle="Loading active configurations..."
        backTo="/wizard/connected-app"
        widthClass="max-w-7xl"
      >
        <div className="h-96 flex items-center justify-center text-slate-400 font-mono text-sm">
          ⏳ Synchronizing builder state parameters...
        </div>
      </Day0Shell>
    );
  }

  if (!config) {
    return (
      <Day0Shell
        title="Saviynt API Integration Playpen"
        subtitle="Testing sandbox environment."
        backTo="/wizard/connected-app"
        widthClass="max-w-4xl"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4">
          <span className="text-4xl">⚠️</span>
          <h3 className="text-lg font-bold text-slate-200">No Application Configuration Found</h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            We couldn&apos;t load any active builder states. Please go back to the Connected App Builder page, fill out the connector profile, and then click &quot;Test APIs&quot;.
          </p>
          <Link
            href="/wizard/connected-app"
            className="mt-2 px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/10"
          >
            ← Back to App Builder
          </Link>
        </div>
      </Day0Shell>
    );
  }

  return (
    <Day0Shell
      title={`⚡ ${config.appName || "Connected App"} API Playpen Sandbox`}
      subtitle="Full-scale Postman/Bruno-style endpoint debugger. Test OAuth handshake handshakes, pagination loops, and SCIM provisioning schemas."
      backTo="/wizard/connected-app"
      widthClass="max-w-7xl"
    >
      <div className="mb-4">
        <Link
          href="/wizard/connected-app"
          className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1.5 transition"
        >
          ← Back to Configuration Builder
        </Link>
      </div>

      {!isApiType ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <span className="text-4xl">🔌</span>
          <h3 className="text-lg font-bold text-slate-200">REST API Sandbox Unavailable</h3>
          <p className="text-xs text-slate-400 max-w-md leading-relaxed">
            This application is configured as a **{config.appType} Connector**. SQL Database and Delimited CSV File connections execute HCL/HCF code queries internally inside Saviynt EIC agent modules and do not expose REST API endpoints.
          </p>
          <div className="p-4 bg-purple-950/20 border border-purple-500/25 rounded-xl text-purple-300 text-xs max-w-md text-left mt-2">
            <strong>💡 Save & Go:</strong> You can click the back button to save configurations directly to your local workspace, or export individual JSON files inside the preview suite.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_420px] gap-6 min-h-[600px]">
          
          {/* LEFT SIDEBAR: API ENDPOINT NAVIGATOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">API Collections</span>
              
              <div className="space-y-1.5 text-xs">
                <button
                  onClick={() => setSandboxEndpoint("auth")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-0.5 transition ${
                    sandboxEndpoint === "auth" ? "bg-sky-950/40 text-sky-400 border border-sky-500/25" : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[8px]">POST</span>
                    1. OAuth / Auth
                  </span>
                  <span className="text-[9px] text-slate-500 truncate">{config.authUrl || "Not Configured"}</span>
                </button>

                {config.reconEnabled && (
                  <button
                    onClick={() => setSandboxEndpoint("recon")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-0.5 transition ${
                      sandboxEndpoint === "recon" ? "bg-sky-950/40 text-sky-400 border border-sky-500/25" : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-sky-500/10 text-sky-400 text-[8px]">{config.reconMethod || "GET"}</span>
                      2. Reconciliation
                    </span>
                    <span className="text-[9px] text-slate-500 truncate">{config.reconPath || "Not Configured"}</span>
                  </button>
                )}

                {config.createEnabled && (
                  <button
                    onClick={() => setSandboxEndpoint("create")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-0.5 transition ${
                      sandboxEndpoint === "create" ? "bg-sky-950/40 text-sky-400 border border-sky-500/25" : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-purple-500/10 text-purple-400 text-[8px]">{config.createMethod || "POST"}</span>
                      3. Create Account
                    </span>
                    <span className="text-[9px] text-slate-500 truncate">{config.createPath || "Not Configured"}</span>
                  </button>
                )}

                {config.updateEnabled && (
                  <button
                    onClick={() => setSandboxEndpoint("update")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-0.5 transition ${
                      sandboxEndpoint === "update" ? "bg-sky-950/40 text-sky-400 border border-sky-500/25" : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 text-[8px]">{config.updateMethod || "PATCH"}</span>
                      4. Update Account
                    </span>
                    <span className="text-[9px] text-slate-500 truncate">{config.updatePath || "Not Configured"}</span>
                  </button>
                )}

                {config.disableEnabled && (
                  <button
                    onClick={() => setSandboxEndpoint("disable")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-0.5 transition ${
                      sandboxEndpoint === "disable" ? "bg-sky-950/40 text-sky-400 border border-sky-500/25" : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-rose-500/10 text-rose-400 text-[8px]">{config.disableMethod || "PATCH"}</span>
                      5. Disable Account
                    </span>
                    <span className="text-[9px] text-slate-500 truncate">{config.disablePath || "Not Configured"}</span>
                  </button>
                )}

                {config.addAccessEnabled && (
                  <button
                    onClick={() => setSandboxEndpoint("addAccess")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-0.5 transition ${
                      sandboxEndpoint === "addAccess" ? "bg-sky-950/40 text-sky-400 border border-sky-500/25" : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="px-1 py-0.2 rounded bg-purple-500/10 text-purple-400 text-[8px]">{config.addAccessMethod || "POST"}</span>
                      6. Grant Access
                    </span>
                    <span className="text-[9px] text-slate-500 truncate">{config.addAccessPath || "Not Configured"}</span>
                  </button>
                )}

                <button
                  onClick={() => setSandboxEndpoint("custom")}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex flex-col gap-0.5 transition ${
                    sandboxEndpoint === "custom" ? "bg-sky-950/40 text-sky-400 border border-sky-500/25" : "text-slate-400 hover:bg-slate-950 hover:text-slate-200"
                  }`}
                >
                  <span className="font-bold flex items-center gap-1.5">
                    <span className="px-1 py-0.2 rounded bg-slate-500/10 text-slate-400 text-[8px]">✏️ Custom</span>
                    Manual Request Builder
                  </span>
                  <span className="text-[9px] text-slate-500">Fully custom manual parameters</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <button
                onClick={exportPostmanCollection}
                className="w-full py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>💾</span> Export Postman/Bruno
              </button>
            </div>
          </div>

          {/* MAIN PANEL: ENDPOINT DEBUGGER & PAYLOADS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-slate-200">REST Client Engine</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {sandboxEndpoint.toUpperCase()} MODE
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Method and URL Input Group */}
              <div className="grid grid-cols-[110px_1fr] gap-3 items-end">
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">HTTP Method</label>
                  <select
                    value={sandboxMethod}
                    onChange={(e) => setSandboxMethod(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-extrabold"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PATCH">PATCH</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-slate-400 font-medium">Request Endpoint URL</label>
                  <input
                    value={sandboxUrl}
                    onChange={(e) => setSandboxUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/..."
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Request Headers Textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 font-medium">HTTP Request Headers (JSON dictionary format)</label>
                <textarea
                  value={sandboxHeaders}
                  onChange={(e) => setSandboxHeaders(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                  placeholder='{ "Content-Type": "application/json" }'
                />
              </div>

              {/* Request Body Textarea */}
              {sandboxMethod !== "GET" && (
                <div className="flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-slate-400 font-medium">HTTP Request Payload Body</label>
                  <textarea
                    value={sandboxBody}
                    onChange={(e) => setSandboxBody(e.target.value)}
                    rows={8}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-350 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                    placeholder='{ "key": "value" }'
                  />
                </div>
              )}

              {/* Action execute button */}
              <button
                onClick={executeSandboxRequest}
                disabled={sandboxLoading || !sandboxUrl}
                className={`
                  w-full py-3 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-lg
                  ${
                    sandboxLoading
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750"
                      : "bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white hover:opacity-95 shadow-sky-500/10 active:translate-y-0.5"
                  }
                `}
              >
                {sandboxLoading ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span> Routing fetch connection via server proxy...
                  </>
                ) : (
                  <>
                    <span>⚡</span> Fire Sandbox HTTP Request
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: RETRO-TERMINAL SCREEN RESPONSE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-sm font-bold text-slate-200">Terminal Output console</span>
              {sandboxResponse && (
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sandboxResponse.ok 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {sandboxResponse.status} {sandboxResponse.statusText}
                  </span>
                  <span className="font-mono text-slate-500 text-[10px]">{sandboxResponse.durationMs}ms</span>
                </div>
              )}
            </div>

            <div className="flex-1 border border-slate-850 bg-slate-950 p-4 rounded-xl flex flex-col overflow-auto h-[480px]">
              {sandboxResponse ? (
                <pre className="text-[10px] font-mono text-slate-350 leading-relaxed whitespace-pre-wrap">
                  {typeof sandboxResponse.body === "object"
                    ? JSON.stringify(sandboxResponse.body, null, 2)
                    : String(sandboxResponse.body || "Empty response body payload.")}
                </pre>
              ) : sandboxLoading ? (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 font-mono italic animate-pulse">
                  Connecting via server proxy and executing HTTP handshake...
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
                  <span className="text-3xl opacity-40">📟</span>
                  <span className="text-[10.5px] font-mono text-slate-500 leading-normal max-w-[250px]">
                    Sandbox terminal is idle. Select an integration endpoint action and trigger test to view live response payloads.
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </Day0Shell>
  );
}
