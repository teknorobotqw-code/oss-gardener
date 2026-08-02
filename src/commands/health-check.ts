import fs from "node:fs";
import path from "node:path";
import { findProjectRoot, getPackageJson, fileExists, findFiles } from "../core/fs.js";
import { printHeader, printCheck, printSummary, type CheckResult } from "../utils/logger.js";

export async function healthCheck(options: { path?: string }): Promise<void> {
  const root = options.path ? path.resolve(options.path) : findProjectRoot();
  const pkg = getPackageJson(root);

  printHeader("Repository Health Check");
  console.log(`  ${root}\n`);

  const checks: CheckResult[] = [];

  checks.push({
    name: "README.md exists",
    passed: fileExists(root, "README.md"),
    message: fileExists(root, "README.md")
      ? "README.md found."
      : "No README.md — add one describing the project.",
  });

  const readmeSize = fileExists(root, "README.md")
    ? fs.statSync(path.join(root, "README.md")).size
    : 0;
  checks.push({
    name: "README.md has content",
    passed: readmeSize > 100,
    message: readmeSize > 100
      ? "README.md has sufficient content."
      : "README.md is too brief. Add installation, usage, and contribution instructions.",
  });

  checks.push({
    name: "LICENSE exists",
    passed: fileExists(root, "LICENSE") || fileExists(root, "LICENSE.md") || fileExists(root, "LICENSE.txt"),
    message: fileExists(root, "LICENSE") || fileExists(root, "LICENSE.md") || fileExists(root, "LICENSE.txt")
      ? "License file found."
      : "No LICENSE file. Open source projects need a license.",
  });

  checks.push({
    name: ".gitignore exists",
    passed: fileExists(root, ".gitignore"),
    message: fileExists(root, ".gitignore")
      ? ".gitignore found."
      : "No .gitignore file. Consider adding one to exclude node_modules, dist, etc.",
  });

  const hasCI =
    fs.existsSync(path.join(root, ".github", "workflows")) ||
    fileExists(root, ".gitlab-ci.yml") ||
    fileExists(root, "Jenkinsfile") ||
    fileExists(root, ".circleci");
  checks.push({
    name: "CI/CD configured",
    passed: hasCI,
    message: hasCI
      ? "CI/CD pipeline detected."
      : "No CI/CD configuration found. Consider adding automated checks.",
  });

  checks.push({
    name: "Contributing guide",
    passed: fileExists(root, "CONTRIBUTING.md") || fileExists(root, ".github/CONTRIBUTING.md"),
    message: fileExists(root, "CONTRIBUTING.md") || fileExists(root, ".github/CONTRIBUTING.md")
      ? "CONTRIBUTING.md found."
      : "No CONTRIBUTING.md. Help new contributors understand your process.",
  });

  checks.push({
    name: "Code of conduct",
    passed: fileExists(root, "CODE_OF_CONDUCT.md") || fileExists(root, ".github/CODE_OF_CONDUCT.md"),
    message: "Consider adding a CODE_OF_CONDUCT.md for community guidelines.",
  });

  if (pkg) {
    checks.push({
      name: "package.json name & description",
      passed: Boolean(pkg.name && pkg.description),
      message: pkg.name && pkg.description
        ? "package.json has name and description."
        : "package.json missing name or description.",
    });

    const scripts = Object.keys(pkg.scripts || {});
    const hasTest = scripts.some((s) => s.includes("test"));
    const hasLint = scripts.some((s) => s.includes("lint"));
    checks.push({
      name: "npm scripts",
      passed: hasTest && hasLint,
      message: `Scripts: ${scripts.join(", ") || "(none)"}${!hasTest ? " — missing test script." : ""}${!hasLint ? " — missing lint script." : ""}`,
    });
  }

  const tsFiles = findFiles(root, /\.ts$/);
  const jsFiles = findFiles(root, /\.js$/);
  checks.push({
    name: "File count",
    passed: tsFiles.length + jsFiles.length > 2,
    message: `${tsFiles.length + jsFiles.length} source files. ${tsFiles.length > jsFiles.length ? "TypeScript" : "JavaScript"} dominant.`,
  });

  for (const check of checks) {
    printCheck(check);
  }

  const passed = checks.filter((c) => c.passed).length;
  printSummary(passed, checks.length);

  const score = Math.round((passed / checks.length) * 100);
  const grade = score >= 90 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "D";
  console.log(`  Health score: ${grade} (${score}%)`);
}
