/**
 * envizorSync.ts
 * Shared utility to broadcast left-panel page state to the right-panel Envizor AI Advisor.
 * Any page imports and calls `dispatchPageContext(...)` when meaningful state changes.
 */

export type EnvizorPage = "push" | "diff" | "discovery" | "baseline" | "explorer" | "home";

export interface EnvizorPageContextPayload {
  page: EnvizorPage;
  action: string;
  payload?: Record<string, any>;
}

export function dispatchPageContext(detail: EnvizorPageContextPayload) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("envizor_page_context", { detail }));
  }
}
