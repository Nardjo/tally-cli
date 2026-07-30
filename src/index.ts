#!/usr/bin/env bun
import { Command } from "commander";
import { authCommand } from "./commands/auth.js";
import { globalFlags } from "./lib/config.js";
import { foldersResource } from "./resources/folders.js";
import { formsResource } from "./resources/forms.js";
import { meResource } from "./resources/me.js";
import { organizationsResource } from "./resources/organizations.js";
import { submissionsResource } from "./resources/submissions.js";
import { webhooksResource } from "./resources/webhooks.js";
import { workspacesResource } from "./resources/workspaces.js";

const program = new Command();

program
  .name("tally-cli")
  .description("CLI for the Tally forms API (https://api.tally.so)")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

// Built-in commands
program.addCommand(authCommand);

// Resources
program.addCommand(meResource);
program.addCommand(formsResource);
program.addCommand(submissionsResource);
program.addCommand(workspacesResource);
program.addCommand(foldersResource);
program.addCommand(webhooksResource);
program.addCommand(organizationsResource);

program.parse();
