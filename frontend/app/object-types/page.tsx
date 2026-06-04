"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
import { useWizardStore } from "../store/wizardstore";
import WizardStepper from "../components/WizardStepper";


const AVAILABLE_TYPES = [
  "Account",
  "Entitlement",
  "Role",
  "UserGroup",
  "Application",
  "Endpoint",
];

export default function ObjectTypesPage() {
  const router = useRouter();
  const setObjectTypesState = (selected: string[]) => {};

  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleType(type: string) {
    setSelected((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.setObjectTypes(selected);
      setObjectTypesState(selected);
      router.push("/summary");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-3xl font-semibold mb-6">Select Object Types</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {AVAILABLE_TYPES.map((type) => (
            <label
              key={type}
              className="flex items-center space-x-3 p-2 border rounded-md hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(type)}
                onChange={() => toggleType(type)}
                className="h-4 w-4"
              />
              <span>{type}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || selected.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
