"use client";

import { useEffect, useState } from "react";
import Day0Shell from "../Day0Shell";
import Link from "next/link";

interface FlattenedRequest {
  id: string;
  name: string;
  folderPath: string[];
  method: string;
  url: string;
  description: string;
  headers: Array<{ key: string; value: string; description?: string }>;
  bodyMode: string;
  bodyRaw: string;
}

interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

export default function SaviyntApiUsagePage() {
  const [apis, setApis] = useState<FlattenedRequest[]>([]);
  const [filteredApis, setFilteredApis] = useState<FlattenedRequest[]>([]);
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [selectedApi, setSelectedApi] = useState<FlattenedRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"view" | "edit" | "test">("view");

  // ── Playground States ───────────────────────────────────────
  type CredEnv = "DEV" | "PRE" | "PROD";
  const [credTab, setCredTab] = useState<CredEnv>("DEV");
  const [creds, setCreds] = useState<Record<CredEnv, { url: string; username: string; password: string }>>({ 
    DEV:  { url: "", username: "", password: "" },
    PRE:  { url: "", username: "", password: "" },
    PROD: { url: "", username: "", password: "" },
  });
  const [showPwd, setShowPwd] = useState<Record<CredEnv, boolean>>({ DEV: false, PRE: false, PROD: false });
  const [testApiLoading, setTestApiLoading] = useState<boolean>(false);
  const [testApiResponse, setTestApiResponse] = useState<any>(null);
  const [responseFormat, setResponseFormat] = useState<"json" | "table" | "cards">("json");

  // Load tenant credentials on mount
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const res = await fetch("/api/day0/tenant-credentials");
        if (res.ok) {
          const data = await res.json();
          if (data.credentials) {
            const c = data.credentials;
            setCreds({
              DEV:  { url: c.SAVIYNT_DEV_URL  || "", username: c.SAVIYNT_DEV_USERNAME  || "", password: c.SAVIYNT_DEV_PASSWORD  || "" },
              PRE:  { url: c.SAVIYNT_PRE_URL  || "", username: c.SAVIYNT_PRE_USERNAME  || "", password: c.SAVIYNT_PRE_PASSWORD  || "" },
              PROD: { url: c.SAVIYNT_PROD_URL || "", username: c.SAVIYNT_PROD_USERNAME || "", password: c.SAVIYNT_PROD_PASSWORD || "" },
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch credentials on mount in API usage page:", err);
      }
    };
    fetchCredentials();
  }, []);

  const [userRole, setUserRole] = useState<string>("BasicUser");
  const [userName, setUserName] = useState<string>("admin");

  // Expanded folders in the tree view
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Toast alerts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Editor states
  const [editName, setEditName] = useState("");
  const [editFolderText, setEditFolderText] = useState("");
  const [editMethod, setEditMethod] = useState("GET");
  const [editUrl, setEditUrl] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editHeaders, setEditHeaders] = useState<Array<{ key: string; value: string; description?: string }>>([]);
  const [editBodyMode, setEditBodyMode] = useState("none");
  const [editBodyRaw, setEditBodyRaw] = useState("");
  const [isEditingCustomFolder, setIsEditingCustomFolder] = useState(false);

  // Live JSON validation
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Modal / Creator states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createFolderText, setCreateFolderText] = useState("");
  const [createMethod, setCreateMethod] = useState("GET");
  const [createUrl, setCreateUrl] = useState("{{url}}/ECM/api/v5/");
  const [createDescription, setCreateDescription] = useState("");
  const [createHeaders, setCreateHeaders] = useState<Array<{ key: string; value: string; description?: string }>>([]);
  const [createBodyMode, setCreateBodyMode] = useState("none");
  const [createBodyRaw, setCreateBodyRaw] = useState("");
  const [createJsonError, setCreateJsonError] = useState<string | null>(null);

  // Fetch API list on load
  async function fetchApis() {
    try {
      setLoading(true);
      const res = await fetch("/api/day0/api-usage");
      if (!res.ok) throw new Error("Failed to fetch definitions");
      const data = await res.json();
      setApis(data.apis || []);
      setFilteredApis(data.apis || []);
      setAvailableFolders(data.availableFolders || []);

      // Auto-expand first-level folders initially
      const initialExpansions: Record<string, boolean> = {};
      data.apis.forEach((api: FlattenedRequest) => {
        if (api.folderPath.length > 0) {
          initialExpansions[api.folderPath[0]] = true;
          if (api.folderPath.length > 1) {
            initialExpansions[`${api.folderPath[0]} / ${api.folderPath[1]}`] = true;
          }
        }
      });
      setExpandedFolders(initialExpansions);
    } catch (err: any) {
      showToast(err.message || "Failed to load APIs", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApis();
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "admin";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      setUserRole(latestRole);
      setUserName(user);
    }
  }, []);

  // Filter APIs when search query or base list changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredApis(apis);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = apis.filter(
      api =>
        api.name.toLowerCase().includes(query) ||
        api.url.toLowerCase().includes(query) ||
        api.method.toLowerCase().includes(query) ||
        api.description.toLowerCase().includes(query) ||
        api.folderPath.some(folder => folder.toLowerCase().includes(query))
    );
    setFilteredApis(filtered);
  }, [searchQuery, apis]);

  // Handle selected API change to populate editor
  useEffect(() => {
    if (!selectedApi) return;
    setEditName(selectedApi.name);
    setEditFolderText(selectedApi.folderPath.join(" / "));
    setEditMethod(selectedApi.method);
    setEditUrl(selectedApi.url);
    setEditDescription(selectedApi.description);
    setEditHeaders(selectedApi.headers.length > 0 ? [...selectedApi.headers] : [{ key: "", value: "", description: "" }]);
    setEditBodyMode(selectedApi.bodyMode);
    setEditBodyRaw(selectedApi.bodyRaw);
    setJsonError(null);
    setTestApiResponse(null);
  }, [selectedApi]);

  // Live validate JSON body in editor
  useEffect(() => {
    if (editBodyMode === "raw" && editBodyRaw.trim() !== "") {
      try {
        JSON.parse(editBodyRaw);
        setJsonError(null);
      } catch (err: any) {
        setJsonError(err.message || "Invalid JSON syntax");
      }
    } else {
      setJsonError(null);
    }
  }, [editBodyRaw, editBodyMode]);

  // Live validate JSON body in creator modal
  useEffect(() => {
    if (createBodyMode === "raw" && createBodyRaw.trim() !== "") {
      try {
        JSON.parse(createBodyRaw);
        setCreateJsonError(null);
      } catch (err: any) {
        setCreateJsonError(err.message || "Invalid JSON syntax");
      }
    } else {
      setCreateJsonError(null);
    }
  }, [createBodyRaw, createBodyMode]);

  // Toast Helper
  function showToast(text: string, type: "success" | "error" | "info" = "success") {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }

  // Toggle folder collapse
  function toggleFolder(folderKey: string) {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  }

  // Editor Actions
  function addHeaderRow() {
    setEditHeaders(prev => [...prev, { key: "", value: "", description: "" }]);
  }

  function removeHeaderRow(index: number) {
    setEditHeaders(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy.length === 0 ? [{ key: "", value: "", description: "" }] : copy;
    });
  }

  function updateHeaderRow(index: number, field: "key" | "value" | "description", val: string) {
    setEditHeaders(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  // Creator Actions
  function addCreateHeaderRow() {
    setCreateHeaders(prev => [...prev, { key: "", value: "", description: "" }]);
  }

  function removeCreateHeaderRow(index: number) {
    setCreateHeaders(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy.length === 0 ? [{ key: "", value: "", description: "" }] : copy;
    });
  }

  function updateCreateHeaderRow(index: number, field: "key" | "value" | "description", val: string) {
    setCreateHeaders(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  // Handle Save (Edit)
  async function handleSaveEdit() {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r !== "SUPERADMIN") {
      showToast("🔒 Access Restricted: Only a SuperAdmin can modify API definitions.", "error");
      return;
    }
    if (!selectedApi) return;
    if (jsonError) {
      showToast("Cannot save. Request body JSON is invalid.", "error");
      return;
    }

    try {
      setSaving(true);
      // Clean headers
      const cleanedHeaders = editHeaders.filter(h => h.key.trim() !== "");

      // Split folderPath
      const folderPath = editFolderText.split("/").map(s => s.trim()).filter(s => s !== "");

      const payload = {
        id: selectedApi.id,
        name: editName,
        folderPath,
        method: editMethod,
        url: editUrl,
        description: editDescription,
        headers: cleanedHeaders,
        bodyMode: editBodyMode,
        bodyRaw: editBodyRaw
      };

      const res = await fetch("/api/day0/api-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", payload })
      });

      if (!res.ok) throw new Error("Failed to save changes");
      const data = await res.json();
      
      setApis(data.apis);
      setAvailableFolders(data.availableFolders);
      
      // Update selectedApi state
      const updated = data.apis.find((a: FlattenedRequest) => a.id === selectedApi.id);
      if (updated) setSelectedApi(updated);

      showToast("Changes successfully saved to saviynt_api.json", "success");
      setActiveTab("view");
    } catch (err: any) {
      showToast(err.message || "Failed to save definition", "error");
    } finally {
      setSaving(false);
    }
  }

  // Handle Create
  async function handleCreateApi() {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r !== "SUPERADMIN") {
      showToast("🔒 Access Restricted: Only a SuperAdmin can onboard new API definitions.", "error");
      return;
    }
    if (createJsonError) {
      showToast("Cannot create. Request body JSON is invalid.", "error");
      return;
    }
    if (!createName.trim()) {
      showToast("API name is required", "error");
      return;
    }

    try {
      setSaving(true);
      const cleanedHeaders = createHeaders.filter(h => h.key.trim() !== "");
      const folderPath = createFolderText.split("/").map(s => s.trim()).filter(s => s !== "");

      const payload = {
        name: createName,
        folderPath,
        method: createMethod,
        url: createUrl,
        description: createDescription,
        headers: cleanedHeaders,
        bodyMode: createBodyMode,
        bodyRaw: createBodyRaw
      };

      const res = await fetch("/api/day0/api-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", payload })
      });

      if (!res.ok) throw new Error("Failed to create API endpoint");
      const data = await res.json();

      setApis(data.apis);
      setAvailableFolders(data.availableFolders);
      
      // Auto select the newly created API
      const newlyCreated = data.apis.find((a: FlattenedRequest) => a.name === createName && a.method === createMethod);
      if (newlyCreated) setSelectedApi(newlyCreated);

      showToast("Successfully added new API definition!", "success");
      setShowCreateModal(false);
      setActiveTab("view");
      
      // Reset Modal Form
      setCreateName("");
      setCreateFolderText("");
      setCreateMethod("GET");
      setCreateUrl("{{url}}/ECM/api/v5/");
      setCreateDescription("");
      setCreateHeaders([{ key: "", value: "", description: "" }]);
      setCreateBodyMode("none");
      setCreateBodyRaw("");
    } catch (err: any) {
      showToast(err.message || "Failed to add definition", "error");
    } finally {
      setSaving(false);
    }
  }

  // Handle Import Collection File
  async function handleImportCollection(e: React.ChangeEvent<HTMLInputElement>) {
    const r = userRole.replace(/\s+|_/g, "").toUpperCase();
    if (r !== "SUPERADMIN") {
      showToast("🔒 Access Restricted: Only a SuperAdmin can import API collections.", "error");
      e.target.value = "";
      return;
    }
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Basic verification of Postman Collection format
        if (!parsed.info || !parsed.item) {
          throw new Error("Invalid Postman Collection. Missing 'info' or 'item' fields.");
        }

        setLoading(true);
        const res = await fetch("/api/day0/api-usage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "import",
            payload: { collection: parsed }
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Failed to import collection file");
        }

        const data = await res.json();
        setApis(data.apis || []);
        setFilteredApis(data.apis || []);
        setAvailableFolders(data.availableFolders || []);
        setSelectedApi(null); // Clear active selection

        showToast("Successfully imported and activated new API collection!", "success");
      } catch (err: any) {
        showToast(err.message || "Failed to parse or upload collection file", "error");
      } finally {
        setLoading(false);
        // Reset input value so same file can be selected again
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      showToast("Error reading the selected file", "error");
      e.target.value = "";
    };

    reader.readAsText(file);
  }

  // Copy API endpoint details helper
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showToast("URL copied to clipboard", "info");
  }

  // Method Badge Stylings
  function getMethodBadge(method: string) {
    switch (method.toUpperCase()) {
      case "GET":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "POST":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "PUT":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "DELETE":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  }

  // Structure flat APIs into a tree for render
  function buildTreeStructure(flatApis: FlattenedRequest[]) {
    const root: any = { subfolders: {}, endpoints: [] };

    flatApis.forEach(api => {
      let current = root;
      api.folderPath.forEach(folderName => {
        if (!current.subfolders[folderName]) {
          current.subfolders[folderName] = { subfolders: {}, endpoints: [] };
        }
        current = current.subfolders[folderName];
      });
      current.endpoints.push(api);
    });

    return root;
  }

  const apiTree = buildTreeStructure(filteredApis);

  // Recursive Tree Node Renderer
  function renderTreeNode(node: any, pathSoFar: string[] = [], depth: number = 0) {
    const subfolderKeys = Object.keys(node.subfolders).sort();

    return (
      <div className="flex flex-col w-full">
        {/* Render Subfolders */}
        {subfolderKeys.map(folderName => {
          const fullKey = [...pathSoFar, folderName].join(" / ");
          const isExpanded = !!expandedFolders[fullKey];
          const hasChildren = Object.keys(node.subfolders[folderName].subfolders).length > 0 || node.subfolders[folderName].endpoints.length > 0;

          return (
            <div key={folderName} className="flex flex-col w-full my-0.5">
              <button
                onClick={() => toggleFolder(fullKey)}
                className={`
                  flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold
                  transition-all duration-150 text-slate-300 hover:text-white hover:bg-slate-800/40
                `}
                style={{ paddingLeft: `${Math.max(8, depth * 12)}px` }}
              >
                <span>{isExpanded ? "📂" : "📁"}</span>
                <span className="truncate flex-1">{folderName}</span>
                {hasChildren && (
                  <span className="text-[10px] text-slate-500 px-1.5 bg-slate-800/80 rounded-full">
                    {node.subfolders[folderName].endpoints.length + Object.keys(node.subfolders[folderName].subfolders).length}
                  </span>
                )}
              </button>
              
              {isExpanded && (
                <div className="flex flex-col border-l border-slate-800/60 ml-3.5 pl-1 my-0.5">
                  {renderTreeNode(node.subfolders[folderName], [...pathSoFar, folderName], depth + 1)}
                </div>
              )}
            </div>
          );
        })}

        {/* Render Leaf Endpoints */}
        {node.endpoints.map((api: FlattenedRequest) => {
          const isSelected = selectedApi?.id === api.id;
          return (
            <button
              key={api.id}
              onClick={() => {
                setSelectedApi(api);
                setActiveTab("view");
              }}
              className={`
                flex items-center gap-2.5 w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium
                transition-all duration-150 group border
                ${
                  isSelected
                    ? "bg-blue-600/15 border-blue-500/40 text-blue-300 shadow-sm shadow-blue-500/5"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                }
              `}
              style={{ paddingLeft: `${Math.max(12, depth * 14)}px` }}
            >
              <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded flex-shrink-0 ${getMethodBadge(api.method)}`}>
                {api.method}
              </span>
              <span className="truncate flex-1">{api.name}</span>
            </button>
          );
        })}
      </div>
    );
  }
  const getResourceList = (response: any) => {
    if (!response) return null;
    if (Array.isArray(response)) return { type: "Item", data: response };
    if (response.securitysystems) return { type: "Security System", data: response.securitysystems };
    if (response.endpoints) return { type: "Endpoint", data: response.endpoints };
    if (response.roles) return { type: "Role", data: response.roles };
    if (response.entitlements) return { type: "Entitlement", data: response.entitlements };
    if (response.securitySystems) return { type: "Security System", data: response.securitySystems };
    
    for (const key of Object.keys(response)) {
      if (Array.isArray(response[key])) {
        return { type: key.replace(/s$/, "").replace(/([A-Z])/g, " $1"), data: response[key] };
      }
    }
    return null;
  };

  const renderResponseTable = (response: any) => {
    const resource = getResourceList(response);
    if (!resource || !resource.data || resource.data.length === 0) {
      const entries = Object.entries(response);
      if (entries.length === 0) {
        return (
          <div className="text-[10px] text-slate-400 italic py-3 text-center">
            No properties to display in table.
          </div>
        );
      }
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px] text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                <th className="py-2 pr-4 pl-2">Property</th>
                <th className="py-2 pr-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, val]) => (
                <tr key={key} className="border-b border-slate-900/50 hover:bg-slate-900/30">
                  <td className="py-2 px-2 font-mono text-pink-400">{key}</td>
                  <td className="py-2 px-2 font-mono text-slate-200">
                    {val === null || val === undefined ? (
                      <span className="text-slate-600">-</span>
                    ) : typeof val === "object" ? (
                      <pre className="text-[9.5px] font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-900/50 max-h-[100px] overflow-y-auto whitespace-pre-wrap select-text select-all block">
                        {JSON.stringify(val, null, 2)}
                      </pre>
                    ) : (
                      String(val)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    const allKeys = Array.from(
      new Set(resource.data.flatMap((item: any) => Object.keys(item)))
    ).filter(k => typeof k === "string");

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/45">
        <table className="w-full text-left text-[11px] text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
              {allKeys.map(key => (
                <th key={key} className="py-2 px-3">
                  {key.replace(/([A-Z])/g, " $1")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resource.data.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-900 hover:bg-slate-900/30 transition-colors">
                {allKeys.map(key => (
                  <td 
                    key={key} 
                    className="py-2 px-3 font-mono max-w-[200px] truncate text-slate-200" 
                    title={typeof item[key] === "object" ? JSON.stringify(item[key], null, 2) : String(item[key] ?? "")}
                  >
                    {item[key] === null || item[key] === undefined ? (
                      <span className="text-slate-600">-</span>
                    ) : typeof item[key] === "object" ? (
                      <span className="text-pink-400 bg-pink-950/20 px-1 py-0.5 rounded text-[9px] font-bold">
                        {Array.isArray(item[key]) ? `Array(${item[key].length})` : "Object"}
                      </span>
                    ) : (
                      String(item[key])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderResponseCards = (response: any) => {
    const resource = getResourceList(response);
    if (!resource || !resource.data || resource.data.length === 0) {
      const entries = Object.entries(response);
      if (entries.length === 0) {
        return (
          <div className="text-[10px] text-slate-400 italic py-3 text-center">
            No properties to display as cards.
          </div>
        );
      }
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
          {entries.map(([key, val]) => (
            <div key={key} className="bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl flex flex-col gap-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">{key.replace(/([A-Z])/g, " $1")}</span>
              <div className="text-xs font-mono text-pink-400 break-words mt-0.5">
                {val === null || val === undefined ? (
                  <span className="text-slate-650">-</span>
                ) : typeof val === "object" ? (
                  <pre className="text-[9.5px] font-mono text-slate-350 bg-slate-950 p-2 rounded border border-slate-900 max-h-[120px] overflow-y-auto whitespace-pre-wrap select-text select-all block mt-1">
                    {JSON.stringify(val, null, 2)}
                  </pre>
                ) : (
                  String(val)
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
        {resource.data.map((item: any, idx: number) => {
          const title = item.name || item.displayName || item.id || `Item ${idx + 1}`;
          const id = item.id || item.code || "";
          const desc = item.description || item.descriptionVal || item.entitlement_value || "";
          const extraProps = Object.entries(item).filter(([k, _]) => k !== "name" && k !== "displayName" && k !== "id" && k !== "code" && k !== "description" && k !== "descriptionVal");

          return (
            <div key={idx} className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-850 p-4 rounded-xl space-y-2 hover:border-pink-500/30 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-bold text-slate-100 truncate">{title}</div>
                  {id && (
                    <div className="text-[9px] font-mono text-slate-500">ID: {id}</div>
                  )}
                </div>
                <span className="bg-slate-800 text-slate-400 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide shrink-0">
                  {resource.type}
                </span>
              </div>
              
              {desc && (
                <p className="text-[10px] text-slate-300 leading-relaxed bg-slate-900/50 p-2 rounded-lg border border-slate-900/20 italic">
                  {desc}
                </p>
              )}

              {extraProps.length > 0 && (
                <div className="border-t border-slate-900/60 pt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[9px]">
                  {extraProps.map(([k, v]) => (
                    <div key={k} className="flex flex-col truncate">
                      <span className="text-slate-500 uppercase font-semibold text-[8px] tracking-wider">{k.replace(/([A-Z])/g, " $1")}</span>
                      {typeof v === "object" ? (
                        <span 
                          className="font-mono text-pink-400 truncate cursor-help border-b border-pink-550/20 w-fit"
                          title={JSON.stringify(v, null, 2)}
                        >
                          {Array.isArray(v) ? `Array(${v.length})` : "Object"}
                        </span>
                      ) : (
                        <span className="font-mono text-slate-300 truncate" title={String(v)}>
                          {String(v)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleTestApi = async () => {
    if (!selectedApi) return;
    const activeCreds = creds[credTab];
    if (!activeCreds.url?.trim()) {
      setTestApiResponse({
        success: false,
        error: "Please enter a valid Saviynt Tenant URL in the fields below before testing.",
        reachable: false
      });
      return;
    }
    setTestApiLoading(true);
    setTestApiResponse(null);
    try {
      const payload = {
        env: credTab,
        url: activeCreds.url,
        username: activeCreds.username,
        password: activeCreds.password,
        apiPath: selectedApi.url,
        method: selectedApi.method
      };

      const res = await fetch("/api/day0/tenant-credentials/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "API test request failed");
      }

      const data = await res.json();
      setTestApiResponse(data);
      showToast("API call successfully completed!", "success");
    } catch (err: any) {
      setTestApiResponse({
        success: false,
        error: err.message || "An unexpected error occurred during API testing."
      });
      showToast(err.message || "API call failed", "error");
    } finally {
      setTestApiLoading(false);
    }
  };

  return (
    <Day0Shell
      title="Saviynt REST API Workspace"
      subtitle="Discover, edit, and onboard Saviynt REST API definitions mapped in the Chicago baseline collection."
      backTo="/wizard/day0"
      widthClass="max-w-7xl"
    >
      <div className="relative grid grid-cols-[320px_1fr] gap-8 min-h-[640px] items-stretch">
        
        {/* LEFT COLUMN: API TREE EXPLORER */}
        <div className="flex flex-col gap-4 border-r border-slate-800 pr-6 min-h-[600px]">
          
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-300">API Explorer</span>
            
            {userRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN" && (
              <div className="flex items-center gap-2">
                <label
                  className="
                    px-2.5 py-1 text-[11px] font-bold rounded-lg text-slate-300 border border-slate-800
                    bg-slate-900/50 hover:bg-slate-800 hover:text-white cursor-pointer
                    transition duration-150 shadow-sm flex items-center gap-1
                  "
                >
                  <span>📥</span> Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportCollection}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => {
                    setCreateHeaders([{ key: "", value: "", description: "" }]);
                    setShowCreateModal(true);
                  }}
                  className="
                    px-2.5 py-1 text-[11px] font-bold rounded-lg text-white
                    bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                    transition duration-150 shadow-md flex items-center gap-1
                  "
                >
                  <span>＋</span> New API
                </button>
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search REST definitions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="
                w-full pl-8 pr-4 py-2 text-xs rounded-xl bg-slate-950/70 border border-slate-800/80
                text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/80
                focus:shadow-[0_0_8px_rgba(59,130,246,0.15)] transition duration-200
              "
            />
            <span className="absolute left-2.5 top-2.5 text-slate-500 text-xs">🔍</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Explorer Scroll Area */}
          <div className="flex-1 overflow-y-auto max-h-[520px] pr-2 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin" />
                <span className="text-xs text-slate-500">Parsing saviynt_api.json...</span>
              </div>
            ) : apis.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                No API definitions found.
              </div>
            ) : (
              <div className="w-full flex flex-col">
                {renderTreeNode(apiTree)}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: VIEWER AND EDITOR PANEL */}
        <div className="flex flex-col min-h-[600px]">
          
          {selectedApi ? (
            <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
              
              {/* Header Details */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/30 flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  
                  {/* Folder Breadcrumbs */}
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider overflow-x-auto whitespace-nowrap">
                    <span>Chicago Release</span>
                    {selectedApi.folderPath.map(folder => (
                      <span key={folder} className="flex items-center gap-1.5">
                        <span>/</span>
                        <span className="text-slate-400">{folder}</span>
                      </span>
                    ))}
                  </div>

                  <h2 className="text-lg font-bold text-slate-100 truncate">
                    {selectedApi.name}
                  </h2>
                </div>

                {/* Tab switch */}
                <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800/80">
                  <button
                    onClick={() => setActiveTab("view")}
                    className={`
                      px-4 py-1.5 text-xs font-semibold rounded-md transition duration-150
                      ${activeTab === "view" ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"}
                    `}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => setActiveTab("test")}
                    className={`
                      px-4 py-1.5 text-xs font-semibold rounded-md transition duration-150
                      ${activeTab === "test" ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"}
                    `}
                  >
                    Test API
                  </button>
                  {userRole.replace(/\s+|_/g, "").toUpperCase() === "SUPERADMIN" && (
                    <button
                      onClick={() => setActiveTab("edit")}
                      className={`
                        px-4 py-1.5 text-xs font-semibold rounded-md transition duration-150
                        ${activeTab === "edit" ? "bg-slate-800 text-blue-400" : "text-slate-400 hover:text-slate-200"}
                      `}
                    >
                      Edit Definition
                    </button>
                  )}
                </div>
              </div>

              {/* View Tab Body */}
              {activeTab === "view" && (
                <div className="p-6 flex-1 overflow-y-auto max-h-[500px] flex flex-col gap-6 scrollbar-thin">
                  
                  {/* Endpoint Row */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Endpoint Target URL</span>
                    <div className="flex items-stretch bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                      <span className={`px-4 flex items-center font-bold text-xs ${getMethodBadge(selectedApi.method)}`}>
                        {selectedApi.method}
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={selectedApi.url}
                        className="flex-1 bg-transparent border-none text-xs font-mono px-3 py-2.5 text-sky-400 outline-none select-all"
                      />
                      <button
                        onClick={() => copyToClipboard(selectedApi.url)}
                        className="px-4 border-l border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition bg-slate-900/50"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>

                  {/* Description Box */}
                  {selectedApi.description && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Method Description</span>
                      <div 
                        className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/60 text-xs text-slate-300 leading-relaxed max-h-[140px] overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: selectedApi.description }}
                      />
                    </div>
                  )}

                  {/* Headers Block */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Request Headers</span>
                    {selectedApi.headers.length === 0 ? (
                      <div className="text-xs text-slate-500 italic px-4 py-2 bg-slate-950/20 rounded-xl border border-slate-800/40">
                        No headers required for this request.
                      </div>
                    ) : (
                      <div className="overflow-hidden border border-slate-800/80 rounded-xl">
                        <table className="w-full text-left border-collapse bg-slate-950/20">
                          <thead>
                            <tr className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-800">
                              <th className="px-4 py-2">Header Key</th>
                              <th className="px-4 py-2">Typical Value</th>
                              <th className="px-4 py-2">Role/Purpose</th>
                            </tr>
                          </thead>
                          <tbody className="text-xs text-slate-300 divide-y divide-slate-800/40">
                            {selectedApi.headers.map((h, i) => (
                              <tr key={i} className="hover:bg-slate-900/30">
                                <td className="px-4 py-2.5 font-mono text-slate-300">{h.key}</td>
                                <td className="px-4 py-2.5 font-mono text-blue-400">{h.value}</td>
                                <td className="px-4 py-2.5 text-slate-400">{h.description || "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Request Body Code Block */}
                  {selectedApi.bodyMode !== "none" && selectedApi.bodyRaw && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                        Request Raw Body ({selectedApi.bodyMode})
                      </span>
                      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-sky-300 overflow-x-auto max-h-[220px] scrollbar-thin select-all">
                        {selectedApi.bodyRaw}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Tab Body */}
              {activeTab === "edit" && (
                <div className="p-6 flex-1 overflow-y-auto max-h-[500px] flex flex-col gap-5 scrollbar-thin">
                  
                  {/* Name + Method */}
                  <div className="grid grid-cols-[1fr_120px] gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">API Endpoint Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="
                          px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200
                          focus:outline-none focus:border-blue-500
                        "
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">HTTP Method</label>
                      <select
                        value={editMethod}
                        onChange={e => setEditMethod(e.target.value)}
                        className="
                          px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200
                          focus:outline-none focus:border-blue-500
                        "
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                        <option value="PATCH">PATCH</option>
                      </select>
                    </div>
                  </div>

                  {/* Folder path */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Folder Directory</label>
                    <div className="grid grid-cols-1 gap-2">
                      {!isEditingCustomFolder ? (
                        <div className="flex gap-2">
                          <select
                            value={editFolderText}
                            onChange={e => setEditFolderText(e.target.value)}
                            className="
                              flex-1 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200
                              focus:outline-none focus:border-blue-500
                            "
                          >
                            {availableFolders.map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setIsEditingCustomFolder(true)}
                            className="px-3 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            ✎ Custom Folder Path
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editFolderText}
                            onChange={e => setEditFolderText(e.target.value)}
                            placeholder="e.g. 3.0 Identity Administration / Users"
                            className="
                              flex-1 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200
                              focus:outline-none focus:border-blue-500
                            "
                          />
                          <button
                            type="button"
                            onClick={() => setIsEditingCustomFolder(false)}
                            className="px-3 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            ✕ Cancel
                          </button>
                        </div>
                      )}
                      <span className="text-[10px] text-slate-500">
                        Separate subdirectories with a forward slash (e.g. <code>Parent / Child</code>).
                      </span>
                    </div>
                  </div>

                  {/* Raw URL */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Request Raw URL</label>
                    <input
                      type="text"
                      value={editUrl}
                      onChange={e => setEditUrl(e.target.value)}
                      className="
                        w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-sky-300
                        focus:outline-none focus:border-blue-500
                      "
                    />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Description (Markdown / HTML)</label>
                    <textarea
                      value={editDescription}
                      onChange={e => setEditDescription(e.target.value)}
                      rows={3}
                      className="
                        w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200
                        focus:outline-none focus:border-blue-500 font-sans resize-y
                      "
                    />
                  </div>

                  {/* Headers Editor */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Request Headers List</span>
                      <button
                        onClick={addHeaderRow}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                      >
                        ＋ Add Header Row
                      </button>
                    </div>

                    <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {editHeaders.map((h, i) => (
                        <div key={i} className="grid grid-cols-[140px_140px_1fr_40px] gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Key (e.g. Content-Type)"
                            value={h.key}
                            onChange={e => updateHeaderRow(i, "key", e.target.value)}
                            className="px-2.5 py-1.5 text-[11px] font-mono rounded-md bg-slate-950 border border-slate-850 text-slate-200 outline-none focus:border-blue-500/50"
                          />
                          <input
                            type="text"
                            placeholder="Value (e.g. application/json)"
                            value={h.value}
                            onChange={e => updateHeaderRow(i, "value", e.target.value)}
                            className="px-2.5 py-1.5 text-[11px] font-mono rounded-md bg-slate-950 border border-slate-850 text-blue-400 outline-none focus:border-blue-500/50"
                          />
                          <input
                            type="text"
                            placeholder="Header Description/Role"
                            value={h.description || ""}
                            onChange={e => updateHeaderRow(i, "description", e.target.value)}
                            className="px-2.5 py-1.5 text-[11px] rounded-md bg-slate-950 border border-slate-850 text-slate-400 outline-none focus:border-blue-500/50"
                          />
                          <button
                            type="button"
                            onClick={() => removeHeaderRow(i)}
                            className="text-xs text-rose-500 hover:text-rose-400"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Body Editor */}
                  <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Request Body Selection</span>
                      <div className="flex gap-2">
                        {["none", "raw"].map(mode => (
                          <label key={mode} className="flex items-center gap-1 text-xs text-slate-300 capitalize cursor-pointer">
                            <input
                              type="radio"
                              name="editBodyMode"
                              value={mode}
                              checked={editBodyMode === mode}
                              onChange={() => setEditBodyMode(mode)}
                              className="accent-blue-500"
                            />
                            {mode}
                          </label>
                        ))}
                      </div>
                    </div>

                    {editBodyMode === "raw" && (
                      <div className="flex flex-col gap-1">
                        <textarea
                          placeholder="Place your raw JSON body definition here..."
                          value={editBodyRaw}
                          onChange={e => setEditBodyRaw(e.target.value)}
                          rows={6}
                          className="
                            w-full p-3 font-mono text-xs rounded-lg bg-slate-950 border border-slate-800 text-sky-300
                            focus:outline-none focus:border-blue-500 resize-y
                          "
                        />
                        {jsonError ? (
                          <span className="text-[10px] text-red-500 font-semibold">
                            ⚠️ Invalid JSON Body Format: {jsonError}
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-500 font-semibold">
                            ✓ JSON syntax is valid.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Save row */}
                  <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 mt-2">
                    <button
                      onClick={() => setActiveTab("view")}
                      className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving || !!jsonError}
                      className={`
                        px-6 py-2 text-xs font-bold rounded-lg text-white transition-all
                        ${
                          saving || !!jsonError
                            ? "bg-slate-800 cursor-not-allowed opacity-50"
                            : "bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-500/10"
                        }
                      `}
                    >
                      {saving ? "Overwriting..." : "Save Definition"}
                    </button>
                  </div>

                </div>
              )}

              {/* Test Tab Body */}
              {activeTab === "test" && (
                <div className="p-6 flex-1 overflow-y-auto max-h-[500px] flex flex-col gap-6 scrollbar-thin">
                  
                  {/* Environment Tabs */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">
                      Saviynt Environment Workspace
                    </span>
                    <div className="flex gap-2 border-b pb-1 border-slate-800">
                      {(["DEV", "PRE", "PROD"] as CredEnv[]).map(env => {
                        const filled = !!(creds[env].url && creds[env].username);
                        return (
                          <button
                            key={env}
                            type="button"
                            onClick={() => setCredTab(env)}
                            className={`px-4 py-1.5 rounded-t-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
                              credTab === env
                                ? "border-pink-500 text-pink-400"
                                : "border-transparent text-slate-500 hover:text-slate-350"
                            }`}
                          >
                            {filled ? (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" />
                            )}
                            {env}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Credentials Fields */}
                  <div className="bg-slate-950/40 border border-slate-855 p-4 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Tenant URL
                        </label>
                        <input
                          type="url"
                          value={creds[credTab].url}
                          onChange={e => setCreds(prev => ({ ...prev, [credTab]: { ...prev[credTab], url: e.target.value } }))}
                          placeholder="https://tenant-name.saviyntcloud.com"
                          className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            value={creds[credTab].username}
                            onChange={e => setCreds(prev => ({ ...prev, [credTab]: { ...prev[credTab], username: e.target.value } }))}
                            placeholder="admin"
                            className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-pink-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type={showPwd[credTab] ? "text" : "password"}
                              value={creds[credTab].password}
                              onChange={e => setCreds(prev => ({ ...prev, [credTab]: { ...prev[credTab], password: e.target.value } }))}
                              placeholder={creds[credTab].password === "••••••••" ? "Already set — type to change" : "Password"}
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 pr-10 text-xs font-mono text-slate-200 focus:outline-none focus:border-pink-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPwd(p => ({ ...p, [credTab]: !p[credTab] }))}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-[10px]"
                            >
                              {showPwd[credTab] ? "🙈" : "👁️"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Target Endpoint & Execute Row */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target API Path</span>
                    <div className="flex items-stretch bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                      <span className={`px-4 flex items-center font-bold text-xs ${getMethodBadge(selectedApi.method)}`}>
                        {selectedApi.method}
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={selectedApi.url}
                        className="flex-1 bg-transparent border-none text-xs font-mono px-3 py-2.5 text-sky-400 outline-none select-all"
                      />
                      <button
                        type="button"
                        disabled={testApiLoading}
                        onClick={handleTestApi}
                        className="px-5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-[10px] font-bold uppercase disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shrink-0 flex items-center justify-center gap-1"
                      >
                        {testApiLoading ? "⚡ Requesting..." : "⚡ Execute API Call"}
                      </button>
                    </div>
                  </div>

                  {/* Body Preview */}
                  {selectedApi.bodyMode !== "none" && selectedApi.bodyRaw && (
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Request Body Payload ({selectedApi.bodyMode})
                      </span>
                      <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-850 font-mono text-[10.5px] text-sky-355 overflow-x-auto max-h-[140px] scrollbar-thin select-all">
                        {selectedApi.bodyRaw}
                      </pre>
                    </div>
                  )}

                  {/* Response Container */}
                  {testApiResponse && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3 mt-1 animate-fadeIn">
                      
                      {/* Connection header status */}
                      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2 w-2 rounded-full ${testApiResponse.reachable ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Connection Status: {testApiResponse.reachable ? "REACHABLE" : "UNREACHABLE"}
                          </span>
                        </div>
                        {testApiResponse.token && (
                          <span className="bg-pink-950/40 text-pink-400 border border-pink-850 px-2 py-0.5 rounded text-[8.5px] font-bold font-mono uppercase tracking-wider">
                            Authenticated
                          </span>
                        )}
                      </div>

                      {/* Connection errors if any */}
                      {testApiResponse.error && (
                        <div className="text-[10px] text-red-400 font-mono leading-relaxed bg-red-950/20 border border-red-900/30 p-2.5 rounded-xl">
                          ⚠ {testApiResponse.error}
                        </div>
                      )}

                      {/* Response Payload and Formatting Viewers */}
                      {(testApiResponse.apiResponse || testApiResponse.authResponse) && (
                        <div className="space-y-3">
                          
                          {/* Format Selector Row */}
                          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                            <span className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">
                              Response Visualization:
                            </span>
                            <div className="flex gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
                              {(["json", "table", "cards"] as const).map(fmt => (
                                <button
                                  key={fmt}
                                  type="button"
                                  onClick={() => setResponseFormat(fmt)}
                                  className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                                    responseFormat === fmt
                                      ? "bg-pink-600 text-white shadow-sm font-black"
                                      : "text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  {fmt}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Render response output */}
                          <div className="animate-fadeIn">
                            {responseFormat === "json" ? (
                              <div className="space-y-1">
                                <div className="font-mono text-[10.5px] leading-relaxed text-slate-300 bg-slate-950 max-h-[260px] overflow-y-auto p-3.5 rounded-xl border border-slate-900 shadow-inner select-text select-all">
                                  <pre>{JSON.stringify(testApiResponse.apiResponse || testApiResponse.authResponse, null, 2)}</pre>
                                </div>
                              </div>
                            ) : responseFormat === "table" ? (
                              renderResponseTable(testApiResponse.apiResponse || testApiResponse.authResponse)
                            ) : (
                              renderResponseCards(testApiResponse.apiResponse || testApiResponse.authResponse)
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            /* EMPTY VIEW SELECTION STATE */
            <div className="flex flex-col items-center justify-center flex-1 p-10 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800/80 text-center">
              <span className="text-5xl mb-4 animate-float">⚡</span>
              <h3 className="text-base font-bold text-slate-200 mb-1">
                No API Selection Targeted
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6">
                Click a leaf endpoint inside the folder categories on the left index to inspect, edit, or copy its operational variables.
              </p>
              
              <button
                onClick={() => {
                  setCreateHeaders([{ key: "", value: "", description: "" }]);
                  setShowCreateModal(true);
                }}
                className="
                  px-4 py-2 text-xs font-bold rounded-lg text-white
                  bg-blue-600 hover:bg-blue-500 transition shadow-lg
                "
              >
                ＋ Onboard Fresh API Endpoint
              </button>
            </div>
          )}

        </div>

      </div>

      {/* CREATE API DIALOG / MODAL PANEL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-fade-in-up">
            
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Onboard New Saviynt REST API Definition</h3>
                <p className="text-[11px] text-slate-500">Add a new REST API endpoint to the Saviynt Postman collection.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Content Explorer Scroll */}
            <div className="flex flex-col gap-4 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
              
              {/* Name + Method */}
              <div className="grid grid-cols-[1fr_120px] gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">API Endpoint Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Get User Accounts"
                    value={createName}
                    onChange={e => setCreateName(e.target.value)}
                    className="
                      px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-850 text-slate-200
                      focus:outline-none focus:border-blue-500
                    "
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">HTTP Method</label>
                  <select
                    value={createMethod}
                    onChange={e => setCreateMethod(e.target.value)}
                    className="
                      px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-850 text-slate-200
                      focus:outline-none focus:border-blue-500
                    "
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>

              {/* Folder */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Folder Directory</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    list="folderSuggestions"
                    placeholder="e.g. 3.0 Identity Administration / Users"
                    value={createFolderText}
                    onChange={e => setCreateFolderText(e.target.value)}
                    className="
                      flex-1 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-850 text-slate-200
                      focus:outline-none focus:border-blue-500
                    "
                  />
                  <datalist id="folderSuggestions">
                    {availableFolders.map(f => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </div>
                <span className="text-[10px] text-slate-500">
                  Select an existing folder path or type a new path (levels separated by /).
                </span>
              </div>

              {/* Raw URL */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Request Raw URL</label>
                <input
                  type="text"
                  placeholder="e.g. {{url}}/ECM/api/v5/getUserAccounts"
                  value={createUrl}
                  onChange={e => setCreateUrl(e.target.value)}
                  className="
                    w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-850 text-sky-300
                    focus:outline-none focus:border-blue-500
                  "
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description (Markdown / HTML)</label>
                <textarea
                  placeholder="Explain request query limits or variables..."
                  value={createDescription}
                  onChange={e => setCreateDescription(e.target.value)}
                  rows={2}
                  className="
                    w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-850 text-slate-200
                    focus:outline-none focus:border-blue-500 font-sans resize-y
                  "
                />
              </div>

              {/* Headers Creator */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Request Headers List</span>
                  <button
                    onClick={addCreateHeaderRow}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                  >
                    ＋ Add Header Row
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {createHeaders.map((h, i) => (
                    <div key={i} className="grid grid-cols-[140px_140px_1fr_40px] gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Key (e.g. Authorization)"
                        value={h.key}
                        onChange={e => updateCreateHeaderRow(i, "key", e.target.value)}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-slate-950 border border-slate-850 text-slate-200 outline-none focus:border-blue-500/50"
                      />
                      <input
                        type="text"
                        placeholder="Value (e.g. Bearer Token)"
                        value={h.value}
                        onChange={e => updateCreateHeaderRow(i, "value", e.target.value)}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-slate-950 border border-slate-850 text-blue-400 outline-none focus:border-blue-500/50"
                      />
                      <input
                        type="text"
                        placeholder="Purpose"
                        value={h.description || ""}
                        onChange={e => updateCreateHeaderRow(i, "description", e.target.value)}
                        className="px-2 py-1 text-[11px] rounded bg-slate-950 border border-slate-850 text-slate-400 outline-none focus:border-blue-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => removeCreateHeaderRow(i)}
                        className="text-xs text-rose-500 hover:text-rose-400"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Body Creator */}
              <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Request Body Selection</span>
                  <div className="flex gap-2">
                    {["none", "raw"].map(mode => (
                      <label key={mode} className="flex items-center gap-1 text-xs text-slate-300 capitalize cursor-pointer">
                        <input
                          type="radio"
                          name="createBodyMode"
                          value={mode}
                          checked={createBodyMode === mode}
                          onChange={() => setCreateBodyMode(mode)}
                          className="accent-blue-500"
                        />
                        {mode}
                      </label>
                    ))}
                  </div>
                </div>

                {createBodyMode === "raw" && (
                  <div className="flex flex-col gap-1">
                    <textarea
                      placeholder='{ "key": "value" }'
                      value={createBodyRaw}
                      onChange={e => setCreateBodyRaw(e.target.value)}
                      rows={4}
                      className="
                        w-full p-3 font-mono text-xs rounded-lg bg-slate-950 border border-slate-850 text-sky-300
                        focus:outline-none focus:border-blue-500 resize-y
                      "
                    />
                    {createJsonError ? (
                      <span className="text-[10px] text-red-500 font-semibold">
                        ⚠️ Invalid JSON Body Format: {createJsonError}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 font-semibold">
                        ✓ JSON syntax is valid.
                      </span>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateApi}
                disabled={saving || !createName || !!createJsonError}
                className={`
                  px-6 py-2 text-xs font-bold rounded-lg text-white transition-all
                  ${
                    saving || !createName || !!createJsonError
                      ? "bg-slate-800 cursor-not-allowed opacity-50"
                      : "bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-md"
                  }
                `}
              >
                {saving ? "Writing..." : "Add to Collection"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TOAST SYSTEM CONTAINER */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              p-4 rounded-xl shadow-xl text-xs font-semibold border flex items-center gap-2.5
              animate-fade-in-up pointer-events-auto backdrop-blur-md transition-all duration-300
              ${
                toast.type === "success"
                  ? "bg-emerald-950/80 border-emerald-500/20 text-emerald-300 shadow-emerald-900/10"
                  : toast.type === "error"
                  ? "bg-rose-950/80 border-rose-500/20 text-rose-300 shadow-rose-900/10"
                  : "bg-slate-950/80 border-slate-800/80 text-blue-300 shadow-slate-900/10"
              }
            `}
          >
            <span>
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span className="flex-1 leading-normal">{toast.text}</span>
          </div>
        ))}
      </div>

    </Day0Shell>
  );
}
