"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  Squares2X2Icon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon
} from "@heroicons/react/24/outline";

const steps = [
  { id: 1, name: "Workspace", path: "/workspace", icon: CircleStackIcon },
  { id: 2, name: "Environment", path: "/environment", icon: Cog6ToothIcon },
  { id: 3, name: "Operations", path: "/operations", icon: Squares2X2Icon },
  { id: 4, name: "Summary", path: "/summary", icon: ClipboardDocumentListIcon },
  { id: 5, name: "Output", path: "/output", icon: DocumentCheckIcon }
];

export default function WizardStepper() {
  const pathname = usePathname();
  const router = useRouter();

  const currentIndex = steps.findIndex((s) => pathname.startsWith(s.path));

  return (
    <div className="w-full py-6 mb-8 border-b border-gray-300 bg-white">
      <div className="max-w-5xl mx-auto flex justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => router.push(step.path)}
              className="flex flex-col items-center group"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border transition
                  ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white"
                      : isCompleted
                      ? "bg-green-600 border-green-600 text-white"
                      : "bg-gray-100 border-gray-300 text-gray-500 group-hover:bg-gray-200"
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>

              <span
                className={`mt-2 text-sm font-medium ${
                  isActive
                    ? "text-blue-600"
                    : isCompleted
                    ? "text-green-600"
                    : "text-gray-600 group-hover:text-gray-800"
                }`}
              >
                {step.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
