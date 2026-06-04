"use client";

import { useRouter } from "next/navigation";
import { useDay0Store } from "../store";
import Day0Shell from "../Day0Shell";
import "../day0.css";

export default function GeneratePage() {
  const router = useRouter();
  const { results } = useDay0Store();

  if (!results) {
    router.push("/wizard/day0/discovery");
    return null;
  }

  return (
    <Day0Shell
      title="Generate Terraform Workspace"
      subtitle="Create Terraform files and import commands based on discovered artefacts."
    >
      <div className="flex justify-center">
        <button
          className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg"
        >
          Generate TF Files & Import Commands
        </button>
      </div>

      <div className="flex justify-between max-w-3xl mx-auto mt-12">
        <button
          onClick={() => router.push("/wizard/day0/discovery")}
          className="px-8 py-3 rounded-xl bg-gray-200 hover:bg-gray-300"
        >
          ← Back
        </button>

        <button
          onClick={() => router.push("/wizard/day0/success")}
          className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        >
          Finish →
        </button>
      </div>
    </Day0Shell>
  );
}
