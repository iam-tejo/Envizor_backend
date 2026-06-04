"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WizardStepper from "../components/WizardStepper";
import { api } from "@/app/lib/api";
import { useWizardStore } from "../store/wizardstore";

export default function WorkspacePage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setWorkspaceState = useWizardStore((s) => s.setWorkspace);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.setWorkspace(workspace);
      setWorkspaceState(workspace);
      router.push("/environment");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <WizardStepper />

      <div className="max-w-xl mx-auto mt-10">
        <h1 className="text-3xl font-semibold mb-6">Select Workspace</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Workspace Name or Path
            </label>

            <input
              type="text"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              placeholder="e.g. my-workspace"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </>
  );
}
