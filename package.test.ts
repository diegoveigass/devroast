import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("default test script preloads dotenv", () => {
  const packageJson = JSON.parse(
    readFileSync(new URL("./package.json", import.meta.url), "utf8"),
  ) as {
    scripts?: {
      test?: string;
    };
  };

  assert.match(packageJson.scripts?.test ?? "", /--import=dotenv\/config/);
});
