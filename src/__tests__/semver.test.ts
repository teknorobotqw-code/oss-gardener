import { getConventionalCommits, bumpVersion, generateChangelogSection } from "../core/semver.js";

describe("getConventionalCommits", () => {
  it("parses feat commits", () => {
    const commits = [{ message: "feat: add login button", hash: "abc123" }];
    const result = getConventionalCommits(commits);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("feat");
    expect(result[0].description).toBe("add login button");
    expect(result[0].breaking).toBe(false);
  });

  it("parses fix commits", () => {
    const commits = [{ message: "fix: resolve crash on startup", hash: "def456" }];
    const result = getConventionalCommits(commits);
    expect(result[0].type).toBe("fix");
  });

  it("detects breaking changes with !", () => {
    const commits = [{ message: "feat!: drop support for Node 16", hash: "ghi789" }];
    const result = getConventionalCommits(commits);
    expect(result[0].breaking).toBe(true);
  });

  it("parses scope and description", () => {
    const commits = [{ message: "feat(api): add rate limiting", hash: "jkl012" }];
    const result = getConventionalCommits(commits);
    expect(result[0].scope).toBe("api");
    expect(result[0].description).toBe("add rate limiting");
  });

  it("returns empty for non-conventional commits", () => {
    const commits = [{ message: "random update", hash: "mno345" }];
    const result = getConventionalCommits(commits);
    expect(result).toHaveLength(0);
  });
});

describe("bumpVersion", () => {
  it("bumps major for breaking changes", () => {
    const version = bumpVersion("1.2.3", [{ type: "feat", breaking: true }]);
    expect(version).toBe("2.0.0");
  });

  it("bumps minor for features", () => {
    const version = bumpVersion("1.2.3", [{ type: "feat", breaking: false }]);
    expect(version).toBe("1.3.0");
  });

  it("bumps patch for fixes", () => {
    const version = bumpVersion("1.2.3", [{ type: "fix", breaking: false }]);
    expect(version).toBe("1.2.4");
  });
});

describe("generateChangelogSection", () => {
  it("generates changelog with correct sections", () => {
    const commits = [
      { type: "feat", description: "add dark mode", breaking: false },
      { type: "fix", description: "fix login redirect", breaking: false },
      { type: "feat", scope: "api", description: "add v2 endpoint", breaking: false },
    ];
    const result = generateChangelogSection("1.0.0", commits as any);
    expect(result).toContain("## 1.0.0");
    expect(result).toContain("### Features");
    expect(result).toContain("add dark mode");
    expect(result).toContain("add v2 endpoint");
    expect(result).toContain("### Bug Fixes");
    expect(result).toContain("fix login redirect");
  });
});
