import chalk from "chalk";

export interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
}

export function printHeader(title: string): void {
  console.log(chalk.bold.cyan(`\n  ${title}`));
  console.log(chalk.dim("  " + "─".repeat(40)));
}

export function printCheck(result: CheckResult): void {
  const icon = result.passed ? chalk.green("✔") : chalk.red("✘");
  const name = result.passed ? chalk.green(result.name) : chalk.red(result.name);
  console.log(`  ${icon} ${name}`);
  if (!result.passed) {
    console.log(chalk.dim(`    ${result.message}`));
  }
}

export function printSummary(passed: number, total: number): void {
  console.log(chalk.dim("  " + "─".repeat(40)));
  if (passed === total) {
    console.log(chalk.green(`\n  All ${total} checks passed!`));
  } else {
    console.log(chalk.yellow(`\n  ${passed}/${total} checks passed (${total - passed} failed)`));
  }
}
