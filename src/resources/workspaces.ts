import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { output } from "../lib/output.js";

interface ListOpts {
  fields?: string;
  format?: string;
  json?: boolean;
  page?: string;
}

interface IdOpts {
  fields?: string;
  format?: string;
  json?: boolean;
}

interface CreateOpts {
  format?: string;
  json?: boolean;
  name: string;
}

interface UpdateOpts {
  format?: string;
  json?: boolean;
  name?: string;
}

const WORKSPACE_LIST_FIELDS = ["id", "name", "index", "createdAt", "updatedAt"];

export const workspacesResource = new Command("workspaces").description(
  "Manage workspaces",
);

// ── LIST ──────────────────────────────────────────────
workspacesResource
  .command("list")
  .description("List workspaces (paginated)")
  .option("--page <n>", "Page number", "1")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli workspaces list\n  tally-cli workspaces list --json",
  )
  .action(async (opts: ListOpts) => {
    try {
      const data = (await client.get("/workspaces", {
        page: opts.page ?? "1",
      })) as { items?: unknown[] };
      const items = data.items ?? data;
      output(items, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(",") ?? WORKSPACE_LIST_FIELDS,
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
workspacesResource
  .command("get")
  .description("Get a workspace by ID (includes members)")
  .argument("<workspace-id>", "Workspace ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli workspaces get kb3o5R --json",
  )
  .action(async (workspaceId: string, opts: IdOpts) => {
    try {
      const data = await client.get(
        `/workspaces/${encodeURIComponent(workspaceId)}`,
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

// ── CREATE ────────────────────────────────────────────
workspacesResource
  .command("create")
  .description("Create a workspace (requires Pro)")
  .requiredOption("--name <name>", "Workspace name")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  tally-cli workspaces create --name "Marketing" --json',
  )
  .action(async (opts: CreateOpts) => {
    try {
      const data = await client.post("/workspaces", { name: opts.name });
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
workspacesResource
  .command("update")
  .description("Update a workspace")
  .argument("<workspace-id>", "Workspace ID")
  .option("--name <name>", "New workspace name")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  tally-cli workspaces update kb3o5R --name "Growth" --json',
  )
  .action(async (workspaceId: string, opts: UpdateOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.name) body.name = opts.name;
      if (Object.keys(body).length === 0) {
        throw new Error("Provide at least --name");
      }
      const data = await client.patch(
        `/workspaces/${encodeURIComponent(workspaceId)}`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
workspacesResource
  .command("delete")
  .description("Delete a workspace and its forms (moves to trash)")
  .argument("<workspace-id>", "Workspace ID")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli workspaces delete kb3o5R --json",
  )
  .action(async (workspaceId: string, opts: { json?: boolean }) => {
    try {
      await client.delete(`/workspaces/${encodeURIComponent(workspaceId)}`);
      output({ deleted: true, id: workspaceId }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
