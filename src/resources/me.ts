import { Command } from "commander";
import { client } from "../lib/client.js";
import { handleError } from "../lib/errors.js";
import { output } from "../lib/output.js";

interface MeOpts {
  fields?: string;
  format?: string;
  json?: boolean;
  timezone?: string;
}

export const meResource = new Command("me").description(
  "Current authenticated user",
);

meResource
  .command("get")
  .description("Get the current authenticated user")
  .option("--timezone <tz>", "IANA timezone (also updates stored timezone)")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  tally-cli me get\n  tally-cli me get --json\n  tally-cli me get --timezone Europe/Paris",
  )
  .action(async (opts: MeOpts) => {
    try {
      const params: Record<string, string> = {};
      if (opts.timezone) params.timezone = opts.timezone;
      const data = await client.get(
        "/users/me",
        Object.keys(params).length ? params : undefined,
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
