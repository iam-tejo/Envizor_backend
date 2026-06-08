// app/api/day0/tenant-credentials/test-api/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const isCloud = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.AWS_EXECUTION_ENV);
const ENV_FILE = isCloud
  ? "/tmp/.env.local"
  : path.join(process.cwd(), ".env.local");

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    result[key] = val;
  }
  return result;
}

export async function POST(req: Request) {
  try {
    const { env, url, username, password, apiPath, method } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Tenant URL is required" }, { status: 400 });
    }

    // Resolve password if masked
    let resolvedPassword = password;
    if (password === "••••••••") {
      let existing: Record<string, string> = {};
      if (fs.existsSync(ENV_FILE)) {
        existing = parseEnvFile(fs.readFileSync(ENV_FILE, "utf-8"));
      } else if (isCloud) {
        const bundledEnv = path.join(process.cwd(), ".env.local");
        if (fs.existsSync(bundledEnv)) {
          existing = parseEnvFile(fs.readFileSync(bundledEnv, "utf-8"));
        }
      }
      resolvedPassword = existing[`SAVIYNT_${env}_PASSWORD`] || "";
    }

    const isMock = url.includes("example.com") || url.includes("localhost") || !url.startsWith("http");

    let token = "";
    let authResponse: any = null;
    let apiResponse: any = null;

    if (isMock) {
      // Mock flow
      token = `ephemeral_mock_token_${env.toLowerCase()}_${Math.random().toString(36).substring(2, 10)}`;
      authResponse = {
        access_token: token,
        expires_in: 300,
        token_type: "Bearer",
        scope: "read write",
        user: username || "admin",
        status: "SUCCESS"
      };

      let foundDynamicResponse = false;

      // Attempt to load mock response dynamically from Postman collection file (saviynt_api.json)
      try {
        const collectionPath = path.join(process.cwd(), "..", "saviynt_api.json");
        if (fs.existsSync(collectionPath)) {
          const rawData = fs.readFileSync(collectionPath, "utf-8");
          const collection = JSON.parse(rawData);

          // Normalize paths to compare request paths reliably
          const normalize = (p: string) => {
            if (!p) return "";
            return p
              .toLowerCase()
              .replace(/\{\{path\}\}/g, "api/v5")
              .replace(/\{\{url\}\}\/ecm\//g, "")
              .replace(/ecm\//g, "")
              .replace(/\/$/, "")
              .replace(/^\//, "");
          };

          const targetNorm = normalize(apiPath);
          let foundBody: string | null = null;

          function findResponse(items: any[]): boolean {
            for (const item of items) {
              if (item.request) {
                let reqUrl = "";
                if (typeof item.request.url === "string") {
                  reqUrl = item.request.url;
                } else if (item.request.url && item.request.url.raw) {
                  reqUrl = item.request.url.raw;
                } else if (item.request.url && Array.isArray(item.request.url.path)) {
                  reqUrl = item.request.url.path.join("/");
                }

                const reqNorm = normalize(reqUrl);
                if (targetNorm && reqNorm && (targetNorm === reqNorm || targetNorm.endsWith(reqNorm) || reqNorm.endsWith(targetNorm))) {
                  if (item.response && Array.isArray(item.response) && item.response.length > 0) {
                    const firstResponse = item.response[0];
                    if (firstResponse.body) {
                      foundBody = firstResponse.body;
                      return true;
                    }
                  }
                }
              }

              if (item.item && Array.isArray(item.item)) {
                if (findResponse(item.item)) {
                  return true;
                }
              }
            }
            return false;
          }

          if (collection.item && Array.isArray(collection.item)) {
            findResponse(collection.item);
          }

          if (foundBody) {
            try {
              apiResponse = JSON.parse(foundBody);
              foundDynamicResponse = true;
            } catch (e) {
              apiResponse = { message: foundBody };
              foundDynamicResponse = true;
            }
          }
        }
      } catch (err) {
        console.error("Failed to extract dynamic mock response from Postman collection:", err);
      }

      // Fallback to static mock responses if not found in the Postman collection file
      if (!foundDynamicResponse) {
        if (apiPath.includes("getSecuritySystems")) {
          apiResponse = {
            status: "SUCCESS",
            securitysystems: [
              { id: "ss-dev-1", name: "HR_SYSTEM_DEV", description: "HR Security System for Development" },
              { id: "ss-dev-2", name: "FINANCE_SYSTEM_DEV", description: "Finance Security System for Development" }
            ]
          };
        } else if (apiPath.includes("getEndpoints")) {
          apiResponse = {
            status: "SUCCESS",
            endpoints: [
              { id: "ep-dev-1", name: "HR_ENDPOINT_DEV", securitySystemId: "ss-dev-1", description: "HR Endpoint Dev" },
              { id: "ep-dev-2", name: "FIN_ENDPOINT_DEV", securitySystemId: "ss-dev-2", description: "Finance Endpoint Dev" }
            ]
          };
        } else if (apiPath.includes("getRoles")) {
          apiResponse = {
            status: "SUCCESS",
            roles: [
              { id: "role-dev-1", name: "Dev Role A", description: "Development Role A" },
              { id: "role-dev-2", name: "Dev Role B", description: "Development Role B" }
            ]
          };
        } else if (apiPath.includes("getEntitlements")) {
          apiResponse = {
            status: "SUCCESS",
            entitlements: [
              { id: "ent-dev-1", name: "Dev Entitlement A", entitlement_value: "read-only", description: "Read-only access entitlement" },
              { id: "ent-dev-2", name: "Dev Entitlement B", entitlement_value: "read-write", description: "Read-write access entitlement" }
            ]
          };
        } else if (apiPath.includes("user")) {
          apiResponse = {
            status: "SUCCESS",
            users: [
              { id: "usr-1", name: "John Doe", username: "johndoe", email: "johndoe@example.com", status: "Active", department: "Engineering" },
              { id: "usr-2", name: "Jane Smith", username: "janesmith", email: "janesmith@example.com", status: "Active", department: "Operations" }
            ]
          };
        } else if (apiPath.includes("getEntDetailsforUsers")) {
          apiResponse = {
            status: "SUCCESS",
            entitlementDetails: [
              { username: "johndoe", entitlementName: "read-only", securitySystem: "HR_SYSTEM_DEV", assignedDate: "2026-01-10" },
              { username: "janesmith", entitlementName: "read-write", securitySystem: "FINANCE_SYSTEM_DEV", assignedDate: "2026-02-15" }
            ]
          };
        } else if (apiPath.includes("getRoleDetailsforUsers")) {
          apiResponse = {
            status: "SUCCESS",
            roleDetails: [
              { username: "johndoe", roleName: "Developer", status: "Assigned", assignedDate: "2026-01-10" }
            ]
          };
        } else if (apiPath.includes("getSavRoles")) {
          apiResponse = {
            status: "SUCCESS",
            savRoles: [
              { roleId: "sav-1", roleName: "Saviynt Administrator", description: "Access to all administrative consoles" }
            ]
          };
        } else if (apiPath.includes("getChildEntitlements")) {
          apiResponse = {
            status: "SUCCESS",
            childEntitlements: [
              { parentId: "ent-dev-1", childId: "ent-sub-1", name: "Sub-permission A", value: "read" }
            ]
          };
        } else if (apiPath.includes("getEntitlementTypes")) {
          apiResponse = {
            status: "SUCCESS",
            entitlementTypes: [
              { typeId: "type-1", typeName: "AD Group", description: "Active Directory Security Groups" },
              { typeId: "type-2", typeName: "SAP Role", description: "SAP Authorizations" }
            ]
          };
        } else if (apiPath.includes("fetchDynamicAttribute")) {
          apiResponse = {
            status: "SUCCESS",
            dynamicAttributes: [
              { name: "employeeType", type: "String", required: "true", displayName: "Employee Type" }
            ]
          };
        } else if (apiPath.includes("getOrganization")) {
          apiResponse = {
            status: "SUCCESS",
            organizations: [
              { id: "org-1", name: "Engineering", code: "ENG", parentId: "org-root" },
              { id: "org-2", name: "Operations", code: "OPS", parentId: "org-root" }
            ]
          };
        } else if (apiPath.includes("savroles")) {
          if (apiPath.includes("users")) {
            apiResponse = {
              status: "SUCCESS",
              users: [
                { username: "admin", email: "admin@example.com", status: "Active" }
              ]
            };
          } else {
            apiResponse = {
              status: "SUCCESS",
              savroles: [
                { id: "role-1", name: "SuperAdmin", description: "Full root access" },
                { id: "role-2", name: "BusinessOwner", description: "Risk and ownership approvals" }
              ]
            };
          }
        } else if (apiPath.includes("getDatasetValues")) {
          apiResponse = {
            status: "SUCCESS",
            datasetValues: [
              { id: "ds-1", value: "US-East", display: "United States East" },
              { id: "ds-2", value: "EU-West", display: "Europe West" }
            ]
          };
        } else if (apiPath.includes("fetchControlListES")) {
          apiResponse = {
            status: "SUCCESS",
            controls: [
              { controlId: "ctrl-1", name: "Root Access Check", riskLevel: "High", controlOwner: "Security Team" }
            ]
          };
        } else if (apiPath.includes("fetchControlDetailsES")) {
          apiResponse = {
            status: "SUCCESS",
            controlDetails: [
              { controlId: "ctrl-1", logic: "user.status == 'Active'", riskAssessment: "Mitigated" }
            ]
          };
        } else if (apiPath.includes("getrequestableusers")) {
          apiResponse = {
            status: "SUCCESS",
            requestableUsers: [
              { username: "johndoe", department: "IT", status: "Active" }
            ]
          };
        } else if (apiPath.includes("getDelegateUserList")) {
          apiResponse = {
            status: "SUCCESS",
            delegates: [
              { delegator: "admin", delegate: "johndoe", startDate: "2026-06-01", endDate: "2026-06-30" }
            ]
          };
        } else if (apiPath.includes("risks")) {
          apiResponse = {
            status: "SUCCESS",
            risks: [
              { riskId: "risk-1", name: "Excessive Access Rights", status: "Active", riskSeverity: "Medium" }
            ]
          };
        } else if (apiPath.includes("resume-all")) {
          apiResponse = {
            status: "SUCCESS",
            message: "All background scheduler jobs have been resumed successfully."
          };
        } else if (apiPath.includes("getKeyStoreCertificateDetails")) {
          apiResponse = {
            status: "SUCCESS",
            certificates: [
              { alias: "saviynt_mtls", expiry: "2028-12-31", issuer: "Saviynt CA", keySize: 2048 }
            ]
          };
        } else if (apiPath.includes("getUser")) {
          apiResponse = {
            status: "SUCCESS",
            user: { dn: "cn=admin,dc=saviynt,dc=local", sAMAccountName: "admin", displayName: "Administrator" }
          };
        } else if (apiPath.includes("fetchUserQuestions")) {
          apiResponse = {
            status: "SUCCESS",
            questions: [
              { id: "q1", question: "What is your favorite color?" }
            ]
          };
        } else if (apiPath.includes("transportPackageStatus")) {
          apiResponse = {
            status: "SUCCESS",
            packages: [
              { packageId: "pkg-101", name: "Baseline Config", status: "Imported", importDate: "2026-06-05" }
            ]
          };
        } else if (apiPath.includes("rules/technical")) {
          apiResponse = {
            status: "SUCCESS",
            technicalRules: [
              { ruleId: "trule-1", name: "AD Account Sync Rule", status: "Active", query: "status = 1" }
            ]
          };
        } else if (apiPath.includes("rules/userUpdate")) {
          apiResponse = {
            status: "SUCCESS",
            userUpdateRules: [
              { ruleId: "urule-1", name: "Manager Change Rule", trigger: "onUpdate", action: "Evaluate Roles" }
            ]
          };
        } else {
          apiResponse = { message: "Authentication successful. Connection is active and reachable." };
        }
      }
    } else {
      // Live API flow
      // 1. Fetch Token first in the same request
      try {
        const loginUrl = `${url.replace(/\/$/, "")}/ECM/api/login`;
        const loginRes = await fetch(loginUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password: resolvedPassword }),
        });

        if (!loginRes.ok) {
          throw new Error(`Authentication endpoint returned status ${loginRes.status}`);
        }

        authResponse = await loginRes.json();
        token = authResponse.access_token || authResponse.token || "";
      } catch (authErr: any) {
        return NextResponse.json({
          success: false,
          error: `Authentication failed: ${authErr.message || authErr}`,
          reachable: false
        });
      }

      if (!token) {
        return NextResponse.json({
          success: false,
          error: "Auth endpoint succeeded but did not return access_token",
          authResponse,
          reachable: true
        });
      }

      // 2. Fetch the requested API path using the newly obtained token
      if (apiPath && apiPath !== "auth_only") {
        try {
          const cleanApiPath = apiPath
            .replace(/\{\{url\}\}\/?/gi, "")
            .replace(/\{\{path\}\}/gi, "api/v5");
          const targetUrl = `${url.replace(/\/$/, "")}/${cleanApiPath.replace(/^\//, "")}`;
          
          const reqMethod = (method || "GET").toUpperCase();
          const fetchOptions: RequestInit = {
            method: reqMethod,
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          };
          if (reqMethod !== "GET") {
            fetchOptions.body = JSON.stringify({ filterCriteria: {}, max: 5 });
          }

          const apiRes = await fetch(targetUrl, fetchOptions);
          if (!apiRes.ok) {
            throw new Error(`API Endpoint returned status ${apiRes.status}`);
          }
          apiResponse = await apiRes.json();
        } catch (apiErr: any) {
          return NextResponse.json({
            success: true,
            authResponse,
            apiResponse: { error: `API Call failed: ${apiErr.message || apiErr}` },
            reachable: true
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      token,
      authResponse,
      apiResponse,
      reachable: true
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
