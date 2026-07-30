import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { output } from "../lib/output.js";

interface ListOpts {
  fields?: string;
  format?: string;
  json?: boolean;
}

interface InviteCreateOpts {
  email: string;
  format?: string;
  json?: boolean;
  workspaceIds: string;
}

export const organizationsResource = new Command("organizations").description(
  "Organization users and invites",
);

// ── USERS LIST ────────────────────────────────────────
organizationsResource
  .command("users")
  .description("List users in an organization")
  .argument("<organization-id>", "Organization ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli organizations users atL65s --json",
  )
  .action(async (organizationId: string, opts: ListOpts) => {
    try {
      const data = await client.get(
        `/organizations/${encodeURIComponent(organizationId)}/users`,
      );
      const items = Array.isArray(data)
        ? data
        : ((data as { users?: unknown[]; items?: unknown[] }).users ??
          (data as { items?: unknown[] }).items ??
          data);
      output(items, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(",") ?? [
          "id",
          "fullName",
          "email",
          "subscriptionPlan",
        ],
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── USERS REMOVE ──────────────────────────────────────
organizationsResource
  .command("remove-user")
  .description(
    "Remove a user from the organization (creator only, or self-remove)",
  )
  .argument("<organization-id>", "Organization ID")
  .argument("<user-id>", "User ID")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli organizations remove-user atL65s user_123 --json",
  )
  .action(
    async (
      organizationId: string,
      userId: string,
      opts: { json?: boolean },
    ) => {
      try {
        await client.delete(
          `/organizations/${encodeURIComponent(organizationId)}/users/${encodeURIComponent(userId)}`,
        );
        output(
          { deleted: true, organizationId, userId },
          { json: opts.json },
        );
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );

// ── INVITES LIST ──────────────────────────────────────
organizationsResource
  .command("invites")
  .description("List pending organization invites")
  .argument("<organization-id>", "Organization ID")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli organizations invites atL65s --json",
  )
  .action(async (organizationId: string, opts: ListOpts) => {
    try {
      const data = await client.get(
        `/organizations/${encodeURIComponent(organizationId)}/invites`,
      );
      const items = Array.isArray(data)
        ? data
        : ((data as { invites?: unknown[]; items?: unknown[] }).invites ??
          (data as { items?: unknown[] }).items ??
          data);
      output(items, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(",") ?? ["id", "email", "workspaceIds"],
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── INVITE CREATE ─────────────────────────────────────
organizationsResource
  .command("invite")
  .description("Invite a user to workspaces in the organization")
  .argument("<organization-id>", "Organization ID")
  .requiredOption("--email <email>", "Invitee email")
  .requiredOption(
    "--workspace-ids <ids>",
    "Comma-separated workspace IDs to grant access to",
  )
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    '\nExamples:\n  tally-cli organizations invite atL65s --email teammate@example.com --workspace-ids kb3o5R --json',
  )
  .action(async (organizationId: string, opts: InviteCreateOpts) => {
    try {
      const workspaceIds = opts.workspaceIds
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const data = await client.post(
        `/organizations/${encodeURIComponent(organizationId)}/invites`,
        {
          email: opts.email,
          workspaceIds,
        },
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── INVITE CANCEL ─────────────────────────────────────
organizationsResource
  .command("cancel-invite")
  .description("Cancel a pending invite (only the inviter can cancel)")
  .argument("<organization-id>", "Organization ID")
  .argument("<invite-id>", "Invite ID")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli organizations cancel-invite atL65s inv_123 --json",
  )
  .action(
    async (
      organizationId: string,
      inviteId: string,
      opts: { json?: boolean },
    ) => {
      try {
        await client.delete(
          `/organizations/${encodeURIComponent(organizationId)}/invites/${encodeURIComponent(inviteId)}`,
        );
        output(
          { deleted: true, organizationId, inviteId },
          { json: opts.json },
        );
      } catch (err) {
        handleError(err, opts.json);
      }
    },
  );
