// lib/envizor/actionHandler.ts

import { EnvizorAction } from "./types";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function handleEnvizorAction(
  action: EnvizorAction,
  router?: AppRouterInstance
) {
  if (!action) return;

  switch (action.type) {
    case "NAVIGATE":
      if (router && action.payload?.path) {
        router.push(action.payload.path);
      }
      break;

    default:
      break;
  }
}
