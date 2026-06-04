"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import WizardStepper from "../components/WizardStepper";
import { useWizardStore } from "../store/wizardstore";

type StandardItem = {
  type: string;
  name: string;
  attributes: Record<string, string>;
};

type ExportItem = { type: string; name: string };
type ImportItem = { type: string; name: string; zipFileName: string };
type TransportItem = { type: string; name: string; zipFileName: string };

export default function OperationsPage() {
  const router = useRouter();
  const setSelections = (selections: any[]) => {};

  const [standardItems, setStandardItems] = useState<StandardItem[]>([
    { type: "", name: "", attributes: {} }
  ]);

  const [exportItems, setExportItems] = useState<ExportItem[]>([
    { type: "", name: "" }
  ]);

  const [importItems, setImportItems] = useState<ImportItem[]>([
    { type: "", name: "", zipFileName: "" }
  ]);

  const [transportItems, setTransportItems] = useState<TransportItem[]>([
    { type: "", name: "", zipFileName: "" }
  ]);

  function updateStandardField(
    i: number,
    field: keyof StandardItem,
    value: any
  ) {
    const updated = [...standardItems];
    updated[i][field] = value;
    setStandardItems(updated);
  }

  function updateStandardAttribute(i: number, key: string, value: string) {
    const updated = [...standardItems];
    updated[i].attributes[key] = value;
    setStandardItems(updated);
  }

  function addStandard() {
    setStandardItems([...standardItems, { type: "", name: "", attributes: {} }]);
  }

  function removeStandard(i: number) {
    setStandardItems(standardItems.filter((_, idx) => idx !== i));
  }

  function updateExportField(i: number, field: keyof ExportItem, value: string) {
    const updated = [...exportItems];
    updated[i][field] = value;
    setExportItems(updated);
  }

  function addExport() {
    setExportItems([...exportItems, { type: "", name: "" }]);
  }

  function removeExport(i: number) {
    setExportItems(exportItems.filter((_, idx) => idx !== i));
  }

  function updateImportField(i: number, field: keyof ImportItem, value: string) {
    const updated = [...importItems];
    updated[i][field] = value;
    setImportItems(updated);
  }

  function addImport() {
    setImportItems([...importItems, { type: "", name: "", zipFileName: "" }]);
  }

  function removeImport(i: number) {
    setImportItems(importItems.filter((_, idx) => idx !== i));
  }

  function updateTransportField(
    i: number,
    field: keyof TransportItem,
    value: string
  ) {
    const updated = [...transportItems];
    updated[i][field] = value;
    setTransportItems(updated);
  }

  function addTransport() {
    setTransportItems([...transportItems, { type: "", name: "", zipFileName: "" }]);
  }

  function removeTransport(i: number) {
    setTransportItems(transportItems.filter((_, idx) => idx !== i));
  }

  function handleContinue() {
    const selections: any[] = [];

    standardItems.forEach((item) => {
      if (item.type && item.name) {
        selections.push({
          operation: "STANDARD",
          type: item.type,
          name: item.name,
          attributes: item.attributes
        });
      }
    });

    exportItems.forEach((item) => {
      if (item.type && item.name) {
        selections.push({
          operation: "EXPORT",
          type: item.type,
          name: item.name
        });
      }
    });

    importItems.forEach((item) => {
      if (item.type && item.name && item.zipFileName) {
        selections.push({
          operation: "IMPORT",
          type: item.type,
          name: item.name,
          zipFileName: item.zipFileName
        });
      }
    });

    const artefacts = transportItems
      .filter((t) => t.type && t.name && t.zipFileName)
      .map((t) => ({
        type: t.type,
        name: t.name,
        zipFileName: t.zipFileName
      }));

    if (artefacts.length > 0) {
      selections.push({
        operation: "TRANSPORT",
        artefacts
      });
    }

    setSelections(selections);
    router.push("/summary");
  }

  return (
    <>
      <WizardStepper />

      <div className="max-w-4xl mx-auto mt-10 space-y-10 text-gray-900">
        <h1 className="text-3xl font-semibold">Select Operations</h1>

        {/* STANDARD */}
        <section className="border border-gray-300 p-6 rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-4">STANDARD Objects</h2>
          <p className="text-gray-600 mb-4">
            Create new Saviynt objects (Endpoint, Role, Analytics, etc.)
          </p>

          {standardItems.map((item, i) => (
            <div
              key={i}
              className="border border-gray-300 p-4 rounded mb-4 space-y-4 bg-white shadow-sm"
            >
              <div className="flex gap-4">
                <input
                  className="border border-gray-300 p-2 flex-1 rounded"
                  placeholder="Type (e.g. Endpoint)"
                  value={item.type}
                  onChange={(e) =>
                    updateStandardField(i, "type", e.target.value)
                  }
                />

                <input
                  className="border border-gray-300 p-2 flex-1 rounded"
                  placeholder="Name"
                  value={item.name}
                  onChange={(e) =>
                    updateStandardField(i, "name", e.target.value)
                  }
                />

                <button
                  type="button"
                  className="bg-red-600 text-white px-3 rounded"
                  onClick={() => removeStandard(i)}
                >
                  Remove
                </button>
              </div>

              <div>
                <h3 className="font-medium mb-2">Attributes</h3>

                <input
                  className="border border-gray-300 p-2 w-full rounded"
                  placeholder="key=value (press Enter to add)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = (e.target as HTMLInputElement).value;
                      const [key, value] = input.split("=");

                      if (key && value) {
                        updateStandardAttribute(i, key.trim(), value.trim());
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />

                <div className="mt-3 space-y-1">
                  {Object.entries(
                    item.attributes as Record<string, string>
                  ).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between bg-white border border-gray-300 p-2 rounded shadow-sm"
                    >
                      <span className="font-mono">
                        {key} = {value}
                      </span>
                      <button
                        type="button"
                        className="text-red-600"
                        onClick={() => {
                          const updated = { ...item.attributes };
                          delete updated[key];
                          updateStandardField(i, "attributes", updated);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={addStandard}
          >
            Add STANDARD Object
          </button>
        </section>

        {/* EXPORT */}
        <section className="border border-gray-300 p-6 rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-4">EXPORT Objects</h2>
          <p className="text-gray-600 mb-4">
            Export existing objects from Saviynt into ZIP files.
          </p>

          {exportItems.map((item, i) => (
            <div
              key={i}
              className="border border-gray-300 p-4 rounded mb-4 flex gap-4 bg-white shadow-sm"
            >
              <input
                className="border border-gray-300 p-2 flex-1 rounded"
                placeholder="Type"
                value={item.type}
                onChange={(e) =>
                  updateExportField(i, "type", e.target.value)
                }
              />

              <input
                className="border border-gray-300 p-2 flex-1 rounded"
                placeholder="Name"
                value={item.name}
                onChange={(e) =>
                  updateExportField(i, "name", e.target.value)
                }
              />

              <button
                type="button"
                className="bg-red-600 text-white px-3 rounded"
                onClick={() => removeExport(i)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={addExport}
          >
            Add EXPORT Object
          </button>
        </section>

        {/* IMPORT */}
        <section className="border border-gray-300 p-6 rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-4">IMPORT Objects</h2>
          <p className="text-gray-600 mb-4">
            Import ZIP files into Saviynt (Email Templates, Analytics, Roles,
            etc.)
          </p>

          {importItems.map((item, i) => (
            <div
              key={i}
              className="border border-gray-300 p-4 rounded mb-4 flex gap-4 bg-white shadow-sm"
            >
              <input
                className="border border-gray-300 p-2 flex-1 rounded"
                placeholder="Type"
                value={item.type}
                onChange={(e) =>
                  updateImportField(i, "type", e.target.value)
                }
              />

              <input
                className="border border-gray-300 p-2 flex-1 rounded"
                placeholder="Name"
                value={item.name}
                onChange={(e) =>
                  updateImportField(i, "name", e.target.value)
                }
              />

              <input
                className="border border-gray-300 p-2 flex-1 rounded"
                placeholder="ZIP File Name"
                value={item.zipFileName}
                onChange={(e) =>
                  updateImportField(i, "zipFileName", e.target.value)
                }
              />

              <button
                type="button"
                className="bg-red-600 text-white px-3 rounded"
                onClick={() => removeImport(i)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={addImport}
          >
            Add IMPORT Object
          </button>
        </section>

        {/* TRANSPORT */}
        <section className="border border-gray-300 p-6 rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-4">TRANSPORT Artefacts</h2>
          <p className="text-gray-600 mb-4">
            Transport multiple artefacts (ZIP files) across environments.
          </p>

          {transportItems.map((item, i) => (
            <div
              key={i}
              className="border border-gray-300 p-4 rounded mb-4 flex gap-4 bg-white shadow-sm"
            >
              <input
                className="border border-gray-300 p-2 flex-1 rounded"
                placeholder="Type"
                value={item.type}
                onChange={(e) =>
                  updateTransportField(i, "type", e.target.value)
                }
              />

              <input
                className="border border-gray-300 p-2 flex-1 rounded"
                placeholder="Name"
                value={item.name}
                onChange={(e) =>
                  updateTransportField(i, "name", e.target.value)
                }
              />

              <input
                className="border border-gray-300 p-2 flex-1 rounded"
                placeholder="ZIP File Name"
                value={item.zipFileName}
                onChange={(e) =>
                  updateTransportField(i, "zipFileName", e.target.value)
                }
              />

              <button
                type="button"
                className="bg-red-600 text-white px-3 rounded"
                onClick={() => removeTransport(i)}
              >
                Remove
              </button>
            </div>
          ))}

          <button
            type="button"
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={addTransport}
          >
            Add TRANSPORT Artefact
          </button>
        </section>

        <button
          className="bg-green-600 text-white px-6 py-3 rounded text-lg"
          onClick={handleContinue}
        >
          Continue to Summary
        </button>
      </div>
    </>
  );
}
