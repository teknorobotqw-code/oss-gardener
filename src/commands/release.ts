import fs from "node:fs";
import path from "node:path";
import { findProjectRoot, getPackageJson } from "../core/fs.js";
import { getGitLog, getLatestTag } from "../core/git.js";
import { getConventionalCommits, bumpVersion, generateChangelogSection } from "../core/semver.js";
import { printHeader } from "../utils/logger.js";
import chalk from "chalk";

export async function release(options: { dry?: boolean; path?: string; skipTag?: boolean }): Promise<void> {
  const root = options.path ? path.resolve(options.path) : findProjectRoot();
  const pkg = getPackageJson(root);

  if (!pkg) {
    console.log(chalk.red("  No package.json found in project root."));
    return;
  }

  printHeader("Release Manager");

  const latestTag = await getLatestTag();
  console.log(chalk.dim(`  Latest tag: ${latestTag || "(none)"}`));

  const commits = await getGitLog(latestTag || undefined);
  const conventional = getConventionalCommits(commits);

  console.log(chalk.dim(`  Commits since last tag: ${commits.length} (${conventional.length} conventional)`));

  if (conventional.length === 0) {
    console.log(chalk.yellow("  No conventional commits found. Nothing to release."));
    return;
  }

  const nextVersion = bumpVersion(pkg.version, conventional);
  const changelog = generateChangelogSection(nextVersion, conventional);

  console.log("");
  console.log(chalk.bold(`  Next version: ${chalk.green(nextVersion)}`));
  console.log(chalk.dim(`  Current:      ${pkg.version}`));
  console.log("");

  const changelogPath = path.join(root, "CHANGELOG.md");
  let oldChangelog = "";
  if (fs.existsSync(changelogPath)) {
    oldChangelog = fs.readFileSync(changelogPath, "utf-8");
  }

  console.log(chalk.bold("  Changelog preview:"));
  console.log(chalk.dim("  " + "─".repeat(40)));
  console.log(changelog
    .split("\n")
    .map((l) => "  " + l)
    .join("\n"));

  if (options.dry) {
    console.log(chalk.dim("\n  Dry run — no files modified."));
    return;
  }

  const newChangelog = changelog + "\n" + oldChangelog;
  fs.writeFileSync(changelogPath, newChangelog);
  console.log(chalk.green(`\n  CHANGELOG.md updated with version ${nextVersion}`));

  pkg.version = nextVersion;
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify(pkg, null, 2) + "\n");
  console.log(chalk.green(`  package.json version bumped to ${nextVersion}`));

  console.log(chalk.cyan(`\n  Next steps:`));
  console.log(chalk.dim(`    git add CHANGELOG.md package.json`));
  console.log(chalk.dim(`    git commit -m "chore: release ${nextVersion}"`));
  console.log(chalk.dim(`    git tag v${nextVersion}`));
  console.log(chalk.dim(`    git push --tags`));
}
