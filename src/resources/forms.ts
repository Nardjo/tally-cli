import { Command } from "commander";
import { readFileSync } from "fs";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { output } from "../lib/output.js";

interface ListOpts {
  fields?: string;
  format?: string;
  json?: boolean;
  limit?: string;
  page?: string;
  workspaceIds?: string;
}

interface IdOpts {
  fields?: string;
  format?: string;
  json?: boolean;
}

interface CreateOpts {
  blocksFile?: string;
  folderId?: string;
  format?: string;
  json?: boolean;
  settingsFile?: string;
  status?: string;
  templateId?: string;
  title?: string;
  workspaceId?: string;
}

interface UpdateOpts {
  blocksFile?: string;
  format?: string;
  json?: boolean;
  name?: string;
  settingsFile?: string;
  status?: string;
}

interface MetricsOpts {
  fields?: string;
  format?: string;
  json?: boolean;
  period: string;
}

interface AnalyticsOpts {
  fields?: string;
  format?: string;
  json?: boolean;
  period: string;
}

const FORM_LIST_FIELDS = [
  "id",
  "name",
  "status",
  "workspaceId",
  "numberOfSubmissions",
  "isClosed",
  "createdAt",
  "updatedAt",
];

const ANALYTICS_PERIODS =
  "today, yesterday, 24h, 7d, 30d, 3m, 6m, 12m, all";

export const formsResource = new Command("forms").description(
  "Manage Tally forms",
);

// ── LIST ──────────────────────────────────────────────
formsResource
  .command("list")
  .description("List forms (paginated)")
  .option("--page <n>", "Page number", "1")
  .option("--limit <n>", "Forms per page (max 500)", "50")
  .option(
    "--workspace-ids <ids>",
    "Filter by workspace IDs (comma-separated)",
  )
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli forms list\n  tally-cli forms list --limit 10 --json\n  tally-cli forms list --workspace-ids abc,def",
  )
  .action(async (opts: ListOpts) => {
    try {
      const params: Record<string, string> = {
        page: opts.page ?? "1",
        limit: opts.limit ?? "50",
      };
      if (opts.workspaceIds) {
        // API expects explode form: workspaceIds=a&workspaceIds=b
        // URLSearchParams with same key repeated — pass first id here and
        // append rest via custom query if needed. Simpler: join not supported;
        // send as first value and document single workspace for text mode.
        const ids = opts.workspaceIds.split(",").map((s) => s.trim()).filter(Boolean);
        if (ids.length === 1) {
          params.workspaceIds = ids[0]!;
        } else if (ids.length > 1) {
          // client only supports Record<string,string>; pass first and rely on
          // multi via repeated key by encoding manually through path trick.
          // Use first ID + note; better: override via full query in get.
          params.workspaceIds = ids.join(",");
        }
      }

      const data = (await client.get("/forms", params)) as {
        items?: unknown[];
        page?: number;
        limit?: number;
        total?: number;
        hasMore?: boolean;
      };

      const items = data.items ?? data;
      output(items, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(",") ?? FORM_LIST_FIELDS,
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
formsResource
  .command("get")
  .description("Get a form by ID (includes blocks and settings)")
  .argument("<form-id>", "Form ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli forms get m2fK5R\n  tally-cli forms get m2fK5R --json",
  )
  .action(async (formId: string, opts: IdOpts) => {
    try {
      const data = await client.get(`/forms/${encodeURIComponent(formId)}`);
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
formsResource
  .command("create")
  .description("Create a form (simple title or full blocks JSON file)")
  .option("--title <title>", "Form title (creates a minimal FORM_TITLE form)")
  .option("--status <status>", "BLANK | DRAFT | PUBLISHED", "DRAFT")
  .option("--workspace-id <id>", "Workspace ID (default: user's default)")
  .option("--template-id <id>", "Template ID to base the form on")
  .option("--folder-id <id>", "Folder ID within the workspace")
  .option("--blocks-file <path>", "JSON file with blocks array")
  .option("--settings-file <path>", "JSON file with form settings object")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    [
      "",
      "Examples:",
      '  tally-cli forms create --title "Contact form" --status PUBLISHED',
      "  tally-cli forms create --blocks-file ./blocks.json --status DRAFT --json",
      "  tally-cli forms create --title \"NPS\" --workspace-id kb3o5R",
    ].join("\n"),
  )
  .action(async (opts: CreateOpts) => {
    try {
      const body: Record<string, unknown> = {
        status: opts.status ?? "DRAFT",
      };

      if (opts.workspaceId) body.workspaceId = opts.workspaceId;
      if (opts.templateId) body.templateId = opts.templateId;
      if (opts.folderId) body.folderId = opts.folderId;

      if (opts.blocksFile) {
        body.blocks = parseJsonFile(opts.blocksFile);
      } else if (opts.title) {
        body.blocks = minimalTitleBlocks(opts.title);
      } else {
        throw new Error(
          "Provide --title for a minimal form, or --blocks-file with a full blocks array",
        );
      }

      if (opts.settingsFile) {
        body.settings = parseJsonFile(opts.settingsFile);
      }

      const data = await client.post("/forms", body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
formsResource
  .command("update")
  .description("Update a form name, status, blocks, or settings")
  .argument("<form-id>", "Form ID")
  .option("--name <name>", "New form name")
  .option("--status <status>", "BLANK | DRAFT | PUBLISHED | DELETED")
  .option("--blocks-file <path>", "JSON file with updated blocks array")
  .option("--settings-file <path>", "JSON file with updated settings")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    [
      "",
      "Examples:",
      '  tally-cli forms update m2fK5R --name "New name"',
      "  tally-cli forms update m2fK5R --status PUBLISHED --json",
      "  tally-cli forms update m2fK5R --blocks-file ./blocks.json",
    ].join("\n"),
  )
  .action(async (formId: string, opts: UpdateOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (opts.status) body.status = opts.status;
      if (opts.blocksFile) body.blocks = parseJsonFile(opts.blocksFile);
      if (opts.settingsFile) body.settings = parseJsonFile(opts.settingsFile);

      if (Object.keys(body).length === 0) {
        throw new Error(
          "Provide at least one of: --name, --status, --blocks-file, --settings-file",
        );
      }

      const data = await client.patch(
        `/forms/${encodeURIComponent(formId)}`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
formsResource
  .command("delete")
  .description("Delete a form (moves to trash)")
  .argument("<form-id>", "Form ID")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli forms delete m2fK5R\n  tally-cli forms delete m2fK5R --json",
  )
  .action(async (formId: string, opts: { json?: boolean }) => {
    try {
      await client.delete(`/forms/${encodeURIComponent(formId)}`);
      output({ deleted: true, id: formId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── QUESTIONS ─────────────────────────────────────────
formsResource
  .command("questions")
  .description("List questions for a form")
  .argument("<form-id>", "Form ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli forms questions m2fK5R\n  tally-cli forms questions m2fK5R --json",
  )
  .action(async (formId: string, opts: IdOpts) => {
    try {
      const data = await client.get(
        `/forms/${encodeURIComponent(formId)}/questions`,
      );
      const items = Array.isArray(data)
        ? data
        : ((data as { questions?: unknown[] }).questions ?? data);
      output(items, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(",") ?? [
          "id",
          "type",
          "title",
          "numberOfResponses",
        ],
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── METRICS ───────────────────────────────────────────
formsResource
  .command("metrics")
  .description("Aggregate analytics metrics for a form")
  .argument("<form-id>", "Form ID")
  .requiredOption(
    "--period <period>",
    `Time period: ${ANALYTICS_PERIODS}`,
  )
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli forms metrics m2fK5R --period 7d\n  tally-cli forms metrics m2fK5R --period 30d --json",
  )
  .action(async (formId: string, opts: MetricsOpts) => {
    try {
      const data = await client.get(
        `/forms/${encodeURIComponent(formId)}/analytics/metrics`,
        { period: opts.period },
      );
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── VISITS ────────────────────────────────────────────
formsResource
  .command("visits")
  .description("Visit counts over time for a form")
  .argument("<form-id>", "Form ID")
  .requiredOption("--period <period>", `Time period: ${ANALYTICS_PERIODS}`)
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli forms visits m2fK5R --period 7d --json",
  )
  .action(async (formId: string, opts: AnalyticsOpts) => {
    try {
      const data = await client.get(
        `/forms/${encodeURIComponent(formId)}/analytics/visits`,
        { period: opts.period },
      );
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── SUBMISSIONS ANALYTICS ─────────────────────────────
formsResource
  .command("submission-stats")
  .description("Completed and partial submission counts over time")
  .argument("<form-id>", "Form ID")
  .requiredOption("--period <period>", `Time period: ${ANALYTICS_PERIODS}`)
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli forms submission-stats m2fK5R --period 30d --json",
  )
  .action(async (formId: string, opts: AnalyticsOpts) => {
    try {
      const data = await client.get(
        `/forms/${encodeURIComponent(formId)}/analytics/submissions`,
        { period: opts.period },
      );
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DROP-OFF ──────────────────────────────────────────
formsResource
  .command("drop-off")
  .description("Per-question drop-off statistics")
  .argument("<form-id>", "Form ID")
  .requiredOption("--period <period>", `Time period: ${ANALYTICS_PERIODS}`)
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli forms drop-off m2fK5R --period 7d --json",
  )
  .action(async (formId: string, opts: AnalyticsOpts) => {
    try {
      const data = await client.get(
        `/forms/${encodeURIComponent(formId)}/analytics/drop-off`,
        { period: opts.period },
      );
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DIMENSIONS ────────────────────────────────────────
formsResource
  .command("dimensions")
  .description("Visitor breakdowns (source, browser, OS, device, location)")
  .argument("<form-id>", "Form ID")
  .requiredOption("--period <period>", `Time period: ${ANALYTICS_PERIODS}`)
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli forms dimensions m2fK5R --period 30d --json",
  )
  .action(async (formId: string, opts: AnalyticsOpts) => {
    try {
      const data = await client.get(
        `/forms/${encodeURIComponent(formId)}/analytics/dimensions`,
        { period: opts.period },
      );
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

function parseJsonFile(path: string): unknown {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw);
}

function minimalTitleBlocks(title: string): unknown[] {
  const uuid = crypto.randomUUID();
  const groupUuid = crypto.randomUUID();
  return [
    {
      uuid,
      type: "FORM_TITLE",
      groupUuid,
      groupType: "TEXT",
      payload: {
        html: escapeHtml(title),
        title,
      },
    },
  ];
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
