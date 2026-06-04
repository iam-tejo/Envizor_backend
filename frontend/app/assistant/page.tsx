"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MeetEnvizorAssistant from "@/components/MeetEnvizorAssistant";

function AssistantPageContent() {
  const search = useSearchParams();

  const terraformPlan = decodeURIComponent(search.get("plan") || "");
  const discoveredRaw = search.get("discovered") || "";
  const stateRaw = search.get("state") || "";

  const discoveredObjects = discoveredRaw
    ? JSON.parse(decodeURIComponent(discoveredRaw))
    : {};
  const terraformState = stateRaw
    ? JSON.parse(decodeURIComponent(stateRaw))
    : {};

  return (
    <MeetEnvizorAssistant
      terraformPlan={terraformPlan}
      discoveredObjects={discoveredObjects}
      terraformState={terraformState}
    />
  );
}

export default function AssistantPage() {
  return (
    <Suspense fallback={<div className="bg-slate-950 text-slate-400 p-8 text-center text-xs">Loading assistant core...</div>}>
      <AssistantPageContent />
    </Suspense>
  );
}
