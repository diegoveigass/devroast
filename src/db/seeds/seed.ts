import { createHash } from "node:crypto";

import { faker } from "@faker-js/faker";

import { db, pool } from "@/db";
import {
  type DiffLineType,
  type IssueSeverity,
  type RoastMode,
  type RoastVerdict,
  roastDiffLines,
  roastIssues,
  roastResults,
  submissions,
} from "@/db/schema";

const SEED_COUNT = 120;

const languages = [
  "javascript",
  "typescript",
  "sql",
  "python",
  "bash",
  "go",
  "rust",
  "json",
] as const;

const verdictConfigs: Record<
  RoastVerdict,
  {
    headlineTemplates: string[];
    issueWeights: { value: IssueSeverity; weight: number }[];
    scoreRange: { min: number; max: number; precision?: number };
  }
> = {
  needs_serious_help: {
    headlineTemplates: [
      "this snippet feels like a speedrun through every avoidable mistake in the file",
      "your code compiles, but emotionally it is still throwing exceptions",
      "this implementation has strong hackathon-at-4am energy",
    ],
    issueWeights: [
      { value: "critical", weight: 6 },
      { value: "warning", weight: 3 },
      { value: "good", weight: 1 },
    ],
    scoreRange: { min: 1.0, max: 3.4, precision: 1 },
  },
  rough: {
    headlineTemplates: [
      "there is a decent idea here, buried under a few questionable decisions",
      "not catastrophic, but definitely one review away from a long comment thread",
      "the logic works, the taste level needs a second pass",
    ],
    issueWeights: [
      { value: "critical", weight: 2 },
      { value: "warning", weight: 5 },
      { value: "good", weight: 3 },
    ],
    scoreRange: { min: 3.5, max: 6.4, precision: 1 },
  },
  salvageable: {
    headlineTemplates: [
      "surprisingly solid, with just enough rough edges to keep reviewers employed",
      "this one is mostly under control, even if a couple of choices are still loud",
      "good structure overall, only a few cleanup passes away from respectable",
    ],
    issueWeights: [
      { value: "critical", weight: 1 },
      { value: "warning", weight: 4 },
      { value: "good", weight: 5 },
    ],
    scoreRange: { min: 6.5, max: 8.4, precision: 1 },
  },
  solid: {
    headlineTemplates: [
      "annoyingly competent code, hard to roast without sounding jealous",
      "clean enough that the sarcasm budget had to be cut in half",
      "this is actually good, which is rude in a product named DevRoast",
    ],
    issueWeights: [
      { value: "critical", weight: 1 },
      { value: "warning", weight: 2 },
      { value: "good", weight: 7 },
    ],
    scoreRange: { min: 8.5, max: 9.9, precision: 1 },
  },
};

const verdictWeights = [
  { value: "needs_serious_help" as const, weight: 2 },
  { value: "rough" as const, weight: 4 },
  { value: "salvageable" as const, weight: 3 },
  { value: "solid" as const, weight: 1 },
];

const diffLineTemplates: Record<
  (typeof languages)[number],
  { base: string[]; improved: string[] }
> = {
  javascript: {
    base: [
      "function calculateTotal(items) {",
      "  var total = 0;",
      "  for (const item of items) {",
      "    total += item.price;",
      "  }",
      "  return total;",
      "}",
    ],
    improved: [
      "function calculateTotal(items) {",
      "  return items.reduce((sum, item) => sum + item.price, 0);",
      "}",
    ],
  },
  typescript: {
    base: [
      "type User = { id: string; active: boolean };",
      "function isActive(user: User) {",
      "  if (user.active == true) {",
      "    return true;",
      "  }",
      "  return false;",
      "}",
    ],
    improved: [
      "type User = { id: string; active: boolean };",
      "function isActive(user: User) {",
      "  return user.active;",
      "}",
    ],
  },
  sql: {
    base: [
      "SELECT *",
      "FROM users",
      "WHERE deleted_at IS NULL",
      "ORDER BY created_at DESC;",
    ],
    improved: [
      "SELECT id, username, email, created_at",
      "FROM users",
      "WHERE deleted_at IS NULL",
      "ORDER BY created_at DESC;",
    ],
  },
  python: {
    base: [
      "def total_prices(items):",
      "    total = 0",
      "    for item in items:",
      "        total = total + item['price']",
      "    return total",
    ],
    improved: [
      "def total_prices(items):",
      "    return sum(item['price'] for item in items)",
    ],
  },
  bash: {
    base: [
      "#!/usr/bin/env bash",
      "FILES=$(ls src)",
      "for FILE in $FILES; do",
      "  echo $FILE",
      "done",
    ],
    improved: [
      "#!/usr/bin/env bash",
      "for file in src/*; do",
      "  printf '%s\\n' \"$file\"",
      "done",
    ],
  },
  go: {
    base: [
      "func sum(values []int) int {",
      "    total := 0",
      "    for i := 0; i < len(values); i++ {",
      "        total += values[i]",
      "    }",
      "    return total",
      "}",
    ],
    improved: [
      "func sum(values []int) int {",
      "    total := 0",
      "    for _, value := range values {",
      "        total += value",
      "    }",
      "    return total",
      "}",
    ],
  },
  rust: {
    base: [
      "fn sum(values: &[i32]) -> i32 {",
      "    let mut total = 0;",
      "    for i in 0..values.len() {",
      "        total += values[i];",
      "    }",
      "    total",
      "}",
    ],
    improved: [
      "fn sum(values: &[i32]) -> i32 {",
      "    values.iter().sum()",
      "}",
    ],
  },
  json: {
    base: [
      "{",
      '  "feature": "leaderboard",',
      '  "enabled": true,',
      '  "timeout": 1000,',
      '  "retry": false',
      "}",
    ],
    improved: [
      "{",
      '  "feature": "leaderboard",',
      '  "enabled": true,',
      '  "timeout": 3000,',
      '  "retry": true',
      "}",
    ],
  },
};

function getCodeHash(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

function createCodeSnippet(language: (typeof languages)[number]) {
  const helperName = faker.helpers.arrayElement([
    "calculateTotal",
    "resolveScore",
    "buildPayload",
    "sanitizeInput",
    "loadEntries",
    "rankSubmissions",
  ]);

  const entityName = faker.helpers.arrayElement([
    "items",
    "entries",
    "records",
    "payload",
    "users",
    "submissions",
  ]);

  switch (language) {
    case "javascript":
      return [
        `function ${helperName}(${entityName}) {`,
        "  var total = 0;",
        `  for (const entry of ${entityName}) {`,
        `    total += entry.${faker.helpers.arrayElement(["price", "score", "value", "count"])};`,
        "  }",
        "",
        "  return total;",
        "}",
      ].join("\n");
    case "typescript":
      return [
        `type Item = { id: string; ${faker.helpers.arrayElement(["score", "price", "value"])}: number };`,
        `export function ${helperName}(${entityName}: Item[]) {`,
        `  if (${entityName}.length == 0) {`,
        "    return 0;",
        "  }",
        `  return ${entityName}.map((item) => item.${faker.helpers.arrayElement(["score", "price", "value"])}).reduce((sum, value) => sum + value, 0);`,
        "}",
      ].join("\n");
    case "sql":
      return [
        "SELECT *",
        `FROM ${faker.helpers.arrayElement(["users", "orders", "submissions", "reviews"])} `,
        "WHERE deleted_at IS NULL",
        `ORDER BY ${faker.helpers.arrayElement(["created_at", "updated_at", "score"])} DESC;`,
      ].join("\n");
    case "python":
      return [
        `def ${helperName}(${entityName}):`,
        "    total = 0",
        `    for entry in ${entityName}:`,
        `        total += entry["${faker.helpers.arrayElement(["score", "price", "value"])}"]`,
        "    return total",
      ].join("\n");
    case "bash":
      return [
        "#!/usr/bin/env bash",
        `FILES=$(ls ${faker.helpers.arrayElement(["src", "app", "scripts", "data"])})`,
        "for FILE in $FILES; do",
        "  echo $FILE",
        "done",
      ].join("\n");
    case "go":
      return [
        `func ${helperName}(${entityName} []int) int {`,
        "    total := 0",
        `    for i := 0; i < len(${entityName}); i++ {`,
        `        total += ${entityName}[i]`,
        "    }",
        "    return total",
        "}",
      ].join("\n");
    case "rust":
      return [
        `fn ${helperName}(${entityName}: &[i32]) -> i32 {`,
        "    let mut total = 0;",
        `    for i in 0..${entityName}.len() {`,
        `        total += ${entityName}[i];`,
        "    }",
        "    total",
        "}",
      ].join("\n");
    case "json":
      return JSON.stringify(
        {
          feature: faker.helpers.arrayElement([
            "leaderboard",
            "roast",
            "editor",
            "share",
          ]),
          enabled: faker.datatype.boolean(),
          retries: faker.number.int({ min: 0, max: 5 }),
          timeout: faker.number.int({ min: 500, max: 5000 }),
          owner: faker.internet.username(),
        },
        null,
        2,
      );
  }
}

function createIssueDescription(severity: IssueSeverity) {
  const intros = {
    critical: [
      "This part is carrying real maintenance risk.",
      "This is the kind of choice that keeps reviewers awake.",
      "The code works today, but it is negotiating with tomorrow.",
    ],
    warning: [
      "This is readable enough, but still harder than it needs to be.",
      "Not broken, just a little louder than ideal.",
      "There is room to simplify this without changing behavior.",
    ],
    good: [
      "This part is doing its job cleanly.",
      "A rare moment of restraint and clarity.",
      "This choice actually improves the flow of the code.",
    ],
  };

  return `${faker.helpers.arrayElement(intros[severity])} ${faker.lorem.sentence()}`;
}

function createIssueTitle(severity: IssueSeverity) {
  const titles = {
    critical: [
      "hidden complexity spike",
      "unsafe control flow",
      "leaky abstraction",
      "too much trust in input",
      "fragile branching logic",
    ],
    warning: [
      "imperative loop pattern",
      "redundant boolean flow",
      "naming could be clearer",
      "verbose implementation",
      "hard-coded assumption",
    ],
    good: [
      "clear naming conventions",
      "single responsibility",
      "predictable data flow",
      "small readable surface",
      "good extraction boundary",
    ],
  };

  return faker.helpers.arrayElement(titles[severity]);
}

function createDiffLines(language: (typeof languages)[number]) {
  const template = diffLineTemplates[language];
  const commonStart = template.base[0];
  const commonEnd = template.base.at(-1) ?? "}";

  const removed = template.base.slice(1, -1);
  const added = template.improved.slice(1, -1);

  const lines: Array<{ lineType: DiffLineType; content: string }> = [
    { lineType: "context", content: commonStart },
    ...removed.map((content) => ({ lineType: "removed" as const, content })),
    ...added.map((content) => ({ lineType: "added" as const, content })),
    { lineType: "context", content: commonEnd },
  ];

  return lines;
}

async function main() {
  faker.seed(20260313);

  const generatedEntries = faker.helpers.multiple(
    () => {
      const language = faker.helpers.arrayElement(languages);
      const code = createCodeSnippet(language);
      const verdict = faker.helpers.weightedArrayElement(verdictWeights);
      const verdictConfig = verdictConfigs[verdict];
      const score = faker.number.float(verdictConfig.scoreRange).toFixed(1);
      const submissionId = faker.string.uuid();
      const publicId = `sub_${faker.string.alphanumeric({ length: 16, casing: "lower" })}`;
      const shareSlug = `share-${faker.string.alphanumeric({ length: 20, casing: "lower" })}`;
      const roastMode: RoastMode = faker.helpers.arrayElement([
        "honest",
        "full_roast",
      ]);
      const createdAt = faker.date.recent({ days: 120 });
      const updatedAt = faker.date.between({ from: createdAt, to: new Date() });
      const isPublic =
        faker.helpers.maybe(() => false, { probability: 0.12 }) ?? true;
      const issueCount = faker.number.int({ min: 3, max: 5 });
      const issues = Array.from({ length: issueCount }, (_, index) => {
        const severity = faker.helpers.weightedArrayElement(
          verdictConfig.issueWeights,
        );

        return {
          id: faker.string.uuid(),
          submissionId,
          severity,
          title: createIssueTitle(severity),
          description: createIssueDescription(severity),
          position: index + 1,
          createdAt: updatedAt,
        };
      });

      const diffLines = createDiffLines(language).map((line, index) => ({
        id: faker.string.uuid(),
        submissionId,
        lineType: line.lineType,
        content: line.content,
        position: index + 1,
        createdAt: updatedAt,
      }));

      return {
        diffLines,
        issues,
        roastResult: {
          id: faker.string.uuid(),
          submissionId,
          score,
          verdict,
          headline: faker.helpers.arrayElement(verdictConfig.headlineTemplates),
          summary: faker.lorem.paragraph(),
          languageLabel: language,
          shareSlug,
          provider: "seed",
          providerModel: faker.helpers.arrayElement([
            "gpt-4.1-mini",
            "gpt-5.4",
            "claude-3.7-sonnet",
            "mock-evaluator-v1",
          ]),
          createdAt,
          updatedAt,
        },
        submission: {
          id: submissionId,
          publicId,
          status: "completed" as const,
          roastMode,
          source: "web",
          language,
          originalCode: code,
          codeHash: getCodeHash(code),
          lineCount: code.split("\n").length,
          isPublic,
          createdAt,
          updatedAt,
        },
      };
    },
    { count: SEED_COUNT },
  );

  await db.transaction(async (tx) => {
    await tx.delete(roastDiffLines);
    await tx.delete(roastIssues);
    await tx.delete(roastResults);
    await tx.delete(submissions);

    await tx
      .insert(submissions)
      .values(generatedEntries.map((entry) => entry.submission));
    await tx
      .insert(roastResults)
      .values(generatedEntries.map((entry) => entry.roastResult));
    await tx
      .insert(roastIssues)
      .values(generatedEntries.flatMap((entry) => entry.issues));
    await tx
      .insert(roastDiffLines)
      .values(generatedEntries.flatMap((entry) => entry.diffLines));
  });

  console.log(`Seeded ${generatedEntries.length} submissions.`);
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await pool.end();
    process.exit(1);
  });
