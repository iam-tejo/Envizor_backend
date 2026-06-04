import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Path to the saviynt_api.json at the workspace root
// process.cwd() is /Users/tejov/Documents/Terraform-Wizard/generate-workspace-terraform/frontend
const filePath = path.join(process.cwd(), "../saviynt_api.json");

interface FlattenedRequest {
  id: string;
  name: string;
  folderPath: string[];
  method: string;
  url: string;
  description: string;
  headers: Array<{ key: string; value: string; description?: string }>;
  bodyMode: string;
  bodyRaw: string;
}

// Traverse collection to extract flat lists
function traverseItems(items: any[], currentPath: string[], result: FlattenedRequest[]) {
  if (!Array.isArray(items)) return;
  for (const item of items) {
    if (item.item && Array.isArray(item.item)) {
      // Folder
      traverseItems(item.item, [...currentPath, item.name], result);
    } else if (item.request) {
      // Request leaf node
      const req = item.request;
      
      let rawUrl = "";
      if (typeof req.url === "string") {
        rawUrl = req.url;
      } else if (req.url && typeof req.url === "object") {
        rawUrl = req.url.raw || "";
      }
      
      let bodyRaw = "";
      const bodyMode = req.body?.mode || "none";
      if (req.body?.raw) {
        bodyRaw = req.body.raw;
      }
      
      const id = item.id || item._postman_id || `req_${Math.random().toString(36).substring(2, 9)}`;
      
      result.push({
        id,
        name: item.name || "Unnamed Request",
        folderPath: currentPath,
        method: req.method || "GET",
        url: rawUrl,
        description: req.description || "",
        headers: Array.isArray(req.header) ? req.header.map((h: any) => ({
          key: h.key || "",
          value: h.value || "",
          description: h.description || ""
        })) : [],
        bodyMode,
        bodyRaw
      });
    }
  }
}

// Recursively update an item matching the target ID
function updateItemInCollection(items: any[], updatedItem: any): boolean {
  if (!Array.isArray(items)) return false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.item && Array.isArray(item.item)) {
      if (updateItemInCollection(item.item, updatedItem)) {
        return true;
      }
    } else if (item.request) {
      const id = item.id || item._postman_id;
      if (id === updatedItem.id) {
        item.name = updatedItem.name;
        item.request.method = updatedItem.method;
        
        // Update URL
        if (typeof item.request.url === "string") {
          item.request.url = updatedItem.url;
        } else if (item.request.url && typeof item.request.url === "object") {
          item.request.url.raw = updatedItem.url;
        } else {
          item.request.url = updatedItem.url;
        }
        
        item.request.description = updatedItem.description;
        
        // Update headers
        item.request.header = updatedItem.headers.map((h: any) => ({
          key: h.key,
          value: h.value,
          description: h.description || "",
          type: "text"
        }));
        
        // Update body
        if (updatedItem.bodyMode !== "none") {
          item.request.body = item.request.body || {};
          item.request.body.mode = updatedItem.bodyMode;
          item.request.body.raw = updatedItem.bodyRaw;
        } else {
          delete item.request.body;
        }
        
        return true;
      }
    }
  }
  return false;
}

// Recursively append a new request inside folderPath
function addRequestToFolder(items: any[], folderPath: string[], newReq: any) {
  if (folderPath.length === 0) {
    items.push(newReq);
    return;
  }
  
  const [currentFolder, ...rest] = folderPath;
  let folder = items.find(item => item.name === currentFolder && item.item && Array.isArray(item.item));
  
  if (!folder) {
    folder = {
      name: currentFolder,
      item: [],
      description: ""
    };
    items.push(folder);
  }
  
  addRequestToFolder(folder.item, rest, newReq);
}

// Recursively clean up empty folders if an item was moved
function removeRequestFromCollection(items: any[], idToRemove: string): boolean {
  if (!Array.isArray(items)) return false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.item && Array.isArray(item.item)) {
      if (removeRequestFromCollection(item.item, idToRemove)) {
        // Clean up empty folders
        if (item.item.length === 0) {
          items.splice(i, 1);
        }
        return true;
      }
    } else if (item.request) {
      const id = item.id || item._postman_id;
      if (id === idToRemove) {
        items.splice(i, 1);
        return true;
      }
    }
  }
  return false;
}

export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "saviynt_api.json file not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const collection = JSON.parse(fileContent);

    const apis: FlattenedRequest[] = [];
    traverseItems(collection.item, [], apis);

    // Extract all unique folder paths to help the frontend place newly added APIs
    const folderPathsSet = new Set<string>();
    apis.forEach(api => {
      if (api.folderPath.length > 0) {
        folderPathsSet.add(api.folderPath.join(" / "));
      }
    });

    return NextResponse.json({
      collectionName: collection.info?.name || "Saviynt APIs",
      apis,
      availableFolders: Array.from(folderPathsSet)
    });
  } catch (err: any) {
    console.error("Error reading Saviynt API definitions:", err);
    return NextResponse.json({ error: err.message || "Failed to read API definitions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body; // action can be "update", "create", or "import"

    if (action === "import") {
      const { collection: newCollection } = payload;
      if (!newCollection || !newCollection.info || !newCollection.item) {
        return NextResponse.json({ error: "Invalid Postman Collection schema. Must contain info and item fields." }, { status: 400 });
      }
      
      // Overwrite the entire file with the imported collection
      fs.writeFileSync(filePath, JSON.stringify(newCollection, null, 2), "utf-8");

      // Re-flatten to return latest list
      const updatedApis: FlattenedRequest[] = [];
      traverseItems(newCollection.item, [], updatedApis);

      const folderPathsSet = new Set<string>();
      updatedApis.forEach(api => {
        if (api.folderPath.length > 0) {
          folderPathsSet.add(api.folderPath.join(" / "));
        }
      });

      return NextResponse.json({
        success: true,
        apis: updatedApis,
        availableFolders: Array.from(folderPathsSet)
      });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "saviynt_api.json file not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const collection = JSON.parse(fileContent);

    if (action === "update") {
      const { id, name, folderPath, method, url, description, headers, bodyMode, bodyRaw } = payload;
      
      // Check if folderPath changed. If so, move it
      const currentApis: FlattenedRequest[] = [];
      traverseItems(collection.item, [], currentApis);
      const original = currentApis.find(a => a.id === id);

      if (!original) {
        return NextResponse.json({ error: `API definition with ID ${id} not found` }, { status: 404 });
      }

      const folderChanged = JSON.stringify(original.folderPath) !== JSON.stringify(folderPath);

      if (folderChanged) {
        // Remove from old location
        removeRequestFromCollection(collection.item, id);

        // Build new request node
        const newPostmanReq = {
          id,
          _postman_id: id,
          name,
          request: {
            method,
            url: {
              raw: url,
              host: ["{{url}}"],
              path: url.replace("{{url}}/", "").split("/")
            },
            description,
            header: headers.map((h: any) => ({
              key: h.key,
              value: h.value,
              description: h.description || "",
              type: "text"
            })),
            body: bodyMode !== "none" ? {
              mode: bodyMode,
              raw: bodyRaw
            } : undefined
          },
          response: []
        };

        // Add to new folder
        addRequestToFolder(collection.item, folderPath, newPostmanReq);
      } else {
        // Just update in place
        updateItemInCollection(collection.item, {
          id,
          name,
          method,
          url,
          description,
          headers,
          bodyMode,
          bodyRaw
        });
      }
    } else if (action === "create") {
      const { name, folderPath, method, url, description, headers, bodyMode, bodyRaw } = payload;
      const newId = crypto.randomUUID();

      const newPostmanReq = {
        id: newId,
        _postman_id: newId,
        name,
        request: {
          method,
          url: {
            raw: url,
            host: ["{{url}}"],
            path: url.replace("{{url}}/", "").split("/")
          },
          description,
          header: headers.map((h: any) => ({
            key: h.key,
            value: h.value,
            description: h.description || "",
            type: "text"
          })),
          body: bodyMode !== "none" ? {
            mode: bodyMode,
            raw: bodyRaw
          } : undefined
        },
        response: []
      };

      // Add request under target folder path
      addRequestToFolder(collection.item, folderPath, newPostmanReq);
    } else {
      return NextResponse.json({ error: "Invalid action. Supported: 'update', 'create', or 'import'" }, { status: 400 });
    }

    // Write the collection back to saviynt_api.json with pretty printing
    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2), "utf-8");

    // Re-flatten to return latest list
    const updatedApis: FlattenedRequest[] = [];
    traverseItems(collection.item, [], updatedApis);

    const folderPathsSet = new Set<string>();
    updatedApis.forEach(api => {
      if (api.folderPath.length > 0) {
        folderPathsSet.add(api.folderPath.join(" / "));
      }
    });

    return NextResponse.json({
      success: true,
      apis: updatedApis,
      availableFolders: Array.from(folderPathsSet)
    });
  } catch (err: any) {
    console.error("Error saving Saviynt API definitions:", err);
    return NextResponse.json({ error: err.message || "Failed to save API definitions" }, { status: 500 });
  }
}
