import fs from "node:fs";
import path from "node:path";
import { findProjectRoot, getPackageJson, fileExists, findFiles } from "../core/fs.js";
import { getChangedFiles } from "../core/git.js";
import { printHeader, printCheck, printSummary, type CheckResult } from "../utils/logger.js";

export async function prReview(options: { base?: string; path?: string }): Promise<void> {
  const root = options.path ? path.resolve(options.path) : findProjectRoot();
  const pkg = getPackageJson(root);

  printHeader("PR Review");

  const changedFiles = await getChangedFiles(options.base || "HEAD~1");
  const checks: CheckResult[] = [];

  const testPattern = /\.(test|spec)\.(ts|tsx|js|jsx)$/;
  const sourcePattern = /\.(ts|tsx|js|jsx)$/;
  const sourceChanges = changedFiles.filter((f) => sourcePattern.test(f) && !testPattern.test(f));
  const testChanges = changedFiles.filter((f) => testPattern.test(f));

  if (sourceChanges.length > 0 && testChanges.length === 0) {
    checks.push({
      name: "Test coverage",
      passed: false,
      message: `${sourceChanges.length} source files changed but no test files. Consider adding tests.`,
    });
  } else {
    checks.push({
      name: "Test coverage",
      passed: true,
      message: "Tests present for source changes.",
    });
  }

  const changelogExists = fileExists(root, "CHANGELOG.md");
  if (changelogExists) {
    const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf-8");
    const hasUnreleased = /##\s*Unreleased/i.test(changelog) || /##\s*\[Unreleased\]/i.test(changelog);
    checks.push({
      name: "CHANGELOG entry",
      passed: hasUnreleased,
      message: hasUnreleased
        ? "CHANGELOG.md has unreleased section."
        : "No 'Unreleased' section found in CHANGELOG.md. Add your changes there.",
    });
  } else {
    checks.push({
      name: "CHANGELOG entry",
      passed: true,
      message: "No CHANGELOG.md found (optional).",
    });
  }

  const sourceFiles = findFiles(root, sourcePattern);
  let consoleLogCount = 0;
  for (const file of sourceFiles.slice(0, 100)) {
    const content = fs.readFileSync(file, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      if (
        /\bconsole\.(log|warn|error|debug)\s*\(/.test(line) &&
        !line.includes("//") &&
        !line.includes("process.stderr") &&
        !line.includes("process.stdout")
      ) {
        consoleLogCount++;
      }
    }
  }

  checks.push({
    name: "No console.log left",
    passed: consoleLogCount < 20,
    message:
      consoleLogCount > 0
        ? `Found ~${consoleLogCount} console.log/warn/error calls. Clean up before merging.`
        : "No stray console statements detected.",
  });

  for (const file of changedFiles) {
    const fullPath = path.join(root, file);
    if (!fs.existsSync(fullPath)) continue;
    if (!sourcePattern.test(file)) continue;
    const content = fs.readFileSync(fullPath, "utf-8");
    const conflictPattern = /^(<{7}|>{7}|={7})/m;
    if (conflictPattern.test(content)) {
      checks.push({
        name: "No merge conflicts",
        passed: false,
        message: `File ${file} contains merge conflict markers.`,
      });
    }
  }

  if (!changedFiles.some((f) => f.includes("package-lock.json") || f.includes("yarn.lock") || f.includes("pnpm-lock.yaml"))) {
    const hasLockChanges = changedFiles.some(
      (f) => f === "package.json" && !changedFiles.includes("package-lock.json") && !changedFiles.includes("yarn.lock") && !changedFiles.includes("pnpm-lock.yaml")
    );
    if (hasLockChanges) {
      checks.push({
        name: "Lock file update",
        passed: false,
        message: "package.json changed but lock file not updated.",
      });
    } else {
      checks.push({
        name: "Lock file update",
        passed: true,
        message: "No lock file changes needed.",
      });
    }
  } else {
    checks.push({
      name: "Lock file update",
      passed: true,
      message: "Lock file updated.",
    });
  }

  const readmeSize = fileExists(root, "README.md")
    ? fs.statSync(path.join(root, "README.md")).size
    : 0;
  const largeChange = changedFiles.length > 15;
  checks.push({
    name: "PR size",
    passed: !largeChange,
    message: largeChange
      ? `${changedFiles.length} files changed. Consider splitting into smaller PRs.`
      : `${changedFiles.length} files changed — good size.`,
  });

  for (const check of checks) {
    printCheck(check);
  }

  const passed = checks.filter((c) => c.passed).length;
  printSummary(passed, checks.length);
}
