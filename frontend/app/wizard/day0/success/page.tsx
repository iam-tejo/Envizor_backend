"use client";

import { useRouter } from "next/navigation";
import Day0Shell from "../Day0Shell";
import Confetti from "../Confetti";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <>
      <Confetti />

      <Day0Shell
        title="Day‑0 Onboarding Complete"
        subtitle="Your Terraform workspace has been successfully generated and is ready for use."
      >
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-10 max-w-3xl mx-auto text-center">

          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center shadow-inner">
              <svg
                viewBox="0 0 24 24"
                className="w-14 h-14 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Workspace Generated Successfully
          </h2>

          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Your Terraform files and import commands have been created.  
            You can now integrate them into your CI/CD pipeline or continue configuring your environment.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
            <button
              onClick={() => router.push("/wizard/day0/environment")}
              className="px-8 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold shadow"
            >
              Start Again
            </button>

            <button
              onClick={() => router.push("/wizard/steps/welcome")}
              className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
            >
              Return to Hub →
            </button>
          </div>
        </div>
      </Day0Shell>
    </>
  );
}
