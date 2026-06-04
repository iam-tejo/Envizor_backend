import fs from "fs";
import path from "path";
import os from "os";
import { diffLines } from "diff";
import { getWorkspaceRoot } from "../../../lib/workspaceConfig";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const left = url.searchParams.get("left")!;
    const right = url.searchParams.get("right")!;

    const root = getWorkspaceRoot();

    const leftRoot = path.join(root, left);
    const rightRoot = path.join(root, right);

    function walk(dir: string, base = ""): string[] {
      if (!fs.existsSync(dir)) return [];
      let results: string[] = [];

      try {
        const list = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of list) {
          const rel = base ? `${base}/${entry.name}` : entry.name;
          const abs = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            results.push(rel + "/");
            results = results.concat(walk(abs, rel));
          } else {
            results.push(rel);
          }
        }
      } catch (err) {
        console.error(`Error walking path ${dir}:`, err);
      }

      return results;
    }

    const leftFiles = walk(leftRoot);
    const rightFiles = walk(rightRoot);

    const leftSet = new Set(leftFiles);
    const rightSet = new Set(rightFiles);

    const all = Array.from(new Set([...leftFiles, ...rightFiles]));

    const items = all.map((file) => {
      const inLeft = leftSet.has(file);
      const inRight = rightSet.has(file);

      let diff = null;

      if (inLeft && inRight && !file.endsWith("/")) {
        const leftPath = path.join(leftRoot, file);
        const rightPath = path.join(rightRoot, file);

        const leftContent = fs.existsSync(leftPath)
          ? fs.readFileSync(leftPath, "utf8")
          : "";

        const rightContent = fs.existsSync(rightPath)
          ? fs.readFileSync(rightPath, "utf8")
          : "";

        diff = diffLines(leftContent, rightContent);
      }

      return { name: file, inLeft, inRight, diff };
    });

    function buildTree(items: any[]) {
      const root = {
        name: "",
        type: "folder",
        inLeft: true,
        inRight: true,
        children: [] as any[],
      };

      for (const item of items) {
        const parts = item.name.split("/").filter(Boolean);
        let current = root;

        parts.forEach((part: string, idx: number) => {
          const isFile = idx === parts.length - 1 && !item.name.endsWith("/");

          let child = current.children.find((c: any) => c.name === part);

          if (!child) {
            child = {
              name: part,
              type: isFile ? "file" : "folder",
              inLeft: item.inLeft,
              inRight: item.inRight,
              diff: isFile ? item.diff : null,
              children: [],
            };
            current.children.push(child);
          }

          if (!isFile) {
            child.inLeft = child.inLeft || item.inLeft;
            child.inRight = child.inRight || item.inRight;
          }

          current = child;
        });
      }

      return root;
    }

    return Response.json({ tree: buildTree(items) });
  } catch (err: any) {
    console.error("Workspace comparison API error:", err);
    return Response.json(
      {
        error: err.message,
        tree: { name: "", type: "folder", inLeft: false, inRight: false, children: [] },
      },
      { status: 500 }
    );
  }
}

