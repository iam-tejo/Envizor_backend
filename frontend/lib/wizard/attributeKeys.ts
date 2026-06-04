// attributeKeys.ts
// Strongly typed registry of all Saviynt resource attributes

export type AttributeKeyMap = Record<string, readonly string[]>;

export const ATTRIBUTE_KEYS: AttributeKeyMap = {
  // Connections
  Connection_AD: [
    "connection_name",
    "connection_json",
    "import_user_json",
    "import_account_ent_json",
    "status_threshold_config",
    "create_account_json",
    "update_account_json",
    "enable_account_json",
    "disable_account_json",
    "remove_access_json",
    "change_pass_json",
    "remove_account_json",
    "add_access_json",
    "update_user_json",
    "endpoints_filter",
    "accounts_filter",
    "config_json"
  ],

  Connection_EntraID: [
    "connection_name",
    "client_id",
    "client_secret",
    "aad_tenant_id",
    "authentication_endpoint",
    "microsoft_graph_endpoint",
    "azure_management_endpoint",
    "create_users",
    "create_new_endpoints",
    "managed_account_type",
    "import_depth",
    "import_user_json",
    "account_attributes",
    "entitlement_attribute",
    "create_account_json",
    "add_access_json",
    "connection_json",
    "status_threshold_config",
    "account_import_fields",
    "update_account_json",
    "enable_account_json",
    "disable_account_json",
    "remove_access_json",
    "update_user_json",
    "change_pass_json",
    "remove_account_json",
    "endpoints_filter",
    "accounts_filter",
    "config_json",
    "windows_connector_json",
    "service_account_attributes"
  ],

  Connection_REST: [
    "connection_name",
    "connection_json",
    "import_user_json",
    "import_account_ent_json",
    "status_threshold_config",
    "create_account_json",
    "update_account_json",
    "enable_account_json",
    "disable_account_json",
    "remove_access_json",
    "change_pass_json",
    "remove_account_json",
    "add_access_json",
    "update_user_json",
    "endpoints_filter",
    "accounts_filter",
    "config_json"
  ],

  // Security System
  Security_System: [
    "systemname",
    "display_name",
    "hostname",
    "port",
    "access_add_workflow",
    "access_remove_workflow",
    "add_service_account_workflow",
    "remove_service_account_workflow",
    "automated_provisioning",
    "use_open_connector",
    "recon_application",
    "instant_provision",
    "provisioning_tries",
    "provisioning_comments"
  ],

  // Endpoint
  Endpoint: [
    "endpointname",
    "displayname",
    "description",
    "endpointtype",
    "securitysystem",
    "connection",
    "status",
    "customproperty1",
    "customproperty2",
    "customproperty3",
    "customproperty4",
    "customproperty5",
    "customproperty6",
    "customproperty7",
    "customproperty8",
    "customproperty9",
    "customproperty10"
  ],

  // Enterprise Role
  Enterprise_Role: [
    "rolename",
    "displayname",
    "description",
    "roletype",
    "owner",
    "approver",
    "risk",
    "status",
    "customproperty1",
    "customproperty2",
    "customproperty3",
    "customproperty4",
    "customproperty5"
  ],

  // Entitlement
  Entitlement: [
    "endpoint",
    "entitlement_type",
    "entitlement_value",
    "displayname",
    "description",
    "entitlement_glossary",
    "risk",
    "status",
    "soxcritical",
    "syscritical",
    "privileged",
    "confidentiality",
    "priority",
    "module",
    "access",
    "entitlement_owners.rank_1",
    "entitlement_owners.rank_2",
    "entitlement_map.entitlement_value",
    "entitlement_map.entitlement_type",
    "entitlement_map.endpoint",
    "entitlement_map.request_filter",
    "entitlement_map.exclude_entitlement",
    "entitlement_map.add_dependent_task",
    "entitlement_map.remove_dependent_ent_task",
    ...Array.from({ length: 60 }, (_, i) => `customproperty${i + 1}`)
  ],

  // Entitlement Type
  Entitlement_Type: [
    "entitlement_name",
    "endpoint_name",
    "display_name",
    "entitlement_description",
    "workflow",
    "enable_entitlement_to_role_sync",
    "available_query_service_account",
    "selected_query_service_account",
    "ars_requestable_entitlement_query",
    "ars_selected_entitlement_query",
    "certifiable",
    "create_task_action",
    "request_dates_conf_json",
    "order_index",
    "required_in_request",
    "required_in_service_request",
    "hierarchy_required",
    "show_ent_type_on",
    "enable_provisioning_priority",
    "request_option",
    "recon",
    "exclude_rule_assgn_ents_in_req",
    "start_date_in_revoke_request",
    "start_end_date_in_request",
    "allow_remove_all_entitlement_in_request",
    ...Array.from({ length: 60 }, (_, i) => `custom_property${i + 1}`)
  ],

  // Export Transport Package
  Export_Transport_Package: [
    "export_online",
    "export_path",
    "update_user",
    "business_justification",
    "transport_owner",
    "transport_members",
    "environment_name",
    "export_package_version",
    "sav_roles",
    "roles",
    "connections",
    "email_template",
    "workflows",
    "security_systems",
    "user_groups",
    "organizations",
    "global_config",
    "analytics_v1",
    "analytics_v2",
    "scan_rules",
    "app_onboarding"
  ],

  // Import Transport Package
  Import_Transport_Package: [
    "package_path",
    "update_user",
    "business_justification",
    "import_package_version"
  ],

  // Jobs
  Accounts_Import_Full_Job: [
    "name",
    "job_group",
    "group",
    "cron_exp",
    "connection_name"
  ],

  Accounts_Import_Incremental_Job: [
    "name",
    "job_group",
    "group",
    "cron_exp",
    "connection_name"
  ],

  WS_Retry_Job: [
    "trigger_name",
    "job_group",
    "cron_expression",
    "trigger_group",
    "security_systems",
    "task_types"
  ]
} as const;
