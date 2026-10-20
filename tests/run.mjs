// Optional command-line runner: `node tests/run.mjs` (Node 18 or newer).
// No npm install needed. It loads the same plain scripts the browser runner
// (tests/index.html) loads, in the same order, then runs every test.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { SCRIPTS } from "./scripts.mjs";

const here = dirname(fileURLToPath(import.meta.url));
for (const file of SCRIPTS) {
  const path = join(here, file);
  vm.runInThisContext(readFileSync(path, "utf8"), { filename: path });
}

const results = await globalThis.PickColor.testHarness.run();
const failed = results.filter((result) => !result.ok);

for (const result of results) {
  console.log(`${result.ok ? "pass" : "FAIL"}  ${result.name}${result.ok ? "" : `\n      ${result.message}`}`);
}
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exitCode = failed.length ? 1 : 0;
