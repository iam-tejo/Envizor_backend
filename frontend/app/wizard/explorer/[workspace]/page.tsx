"use client";

import { use, useEffect, useState } from "react";
import Day0Shell from "../../day0/Day0Shell";
import CatppuccinIcon from "@/app/components/CatppuccinIcon";

export default function WorkspaceExplorerPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  // ⭐ FIX: unwrap params using React.use()
  const { workspace } = use(params);

  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!workspace) return;

    fetch(`/api/workspaces/${workspace}`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, [workspace]);

  return (
    <Day0Shell
      title={`Workspace: ${workspace}`}
      subtitle="Browse folders and files."
    >
      <div className="grid grid-cols-[260px_1fr] gap-8">

        {/* LEFT SIDEBAR */}
        <div className="flex flex-col gap-8 border-r pr-4">
          {/* Add your sidebar content here */}
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col gap-4">
          {items.length === 0 && (
            <div className="text-gray-500">No files or folders found.</div>
          )}

          {items.map((item: any) => (
            <div
              key={item.name}
              className="border rounded-lg shadow-sm p-4 flex justify-between items-center hover:shadow-md transition cursor-pointer"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <CatppuccinIcon name={item.name} type={item.type === "folder" ? "folder" : "file"} className="w-5 h-5" />
                <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{item.name}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </Day0Shell>
  );
}
