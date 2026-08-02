import fs from "node:fs";
import path from "node:path";
import { findProjectRoot, fileExists } from "../core/fs.js";
import { printHeader, printCheck, printSummary, type CheckResult } from "../utils/logger.js";

interface IssueData {
  title: string;
  body: string;
  labels?: string[];
}

const LABEL_RULES: { label: string; keywords: RegExp; emoji: string }[] = [
  { label: "bug", keywords: /\b(bug|error|crash|fail|broken|incorrect|not working|doesn't work)\b/i, emoji: "🐛" },
  { label: "feature", keywords: /\b(feature|request|enhancement|suggestion|add |support for|would be nice)\b/i, emoji: "✨" },
  { label: "documentation", keywords: /\b(doc|readme|typo|document|wiki|guide)\b/i, emoji: "📚" },
  { label: "question", keywords: /\b(how |what |why |is it|can i|does |help\?|question)\b/i, emoji: "❓" },
  { label: "performance", keywords: /\b(slow|performance|speed|memory|optimize|lag|fast)\b/i, emoji: "⚡" },
  { label: "security", keywords: /\b(security|vulnerability|cve|xss|injection|exploit|leak)\b/i, emoji: "🔒" },
  { label: "dependencies", keywords: /\b(dependenc|bump |upgrade |update |npm |package|version)\b/i, emoji: "📦" },
];

export async function issueTriage(options: { title?: string; body?: string; file?: string }): Promise<void> {
  printHeader("Issue Triage");

  let title = options.title || "";
  let body = options.body || "";

  if (options.file) {
    const filePath = path.resolve(options.file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n");
      title = lines[0] || "";
      body = lines.slice(1).join("\n");
    }
  }

  if (!title && !body) {
    console.log("  No issue data provided. Use --title, --body, or --file flags.");
    return;
  }

  const checks: CheckResult[] = [];

  checks.push({
    name: "Title length",
    passed: title.length >= 10,
    message: title.length < 10 ? `Title is too short (${title.length} chars). Add more detail.` : "Title length is good.",
  });

  const hasBody = body.replace(/\s/g, "").length > 20;
  checks.push({
    name: "Description detail",
    passed: hasBody,
    message: hasBody ? "Description has enough detail." : "Description is too brief. Add steps to reproduce, expected vs actual behavior.",
  });

  const hasEnv = /\b(version|node|os|browser|env|environment)\b/i.test(body);
  checks.push({
    name: "Environment info",
    passed: hasEnv,
    message: hasEnv ? "Environment details provided." : "No environment info (version, OS, etc). Ask for details.",
  });

  console.log("\n  Suggested labels:");

  const matchedLabels: string[] = [];
  for (const rule of LABEL_RULES) {
    const text = `${title}\n${body}`;
    if (rule.keywords.test(text)) {
      matchedLabels.push(`${rule.emoji} ${rule.label}`);
    }
  }

  if (matchedLabels.length === 0) {
    console.log("  ⚡ triage (no matching patterns — needs manual review)");
  } else {
    for (const label of matchedLabels) {
      console.log(`  ${label}`);
    }
  }

  const isDuplicate = /(duplicate|same as|already reported|#\d+)/i.test(body);
  checks.push({
    name: "Potential duplicate",
    passed: !isDuplicate,
    message: isDuplicate
      ? "Issue references another issue/PR. Check for duplicates."
      : "No duplicate references detected.",
  });

  console.log("");
  for (const check of checks) {
    printCheck(check);
  }

  const passed = checks.filter((c) => c.passed).length;
  printSummary(passed, checks.length);
}
