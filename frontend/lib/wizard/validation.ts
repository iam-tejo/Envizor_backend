// lib/wizard/validation.ts
export type ValidationError = {
  field: string;
  message: string;
};

export function validateValues(
  stepId: string,
  values: Record<string, unknown>
): ValidationError[] {
  const errors: ValidationError[] = [];

  const require = (key: string, label?: string) => {
    if (!values[key]) {
      errors.push({
        field: key,
        message: `${label ?? key} is required`,
      });
    }
  };

  if (stepId === "basic") {
    require("name", "Name");
    require("description", "Description");
  }

  if (stepId === "auth") {
    require("url", "URL");
  }

  if (stepId === "metadata") {
    const raw = values["metadata"];
    if (raw && typeof raw === "string") {
      try {
        JSON.parse(raw);
      } catch {
        errors.push({
          field: "metadata",
          message: "Metadata must be valid JSON",
        });
      }
    }
  }

  return errors;
}
