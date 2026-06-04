"use client";

import { useEffect, useState } from "react";

export default function EnvironmentDiffPage() {
  const [leftEnv, setLeftEnv] = useState("DEV");
  const [rightEnv, setRightEnv] = useState("PRE");

  const [summary, setSummary] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const [leftContent, setLeftContent] = useState<string | null>(null);
  const [rightContent, setRightContent] = useState<string | null>(null);

  // Fetch summary diff
  useEffect(() => {
    async function loadSummary() {
      const res = await fetch(
        `/api/day0/diff?left=${leftEnv}&right=${rightEnv}`
      );
      const data = await res.json();
      setSummary(data);
      setSelectedFile(null);
      setLeftContent(null);
      setRightContent(null);
    }
    loadSummary();
  }, [leftEnv, rightEnv]);

  // Fetch file diff
  useEffect(() => {
    if (!selectedFile) return;

    async function loadFile() {
      const res = await fetch(
        `/api/day0/diff/file?left=${leftEnv}&right=${rightEnv}&path=${selectedFile}`
      );
      const data = await res.json();
      setLeftContent(data.leftContent);
      setRightContent(data.rightContent);
    }

    loadFile();
  }, [selectedFile, leftEnv, rightEnv]);

  // Merge file lists with unique keys
  const mergedFiles =
    summary
      ? [
          ...summary.onlyLeft.map((f: string) => ({ f, k: `left-${f}` })),
          ...summary.onlyRight.map((f: string) => ({ f, k: `right-${f}` })),
          ...summary.different.map((f: string) => ({ f, k: `diff-${f}` })),
          ...summary.same.map((f: string) => ({ f, k: `same-${f}` })),
        ]
      : [];

  return (
    <div className="flex flex-col gap-8">
      {/* Environment Selectors */}
      <div className="flex gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Left</label>
          <select
            className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm"
            value={leftEnv}
            onChange={(e) => setLeftEnv(e.target.value)}
          >
            <option>DEV</option>
            <option>PRE</option>
            <option>PROD</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Right</label>
          <select
            className="mt-1 block w-40 rounded-md border-gray-300 shadow-sm"
            value={rightEnv}
            onChange={(e) => setRightEnv(e.target.value)}
          >
            <option>DEV</option>
            <option>PRE</option>
            <option>PROD</option>
          </select>
        </div>
      </div>

      {/* Summary Tiles */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <SummaryTile label="Only Left" count={summary.onlyLeft.length} />
          <SummaryTile label="Only Right" count={summary.onlyRight.length} />
          <SummaryTile label="Different" count={summary.different.length} />
          <SummaryTile label="Same" count={summary.same.length} />
        </div>
      )}

      {/* File List + Diff Viewer */}
      <div className="grid grid-cols-3 gap-6">
        {/* File List */}
        <div className="col-span-1 border rounded-lg bg-white shadow-sm p-4 h-[600px] overflow-auto">
          <h3 className="font-semibold mb-3">Files</h3>

          {mergedFiles.map(({ f, k }) => (
            <div
              key={k}
              onClick={() => setSelectedFile(f)}
              className={`cursor-pointer px-2 py-1 rounded hover:bg-gray-100 ${
                selectedFile === f ? "bg-gray-200" : ""
              }`}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Diff Viewer */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <DiffPane title={leftEnv} content={leftContent} />
          <DiffPane title={rightEnv} content={rightContent} />
        </div>
      </div>
    </div>
  );
}

/* Summary Tile Component */
function SummaryTile({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl bg-white border shadow-sm p-4 text-center">
      <div className="text-2xl font-bold text-blue-600">{count}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

/* Diff Pane Component */
function DiffPane({ title, content }: { title: string; content: string | null }) {
  return (
    <div className="border rounded-lg bg-white shadow-sm h-[600px] overflow-auto">
      <div className="px-4 py-2 border-b bg-gray-50 font-semibold">{title}</div>
      <pre className="p-4 text-sm whitespace-pre-wrap">{content}</pre>
    </div>
  );
}
