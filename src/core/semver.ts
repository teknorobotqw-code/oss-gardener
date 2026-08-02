import semver from "semver";

export function getConventionalCommits(
  commits: { message: string; hash: string }[]
): { type: string; scope?: string; description: string; hash: string; breaking: boolean }[] {
  const conventional = /^(?<type>\w+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?:\s*(?<description>.+)$/;
  return commits
    .map((c) => {
      const match = c.message.match(conventional);
      if (!match) return null;
      return {
        type: match.groups!.type,
        scope: match.groups!.scope,
        description: match.groups!.description,
        hash: c.hash,
        breaking: Boolean(match.groups!.breaking || /BREAKING CHANGE/i.test(c.message)),
      };
    })
    .filter(Boolean) as any[];
}

export function bumpVersion(
  current: string,
  commits: { type: string; breaking: boolean }[]
): string {
  const hasBreaking = commits.some((c) => c.breaking);
  const hasFeature = commits.some((c) => c.type === "feat");
  const hasFix = commits.some((c) => c.type === "fix");

  if (hasBreaking) return semver.inc(current, "major")!;
  if (hasFeature) return semver.inc(current, "minor")!;
  if (hasFix) return semver.inc(current, "patch")!;
  return semver.inc(current, "patch")!;
}

export function generateChangelogSection(
  version: string,
  commits: { type: string; scope?: string; description: string; breaking: boolean }[]
): string {
  const groups: Record<string, string[]> = {
    "Breaking Changes": [],
    Features: [],
    "Bug Fixes": [],
    Other: [],
  };

  for (const c of commits) {
    const scope = c.scope ? `**${c.scope}**: ` : "";
    const breaking = c.breaking ? " ⚠ BREAKING" : "";

    if (c.breaking) {
      groups["Breaking Changes"].push(`- ${scope}${c.description}${breaking}`);
      continue;
    }
    switch (c.type) {
      case "feat":
        groups["Features"].push(`- ${scope}${c.description}`);
        break;
      case "fix":
        groups["Bug Fixes"].push(`- ${scope}${c.description}`);
        break;
      default:
        groups["Other"].push(`- ${scope}${c.description}`);
    }
  }

  const sections: string[] = [`## ${version}`];
  for (const [title, items] of Object.entries(groups)) {
    if (items.length > 0) {
      sections.push(`\n### ${title}`);
      items.forEach((i) => sections.push(i));
    }
  }
  return sections.join("\n") + "\n";
}
