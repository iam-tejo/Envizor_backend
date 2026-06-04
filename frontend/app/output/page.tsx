"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";

export default function OutputPage() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOutput() {
      try {
        const data = { files: {} as Record<string, string>, logs: [] as string[] };
        setFiles(data.files || {});
        setLogs(data.logs || []);
      } catch (err: any) {
        setError(err.message || "Failed to load output");
      } finally {
        setLoading(false);
      }
    }
    loadOutput();
  }, []);

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center text-gray-700">
        Loading output…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 space-y-10">
      <h1 className="text-3xl font-semibold">Generated Terraform Output</h1>

      {/* FILES */}
      <div className="space-y-6">
        {Object.entries(files).map(([filename, content]) => (
          <div key={filename} className="border rounded-md shadow-sm">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-100 border-b">
              <span className="font-medium">{filename}</span>
              <button
                onClick={() => copy(content)}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Copy
              </button>
            </div>

            <pre className="p-4 text-sm bg-gray-50 overflow-x-auto whitespace-pre-wrap">
              {content}
            </pre>
          </div>
        ))}
      </div>

      {/* LOGS */}
      {logs.length > 0 && (
        <div className="border rounded-md shadow-sm">
          <div className="px-4 py-2 bg-gray-100 border-b">
            <span className="font-medium">Generation Logs</span>
          </div>

          <pre className="p-4 text-sm bg-gray-50 whitespace-pre-wrap">
            {logs.join("\n")}
          </pre>
        </div>
      )}
    </div>
  );
}
