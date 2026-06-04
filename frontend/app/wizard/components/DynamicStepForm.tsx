"use client";

import React, { useState } from "react";
import { useWizardStore } from "@/lib/wizard/useWizardStore";
import {
  WizardObjectType,
  WizardJobType,
  WizardStepId,
  OBJECT_TYPE_FIELDS,
} from "@/lib/wizard/wizardSchema";

import {
  ENDPOINT_SCHEMA,
  EndpointStepId,
} from "@/lib/wizard/schemas/endpointSchema";

type Props = {
  objectOrJob: WizardObjectType | WizardJobType;
  stepId: WizardStepId;
};

export default function DynamicStepForm({ objectOrJob, stepId }: Props) {
  const { formData, updateFormField } = useWizardStore();

  // Controls how many custom properties are visible (5 at a time)
  const [visibleCustomProps, setVisibleCustomProps] = useState(5);

  const isEndpoint = objectOrJob === "ENDPOINT";

  // Load schema for ENDPOINT steps
  const schema =
    isEndpoint &&
    (stepId as EndpointStepId) in ENDPOINT_SCHEMA
      ? ENDPOINT_SCHEMA[stepId as EndpointStepId]
      : null;

  const valuesForObject = formData[objectOrJob] || {};
  const valuesForStep = valuesForObject[stepId] || {};

  // Fallback fields for non-ENDPOINT object types
  const fallbackFields =
    OBJECT_TYPE_FIELDS[objectOrJob as WizardObjectType]?.[stepId] || [];

  // Remove last 5 custom properties (Simple UX)
  const handleRemoveLastFive = () => {
    const newCount = Math.max(5, visibleCustomProps - 5);
    setVisibleCustomProps(newCount);
  };

  // Render a single field
  const renderField = (field: string, config: any) => {
    const value = valuesForStep[field] || "";

    if (config.type === "string" && !config.multiline) {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) =>
            updateFormField(objectOrJob, stepId, field, e.target.value)
          }
          className="border rounded-lg px-4 py-2 shadow-sm transition duration-150"
          style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
      );
    }

    if (config.multiline) {
      return (
        <textarea
          value={value}
          onChange={(e) =>
            updateFormField(objectOrJob, stepId, field, e.target.value)
          }
          className="border rounded-lg px-4 py-2 shadow-sm h-24 transition duration-150"
          style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
      );
    }

    if (config.type === "boolean") {
      return (
        <select
          value={value}
          onChange={(e) =>
            updateFormField(objectOrJob, stepId, field, e.target.value)
          }
          className="border rounded-lg px-4 py-2 shadow-sm transition duration-150"
          style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          <option value="" style={{ backgroundColor: "var(--bg-panel)" }}>Select</option>
          <option value="true" style={{ backgroundColor: "var(--bg-panel)" }}>true</option>
          <option value="false" style={{ backgroundColor: "var(--bg-panel)" }}>false</option>
        </select>
      );
    }

    if (config.type === "number") {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) =>
            updateFormField(objectOrJob, stepId, field, e.target.value)
          }
          className="border rounded-lg px-4 py-2 shadow-sm transition duration-150"
          style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
      );
    }

    if (config.type === "select") {
      return (
        <select
          value={value}
          onChange={(e) =>
            updateFormField(objectOrJob, stepId, field, e.target.value)
          }
          className="border rounded-lg px-4 py-2 shadow-sm transition duration-150"
          style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        >
          <option value="" style={{ backgroundColor: "var(--bg-panel)" }}>Select</option>
          {config.options.map((opt: string) => (
            <option key={opt} value={opt} style={{ backgroundColor: "var(--bg-panel)" }}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (config.type === "sql") {
      return (
        <textarea
          value={value}
          onChange={(e) =>
            updateFormField(objectOrJob, stepId, field, e.target.value)
          }
          className="border rounded-lg px-4 py-2 shadow-sm font-mono h-24 transition duration-150"
          style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
      );
    }

    if (config.type === "json") {
      return (
        <textarea
          value={value}
          onChange={(e) =>
            updateFormField(objectOrJob, stepId, field, e.target.value)
          }
          className="border rounded-lg px-4 py-2 shadow-sm font-mono h-32 transition duration-150"
          style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--text-primary)" }}
        />
      );
    }

    return null;
  };

  return (
    <div 
      className="w-full max-w-3xl rounded-2xl shadow-xl p-8 border transition-all duration-300"
      style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)", color: "var(--text-primary)" }}
    >
      <h2 
        className="text-2xl font-semibold mb-6 transition-colors"
        style={{ color: "var(--text-primary)" }}
      >
        {objectOrJob} — {stepId}
      </h2>

      {/* ENDPOINT schema-driven fields */}
      {schema && (
        <div className="space-y-6">
          {Object.entries(schema.fields).map(([field, config]) => {
            // Custom property visibility logic
            if (field.startsWith("custom_property")) {
              const index = parseInt(field.replace(/\D/g, ""), 10);
              if (index > visibleCustomProps) return null;
            }

            return (
              <div key={field} className="flex flex-col animate-fade-in">
                <label 
                  className="font-medium mb-2 transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {field}
                </label>
                {renderField(field, config)}
              </div>
            );
          })}

          {/* Add / Remove buttons ONLY on CustomProperties step */}
          {stepId === "CustomProperties" && (
            <div className="flex gap-4 mt-4">
              {visibleCustomProps < 60 && (
                <button
                  onClick={() =>
                    setVisibleCustomProps(visibleCustomProps + 5)
                  }
                  className="px-6 py-2 text-white rounded-lg shadow transition hover:opacity-90 cursor-pointer"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  + Add More Custom Properties
                </button>
              )}

              {visibleCustomProps > 5 && (
                <button
                  onClick={handleRemoveLastFive}
                  className="px-6 py-2 bg-red-650 hover:bg-red-550 text-white rounded-lg shadow transition cursor-pointer"
                >
                  – Remove Last 5
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fallback fields for non-ENDPOINT types */}
      {!schema && (
        <div className="space-y-6">
          {fallbackFields.length === 0 && (
            <p className="italic" style={{ color: "var(--text-muted)" }}>
              No fields defined for this step.
            </p>
          )}

          {fallbackFields.map((field) => (
            <div key={field} className="flex flex-col animate-fade-in">
              <label 
                className="font-medium mb-2 transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                {field}
              </label>

              <input
                type="text"
                value={valuesForStep[field] || ""}
                onChange={(e) =>
                  updateFormField(objectOrJob, stepId, field, e.target.value)
                }
                className="border rounded-lg px-4 py-2 shadow-sm transition duration-150"
                style={{ backgroundColor: "var(--code-bg)", borderColor: "var(--border)", color: "var(--text-primary)" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
