// lib/envizor/terraformModel.ts

export type TerraformResource = {
  address: string;
  type: string;
  name: string;
};

export type TerraformModule = {
  name: string;
  path: string;
  resources: TerraformResource[];
};

export type TerraformStateModel = {
  modules: TerraformModule[];
};

export function buildTerraformStateModel(state: any): TerraformStateModel {
  const modules: TerraformModule[] = [];

  const rawModules = state?.modules ?? [];
  for (const m of rawModules) {
    const resources: TerraformResource[] = [];

    const rawResources = m.resources ?? [];
    for (const r of rawResources) {
      resources.push({
        address: r.address,
        type: r.type,
        name: r.name,
      });
    }

    modules.push({
      name: m.path?.join(".") ?? "root",
      path: (m.path ?? []).join("/"),
      resources,
    });
  }

  return { modules };
}
