"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WizardStepper from "../components/WizardStepper";
import { useWizardStore } from "../store/wizardstore";

import {
  CubeIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TruckIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";

export default function SummaryPage() {
  const router = useRouter();
  const selections: any[] = [];

  const [open, setOpen] = useState<Record<string, boolean>>({});

  function toggle(section: string) {
    setOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  const standard = selections.filter((s) => s.operation === "STANDARD");
  const exportOps = selections.filter((s) => s.operation === "EXPORT");
  const importOps = selections.filter((s) => s.operation === "IMPORT");
  const transportOps = selections.filter((s) => s.operation === "TRANSPORT");

  return (
    <>
      <WizardStepper />

      <div className="max-w-4xl mx-auto mt-10 space-y-10 text-gray-900">
        <h1 className="text-3xl font-semibold">Summary</h1>
        <p className="text-gray-600">
          Review your selections before generating Terraform files.
        </p>

        {/* STANDARD */}
        {standard.length > 0 && (
          <section className="border border-gray-300 rounded-lg bg-white shadow">
            <button
              onClick={() => toggle("standard")}
              className="w-full flex justify-between items-center p-4"
            >
              <div className="flex items-center gap-3">
                <CubeIcon className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-semibold">STANDARD Objects</span>
              </div>
              <ChevronDownIcon
                className={`w-6 h-6 transition ${
                  open["standard"] ? "rotate-180" : ""
                }`}
              />
            </button>

            {open["standard"] && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                {standard.map((item, i) => (
                  <div
                    key={i}
                    className="border border-gray-300 p-4 rounded bg-white shadow-sm space-y-2"
                  >
                    <div><strong>Type:</strong> {item.type}</div>
                    <div><strong>Name:</strong> {item.name}</div>

                    {Object.keys(item.attributes).length > 0 && (
                      <div>
                        <strong>Attributes:</strong>
                        <ul className="list-disc ml-6 mt-1">
                          {Object.entries(
                            item.attributes as Record<string, string>
                          ).map(([key, value]) => (
                            <li key={key} className="font-mono">
                              {key} = {value}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* EXPORT */}
        {exportOps.length > 0 && (
          <section className="border border-gray-300 rounded-lg bg-white shadow">
            <button
              onClick={() => toggle("export")}
              className="w-full flex justify-between items-center p-4"
            >
              <div className="flex items-center gap-3">
                <ArrowUpTrayIcon className="w-6 h-6 text-purple-600" />
                <span className="text-lg font-semibold">EXPORT Objects</span>
              </div>
              <ChevronDownIcon
                className={`w-6 h-6 transition ${
                  open["export"] ? "rotate-180" : ""
                }`}
              />
            </button>

            {open["export"] && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                {exportOps.map((item, i) => (
                  <div
                    key={i}
                    className="border border-gray-300 p-4 rounded bg-white shadow-sm space-y-2"
                  >
                    <div><strong>Type:</strong> {item.type}</div>
                    <div><strong>Name:</strong> {item.name}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* IMPORT */}
        {importOps.length > 0 && (
          <section className="border border-gray-300 rounded-lg bg-white shadow">
            <button
              onClick={() => toggle("import")}
              className="w-full flex justify-between items-center p-4"
            >
              <div className="flex items-center gap-3">
                <ArrowDownTrayIcon className="w-6 h-6 text-green-600" />
                <span className="text-lg font-semibold">IMPORT Objects</span>
              </div>
              <ChevronDownIcon
                className={`w-6 h-6 transition ${
                  open["import"] ? "rotate-180" : ""
                }`}
              />
            </button>

            {open["import"] && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                {importOps.map((item, i) => (
                  <div
                    key={i}
                    className="border border-gray-300 p-4 rounded bg-white shadow-sm space-y-2"
                  >
                    <div><strong>Type:</strong> {item.type}</div>
                    <div><strong>Name:</strong> {item.name}</div>
                    <div><strong>ZIP File:</strong> {item.zipFileName}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TRANSPORT */}
        {transportOps.length > 0 && (
          <section className="border border-gray-300 rounded-lg bg-white shadow">
            <button
              onClick={() => toggle("transport")}
              className="w-full flex justify-between items-center p-4"
            >
              <div className="flex items-center gap-3">
                <TruckIcon className="w-6 h-6 text-orange-600" />
                <span className="text-lg font-semibold">TRANSPORT Artefacts</span>
              </div>
              <ChevronDownIcon
                className={`w-6 h-6 transition ${
                  open["transport"] ? "rotate-180" : ""
                }`}
              />
            </button>

            {open["transport"] && (
              <div className="p-4 space-y-4 border-t border-gray-200">
                {transportOps.map((item, i) => (
                  <div
                    key={i}
                    className="border border-gray-300 p-4 rounded bg-white shadow-sm space-y-3"
                  >
                    <strong>Artefacts:</strong>
                    <ul className="list-disc ml-6">
                      {item.artefacts.map((a: any, idx: number) => (
                        <li key={idx} className="space-y-1">
                          <div><strong>Type:</strong> {a.type}</div>
                          <div><strong>Name:</strong> {a.name}</div>
                          <div><strong>ZIP File:</strong> {a.zipFileName}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="flex gap-4">
          <button
            className="px-6 py-3 bg-gray-300 rounded"
            onClick={() => router.back()}
          >
            Back
          </button>

          <button
            className="px-6 py-3 bg-green-600 text-white rounded"
            onClick={() => router.push("/output")}
          >
            Generate Terraform
          </button>
        </div>
      </div>
    </>
  );
}
