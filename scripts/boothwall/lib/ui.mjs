import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";

const colour = (code) => (text) => (stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
export const bold = colour(1);
export const dim = colour(2);
const green = colour(32);
const red = colour(31);

export const log = (message = "") => stdout.write(`${message}\n`);
export const step = (message) => log(`${bold("›")} ${message}`);
export const ok = (message) => log(`  ${green("✓")} ${message}`);
export const fail = (message) => log(`  ${red("✗")} ${message}`);

/** Error the CLI prints without a stack trace: a problem the user can fix. */
export class UserError extends Error {}

export async function ask(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

export async function confirm(question) {
  if (!stdin.isTTY) return false;
  return /^y(es)?$/i.test(await ask(`${question} ${dim("[y/N]")} `));
}

/** Like ask(), but nothing is echoed: for passcodes. */
export async function askHidden(question) {
  if (!stdin.isTTY) return "";
  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  let value = "";
  try {
    for await (const chunk of stdin) {
      for (const char of chunk.toString("utf8")) {
        if (char === "\r" || char === "\n") return value;
        if (char === "\u0003") throw new UserError("Cancelled.");
        value = char === "\u007f" ? value.slice(0, -1) : value + char;
      }
    }
  } finally {
    stdin.setRawMode(false);
    stdin.pause();
    stdout.write("\n");
  }
  return value;
}
