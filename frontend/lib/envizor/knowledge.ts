// lib/envizor/knowledge.ts

export const KNOWLEDGE = [
  {
    weight: 5,
    keywords: ["tenant", "tenants", "iga", "saviynt tenant"],
    answer:
      "Use the **IGA Tenants Explorer** to discover Saviynt tenants, inspect objects, and import artefacts.",
  },
  {
    weight: 5,
    keywords: ["workspace", "workspaces", "terraform workspace"],
    answer:
      "Use the **Terraform Workspace Explorer** to browse generated `.tf` files, modules, variables, and import scripts.",
  },
  {
    weight: 4,
    keywords: ["wizard", "screen", "page", "step"],
    answer:
      "The **DevOps Terraform Wizard** guides you through configuring your environment, selecting objects, and generating Terraform packages.",
  },
  {
    weight: 4,
    keywords: ["compare", "diff", "drift"],
    answer:
      "Envizor can **compare tenants or workspaces** to identify drift, mismatches, or missing objects.",
  },
  {
    weight: 3,
    keywords: ["generate", "tf", "terraform", "terraform files", "terraform code"],
    answer:
      "Use the **Terraform Generator** step to create `.tf` files, modules, variables, and import scripts.",
  },
  {
    weight: 3,
    keywords: ["deploy", "apply", "plan", "init"],
    answer:
      "Envizor can help you run `terraform init`, `terraform plan`, and `terraform apply` to deploy changes safely to Saviynt.",
  },
  {
    weight: 2,
    keywords: ["environment", "env", "dev", "test", "prod"],
    answer:
      "Saviynt environments (dev/test/prod) usually map to Terraform workspaces. Each environment has its own credentials, URLs, and configuration.",
  },
  {
    weight: 2,
    keywords: ["role", "entitlement", "account", "object"],
    answer:
      "Saviynt objects like roles, entitlements, and accounts can be imported into Terraform using the Tenants Explorer.",
  },
  {
    weight: 1,
    keywords: ["error", "issue", "problem"],
    answer:
      "Paste the error message and I’ll explain what it means in Terraform or Saviynt terms.",
  },
];
