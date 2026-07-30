import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { output } from "../lib/output.js";

interface ListOpts {
  afterId?: string;
  endDate?: string;
  fields?: string;
  filter?: string;
  format?: string;
  json?: boolean;
  limit?: string;
  page?: string;
  startDate?: string;
}

interface IdOpts {
  fields?: string;
  format?: string;
  json?: boolean;
}

const SUBMISSION_LIST_FIELDS = [
  "id",
  "formId",
  "isCompleted",
  "submittedAt",
];

export const submissionsResource = new Command("submissions").description(
  "List, inspect, and delete form submissions",
);

// ── LIST ──────────────────────────────────────────────
submissionsResource
  .command("list")
  .description("List submissions for a form")
  .argument("<form-id>", "Form ID")
  .option("--page <n>", "Page number", "1")
  .option("--limit <n>", "Submissions per page (max 500)", "50")
  .option(
    "--filter <status>",
    "Filter: all | completed | partial",
    "all",
  )
  .option("--start-date <iso>", "Submitted on or after (ISO 8601)")
  .option("--end-date <iso>", "Submitted on or before (ISO 8601)")
  .option("--after-id <id>", "Submissions after this submission ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    [
      "",
      "Examples:",
      "  tally-cli submissions list m2fK5R",
      "  tally-cli submissions list m2fK5R --filter completed --limit 20 --json",
      "  tally-cli submissions list m2fK5R --start-date 2026-01-01T00:00:00Z",
    ].join("\n"),
  )
  .action(async (formId: string, opts: ListOpts) => {
    try {
      const params: Record<string, string> = {
        page: opts.page ?? "1",
        limit: opts.limit ?? "50",
      };
      if (opts.filter) params.filter = opts.filter;
      if (opts.startDate) params.startDate = opts.startDate;
      if (opts.endDate) params.endDate = opts.endDate;
      if (opts.afterId) params.afterId = opts.afterId;

      const data = (await client.get(
        `/forms/${encodeURIComponent(formId)}/submissions`,
        params,
      )) as {
        submissions?: unknown[];
        questions?: unknown[];
        page?: number;
        limit?: number;
        hasMore?: boolean;
        totalNumberOfSubmissionsPerFilter?: Record<string, number>;
      };

      if (opts.json) {
        // Full payload for agents (questions + submissions + totals)
        output(data, { json: true });
        return;
      }

      const items = data.submissions ?? [];
      output(items, {
        format: opts.format,
        fields: opts.fields?.split(",") ?? SUBMISSION_LIST_FIELDS,
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
submissionsResource
  .command("get")
  .description("Get a single submission with responses")
  .argument("<form-id>", "Form ID")
  .argument("<submission-id>", "Submission ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli submissions get m2fK5R sub_abc\n  tally-cli submissions get m2fK5R sub_abc --json",
  )
  .action(async (formId: string, submissionId: string, opts: IdOpts) => {
    try {
      const data = await client.get(
        `/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submissionId)}`,
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

// ── DELETE ────────────────────────────────────────────
submissionsResource
  .command("delete")
  .description("Delete a submission")
  .argument("<form-id>", "Form ID")
  .argument("<submission-id>", "Submission ID")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli submissions delete m2fK5R sub_abc --json",
  )
  .action(
    async (
      formId: string,
      submissionId: string,
      opts: { json?: boolean },
    ) => {
      try {
        await client.delete(
          `/forms/${encodeURIComponent(formId)}/submissions/${encodeURIComponent(submissionId)}`,
        );
        output(
          { deleted: true, formId, submissionId },
          { json: opts.json },
        );
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );
