import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { output } from "../lib/output.js";

interface ListOpts {
  fields?: string;
  format?: string;
  json?: boolean;
  limit?: string;
  page?: string;
}

interface CreateOpts {
  eventTypes?: string;
  externalSubscriber?: string;
  format?: string;
  formId: string;
  headers?: string;
  json?: boolean;
  signingSecret?: string;
  url: string;
}

interface UpdateOpts {
  enabled?: string;
  eventTypes?: string;
  format?: string;
  headers?: string;
  json?: boolean;
  signingSecret?: string;
  url?: string;
}

interface EventsOpts {
  fields?: string;
  format?: string;
  json?: boolean;
  limit?: string;
  page?: string;
}

const WEBHOOK_LIST_FIELDS = [
  "id",
  "formId",
  "url",
  "isEnabled",
  "eventTypes",
  "createdAt",
  "updatedAt",
];

export const webhooksResource = new Command("webhooks").description(
  "Manage form webhooks and delivery events",
);

// ── LIST ──────────────────────────────────────────────
webhooksResource
  .command("list")
  .description("List webhooks across accessible forms")
  .option("--page <n>", "Page number", "1")
  .option("--limit <n>", "Webhooks per page (max 100)", "25")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli webhooks list\n  tally-cli webhooks list --limit 50 --json",
  )
  .action(async (opts: ListOpts) => {
    try {
      const data = (await client.get("/webhooks", {
        page: opts.page ?? "1",
        limit: opts.limit ?? "25",
      })) as { webhooks?: unknown[] };
      const items = data.webhooks ?? data;
      output(items, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(",") ?? WEBHOOK_LIST_FIELDS,
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
webhooksResource
  .command("create")
  .description("Create a webhook for a form")
  .requiredOption("--form-id <id>", "Form ID")
  .requiredOption("--url <url>", "Webhook endpoint URL")
  .option(
    "--event-types <types>",
    "Comma-separated event types (default: FORM_RESPONSE)",
    "FORM_RESPONSE",
  )
  .option("--signing-secret <secret>", "Secret used to sign payloads")
  .option(
    "--headers <json>",
    'Custom HTTP headers as JSON array: [{"name":"X-Key","value":"..."}]',
  )
  .option("--external-subscriber <id>", "External subscriber identifier")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    [
      "",
      "Examples:",
      "  tally-cli webhooks create --form-id m2fK5R --url https://example.com/hook --json",
      "  tally-cli webhooks create --form-id m2fK5R --url https://example.com/hook --signing-secret s3cr3t",
    ].join("\n"),
  )
  .action(async (opts: CreateOpts) => {
    try {
      const body: Record<string, unknown> = {
        formId: opts.formId,
        url: opts.url,
        eventTypes: (opts.eventTypes ?? "FORM_RESPONSE")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      if (opts.signingSecret) body.signingSecret = opts.signingSecret;
      if (opts.externalSubscriber) {
        body.externalSubscriber = opts.externalSubscriber;
      }
      if (opts.headers) body.httpHeaders = JSON.parse(opts.headers);

      const data = await client.post("/webhooks", body);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
webhooksResource
  .command("update")
  .description("Update a webhook configuration")
  .argument("<webhook-id>", "Webhook ID")
  .option("--url <url>", "New webhook URL")
  .option("--event-types <types>", "Comma-separated event types")
  .option("--signing-secret <secret>", "New signing secret")
  .option(
    "--headers <json>",
    'Custom HTTP headers as JSON array: [{"name":"X-Key","value":"..."}]',
  )
  .option("--enabled <bool>", "Enable or disable: true | false")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli webhooks update wh_123 --enabled false --json\n  tally-cli webhooks update wh_123 --url https://new.example.com/hook",
  )
  .action(async (webhookId: string, opts: UpdateOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.url) body.url = opts.url;
      if (opts.eventTypes) {
        body.eventTypes = opts.eventTypes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (opts.signingSecret) body.signingSecret = opts.signingSecret;
      if (opts.headers) body.httpHeaders = JSON.parse(opts.headers);
      if (opts.enabled !== undefined) {
        body.isEnabled = opts.enabled === "true" || opts.enabled === "1";
      }
      if (Object.keys(body).length === 0) {
        throw new Error(
          "Provide at least one of: --url, --event-types, --signing-secret, --headers, --enabled",
        );
      }
      const data = await client.patch(
        `/webhooks/${encodeURIComponent(webhookId)}`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
webhooksResource
  .command("delete")
  .description("Delete a webhook")
  .argument("<webhook-id>", "Webhook ID")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli webhooks delete wh_123 --json",
  )
  .action(async (webhookId: string, opts: { json?: boolean }) => {
    try {
      await client.delete(`/webhooks/${encodeURIComponent(webhookId)}`);
      output({ deleted: true, id: webhookId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── EVENTS ────────────────────────────────────────────
webhooksResource
  .command("events")
  .description("List delivery events for a webhook")
  .argument("<webhook-id>", "Webhook ID")
  .option("--page <n>", "Page number", "1")
  .option("--limit <n>", "Events per page", "25")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli webhooks events wh_123 --json",
  )
  .action(async (webhookId: string, opts: EventsOpts) => {
    try {
      const data = await client.get(
        `/webhooks/${encodeURIComponent(webhookId)}/events`,
        {
          page: opts.page ?? "1",
          limit: opts.limit ?? "25",
        },
      );
      const items = Array.isArray(data)
        ? data
        : ((data as { events?: unknown[]; items?: unknown[] }).events ??
          (data as { items?: unknown[] }).items ??
          data);
      output(items, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── RETRY EVENT ───────────────────────────────────────
webhooksResource
  .command("retry-event")
  .description("Retry a failed webhook delivery event")
  .argument("<webhook-id>", "Webhook ID")
  .argument("<event-id>", "Event ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli webhooks retry-event wh_123 evt_456 --json",
  )
  .action(
    async (
      webhookId: string,
      eventId: string,
      opts: { json?: boolean; format?: string },
    ) => {
      try {
        const data = await client.post(
          `/webhooks/${encodeURIComponent(webhookId)}/events/${encodeURIComponent(eventId)}`,
        );
        output(data ?? { retried: true, webhookId, eventId }, {
          json: opts.json,
          format: opts.format,
        });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );
