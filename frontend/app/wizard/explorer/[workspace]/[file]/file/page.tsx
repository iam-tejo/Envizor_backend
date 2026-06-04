"use client";

import Day0Shell from "../../../../day0/Day0Shell";

export default function FileViewerPage({ params }: any) {
  const { workspace, file } = params;

  return (
    <Day0Shell
      title={`File: ${file}`}
      subtitle={`Workspace: ${workspace}`}
    >
      <div className="grid grid-cols-[260px_1fr] gap-8">

        {/* LEFT SIDEBAR */}
        <div className="flex flex-col gap-8 border-r pr-4" style={{ borderColor: "var(--border)" }}>

          {/* WORKSPACE SELECTOR */}
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Workspace</div>

            <select
              defaultValue={workspace}
              className="
                border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:border-blue-500
              "
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
            >
              <option>DEV</option>
              <option>PRE</option>
              <option>PROD</option>
            </select>
          </div>

          {/* FOLDER TREE */}
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Folders</div>

            <div className="max-h-[400px] overflow-auto border rounded-lg shadow-sm p-3"
                 style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
              {/* TODO: Render folder tree */}
              <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Directory hierarchy</span>
            </div>
          </div>

          {/* FILE ACTIONS */}
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Actions</div>

            <div className="flex flex-col gap-2">
              <button className="px-3 py-2 rounded-lg border transition hover:opacity-85 text-xs font-bold cursor-pointer"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                Rename
              </button>
              <button className="px-3 py-2 rounded-lg border transition hover:opacity-85 text-xs font-bold cursor-pointer"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                Duplicate
              </button>
              <button className="px-3 py-2 rounded-lg border transition hover:opacity-85 text-xs font-bold cursor-pointer"
                      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}>
                Download
              </button>
              <button className="px-3 py-2 rounded-lg bg-red-950/20 text-red-400 border border-red-900/50 hover:bg-red-950/30 transition text-xs font-bold cursor-pointer">
                Delete
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-6">

          {/* FILE CONTENT */}
          <div className="border rounded-lg shadow-sm p-4"
               style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
            {/* TODO: Render file content */}
            <pre className="text-sm" style={{ color: "var(--text-primary)" }}>File content goes here…</pre>
          </div>

          {/* METADATA */}
          <div className="border rounded-lg shadow-sm p-4"
               style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Metadata</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Size: 0 Bytes | Type: HCL</div>
          </div>

        </div>

      </div>
    </Day0Shell>
  );
}
