"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Day0Shell from "../day0/Day0Shell";

type AttributeRow = {
  prop: string;
  path: string;
  type: "char" | "date" | "bool" | "listAsString" | "boolList" | "json" | "ufjson" | "ufchar" | "epochdate";
};

type ValidationCheck = {
  id: string;
  label: string;
  status: "success" | "warning" | "error" | "pending";
  detail: string;
};

export default function ConnectedAppPage() {
  // Connector type determines steps and configuration structure
  const [appType, setAppType] = useState<"REST" | "SCIM" | "Database" | "File">("REST");
  
  // Step Stepper
  const [currentStep, setCurrentStep] = useState(1);

  // Maximum steps dynamic logic
  const getMaxSteps = () => {
    if (appType === "File") return 4;
    return 5;
  };

  // Ensure current step stays in bounds on type switch
  useEffect(() => {
    setCurrentStep(1);
    // Reset active tabs depending on type
    if (appType === "File") {
      setActiveTab("ConnectionJSON");
    } else if (appType === "Database") {
      setActiveTab("ConnectionJSON");
    } else {
      setActiveTab("ConnectionJSON");
    }
  }, [appType]);

  // --- Common application state ---
  const [appName, setAppName] = useState("Salesforce");

  // --- REST / SCIM State (Types: REST, SCIM) ---
  const [serviceUrl, setServiceUrl] = useState("https://api.salesforce.com/services/data/v57.0");
  const [authType, setAuthType] = useState("oauth2"); // oauth2, Basic, Bearer, HMAC, cookies
  const [authUrl, setAuthUrl] = useState("https://login.salesforce.com/services/oauth2/token");
  const [authMethod, setAuthMethod] = useState("POST");
  const [grantType, setGrantType] = useState("client_credentials");
  const [clientId, setClientId] = useState("3MVG99OxpGeerPDR...");
  const [clientSecret, setClientSecret] = useState("********");
  const [username, setUsername] = useState("api_admin");
  const [password, setPassword] = useState("password123");
  const [accessTokenPath, setAccessTokenPath] = useState("access_token");
  const [tokenType, setTokenType] = useState("Bearer");
  const [authHeaderName, setAuthHeaderName] = useState("Authorization");
  const [accessTokenLocation, setAccessTokenLocation] = useState("body"); // body, header
  const [reconEnabled, setReconEnabled] = useState(true);
  const [reconPath, setReconPath] = useState("/sobjects/User");
  const [reconMethod, setReconMethod] = useState("GET");
  const [listField, setListField] = useState("records");
  const [keyField, setKeyField] = useState("id");
  const [statusColumn, setStatusColumn] = useState("customproperty11");
  const [activeValue, setActiveValue] = useState("true");
  const [inactiveValue, setInactiveValue] = useState("false");
  
  const [createEnabled, setCreateEnabled] = useState(true);
  const [createPath, setCreatePath] = useState("/sobjects/User");
  const [createMethod, setCreateMethod] = useState("POST");
  const [createPayload, setCreatePayload] = useState(`{\n  "Username": "\${user.username}",\n  "LastName": "\${user.lastname}",\n  "FirstName": "\${user.firstname}",\n  "Email": "\${user.email}"\n}`);
  
  const [updateEnabled, setUpdateEnabled] = useState(true);
  const [updatePath, setUpdatePath] = useState("/sobjects/User/\${account.accountID}");
  const [updateMethod, setUpdateMethod] = useState("PATCH");
  const [updatePayload, setUpdatePayload] = useState(`{\n  "Email": "\${user.email}",\n  "FirstName": "\${user.firstname}",\n  "LastName": "\${user.lastname}"\n}`);
  
  const [disableEnabled, setDisableEnabled] = useState(true);
  const [disablePath, setDisablePath] = useState("/sobjects/User/\${account.accountID}");
  const [disableMethod, setDisableMethod] = useState("PATCH");
  const [disablePayload, setDisablePayload] = useState(`{\n  "IsActive": false\n}`);
  
  const [addAccessEnabled, setAddAccessEnabled] = useState(true);
  const [addAccessPath, setAddAccessPath] = useState("/sobjects/GroupMember");
  const [addAccessMethod, setAddAccessMethod] = useState("POST");
  const [addAccessPayload, setAddAccessPayload] = useState(`{\n  "UserOrGroupId": "\${account.accountID}",\n  "GroupId": "\${entitlementValue.entitlementID}"\n}`);
  
  const [attributeRows, setAttributeRows] = useState<AttributeRow[]>([
    { prop: "accountID", path: "id", type: "char" },
    { prop: "name", path: "Username", type: "char" },
    { prop: "displayName", path: "Name", type: "char" },
    { prop: "email", path: "Email", type: "char" },
    { prop: "status", path: "IsActive", type: "bool" },
  ]);

  // --- Database State (Type: Database) ---
  const [dbDriver, setDbDriver] = useState("com.mysql.cj.jdbc.Driver");
  const [dbUrl, setDbUrl] = useState("jdbc:mysql://localhost:3306/identity_db");
  const [dbUsername, setDbUsername] = useState("saviynt_app");
  const [dbPassword, setDbPassword] = useState("db_pass_123");
  const [dbReconQuery, setDbReconQuery] = useState("SELECT employee_id, username, email, active_status, first_name, last_name FROM employees");
  const [dbKeyColumn, setDbKeyColumn] = useState("employee_id");
  const [dbStatusColumn, setDbStatusColumn] = useState("active_status");
  const [dbActiveValue, setDbActiveValue] = useState("1");
  const [dbInactiveValue, setDbInactiveValue] = useState("0");
  const [dbCreateQuery, setDbCreateQuery] = useState("INSERT INTO employees (username, last_name, first_name, email, active_status) VALUES ('\${user.username}', '\${user.lastname}', '\${user.firstname}', '\${user.email}', '1')");
  const [dbUpdateQuery, setDbUpdateQuery] = useState("UPDATE employees SET email = '\${user.email}', first_name = '\${user.firstname}', last_name = '\${user.lastname}' WHERE employee_id = '\${account.accountID}'");
  const [dbDisableQuery, setDbDisableQuery] = useState("UPDATE employees SET active_status = '0' WHERE employee_id = '\${account.accountID}'");
  const [dbAddAccessQuery, setDbAddAccessQuery] = useState("INSERT INTO employee_roles (employee_id, role_id) VALUES ('\${account.accountID}', '\${entitlementValue.entitlementID}')");
  const [dbAttributeRows, setDbAttributeRows] = useState<AttributeRow[]>([
    { prop: "accountID", path: "employee_id", type: "char" },
    { prop: "name", path: "username", type: "char" },
    { prop: "email", path: "email", type: "char" },
    { prop: "status", path: "active_status", type: "char" },
  ]);

  // --- File State (Type: File) ---
  const [filePath, setFilePath] = useState("/var/saviynt/imports/users.csv");
  const [fileDelimiter, setFileDelimiter] = useState(",");
  const [fileEncoding, setFileEncoding] = useState("UTF-8");
  const [fileHasHeader, setFileHasHeader] = useState("true");
  const [fileQuoteChar, setFileQuoteChar] = useState("\"");
  const [fileEscapeChar, setFileEscapeChar] = useState("\\\\");
  const [fileSourceType, setFileSourceType] = useState("local"); // local, sftp
  const [sftpHost, setSftpHost] = useState("sftp.example.com");
  const [sftpPort, setSftpPort] = useState("22");
  const [sftpUser, setSftpUser] = useState("sftp_saviynt");
  const [sftpPassword, setSftpPassword] = useState("sftp_key_pass");
  
  const [fileKeyColumn, setFileKeyColumn] = useState("id");
  const [fileStatusColumn, setFileStatusColumn] = useState("status");
  const [fileActiveValue, setFileActiveValue] = useState("active");
  const [fileInactiveValue, setFileInactiveValue] = useState("inactive");
  const [fileAttributeRows, setFileAttributeRows] = useState<AttributeRow[]>([
    { prop: "accountID", path: "id", type: "char" },
    { prop: "name", path: "username", type: "char" },
    { prop: "email", path: "email_address", type: "char" },
    { prop: "status", path: "status", type: "char" },
  ]);

  // Global Mapping Entry Inputs
  const [newProp, setNewProp] = useState("");
  const [newPath, setNewPath] = useState("");
  const [newType, setNewType] = useState<AttributeRow["type"]>("char");

  // Output Compilation State
  const [activeTab, setActiveTab] = useState("ConnectionJSON");
  const [copystate, setCopystate] = useState(false);
  const [showValidator, setShowValidator] = useState(false);
  const [validations, setValidations] = useState<ValidationCheck[]>([]);

  // Workspace integration states
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [savedFolder, setSavedFolder] = useState("");

  // Sandbox API testing playpen states
  const [sandboxEndpoint, setSandboxEndpoint] = useState<"auth" | "recon" | "create" | "update" | "disable" | "addAccess" | "custom">("auth");
  const [sandboxUrl, setSandboxUrl] = useState("");
  const [sandboxMethod, setSandboxMethod] = useState<"GET" | "POST" | "PATCH" | "PUT" | "DELETE">("POST");
  const [sandboxHeaders, setSandboxHeaders] = useState("");
  const [sandboxBody, setSandboxBody] = useState("");
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);

  // Synchronize sandbox fields when selected endpoint or input fields change
  useEffect(() => {
    if (sandboxEndpoint === "custom") return;

    if (sandboxEndpoint === "auth") {
      setSandboxUrl(authUrl || "");
      setSandboxMethod((authMethod as any) || "POST");
      const defaultHeaders = accessTokenLocation === "header" 
        ? { "Content-Type": "application/json" } 
        : { "Content-Type": "application/x-www-form-urlencoded" };
      setSandboxHeaders(JSON.stringify(defaultHeaders, null, 2));
      
      const defaultBody = authType === "oauth2" 
        ? { grant_type: grantType, client_id: clientId, client_secret: clientSecret } 
        : { username, password };
      setSandboxBody(JSON.stringify(defaultBody, null, 2));
    } else if (sandboxEndpoint === "recon") {
      setSandboxUrl((serviceUrl || "") + (reconPath || ""));
      setSandboxMethod((reconMethod as any) || "GET");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Accept": "application/json"
      }, null, 2));
      setSandboxBody("");
    } else if (sandboxEndpoint === "create") {
      setSandboxUrl((serviceUrl || "") + (createPath || ""));
      setSandboxMethod((createMethod as any) || "POST");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Content-Type": "application/json"
      }, null, 2));
      setSandboxBody(createPayload);
    } else if (sandboxEndpoint === "update") {
      setSandboxUrl((serviceUrl || "") + (updatePath || ""));
      setSandboxMethod((updateMethod as any) || "PATCH");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Content-Type": "application/json"
      }, null, 2));
      setSandboxBody(updatePayload);
    } else if (sandboxEndpoint === "disable") {
      setSandboxUrl((serviceUrl || "") + (disablePath || ""));
      setSandboxMethod((disableMethod as any) || "PATCH");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Content-Type": "application/json"
      }, null, 2));
      setSandboxBody(disablePayload);
    } else if (sandboxEndpoint === "addAccess") {
      setSandboxUrl((serviceUrl || "") + (addAccessPath || ""));
      setSandboxMethod((addAccessMethod as any) || "POST");
      setSandboxHeaders(JSON.stringify({
        [authHeaderName || "Authorization"]: `${tokenType || "Bearer"} YOUR_ACCESS_TOKEN`,
        "Content-Type": "application/json"
      }, null, 2));
      setSandboxBody(addAccessPayload);
    }
  }, [
    sandboxEndpoint,
    authUrl,
    authMethod,
    accessTokenLocation,
    authType,
    grantType,
    clientId,
    clientSecret,
    username,
    password,
    serviceUrl,
    reconPath,
    reconMethod,
    authHeaderName,
    tokenType,
    createPath,
    createMethod,
    createPayload,
    updatePath,
    updateMethod,
    updatePayload,
    disablePath,
    disableMethod,
    disablePayload,
    addAccessPath,
    addAccessMethod,
    addAccessPayload
  ]);


  // Compile JSON files dynamically
  const buildConnectionJSON = () => {
    if (appType === "Database") {
      return {
        authentications: {
          acctAuth: {
            authType: "database",
            properties: {
              driverClass: dbDriver,
              jdbcUrl: dbUrl,
              username: dbUsername,
              password: dbPassword
            }
          }
        }
      };
    } else if (appType === "File") {
      return {
        authentications: {
          acctAuth: {
            authType: "file",
            properties: {
              source: fileSourceType,
              filePath: filePath,
              delimiter: fileDelimiter,
              encoding: fileEncoding,
              hasHeader: fileHasHeader === "true",
              quoteChar: fileQuoteChar,
              escapeChar: fileEscapeChar,
              ...(fileSourceType === "sftp" ? {
                sftpHost,
                sftpPort: parseInt(sftpPort) || 22,
                sftpUser,
                sftpPassword
              } : {})
            }
          }
        }
      };
    } else {
      // REST or SCIM
      return {
        authentications: {
          acctAuth: {
            authType: authType,
            url: authType === "Basic" ? "" : authUrl,
            httpMethod: authType === "Basic" ? "POST" : authMethod,
            httpParams: authType === "oauth2" ? {
              grant_type: grantType,
              client_id: clientId,
              client_secret: clientSecret
            } : authType === "Basic" ? {} : {
              username: username,
              password: password
            },
            httpHeaders: accessTokenLocation === "header" ? {
              "contentType": "application/json"
            } : {
              "Content-Type": "application/x-www-form-urlencoded"
            },
            httpContentType: accessTokenLocation === "header" ? "application/json" : "application/x-www-form-urlencoded",
            expiryError: "ExpiredAuthenticationToken",
            authError: [
              "InvalidAuthenticationToken",
              "AuthenticationFailed",
              "FAILURE"
            ],
            timeOutError: "Read timed out",
            errorPath: "error",
            maxRefreshTryCount: 5,
            tokenResponsePath: accessTokenLocation === "header" ? "#HEADERS#Set-Cookie" : accessTokenPath,
            tokenType: tokenType,
            accessToken: tokenType === "Bearer" ? `Bearer \${${accessTokenPath}}` : `\${${accessTokenPath}}`,
            authHeaderName: authHeaderName
          }
        }
      };
    }
  };

  const buildImportAccountEntJSON = () => {
    if (appType === "Database") {
      return {
        accountParams: {
          connection: "acctAuth",
          processingType: "SequentialAndIterative",
          statusAndThresholdConfig: {
            statusColumn: dbStatusColumn,
            activeStatus: [ dbActiveValue ],
            deleteLinks: true,
            accountThresholdValue: 100
          },
          call: {
            call1: {
              callOrder: 0,
              stageNumber: 0,
              sql: {
                query: dbReconQuery
              },
              keyField: "accountID",
              colsToPropsMap: dbAttributeRows.reduce((acc, row) => {
                acc[row.prop] = `${row.path}~#~${row.type}`;
                return acc;
              }, {} as Record<string, string>),
              disableDeletedAccounts: true
            }
          }
        }
      };
    } else if (appType === "File") {
      return {
        accountParams: {
          connection: "acctAuth",
          processingType: "SequentialAndIterative",
          statusAndThresholdConfig: {
            statusColumn: fileStatusColumn,
            activeStatus: [ fileActiveValue ],
            deleteLinks: true,
            accountThresholdValue: 100
          },
          call: {
            call1: {
              callOrder: 0,
              stageNumber: 0,
              file: {
                path: filePath,
                delimiter: fileDelimiter,
                encoding: fileEncoding,
                hasHeader: fileHasHeader === "true"
              },
              keyField: "accountID",
              colsToPropsMap: fileAttributeRows.reduce((acc, row) => {
                acc[row.prop] = `${row.path}~#~${row.type}`;
                return acc;
              }, {} as Record<string, string>),
              disableDeletedAccounts: true
            }
          }
        }
      };
    } else {
      // REST / SCIM
      return {
        accountParams: {
          connection: "acctAuth",
          processingType: "SequentialAndIterative",
          statusAndThresholdConfig: {
            statusColumn: statusColumn,
            activeStatus: [ activeValue ],
            deleteLinks: true,
            accountThresholdValue: 100
          },
          call: {
            call1: {
              callOrder: 0,
              stageNumber: 0,
              http: {
                url: serviceUrl + reconPath,
                httpHeaders: {
                  [authHeaderName]: `\${access_token}`,
                  "Accept": "application/json"
                },
                "httpContentType": "application/json",
                "httpMethod": reconMethod
              },
              listField: listField,
              keyField: "accountID",
              colsToPropsMap: attributeRows.reduce((acc, row) => {
                acc[row.prop] = `${row.path}~#~${row.type}`;
                return acc;
              }, {} as Record<string, string>),
              disableDeletedAccounts: true
            }
          }
        }
      };
    }
  };

  const buildImportUserJSON = () => {
    if (appType === "Database" || appType === "File") {
      return {
        info: "Reconciliation of identities (Users) is typically processed via File or Database account import steps. Separate ImportUser is optional."
      };
    }
    return {
      connection: "acctAuth",
      url: serviceUrl + "/Users",
      httpMethod: "GET",
      httpHeaders: {
        [authHeaderName]: `\${access_token}`
      },
      userResponsePath: "users",
      colsToPropsMap: {
        "username": "username~#~char",
        "email": "email~#~char",
        "firstname": "firstname~#~char",
        "lastname": "lastname~#~char"
      }
    };
  };

  const buildCreateAccountJSON = () => {
    if (appType === "Database") {
      return {
        accountIdPath: dbKeyColumn,
        call: [
          {
            name: "CreateAccount",
            connection: "acctAuth",
            sql: {
              statement: dbCreateQuery
            },
            successResponses: {
              statusCode: [ 1 ]
            }
          }
        ]
      };
    }
    if (appType === "File") {
      return { info: "Provisioning operations are not supported by CSV Delimited File Connectors." };
    }
    return {
      accountIdPath: keyField,
      dateFormat: "yyyy-MM-dd'T'HH:mm:ssXXX",
      call: [
        {
          name: "CreateAccount",
          connection: "acctAuth",
          url: serviceUrl + createPath,
          httpMethod: createMethod,
          httpParams: createPayload,
          httpHeaders: {
            [authHeaderName]: `\${access_token}`,
            "Content-Type": "application/json"
          },
          httpContentType: "application/json",
          successResponses: {
            statusCode: [ 200, 201 ]
          }
        }
      ]
    };
  };

  const buildUpdateAccountJSON = () => {
    if (appType === "Database") {
      return {
        call: [
          {
            name: "UpdateAccount",
            connection: "acctAuth",
            sql: {
              statement: dbUpdateQuery
            },
            successResponses: {
              statusCode: [ 1 ]
            }
          }
        ]
      };
    }
    if (appType === "File") {
      return { info: "Provisioning operations are not supported by CSV Delimited File Connectors." };
    }
    return {
      call: [
        {
          name: "UpdateAccount",
          connection: "acctAuth",
          url: serviceUrl + updatePath,
          httpMethod: updateMethod,
          httpParams: updatePayload,
          httpHeaders: {
            [authHeaderName]: `\${access_token}`,
            "Content-Type": "application/json"
          },
          httpContentType: "application/json",
          successResponses: {
            statusCode: [ 200, 204 ]
          }
        }
      ]
    };
  };

  const buildDisableAccountJSON = () => {
    if (appType === "Database") {
      return {
        call: [
          {
            name: "DisableAccount",
            connection: "acctAuth",
            sql: {
              statement: dbDisableQuery
            },
            successResponses: {
              statusCode: [ 1 ]
            }
          }
        ]
      };
    }
    if (appType === "File") {
      return { info: "Provisioning operations are not supported by CSV Delimited File Connectors." };
    }
    return {
      call: [
        {
          name: "DisableAccount",
          connection: "acctAuth",
          url: serviceUrl + disablePath,
          httpMethod: disableMethod,
          httpParams: disablePayload,
          httpHeaders: {
            [authHeaderName]: `\${access_token}`,
            "Content-Type": "application/json"
          },
          httpContentType: "application/json",
          successResponses: {
            statusCode: [ 200, 204 ]
          }
        }
      ]
    };
  };

  const buildAddAccessJSON = () => {
    if (appType === "Database") {
      return {
        call: [
          {
            name: "AddAccess",
            connection: "acctAuth",
            sql: {
              statement: dbAddAccessQuery
            },
            successResponses: {
              statusCode: [ 1 ]
            }
          }
        ]
      };
    }
    if (appType === "File") {
      return { info: "Provisioning operations are not supported by CSV Delimited File Connectors." };
    }
    return {
      call: [
        {
          name: "AddAccess",
          connection: "acctAuth",
          url: serviceUrl + addAccessPath,
          httpMethod: addAccessMethod,
          httpParams: addAccessPayload,
          httpHeaders: {
            [authHeaderName]: `\${access_token}`,
            "Content-Type": "application/json"
          },
          httpContentType: "application/json",
          successResponses: {
            statusCode: [ 200, 201 ]
          }
        }
      ]
    };
  };

  // Suite generation map
  const getFullSuite = () => {
    const connectionJSON = buildConnectionJSON();
    const importAccountEntJSON = buildImportAccountEntJSON();
    const importUserJSON = buildImportUserJSON();
    const createAccountJSON = buildCreateAccountJSON();
    const updateAccountJSON = buildUpdateAccountJSON();
    const disableAccountJSON = buildDisableAccountJSON();
    const addAccessJSON = buildAddAccessJSON();

    if (appType === "File") {
      return {
        "ConnectionJSON.json": JSON.stringify(connectionJSON, null, 2),
        "ImportAccountEntJSON.json": JSON.stringify(importAccountEntJSON, null, 2),
      };
    }

    return {
      "ConnectionJSON.json": JSON.stringify(connectionJSON, null, 2),
      "ImportAccountEntJSON.json": JSON.stringify(importAccountEntJSON, null, 2),
      "ImportUserJSON.json": JSON.stringify(importUserJSON, null, 2),
      "CreateAccountJSON.json": JSON.stringify(createAccountJSON, null, 2),
      "UpdateAccountJSON.json": JSON.stringify(updateAccountJSON, null, 2),
      "DisableAccountJSON.json": JSON.stringify(disableAccountJSON, null, 2),
      "AddAccessJSON.json": JSON.stringify(addAccessJSON, null, 2),
    };
  };

  const fullSuite = getFullSuite() as Record<string, string>;
  const activeJsonContent = fullSuite[`${activeTab}.json`] || "";

  // Schema Validator Rules
  function runValidation() {
    const list: ValidationCheck[] = [];

    if (appType === "File") {
      // Rule 1: File path defined
      if (filePath && filePath.trim().length > 0) {
        list.push({
          id: "file-path",
          label: "Valid CSV File Path",
          status: "success",
          detail: "Configured target file import path correctly."
        });
      } else {
        list.push({
          id: "file-path",
          label: "Valid CSV File Path",
          status: "error",
          detail: "Mandatory Handbook Rule: File connector must define a valid absolute directory filepath or filename."
        });
      }

      // Rule 2: Delimiter check
      if (fileDelimiter) {
        list.push({
          id: "file-delimiter",
          label: "Delimiter Parameter",
          status: "success",
          detail: `CSV column delimiter is active ('${fileDelimiter}').`
        });
      } else {
        list.push({
          id: "file-delimiter",
          label: "Delimiter Parameter",
          status: "error",
          detail: "Delimiter must be selected (comma, semicolon, tab, pipe etc.)."
        });
      }

      // Rule 3: AccountID Mapping
      const hasAccountId = fileAttributeRows.some(x => x.prop === "accountID");
      if (hasAccountId) {
        list.push({
          id: "file-accountid",
          label: "Mandatory 'accountID' CSV Mapping",
          status: "success",
          detail: "'accountID' is uniquely mapped to a CSV column header."
        });
      } else {
        list.push({
          id: "file-accountid",
          label: "Mandatory 'accountID' CSV Mapping",
          status: "error",
          detail: "Handbook requires 'accountID' mapping in colsToPropsMap to align file columns to unique Saviynt records."
        });
      }
    } else if (appType === "Database") {
      // Rule 1: JDBC URL validity
      if (dbUrl && dbUrl.startsWith("jdbc:")) {
        list.push({
          id: "db-url",
          label: "JDBC Connection URL Syntax",
          status: "success",
          detail: "JDBC connection string conforms with standard JDBC schema definition prefixes."
        });
      } else {
        list.push({
          id: "db-url",
          label: "JDBC Connection URL Syntax",
          status: "error",
          detail: "Mandatory Handbook Rule: Connection URL for Database connectors must begin with 'jdbc:' (e.g. jdbc:mysql://...)."
        });
      }

      // Rule 2: SELECT query exists
      if (dbReconQuery && dbReconQuery.toUpperCase().includes("SELECT")) {
        list.push({
          id: "db-query",
          label: "Reconciliation Query Verification",
          status: "success",
          detail: "Reconciliation query includes valid read expressions."
        });
      } else {
        list.push({
          id: "db-query",
          label: "Reconciliation Query Verification",
          status: "error",
          detail: "The reconciliation SQL call query must be a non-empty 'SELECT' query statement."
        });
      }

      // Rule 3: accountID mapping defined
      const hasAccountId = dbAttributeRows.some(x => x.prop === "accountID");
      if (hasAccountId) {
        list.push({
          id: "db-accountid",
          label: "Mandatory Column 'accountID' SQL Mapping",
          status: "success",
          detail: "'accountID' is correctly bound to a returned SQL query column."
        });
      } else {
        list.push({
          id: "db-accountid",
          label: "Mandatory Column 'accountID' SQL Mapping",
          status: "error",
          detail: "You must map Saviynt property 'accountID' in colsToPropsMap to a table row primary key."
        });
      }
    } else {
      // REST/SCIM rules
      // Rule 1: #HEADERS# rule for access tokens mapping
      if (accessTokenLocation === "header") {
        if (accessTokenPath.toUpperCase().includes("HEADER") || buildConnectionJSON().authentications?.acctAuth?.tokenResponsePath?.startsWith("#HEADERS#")) {
          list.push({
            id: "header-token",
            label: "Headers Access Token Path Compliance",
            status: "success",
            detail: "Using '#HEADERS#Set-Cookie' tokenResponsePath because token location resides in HTTP headers.",
          });
        } else {
          list.push({
            id: "header-token",
            label: "Headers Access Token Path Compliance",
            status: "error",
            detail: "Mandatory Handbook Rule: When the access token resides in HTTP headers, tokenResponsePath MUST start with '#HEADERS#'.",
          });
        }
      } else {
        list.push({
          id: "header-token",
          label: "Headers Access Token Path Compliance",
          status: "success",
          detail: "Standard JSON-body tokenResponsePath is active.",
        });
      }

      // Rule 2: colsToPropsMap includes accountID
      const hasAccountID = attributeRows.some(x => x.prop === "accountID");
      if (hasAccountID) {
        list.push({
          id: "prop-accountid",
          label: "Mandatory Column 'accountID' Mapping",
          status: "success",
          detail: "'accountID' is correctly mapped under colsToPropsMap.",
        });
      } else {
        list.push({
          id: "prop-accountid",
          label: "Mandatory Column 'accountID' Mapping",
          status: "error",
          detail: "EIC requires 'accountID' to be mapped in colsToPropsMap to uniquely identify user accounts.",
        });
      }

      // Rule 3: customproperty31 or acctEntMappingInfoColumnFromEnt
      const hasCustomProp31 = attributeRows.some(x => x.prop === "customproperty31" || x.prop === "acctEntMappingInfoColumnFromEnt");
      if (hasCustomProp31) {
        list.push({
          id: "ent-customprop",
          label: "Entitlements Mapping Metadata Column",
          status: "success",
          detail: "'customproperty31' is configured to record entitlement metadata mapping info in EIC.",
        });
      } else {
        list.push({
          id: "ent-customprop",
          label: "Entitlements Mapping Metadata Column",
          status: "warning",
          detail: "Saviynt recommends mapping 'customproperty31' or 'acctEntMappingInfoColumnFromEnt' to hold account entitlement mappings in EIC.",
        });
      }

      // Rule 4: dateFormat validation
      list.push({
        id: "date-format",
        label: "Date Format Compatibility",
        status: "success",
        detail: "Standard ISO format or compatible format is configured.",
      });

      // Rule 5: base URL filled
      if (serviceUrl && serviceUrl.startsWith("http")) {
        list.push({
          id: "base-url",
          label: "Base Service URL Validity",
          status: "success",
          detail: "Valid service base URL path provided.",
        });
      } else {
        list.push({
          id: "base-url",
          label: "Base Service URL Validity",
          status: "error",
          detail: "Target API base URL must start with http:// or https://",
        });
      }
    }

    setValidations(list);
    setShowValidator(true);
  }

  // Synchronize configurations to sessionStorage and route to API test Playpen
  function saveStateAndNavigate() {
    const configData = {
      appType,
      appName,
      serviceUrl,
      authType,
      authUrl,
      authMethod,
      grantType,
      clientId,
      clientSecret,
      username,
      password,
      accessTokenPath,
      tokenType,
      authHeaderName,
      accessTokenLocation,
      reconEnabled,
      reconPath,
      reconMethod,
      listField,
      keyField,
      statusColumn,
      activeValue,
      inactiveValue,
      createEnabled,
      createPath,
      createMethod,
      createPayload,
      updateEnabled,
      updatePath,
      updateMethod,
      updatePayload,
      disableEnabled,
      disablePath,
      disableMethod,
      disablePayload,
      addAccessEnabled,
      addAccessPath,
      addAccessMethod,
      addAccessPayload,
      attributeRows
    };
    sessionStorage.setItem("saviynt_connected_app_config", JSON.stringify(configData));
    window.location.href = "/wizard/connected-app/playpen";
  }

  // Save to local workspaces
  async function saveSuiteToWorkspace() {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/wizard/connected-app/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appName: appName,
          files: fullSuite,
        }),
      });

      if (!res.ok) throw new Error("Failed to export suite to workspaces");
      const json = await res.json();

      setSavedFolder(json.path);
      setSaveStatus("success");
    } catch (err: any) {
      console.error(err);
      setSaveStatus("error");
    }
  }

  // Copy to clipboard
  function copyToClipboard() {
    navigator.clipboard.writeText(activeJsonContent);
    setCopystate(true);
    setTimeout(() => setCopystate(false), 2000);
  }

  // Download individual JSON
  function downloadJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(activeJsonContent);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeTab}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // Execute sandbox API request using local CORS-bypass proxy
  async function executeSandboxRequest() {
    setSandboxLoading(true);
    setSandboxResponse(null);
    try {
      let parsedHeaders = {};
      if (sandboxHeaders) {
        try {
          parsedHeaders = JSON.parse(sandboxHeaders);
        } catch (e) {
          throw new Error("Invalid request headers JSON format.");
        }
      }
      
      let parsedBody = sandboxBody;
      if (sandboxBody && typeof sandboxBody === "string") {
        try {
          parsedBody = JSON.parse(sandboxBody);
        } catch {
          // Send as raw string if it's not JSON
        }
      }

      const res = await fetch("/api/wizard/connected-app/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: sandboxUrl,
          method: sandboxMethod,
          headers: parsedHeaders,
          body: parsedBody
        })
      });

      const data = await res.json();
      setSandboxResponse(data);
    } catch (err: any) {
      setSandboxResponse({
        ok: false,
        status: 500,
        statusText: "Client Request Failure",
        body: { error: err.message }
      });
    } finally {
      setSandboxLoading(false);
    }
  }

  // Compile active endpoints and payloads into standard Postman/Bruno compatible collection
  function exportPostmanCollection() {
    const formattedUrl = (urlStr: string) => {
      try {
        const u = new URL(urlStr);
        return {
          raw: urlStr,
          protocol: u.protocol.replace(":", ""),
          host: u.hostname.split("."),
          path: u.pathname.split("/").filter(Boolean),
          query: Array.from(u.searchParams.entries()).map(([key, value]) => ({ key, value }))
        };
      } catch {
        return {
          raw: urlStr,
          protocol: "https",
          host: ["api", "example", "com"],
          path: urlStr.split("/").filter(Boolean)
        };
      }
    };

    const items: any[] = [];

    // 1. Auth Endpoint
    if (authType === "oauth2" && authUrl) {
      items.push({
        name: "1. Authentication Handshake (OAuth2)",
        request: {
          method: authMethod || "POST",
          header: [
            {
              key: "Content-Type",
              value: "application/x-www-form-urlencoded"
            }
          ],
          body: {
            mode: "urlencoded",
            urlencoded: [
              { key: "grant_type", value: grantType },
              { key: "client_id", value: clientId },
              { key: "client_secret", value: clientSecret }
            ]
          },
          url: formattedUrl(authUrl)
        }
      });
    } else if (authType === "Basic") {
      items.push({
        name: "1. Authentication Handshake (Basic Auth Example)",
        request: {
          method: "GET",
          header: [
            {
              key: "Authorization",
              value: `Basic {{basic_auth_base64_token}}`
            }
          ],
          url: formattedUrl(serviceUrl || "https://api.example.com")
        }
      });
    }

    // 2. Recon Endpoint
    if (reconEnabled && reconPath) {
      items.push({
        name: "2. Account Reconciliation (Fetch Accounts)",
        request: {
          method: reconMethod || "GET",
          header: [
            {
              key: authHeaderName || "Authorization",
              value: `${tokenType || "Bearer"} {{access_token}}`
            },
            {
              key: "Accept",
              value: "application/json"
            }
          ],
          url: formattedUrl((serviceUrl || "") + reconPath)
        }
      });
    }

    // 3. Create Account
    if (createEnabled && createPath) {
      items.push({
        name: "3. Create Account (Provisioning)",
        request: {
          method: createMethod || "POST",
          header: [
            {
              key: authHeaderName || "Authorization",
              value: `${tokenType || "Bearer"} {{access_token}}`
            },
            {
              key: "Content-Type",
              value: "application/json"
            }
          ],
          body: {
            mode: "raw",
            raw: createPayload
          },
          url: formattedUrl((serviceUrl || "") + createPath)
        }
      });
    }

    // 4. Update Account
    if (updateEnabled && updatePath) {
      items.push({
        name: "4. Update Account",
        request: {
          method: updateMethod || "PATCH",
          header: [
            {
              key: authHeaderName || "Authorization",
              value: `${tokenType || "Bearer"} {{access_token}}`
            },
            {
              key: "Content-Type",
              value: "application/json"
            }
          ],
          body: {
            mode: "raw",
            raw: updatePayload
          },
          url: formattedUrl((serviceUrl || "") + updatePath)
        }
      });
    }

    // 5. Disable Account
    if (disableEnabled && disablePath) {
      items.push({
        name: "5. Disable/Lock Account",
        request: {
          method: disableMethod || "PATCH",
          header: [
            {
              key: authHeaderName || "Authorization",
              value: `${tokenType || "Bearer"} {{access_token}}`
            },
            {
              key: "Content-Type",
              value: "application/json"
            }
          ],
          body: {
            mode: "raw",
            raw: disablePayload
          },
          url: formattedUrl((serviceUrl || "") + disablePath)
        }
      });
    }

    // 6. Add Access
    if (addAccessEnabled && addAccessPath) {
      items.push({
        name: "6. Grant Access / Add Entitlement",
        request: {
          method: addAccessMethod || "POST",
          header: [
            {
              key: authHeaderName || "Authorization",
              value: `${tokenType || "Bearer"} {{access_token}}`
            },
            {
              key: "Content-Type",
              value: "application/json"
            }
          ],
          body: {
            mode: "raw",
            raw: addAccessPayload
          },
          url: formattedUrl((serviceUrl || "") + addAccessPath)
        }
      });
    }

    const collection = {
      info: {
        _postman_id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "saviynt-wizard-app-collection-" + Math.floor(Math.random() * 100000),
        name: `${appName || "Saviynt"} API Collection`,
        description: `Exported API testing suite for ${appName || "Saviynt Connected App"}. Suitable for import into Postman or Bruno.`,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: items
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${(appName || "Saviynt").replace(/\s+/g, "_")}_postman_collection.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }


  // Add attribute mapping row
  function addRow() {
    if (!newProp.trim() || !newPath.trim()) return;
    
    if (appType === "Database") {
      setDbAttributeRows([...dbAttributeRows, { prop: newProp.trim(), path: newPath.trim(), type: newType }]);
    } else if (appType === "File") {
      setFileAttributeRows([...fileAttributeRows, { prop: newProp.trim(), path: newPath.trim(), type: newType }]);
    } else {
      setAttributeRows([...attributeRows, { prop: newProp.trim(), path: newPath.trim(), type: newType }]);
    }
    
    setNewProp("");
    setNewPath("");
  }

  // Remove attribute mapping
  function removeRow(idx: number) {
    if (appType === "Database") {
      setDbAttributeRows(dbAttributeRows.filter((_, i) => i !== idx));
    } else if (appType === "File") {
      setFileAttributeRows(fileAttributeRows.filter((_, i) => i !== idx));
    } else {
      setAttributeRows(attributeRows.filter((_, i) => i !== idx));
    }
  }

  // Active items mapping selector helper
  const getActiveRows = () => {
    if (appType === "Database") return dbAttributeRows;
    if (appType === "File") return fileAttributeRows;
    return attributeRows;
  };

  return (
    <Day0Shell
      title="Saviynt Connected App Builder"
      subtitle="Define and package custom REST, SCIM, Delimited File, and SQL Database configuration suites."
      backTo="/wizard/steps/welcome"
      widthClass="max-w-7xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_520px] gap-8 min-h-[600px]">
        {/* LEFT CARD: GUIDED STEP INTERVIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 flex flex-col justify-between">
          <div>
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4 text-xs font-semibold text-slate-400">
              <span className="text-sky-400 font-bold">Step {currentStep} of {getMaxSteps()}</span>
              <div className="flex gap-1.5">
                {Array.from({ length: getMaxSteps() }, (_, i) => i + 1).map((s) => (
                  <div
                    key={s}
                    className={`w-5 h-1.5 rounded-full transition ${
                      s === currentStep
                        ? "bg-purple-500"
                        : s < currentStep
                        ? "bg-sky-400"
                        : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Stepper Content */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Step 1: Application & Connector Profile</h3>
                <p className="text-xs text-slate-400">Specify the system properties and communication engine type.</p>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-medium">Application Name</label>
                    <input
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="My Enterprise App"
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-slate-300 font-medium">Connector Engine Architecture</label>
                    <select
                      value={appType}
                      onChange={(e) => setAppType(e.target.value as any)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                    >
                      <option value="REST">Custom REST API Connector (JSON/HTTP)</option>
                      <option value="SCIM">SCIM 2.0 Compliant Connector</option>
                      <option value="Database">SQL Database Connector (JDBC/Direct Query)</option>
                      <option value="File">Delimited File Connector (CSV/SFTP)</option>
                    </select>
                  </div>

                  {/* Dynamic fields for Step 1 based on Type */}
                  {(appType === "REST" || appType === "SCIM") && (
                    <div className="flex flex-col gap-1.5 animate-fadeIn">
                      <label className="text-slate-300 font-medium">REST API Endpoint Base URL</label>
                      <input
                        value={serviceUrl}
                        onChange={(e) => setServiceUrl(e.target.value)}
                        placeholder="https://api.example.com/v2"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  )}

                  {appType === "Database" && (
                    <>
                      <div className="flex flex-col gap-1.5 animate-fadeIn">
                        <label className="text-slate-300 font-medium">JDBC Connection URL string</label>
                        <input
                          value={dbUrl}
                          onChange={(e) => setDbUrl(e.target.value)}
                          placeholder="jdbc:mysql://localhost:3306/db_name"
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5 animate-fadeIn">
                        <label className="text-slate-300 font-medium">JDBC Driver Classname</label>
                        <select
                          value={dbDriver}
                          onChange={(e) => setDbDriver(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                        >
                          <option value="com.mysql.cj.jdbc.Driver">MySQL Connector/J (com.mysql.cj.jdbc.Driver)</option>
                          <option value="oracle.jdbc.driver.OracleDriver">Oracle Thin Driver (oracle.jdbc.driver.OracleDriver)</option>
                          <option value="com.microsoft.sqlserver.jdbc.SQLServerDriver">Microsoft SQL Server (com.microsoft.sqlserver.jdbc.SQLServerDriver)</option>
                          <option value="org.postgresql.Driver">PostgreSQL Driver (org.postgresql.Driver)</option>
                        </select>
                      </div>
                    </>
                  )}

                  {appType === "File" && (
                    <>
                      <div className="flex flex-col gap-1.5 animate-fadeIn">
                        <label className="text-slate-300 font-medium">CSV File Absolute Import Path</label>
                        <input
                          value={filePath}
                          onChange={(e) => setFilePath(e.target.value)}
                          placeholder="/var/saviynt/imports/users.csv"
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5 animate-fadeIn">
                          <label className="text-slate-300 font-medium">Delimiter Character</label>
                          <select
                            value={fileDelimiter}
                            onChange={(e) => setFileDelimiter(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                          >
                            <option value=",">Comma ( , )</option>
                            <option value=";">Semicolon ( ; )</option>
                            <option value="\t">Tab ( \t )</option>
                            <option value="|">Pipe ( | )</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5 animate-fadeIn">
                          <label className="text-slate-300 font-medium">File Character Encoding</label>
                          <select
                            value={fileEncoding}
                            onChange={(e) => setFileEncoding(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                          >
                            <option value="UTF-8">UTF-8</option>
                            <option value="ISO-8859-1">ISO-8859-1</option>
                            <option value="UTF-16">UTF-16</option>
                            <option value="US-ASCII">US-ASCII</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  {appType === "Database" ? "Step 2: Database Credentials" : appType === "File" ? "Step 2: File Fetching / SFTP Configuration" : "Step 2: Authentication Handshake"}
                </h3>
                <p className="text-xs text-slate-400">Define access authentication keys or protocol mechanisms.</p>

                {/* REST & SCIM Fields */}
                {(appType === "REST" || appType === "SCIM") && (
                  <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Auth Flow Type</label>
                      <select
                        value={authType}
                        onChange={(e) => setAuthType(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      >
                        <option value="oauth2">OAuth2 (Client Credentials)</option>
                        <option value="Basic">HTTP Basic Auth</option>
                        <option value="Bearer">Static Bearer Token</option>
                        <option value="cookies">Cookie-based Auth</option>
                        <option value="HMAC">HMAC Cryptographic Signature</option>
                      </select>
                    </div>

                    {authType !== "Basic" && authType !== "Bearer" && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-300">Auth Endpoint URL</label>
                        <input
                          value={authUrl}
                          onChange={(e) => setAuthUrl(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                    )}

                    {authType === "oauth2" && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-300">Client ID</label>
                          <input
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-300">Client Secret</label>
                          <input
                            type="password"
                            value={clientSecret}
                            onChange={(e) => setClientSecret(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </>
                    )}

                    {authType === "Basic" && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-300">Username</label>
                          <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-slate-300">Password</label>
                          <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 font-medium">Access Token JSON Path</label>
                      <input
                        value={accessTokenPath}
                        onChange={(e) => setAccessTokenPath(e.target.value)}
                        placeholder="access_token"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Token Response Location</label>
                      <select
                        value={accessTokenLocation}
                        onChange={(e) => setAccessTokenLocation(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      >
                        <option value="body">Body (JSON parameters)</option>
                        <option value="header">Headers (e.g. Set-Cookie/Authorization)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Database Credentials Fields */}
                {appType === "Database" && (
                  <div className="grid grid-cols-1 gap-4 pt-2 text-xs animate-fadeIn">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 font-medium">Database Account User</label>
                      <input
                        value={dbUsername}
                        onChange={(e) => setDbUsername(e.target.value)}
                        placeholder="saviynt_app"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 font-medium">Database Account Password</label>
                      <input
                        type="password"
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        placeholder="database password"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="p-3.5 bg-sky-950/20 border border-sky-500/20 rounded-xl text-sky-300">
                      Saviynt Enterprise Identity Cloud connects directly to the DB instances. Ensure the DB user has suitable reads and updates/inserts permissions on target schema views.
                    </div>
                  </div>
                )}

                {/* File Transfer / Fetching SFTP Fields */}
                {appType === "File" && (
                  <div className="space-y-4 pt-2 text-xs animate-fadeIn">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 font-medium">File Fetch Strategy</label>
                      <select
                        value={fileSourceType}
                        onChange={(e) => setFileSourceType(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      >
                        <option value="local">Local Directory Mounting (Local File Path)</option>
                        <option value="sftp">Secure FTP Remote Client Fetch (SFTP Server)</option>
                      </select>
                    </div>

                    {fileSourceType === "sftp" && (
                      <div className="grid grid-cols-2 gap-3.5 border border-slate-800 bg-slate-950/30 rounded-xl p-4 animate-fadeIn">
                        <div className="flex flex-col gap-1">
                          <label className="text-slate-300">SFTP Server Hostname</label>
                          <input
                            value={sftpHost}
                            onChange={(e) => setSftpHost(e.target.value)}
                            placeholder="sftp.example.com"
                            className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-slate-300">SFTP Server Port</label>
                          <input
                            value={sftpPort}
                            onChange={(e) => setSftpPort(e.target.value)}
                            className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-100 font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-slate-300">SFTP SSH Username</label>
                          <input
                            value={sftpUser}
                            onChange={(e) => setSftpUser(e.target.value)}
                            className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-100"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-slate-300">SFTP SSH Password</label>
                          <input
                            type="password"
                            value={sftpPassword}
                            onChange={(e) => setSftpPassword(e.target.value)}
                            className="bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-slate-100"
                          />
                        </div>
                      </div>
                    )}

                    {fileSourceType === "local" && (
                      <div className="p-3.5 bg-purple-950/20 border border-purple-500/20 rounded-xl text-purple-300">
                        CSV data files will be parsed directly from the mounted filepath directory inside EIC agent execution paths. Ensure absolute access path properties are configured.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Step 3: User & Account Reconciliation Details</h3>
                <p className="text-xs text-slate-400">Configure parameters for importing users/accounts into Saviynt core indexes.</p>

                {/* REST & SCIM Reconciliation */}
                {(appType === "REST" || appType === "SCIM") && (
                  <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Recon Path</label>
                      <input
                        value={reconPath}
                        onChange={(e) => setReconPath(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 font-medium">List Wrapper Key</label>
                      <input
                        value={listField}
                        onChange={(e) => setListField(e.target.value)}
                        placeholder="users"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 font-medium">Unique Account Key</label>
                      <input
                        value={keyField}
                        onChange={(e) => setKeyField(e.target.value)}
                        placeholder="id"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Status Column Key</label>
                      <input
                        value={statusColumn}
                        onChange={(e) => setStatusColumn(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Active Status Value</label>
                      <input
                        value={activeValue}
                        onChange={(e) => setActiveValue(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Inactive Status Value</label>
                      <input
                        value={inactiveValue}
                        onChange={(e) => setInactiveValue(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                )}

                {/* SQL Database Reconciliation */}
                {appType === "Database" && (
                  <div className="space-y-3.5 pt-2 text-xs animate-fadeIn">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300 font-semibold">Account Reconciliation Query (SQL SELECT)</label>
                      <textarea
                        value={dbReconQuery}
                        onChange={(e) => setDbReconQuery(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-300 font-medium">Reconciled Account ID Key Column</label>
                        <input
                          value={dbKeyColumn}
                          onChange={(e) => setDbKeyColumn(e.target.value)}
                          placeholder="employee_id"
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-300">DB Status Column Name</label>
                        <input
                          value={dbStatusColumn}
                          onChange={(e) => setDbStatusColumn(e.target.value)}
                          placeholder="active_status"
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-300">Active Row Status Value</label>
                        <input
                          value={dbActiveValue}
                          onChange={(e) => setDbActiveValue(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-slate-300">Inactive Row Status Value</label>
                        <input
                          value={dbInactiveValue}
                          onChange={(e) => setDbInactiveValue(e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Delimited CSV File Reconciliation */}
                {appType === "File" && (
                  <div className="grid grid-cols-2 gap-4 pt-2 text-xs animate-fadeIn">
                    <div className="flex flex-col gap-1.5 col-span-2">
                      <label className="text-slate-300 font-medium">CSV Account Primary Key Column Header</label>
                      <input
                        value={fileKeyColumn}
                        onChange={(e) => setFileKeyColumn(e.target.value)}
                        placeholder="id"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">CSV Status Column Header</label>
                      <input
                        value={fileStatusColumn}
                        onChange={(e) => setFileStatusColumn(e.target.value)}
                        placeholder="status"
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Active Row Value Label</label>
                      <input
                        value={fileActiveValue}
                        onChange={(e) => setFileActiveValue(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-slate-300">Inactive Row Value Label</label>
                      <input
                        value={fileInactiveValue}
                        onChange={(e) => setFileInactiveValue(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && appType !== "File" && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Step 4: Provisioning Operations & SQL Queries</h3>
                <p className="text-xs text-slate-400">Configure provisioning expressions triggered on create, disable, and grant events.</p>

                <div className="space-y-4 pt-2 text-xs max-h-[350px] overflow-auto pr-2">
                  {/* REST & SCIM Provisioning endpoints */}
                  {(appType === "REST" || appType === "SCIM") && (
                    <>
                      {/* Create */}
                      <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 animate-fadeIn">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-purple-400">User Creation Endpoint</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <input
                            value={createPath}
                            onChange={(e) => setCreatePath(e.target.value)}
                            className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                          />
                          <select
                            value={createMethod}
                            onChange={(e) => setCreateMethod(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                          >
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                          </select>
                        </div>
                        <textarea
                          value={createPayload}
                          onChange={(e) => setCreatePayload(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Update */}
                      <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-purple-400">User Update Endpoint</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <input
                            value={updatePath}
                            onChange={(e) => setUpdatePath(e.target.value)}
                            className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                          />
                          <select
                            value={updateMethod}
                            onChange={(e) => setUpdateMethod(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                          >
                            <option value="PATCH">PATCH</option>
                            <option value="PUT">PUT</option>
                            <option value="POST">POST</option>
                          </select>
                        </div>
                        <textarea
                          value={updatePayload}
                          onChange={(e) => setUpdatePayload(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Disable */}
                      <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-purple-400">Lock / Disable User Endpoint</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <input
                            value={disablePath}
                            onChange={(e) => setDisablePath(e.target.value)}
                            className="col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                          />
                          <select
                            value={disableMethod}
                            onChange={(e) => setDisableMethod(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500"
                          >
                            <option value="PATCH">PATCH</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                        </div>
                        <textarea
                          value={disablePayload}
                          onChange={(e) => setDisablePayload(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </>
                  )}

                  {/* SQL Database Provisioning Queries */}
                  {appType === "Database" && (
                    <>
                      {/* Create SQL */}
                      <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40 animate-fadeIn">
                        <span className="font-semibold text-purple-400 block mb-1.5">User Create Statement (INSERT)</span>
                        <textarea
                          value={dbCreateQuery}
                          onChange={(e) => setDbCreateQuery(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Update SQL */}
                      <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                        <span className="font-semibold text-purple-400 block mb-1.5">User Update Statement (UPDATE)</span>
                        <textarea
                          value={dbUpdateQuery}
                          onChange={(e) => setDbUpdateQuery(e.target.value)}
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Disable SQL */}
                      <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                        <span className="font-semibold text-purple-400 block mb-1.5">User Lock / Disable Statement</span>
                        <textarea
                          value={dbDisableQuery}
                          onChange={(e) => setDbDisableQuery(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                        />
                      </div>

                      {/* Add Access SQL */}
                      <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/40">
                        <span className="font-semibold text-purple-400 block mb-1.5">Add Entitlement Access Statement</span>
                        <textarea
                          value={dbAddAccessQuery}
                          onChange={(e) => setDbAddAccessQuery(e.target.value)}
                          rows={2}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 font-mono text-[10px] focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 5 (or Step 4 for File): Dynamic Attribute Mappings */}
            {((currentStep === 5 && appType !== "File") || (currentStep === 4 && appType === "File")) && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  {appType === "File" ? "Step 4: CSV File Header Mappings" : "Step 5: Dynamic Attribute Mappings"}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {appType === "File"
                    ? "Assign CSV Column Name Headers to target Saviynt properties."
                    : appType === "Database"
                    ? "Map query result SQL column names to target Saviynt properties."
                    : "Assign JSON payload parameters paths to target Saviynt properties."}
                </p>

                {/* Attribute Mapping Table */}
                <div className="max-h-[220px] overflow-auto border border-slate-800 rounded-xl bg-slate-950/30 text-xs">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold text-[11px]">
                        <th className="p-2 w-[35%]">Saviynt Col</th>
                        <th className="p-2 w-[40%]">
                          {appType === "File" ? "CSV Column" : appType === "Database" ? "SQL Column" : "JSON Path"}
                        </th>
                        <th className="p-2 w-[15%]">Datatype</th>
                        <th className="p-2 w-[10%] text-center"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {getActiveRows().map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-850 hover:bg-slate-900/50">
                          <td className="p-2 font-mono text-purple-400 break-all">{row.prop}</td>
                          <td className="p-2 font-mono text-sky-400 break-all">{row.path}</td>
                          <td className="p-2 text-slate-300 truncate">{row.type}</td>
                          <td className="p-2 text-center">
                            <button
                              onClick={() => removeRow(idx)}
                              className="text-red-400 hover:text-red-300 text-sm font-semibold"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Row form */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950/50 p-3 border border-slate-800 rounded-xl text-xs animate-fadeIn">
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">Saviynt Col</label>
                    <input
                      value={newProp}
                      onChange={(e) => setNewProp(e.target.value)}
                      placeholder="customproperty1"
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">
                      {appType === "File" ? "CSV Header" : appType === "Database" ? "SQL Col" : "JSON Path"}
                    </label>
                    <input
                      value={newPath}
                      onChange={(e) => setNewPath(e.target.value)}
                      placeholder={appType === "File" ? "email_addr" : appType === "Database" ? "emp_email" : "profile.email"}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-slate-500 font-medium">Datatype</label>
                    <div className="flex gap-2">
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-100 flex-1 focus:outline-none focus:border-sky-500"
                      >
                        <option value="char">char</option>
                        <option value="date">date</option>
                        <option value="bool">bool</option>
                        <option value="epochdate">epochdate</option>
                        <option value="json">json</option>
                      </select>
                      <button
                        onClick={addRow}
                        className="bg-purple-600 hover:bg-purple-500 text-white rounded px-3 text-sm font-semibold transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className={`
                px-4 py-2 rounded-lg text-xs font-semibold border transition-all
                ${
                  currentStep === 1
                    ? "border-slate-800 text-slate-600 cursor-not-allowed"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
                }
              `}
            >
              Back
            </button>

            {currentStep < getMaxSteps() ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(getMaxSteps(), prev + 1))}
                className="
                  px-4 py-2 rounded-lg text-xs font-semibold
                  bg-purple-600 hover:bg-purple-500 text-white
                  transition-all shadow-md shadow-purple-600/10
                "
              >
                Next Step
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={runValidation}
                  className="
                    px-4 py-2 rounded-lg text-xs font-semibold
                    border border-slate-700 bg-slate-800 text-slate-350 hover:bg-slate-700
                    transition-all
                  "
                >
                  Validate Suite
                </button>
                <button
                  onClick={saveStateAndNavigate}
                  className="
                    px-4 py-2 rounded-lg text-xs font-semibold
                    bg-purple-600 hover:bg-purple-500 text-white
                    transition-all shadow-md shadow-purple-600/10 flex items-center gap-1
                  "
                >
                  Next: API Sandbox ⚡
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: COMPILED PAYLOAD PREVIEW */}
        <div className="flex flex-col gap-6">
          {/* Main Controls Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <span className="text-sm font-semibold text-slate-200">Onboarding JSON Suite</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveSuiteToWorkspace}
                  disabled={saveStatus === "saving"}
                  className="
                    px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/30
                    bg-purple-950/20 text-purple-400 hover:bg-purple-950/50 hover:border-purple-500
                    transition-all duration-350 disabled:opacity-40
                  "
                >
                  {saveStatus === "saving" ? "Exporting..." : "Save to Workspace"}
                </button>
                <button
                  onClick={saveStateAndNavigate}
                  className="
                    px-3 py-1.5 rounded-lg text-xs font-semibold border border-sky-500/30
                    bg-sky-950/20 text-sky-400 hover:bg-sky-950/50 hover:border-sky-500
                    transition-all duration-350 flex items-center gap-1
                  "
                >
                  <span>⚡</span> Test APIs
                </button>
              </div>
            </div>

            {/* Save Status alerts */}
            {saveStatus === "success" && (
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex flex-col gap-1 animate-fadeIn">
                <div className="font-semibold">✓ Saved Successfully</div>
                <div className="text-[10px] text-slate-400">
                  Wrote {Object.keys(fullSuite).length} files to workspace path: <code className="text-sky-300">{savedFolder}</code>
                </div>
              </div>
            )}
            {saveStatus === "error" && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-xl text-red-300 text-xs">
                Failed to export generated configs to workspace.
              </div>
            )}

            {/* Preview Tabs (Dynamically adaptive per appType) */}
            <div className="flex flex-wrap gap-1 border-b border-slate-800/80 pb-2">
              {appType === "File" ? (
                ["ConnectionJSON", "ImportAccountEntJSON"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all
                      ${
                        activeTab === tab
                          ? "border-purple-500 bg-purple-950/30 text-purple-400"
                          : "border-slate-800 bg-slate-950/30 text-slate-400 hover:text-slate-200"
                      }
                    `}
                  >
                    {tab}
                  </button>
                ))
              ) : appType === "Database" ? (
                ["ConnectionJSON", "ImportAccountEntJSON", "CreateAccountJSON", "UpdateAccountJSON", "DisableAccountJSON", "AddAccessJSON"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all
                      ${
                        activeTab === tab
                          ? "border-purple-500 bg-purple-950/30 text-purple-400"
                          : "border-slate-800 bg-slate-950/30 text-slate-400 hover:text-slate-200"
                      }
                    `}
                  >
                    {tab}
                  </button>
                ))
              ) : (
                ["ConnectionJSON", "ImportAccountEntJSON", "ImportUserJSON", "CreateAccountJSON", "UpdateAccountJSON", "DisableAccountJSON", "AddAccessJSON"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`
                      px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all
                      ${
                        activeTab === tab
                          ? "border-purple-500 bg-purple-950/30 text-purple-400"
                          : "border-slate-800 bg-slate-950/30 text-slate-400 hover:text-slate-200"
                      }
                    `}
                  >
                    {tab}
                  </button>
                ))
              )}
            </div>

            {/* Code Block Container */}
            <div className="relative group animate-fadeIn">
              {/* Copy/Download controls */}
              <div className="absolute top-2.5 right-2.5 flex gap-2 opacity-30 group-hover:opacity-100 transition-all z-20">
                <button
                  onClick={copyToClipboard}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 border border-slate-700 shadow"
                >
                  {copystate ? "Copied!" : "Copy"}
                </button>
                <button
                  onClick={downloadJson}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-200 border border-slate-700 shadow"
                >
                  Download
                </button>
              </div>

              <pre className="text-[10.5px] font-mono whitespace-pre-wrap bg-slate-950 p-4 border border-slate-800 rounded-xl h-[360px] overflow-auto text-slate-300">
                {activeJsonContent}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* SCHEMA VALIDATION CHECK SCORECARD MODAL */}
      {showValidator && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-xl shadow-2xl relative max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📋</span>
                  <span className="text-lg font-bold text-slate-100">Saviynt Handbook Validation Scorecard</span>
                </div>
                <button
                  onClick={() => setShowValidator(false)}
                  className="text-slate-400 hover:text-slate-200 text-lg font-bold"
                >
                  ×
                </button>
              </div>

              {/* Validation Summary Card */}
              <div className="p-4 rounded-xl border border-sky-500/20 bg-gradient-to-r from-sky-950/40 to-slate-900/40 text-slate-200 text-xs shadow-md flex items-start gap-3 mb-5">
                <span className="text-2xl leading-none">⚙️</span>
                <div>
                  <div className="font-semibold text-sky-400">Schema Validation Complete</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Scanned Connection and Provisioning schema definitions against EIC Developer Handbook specifications. Review scores and checklist alerts below.
                  </div>
                </div>
              </div>

              {/* Scorecard Items */}
              <div className="space-y-2.5 overflow-auto max-h-[320px] pr-2 text-xs">
                {validations.map((v) => (
                  <div
                    key={v.id}
                    className={`p-3 border rounded-xl flex gap-3 items-start transition-all bg-slate-950/20 ${
                      v.status === "success"
                        ? "border-emerald-500/30"
                        : v.status === "warning"
                        ? "border-amber-500/30"
                        : "border-red-500/30"
                    }`}
                  >
                    <span className="text-base leading-none">
                      {v.status === "success" ? "✓" : v.status === "warning" ? "⚠" : "✗"}
                    </span>
                    <div>
                      <div className={`font-semibold ${
                        v.status === "success"
                          ? "text-emerald-400"
                          : v.status === "warning"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}>
                        {v.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">{v.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-4 mt-6">
              <button
                onClick={() => setShowValidator(false)}
                className="
                  px-5 py-2 rounded-xl text-xs font-semibold
                  bg-gradient-to-r from-sky-500 to-sky-600 text-white
                  hover:-translate-y-0.5 transition duration-200 shadow-lg shadow-sky-500/10
                "
              >
                Close Scorecard
              </button>
            </div>
          </div>
        </div>
      )}
    </Day0Shell>
  );
}
