"use client";

// import Icon from "@/app/wizard/components/Icon";

const steps = [
  { id: "metadata", label: "Metadata", icon: "metadata" },
  { id: "attributes", label: "Attributes", icon: "attributes" },
  { id: "importconfigjson", label: "Import Config", icon: "importconfigjson" },
  { id: "customproperties", label: "Custom Properties", icon: "CustomProperties" },
  { id: "customlabels", label: "Custom Labels", icon: "customlabels" },
  { id: "review", label: "Review", icon: "review" },
];

export default function WizardHeader() {
  return (
    <div className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">

        <div className="text-xl font-semibold text-gray-900">
          Workspace Wizard
        </div>

        <div className="flex items-center gap-6">
          {steps.map(step => (
            <div key={step.id} className="flex flex-col items-center">
              <div className="w-5 h-5 bg-gray-200 rounded-full" />
              <span className="text-xs text-gray-600 mt-1">{step.label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
