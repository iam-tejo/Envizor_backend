// /lib/wizard/schemas/endpointSchema.ts

export const ENDPOINT_SCHEMA = {
  Metadata: {
    title: "Basic Information",
    fields: {
      endpoint_name: { type: "string", required: true },
      display_name: { type: "string", required: true },
      security_system: { type: "string", required: true },
      description: { type: "string", multiline: true },
      owner_type: {
        type: "select",
        options: ["User", "Group", "Application"],
      },
      requestable: { type: "boolean" },
    },
  },

  Attributes: {
    title: "Account Rules",
    fields: {
      enable_copy_access: { type: "boolean" },
      disable_new_account_request_if_account_exists: { type: "boolean" },
      disable_remove_account: { type: "boolean" },
      disable_modify_account: { type: "boolean" },
      user_account_correlation_rule: {
        type: "select",
        options: [
          "MATCH_ON_USERNAME",
          "MATCH_ON_EMAIL",
          "MATCH_ON_EMPLOYEE_ID",
          "CUSTOM",
        ],
      },
      create_ent_task_for_remove_acc: { type: "boolean" },
      out_of_band_action: { type: "number" },
      block_inflight_request: { type: "boolean" },
    },
  },

  ImportConfig: {
    title: "SQL & JSON Configurations",
    fields: {
      access_query: { type: "sql" },
      service_account_access_query: { type: "sql" },
      allow_change_password_sql_query: { type: "sql" },
      change_password_access_query: { type: "sql" },

      status_config: { type: "json" },
      plugin_configs: { type: "json" },
      endpoint_config: { type: "json" },
    },
  },

  CustomProperties: {
    title: "Custom Properties",
    fields: Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [
        `custom_property${i + 1}`,
        { type: "string" },
      ])
    ),
  },

  CustomLabels: {
    title: "Custom Labels",
    fields: Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [
        `custom_property${i + 1}_label`,
        { type: "string" },
      ])
    ),
  },

  Review: {
    title: "Review",
    fields: {},
  },
};

export type EndpointStepId = keyof typeof ENDPOINT_SCHEMA;
