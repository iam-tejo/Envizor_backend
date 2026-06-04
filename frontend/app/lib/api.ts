const BASE_URL = "/api";

async function post<T>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  return res.json();
}

export const api = {
  setWorkspace: (workspace: string) =>
    post("/wizard/workspace", { workspace }),

  setEnvironment: (environment: string) =>
    post("/wizard/environment", { environment }),

  setObjectTypes: (selected: string[]) =>
    post("/wizard/object-types", { selected }),

  preview: (selections: any[]) =>
    post("/wizard/preview", selections),

  generate: (selections: any[]) =>
    post("/wizard/generate", selections),

  reset: () => post("/wizard/reset"),
};
