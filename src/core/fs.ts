import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function findProjectRoot(startDir: string = process.cwd()): string {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(startDir);
    dir = parent;
  }
}

export function getPackageJson(root: string): Record<string, any> | null {
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) return null;
  return JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
}

export function fileExists(root: string, filename: string): boolean {
  return fs.existsSync(path.join(root, filename));
}

export function findFiles(root: string, pattern: RegExp, exclude: string[] = ["node_modules", "dist", ".git"]): string[] {
  const results: string[] = [];
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (exclude.includes(entry.name)) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }
  walk(root);
  return results;
}
