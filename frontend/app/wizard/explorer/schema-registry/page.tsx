"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Day0Shell from "../../day0/Day0Shell";

interface FieldDefinition {
  name: string;
  hclKey: string;
  type: "string" | "number" | "boolean";
  required?: boolean;
}

interface ResourceSchema {
  key: string;
  resourceName: string;
  displayName: string;
  fields: FieldDefinition[];
}

interface ToastMessage {
  id: string;
  text: string;
  type: "success" | "error" | "info";
}

export default function SaviyntProviderSchemaRegistryPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = sessionStorage.getItem("envizor_username") || "user";
      const overriddenRoles = localStorage.getItem("envizor_custom_roles");
      const rolesMap = overriddenRoles ? JSON.parse(overriddenRoles) : {};
      const latestRole = rolesMap[user.toLowerCase()] || sessionStorage.getItem("envizor_user_role") || "BasicUser";
      
      if (latestRole === "BasicUser") {
        setAuthorized(false);
        router.push("/wizard/steps/welcome");
      } else {
        setAuthorized(true);
      }
    }
  }, [router]);

  const [schemas, setSchemas] = useState<ResourceSchema[]>([]);
  const [filteredSchemas, setFilteredSchemas] = useState<ResourceSchema[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<ResourceSchema | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Editing Resource Info states
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editResourceName, setEditResourceName] = useState("");
  const [editFields, setEditFields] = useState<FieldDefinition[]>([]);

  // Creation Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createKey, setCreateKey] = useState("");
  const [createDisplayName, setCreateDisplayName] = useState("");
  const [createResourceName, setCreateResourceName] = useState("");
  const [createFields, setCreateFields] = useState<FieldDefinition[]>([
    { name: "id", hclKey: "id", type: "string" },
    { name: "name", hclKey: "name", type: "string" }
  ]);

  // Fetch schemas on load
  async function fetchSchemas() {
    try {
      setLoading(true);
      const res = await fetch("/api/explorer/schema-registry");
      if (!res.ok) throw new Error("Failed to fetch schema definitions");
      const data = await res.json();
      setSchemas(data.schemas || []);
      setFilteredSchemas(data.schemas || []);
      if (data.schemas && data.schemas.length > 0) {
        setSelectedSchema(data.schemas[0]);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to load provider registry", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSchemas();
  }, []);

  // Filter schemas
  useEffect(() => {
    if (!searchQuery) {
      setFilteredSchemas(schemas);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = schemas.filter(
      s =>
        s.displayName.toLowerCase().includes(query) ||
        s.resourceName.toLowerCase().includes(query) ||
        s.key.toLowerCase().includes(query)
    );
    setFilteredSchemas(filtered);
  }, [searchQuery, schemas]);

  // Handle selected schema change
  useEffect(() => {
    if (!selectedSchema) return;
    setEditDisplayName(selectedSchema.displayName);
    setEditResourceName(selectedSchema.resourceName);
    setEditFields(selectedSchema.fields.map(f => ({ ...f })));
  }, [selectedSchema]);

  // Toast helper
  function showToast(text: string, type: "success" | "error" | "info" = "success") {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }

  // Field Edit Actions (Details Panel)
  function addFieldRow() {
    setEditFields(prev => [...prev, { name: "", hclKey: "", type: "string" }]);
  }

  function removeFieldRow(index: number) {
    setEditFields(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }

  function updateFieldRow(index: number, field: keyof FieldDefinition, val: string) {
    setEditFields(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  // Field Creator Actions (Modal Panel)
  function addCreateFieldRow() {
    setCreateFields(prev => [...prev, { name: "", hclKey: "", type: "string" }]);
  }

  function removeCreateFieldRow(index: number) {
    setCreateFields(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }

  function updateCreateFieldRow(index: number, field: keyof FieldDefinition, val: string) {
    setCreateFields(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  }

  // Save changes to JSON file
  async function handleSaveChanges() {
    if (!selectedSchema) return;
    if (!editDisplayName.trim()) {
      showToast("Display name is required.", "error");
      return;
    }
    if (!editResourceName.trim()) {
      showToast("Terraform resource name is required.", "error");
      return;
    }

    // Clean fields
    const cleanedFields = editFields.filter(f => f.name.trim() !== "" && f.hclKey.trim() !== "");
    if (cleanedFields.length === 0) {
      showToast("Resource must contain at least one mapped attribute.", "error");
      return;
    }

    try {
      setSaving(true);
      const updatedSchemas = schemas.map(s => {
        if (s.key === selectedSchema.key) {
          return {
            ...s,
            displayName: editDisplayName,
            resourceName: editResourceName,
            fields: cleanedFields
          };
        }
        return s;
      });

      const res = await fetch("/api/explorer/schema-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemas: updatedSchemas })
      });

      if (!res.ok) throw new Error("Failed to save schema registry updates");
      const data = await res.json();

      setSchemas(data.schemas);
      const updated = data.schemas.find((s: ResourceSchema) => s.key === selectedSchema.key);
      if (updated) setSelectedSchema(updated);

      showToast("Schema mappings successfully persisted to artefacts_schema.json", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update registry", "error");
    } finally {
      setSaving(false);
    }
  }

  // Onboard new Provider Resource Type
  async function handleOnboardResource() {
    if (!createKey.trim()) {
      showToast("Registry identifier key is required.", "error");
      return;
    }
    if (!createDisplayName.trim()) {
      showToast("Display label is required.", "error");
      return;
    }
    if (!createResourceName.trim()) {
      showToast("Terraform resource block name is required.", "error");
      return;
    }

    const cleanedFields = createFields.filter(f => f.name.trim() !== "" && f.hclKey.trim() !== "");
    if (cleanedFields.length === 0) {
      showToast("Resource must contain at least one mapped attribute.", "error");
      return;
    }

    // Check if key already exists
    if (schemas.some(s => s.key === createKey)) {
      showToast("Registry identifier key already exists.", "error");
      return;
    }

    try {
      setSaving(true);
      const newResource: ResourceSchema = {
        key: createKey,
        displayName: createDisplayName,
        resourceName: createResourceName,
        fields: cleanedFields
      };

      const updatedSchemas = [...schemas, newResource];

      const res = await fetch("/api/explorer/schema-registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schemas: updatedSchemas })
      });

      if (!res.ok) throw new Error("Failed to onboard new resource");
      const data = await res.json();

      setSchemas(data.schemas);
      setSelectedSchema(newResource);

      showToast(`Successfully registered ${createResourceName} to Terraform Schema registry!`, "success");
      setShowCreateModal(false);

      // Reset Create Form
      setCreateKey("");
      setCreateDisplayName("");
      setCreateResourceName("");
      setCreateFields([
        { name: "id", hclKey: "id", type: "string" },
        { name: "name", hclKey: "name", type: "string" }
      ]);
    } catch (err: any) {
      showToast(err.message || "Failed to onboard resource", "error");
    } finally {
      setSaving(false);
    }
  }

  if (authorized === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="w-5 h-5 rounded-full border-2 border-slate-800 border-t-sky-500 animate-spin" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <Day0Shell
      title="Terraform Saviynt Provider Schema Registry"
      subtitle="Easily manage the baseline compilation schemas, edit attribute mapping identifiers, and onboard new resource blocks dynamically."
      backTo="/wizard/explorer"
      widthClass="max-w-7xl"
    >
      <div className="grid grid-cols-[320px_1fr] gap-8 min-h-[640px] items-stretch">
        
        {/* LEFT COLUMN: RESOURCE DIRECTORY LIST */}
        <div className="flex flex-col gap-4 border-r border-slate-800 pr-6 min-h-[600px]">
          
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-300">Saviynt Resources</span>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="
                px-2.5 py-1 text-[11px] font-bold rounded-lg text-white
                bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
                transition duration-150 shadow-md flex items-center gap-1
              "
            >
              <span>＋</span> Onboard
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search resource types..."
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

          {/* Directory Scroll Area */}
          <div className="flex-1 overflow-y-auto max-h-[520px] pr-2 scrollbar-thin">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-slate-800 border-t-blue-500 animate-spin" />
                <span className="text-xs text-slate-500">Reading registry config...</span>
              </div>
            ) : filteredSchemas.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500">
                No resource definitions match your search query.
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                {filteredSchemas.map(s => {
                  const isSelected = selectedSchema?.key === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setSelectedSchema(s)}
                      className={`
                        flex flex-col gap-1 w-full text-left px-3 py-2 rounded-xl border transition duration-150 group
                        ${
                          isSelected
                            ? "bg-blue-600/15 border-blue-500/40 text-blue-300 shadow-sm"
                            : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
                        }
                      `}
                    >
                      <span className="text-xs font-bold truncate">{s.displayName}</span>
                      <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 truncate">
                        {s.resourceName}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ATTRIBUTES & MAPPINGS EDITOR */}
        <div className="flex flex-col min-h-[600px]">
          
          {selectedSchema ? (
            <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm p-6 gap-6">
              
              <div className="flex flex-col gap-1.5 border-b border-slate-800 pb-4">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Terraform Saviynt Provider
                </span>
                <h2 className="text-lg font-bold text-slate-100">
                  {editDisplayName} Schema Mappings
                </h2>
              </div>

              {/* Resource Configuration Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Resource UI Label</label>
                  <input
                    type="text"
                    value={editDisplayName}
                    onChange={e => setEditDisplayName(e.target.value)}
                    className="
                      px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200
                      focus:outline-none focus:border-blue-500
                    "
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Terraform Provider Block Name</label>
                  <input
                    type="text"
                    value={editResourceName}
                    onChange={e => setEditResourceName(e.target.value)}
                    className="
                      px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-sky-400
                      focus:outline-none focus:border-blue-500
                    "
                  />
                </div>
              </div>

              {/* Attributes Mapping Table */}
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Attribute Maps List</span>
                  <button
                    onClick={addFieldRow}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                  >
                    ＋ Add Attribute Map Row
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {editFields.map((f, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_120px_40px] gap-3 items-center">
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="text"
                          placeholder="Saviynt Model property (e.g. securitySystemId)"
                          value={f.name}
                          onChange={e => updateFieldRow(i, "name", e.target.value)}
                          className="px-3 py-1.5 text-xs rounded-md bg-slate-950 border border-slate-850 text-slate-200 outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <input
                          type="text"
                          placeholder="HCL Argument key (e.g. security_system_id)"
                          value={f.hclKey}
                          onChange={e => updateFieldRow(i, "hclKey", e.target.value)}
                          className="px-3 py-1.5 text-xs font-mono rounded-md bg-slate-950 border border-slate-850 text-sky-400 outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <select
                          value={f.type}
                          onChange={e => updateFieldRow(i, "type", e.target.value as any)}
                          className="px-3 py-1.5 text-xs rounded-md bg-slate-950 border border-slate-850 text-slate-300 outline-none focus:border-blue-500/50"
                        >
                          <option value="string">String (HCL)</option>
                          <option value="number">Number (HCL)</option>
                          <option value="boolean">Boolean (HCL)</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFieldRow(i)}
                        className="text-sm text-rose-500 hover:text-rose-400"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4 mt-auto">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className={`
                    px-6 py-2.5 text-xs font-bold rounded-lg text-white transition-all
                    ${
                      saving
                        ? "bg-slate-800 cursor-not-allowed opacity-50"
                        : "bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-500/10"
                    }
                  `}
                >
                  {saving ? "Persisting..." : "Save Schema Changes"}
                </button>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 p-10 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800/80 text-center">
              <span className="text-5xl mb-4 animate-float">⚙️</span>
              <h3 className="text-base font-bold text-slate-200 mb-1">
                No Resource Mappings Targeted
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Choose a Saviynt resource type from the index explorer on the left to modify attribute schemas.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* CREATE MODAL / ONBOARD SAVIYNT RESOURCE TYPE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-fade-in-up animate-duration-200">
            
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">Onboard New Provider Resource Type</h3>
                <p className="text-[11px] text-slate-500">Register a new baseline configuration schema to the Terraform compiler.</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
              
              {/* Key + UI Label */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Registry Key (unique camelCase)</label>
                  <input
                    type="text"
                    placeholder="e.g. organizationUnits"
                    value={createKey}
                    onChange={e => setCreateKey(e.target.value)}
                    className="
                      px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-850 text-slate-200
                      focus:outline-none focus:border-blue-500
                    "
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">UI Display Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Org Units"
                    value={createDisplayName}
                    onChange={e => setCreateDisplayName(e.target.value)}
                    className="
                      px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-850 text-slate-200
                      focus:outline-none focus:border-blue-500
                    "
                  />
                </div>
              </div>

              {/* Resource Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Terraform Provider Block Name</label>
                <input
                  type="text"
                  placeholder="e.g. saviynt_org_unit"
                  value={createResourceName}
                  onChange={e => setCreateResourceName(e.target.value)}
                  className="
                    w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-850 text-sky-400
                    focus:outline-none focus:border-blue-500
                  "
                />
              </div>

              {/* Attributes creator */}
              <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Attributes Config</span>
                  <button
                    onClick={addCreateFieldRow}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold"
                  >
                    ＋ Add Row
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                  {createFields.map((f, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_120px_40px] gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Model Property Name"
                        value={f.name}
                        onChange={e => updateCreateFieldRow(i, "name", e.target.value)}
                        className="px-2 py-1 text-xs rounded bg-slate-950 border border-slate-850 text-slate-200 outline-none focus:border-blue-500/50"
                      />
                      <input
                        type="text"
                        placeholder="HCL Argument key"
                        value={f.hclKey}
                        onChange={e => updateCreateFieldRow(i, "hclKey", e.target.value)}
                        className="px-2 py-1 text-xs font-mono rounded bg-slate-950 border border-slate-850 text-sky-400 outline-none focus:border-blue-500/50"
                      />
                      <select
                        value={f.type}
                        onChange={e => updateCreateFieldRow(i, "type", e.target.value as any)}
                        className="px-2 py-1 text-xs rounded bg-slate-950 border border-slate-850 text-slate-300 outline-none focus:border-blue-500/50"
                      >
                        <option value="string">String</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeCreateFieldRow(i)}
                        className="text-xs text-rose-500 hover:text-rose-400"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 border-t border-slate-800/80 pt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOnboardResource}
                disabled={saving || !createKey || !createDisplayName || !createResourceName}
                className={`
                  px-6 py-2 text-xs font-bold rounded-lg text-white transition-all
                  ${
                    saving || !createKey || !createDisplayName || !createResourceName
                      ? "bg-slate-800 cursor-not-allowed opacity-50"
                      : "bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-md"
                  }
                `}
              >
                {saving ? "Persisting..." : "Register Resource Type"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TOAST SYSTEM ALERTS */}
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
