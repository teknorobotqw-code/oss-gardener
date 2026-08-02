# OSS Gardener

All-in-one CLI toolkit for open source project maintainers. Automates PR reviews, issue triage, release management, and repository health checks.

## Features

- **PR Review** — Automated checks for test coverage, changelog entries, merge conflicts, console.log leftovers, and PR size
- **Issue Triage** — Auto-label issues by content analysis (bug, feature, docs, security, etc.)
- **Release Manager** — Bump versions from conventional commits, auto-generate changelogs
- **Health Check** — Scan repos for README, LICENSE, CI config, contributing guides, and more

## Install

```bash
npm install -g oss-gardener
```

Or run without installing:

```bash
npx oss-gardener <command>
```

## Usage

### PR Review

```bash
oss-gardener pr-review                    # compare HEAD~1..HEAD
oss-gardener pr-review --base main         # compare main..HEAD
oss-gardener pr-review --path ../other-repo
```

Checks:
- Test files accompany source changes
- CHANGELOG.md has unreleased section
- No stray console.log statements
- No merge conflict markers
- Lock file updated if package.json changed
- PR size warning (>15 files)

### Issue Triage

```bash
oss-gardener triage --title "App crashes on login" --body "Steps to reproduce: ..."
oss-gardener triage --file issue.txt
```

Auto-suggests labels: bug, feature, documentation, question, performance, security, dependencies.

### Release Management

```bash
oss-gardener release --dry            # preview only
oss-gardener release                  # bump version + update CHANGELOG
```

Reads conventional commits since last tag, determines semver bump, generates changelog.

### Health Check

```bash
oss-gardener health
oss-gardener health --path /path/to/repo
```

Checks: README, LICENSE, .gitignore, CI/CD, CONTRIBUTING.md, CODE_OF_CONDUCT.md, package.json metadata, npm scripts, file count.

## GitHub Action

```yaml
- uses: teknorobotqw-code/oss-gardener@v1
  with:
    command: health
```

## Requirements

- Node.js >= 18
- Git installed and accessible in PATH

## License

MIT
