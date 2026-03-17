import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("result route server helper loads without DATABASE_URL at import time", () => {
  const child = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "--eval",
      'import("./src/app/result/[submissionId]/_lib/get-result-query.ts")',
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: "",
      },
    },
  );

  assert.equal(child.status, 0, child.stderr || child.stdout);
});
