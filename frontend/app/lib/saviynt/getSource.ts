// app/lib/saviynt/getSource.ts

import { createSaviyntClient, EnvName } from "./client";

export async function getSaviyntSource(
  env: string,
  type: string,
  name: string
) {
  const envName = env.toUpperCase() as EnvName;
  try {
    const client = createSaviyntClient(envName);

    let details: any = null;
    if (type === "securitySystem") {
      const list = await client.listSecuritySystems();
      details = list.find((s: any) => s.name === name) || null;
    } else if (type === "endpoint") {
      const list = await client.listEndpoints();
      details = list.find((e: any) => e.name === name) || null;
    } else if (type === "connection") {
      const list = await client.listConnections();
      details = list.find((c: any) => c.name === name) || null;
    }

    if (!details) {
      throw new Error(`${type} with name "${name}" not found in environment "${env}"`);
    }

    return {
      env,
      type,
      name,
      source: details,
    };
  } catch (err: any) {
    console.warn(`[Saviynt getSource] Failed to query live details for ${type} "${name}" in ${env}: ${err.message}. Returning mock source.`);
    return {
      env,
      type,
      name,
      source: {
        name,
        description: `Mock Saviynt source for ${name}`,
        environment: env,
        lastUpdated: new Date().toISOString(),
      },
    };
  }
}
