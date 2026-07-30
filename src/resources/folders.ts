import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { output } from "../lib/output.js";

interface ListOpts {
  fields?: string;
  format?: string;
  json?: boolean;
}

interface CreateOpts {
  format?: string;
  json?: boolean;
  name: string;
  parentId?: string;
}

interface UpdateOpts {
  format?: string;
  json?: boolean;
  name?: string;
}

const FOLDER_FIELDS = [
  "id",
  "name",
  "workspaceId",
  "parentId",
  "createdAt",
  "updatedAt",
];

export const foldersResource = new Command("folders").description(
  "Manage workspace folders (Pro)",
);

// ── LIST ──────────────────────────────────────────────
foldersResource
  .command("list")
  .description("List folders in a workspace (requires Pro)")
  .argument("<workspace-id>", "Workspace ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli folders list kb3o5R\n  tally-cli folders list kb3o5R --json",
  )
  .action(async (workspaceId: string, opts: ListOpts) => {
    try {
      const data = await client.get(
        `/workspaces/${encodeURIComponent(workspaceId)}/folders`,
      );
      const items = Array.isArray(data)
        ? data
        : ((data as { folders?: unknown[]; items?: unknown[] }).folders ??
          (data as { items?: unknown[] }).items ??
          data);
      output(items, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(",") ?? FOLDER_FIELDS,
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
foldersResource
  .command("create")
  .description("Create a folder in a workspace (requires Pro)")
  .argument("<workspace-id>", "Workspace ID")
  .requiredOption("--name <name>", "Folder name")
  .option("--parent-id <id>", "Parent folder ID (nest under another folder)")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  tally-cli folders create kb3o5R --name "Leads" --json\n  tally-cli folders create kb3o5R --name "Q1" --parent-id folder123',
  )
  .action(async (workspaceId: string, opts: CreateOpts) => {
    try {
      const body: Record<string, unknown> = { name: opts.name };
      if (opts.parentId) body.parentId = opts.parentId;
      const data = await client.post(
        `/workspaces/${encodeURIComponent(workspaceId)}/folders`,
        body,
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
foldersResource
  .command("update")
  .description("Rename a folder (requires Pro)")
  .argument("<workspace-id>", "Workspace ID")
  .argument("<folder-id>", "Folder ID")
  .option("--name <name>", "New folder name")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  tally-cli folders update kb3o5R folder123 --name "Inbound" --json',
  )
  .action(
    async (workspaceId: string, folderId: string, opts: UpdateOpts) => {
      try {
        const body: Record<string, unknown> = {};
        if (opts.name) body.name = opts.name;
        if (Object.keys(body).length === 0) {
          throw new Error("Provide at least --name");
        }
        const data = await client.patch(
          `/workspaces/${encodeURIComponent(workspaceId)}/folders/${encodeURIComponent(folderId)}`,
          body,
        );
        output(data, { json: opts.json, format: opts.format });
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

// ── DELETE ────────────────────────────────────────────
foldersResource
  .command("delete")
  .description("Delete a folder and its subtree (forms move to trash, Pro)")
  .argument("<workspace-id>", "Workspace ID")
  .argument("<folder-id>", "Folder ID")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli folders delete kb3o5R folder123 --json",
  )
  .action(
    async (
      workspaceId: string,
      folderId: string,
      opts: { json?: boolean },
    ) => {
      try {
        await client.delete(
          `/workspaces/${encodeURIComponent(workspaceId)}/folders/${encodeURIComponent(folderId)}`,
        );
        output(
          { deleted: true, workspaceId, folderId },
          { json: opts.json },
        );
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );
