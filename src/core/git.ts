import { simpleGit, type SimpleGit } from "simple-git";

export async function getGitLog(sinceTag?: string): Promise<{ message: string; hash: string; date: string }[]> {
  const git: SimpleGit = simpleGit();
  const options: Record<string, any> = { maxCount: 100 };
  if (sinceTag) {
    options.from = `${sinceTag}..HEAD`;
  }
  const log = await git.log(options);
  return log.all.map((entry) => ({
    message: entry.message,
    hash: entry.hash,
    date: entry.date,
  }));
}

export async function getLatestTag(): Promise<string | null> {
  const git: SimpleGit = simpleGit();
  try {
    const tags = await git.tags();
    return tags.latest || null;
  } catch {
    return null;
  }
}

export async function getChangedFiles(base: string = "HEAD~1"): Promise<string[]> {
  const git: SimpleGit = simpleGit();
  try {
    const diff = await git.diff([base, "HEAD", "--name-only"]);
    return diff.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
