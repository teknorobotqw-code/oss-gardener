#!/usr/bin/env node
import { Command } from "commander";
import { prReview } from "./commands/pr-review.js";
import { issueTriage } from "./commands/issue-triage.js";
import { release } from "./commands/release.js";
import { healthCheck } from "./commands/health-check.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

const program = new Command();

program
  .name("oss-gardener")
  .description("CLI toolkit for open source project maintainers")
  .version(pkg.version);

program
  .command("pr-review")
  .description("Review a pull request for common issues")
  .option("-b, --base <ref>", "Base ref to compare against (default: HEAD~1)", "HEAD~1")
  .option("-p, --path <dir>", "Project root path")
  .action(async (options) => {
    await prReview(options);
  });

program
  .command("triage")
  .description("Analyze and triage an issue")
  .option("-t, --title <text>", "Issue title")
  .option("-b, --body <text>", "Issue body")
  .option("-f, --file <path>", "Read issue from file (first line = title, rest = body)")
  .action(async (options) => {
    await issueTriage(options);
  });

program
  .command("release")
  .description("Generate changelog and bump version based on conventional commits")
  .option("-d, --dry", "Dry run — preview only, no file changes")
  .option("-p, --path <dir>", "Project root path")
  .option("--skip-tag", "Skip tag creation prompt")
  .action(async (options) => {
    await release(options);
  });

program
  .command("health")
  .description("Check repository health and best practices")
  .option("-p, --path <dir>", "Project root path")
  .option("-j, --json", "Output results as JSON")
  .action(async (options) => {
    await healthCheck(options);
  });

program.parse();
