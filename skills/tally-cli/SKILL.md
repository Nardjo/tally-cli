---
name: tally-cli
description: "Manage Tally forms via CLI - me, forms, submissions, workspaces, folders, webhooks, organizations. Use when user mentions 'tally', 'tally.so', 'form submissions', 'tally form', 'tally webhook', 'form analytics', or wants to interact with the Tally API."
category: other
---

# tally-cli

Agent-ready CLI for the [Tally](https://tally.so) REST API (`https://api.tally.so`).

## When To Use This Skill

Use the `tally-cli` skill when you need to:

- list, create, update, publish, or delete Tally forms
- pull form submissions (completed or partial) and inspect answers
- read form analytics (metrics, visits, drop-off, dimensions)
- manage workspaces, Pro folders, webhooks, and org invites
- automate Tally workflows with stable `--json` output

## Capabilities

- **Auth**: store, show, remove, and test a Bearer API key
- **Forms**: full CRUD, questions list, and analytics endpoints
- **Submissions**: list/filter/get/delete responses for a form
- **Workspaces & folders**: organize forms (folders require Pro)
- **Webhooks**: create/update/delete, list delivery events, retry failures
- **Organizations**: list users, invite teammates, cancel invites
- **Automation**: `--json` envelope, multi-format output, deep `--help`

## Common Use Cases

- "List my Tally forms and show submission counts."
- "Fetch completed submissions for form X since last week."
- "Create a draft form titled Contact, then publish it."
- "Show 7-day metrics and drop-off for this form."
- "Create a FORM_RESPONSE webhook pointing at this URL."
- "Who is in my Tally organization, and pending invites?"

## Setup

If `tally-cli` is not found:

```bash
bun --version || curl -fsSL https://bun.sh/install | bash
npx api2cli bundle tally
npx api2cli link tally
```

API key: [Tally settings → API keys](https://tally.so/settings/api-keys) (see also [docs](https://developers.tally.so/api-reference/api-keys)).

Always use `--json` when calling commands programmatically.

## Working Rules

- Always use `--json` for agent-driven calls so downstream steps can parse the result.
- Start with `--help` if the exact action or flags are unclear instead of guessing.
- Prefer read commands first when you need to inspect current state before mutating data.
- Rate limit: 100 requests/minute. Prefer webhooks over polling submissions.
- Analytics `--period` values: `today`, `yesterday`, `24h`, `7d`, `30d`, `3m`, `6m`, `12m`, `all`.
- Complex form blocks: pass a JSON file via `--blocks-file` (see [Tally block docs](https://developers.tally.so/documentation/creating-a-form)).

## Authentication

```bash
tally-cli auth set "your-token"
tally-cli auth test
```

Auth commands: `auth set <token>`, `auth show`, `auth remove`, `auth test`

Token is stored in `~/.config/tokens/tally-cli.txt` (chmod 600).

## Resources

### me

| Command | Description |
|---------|-------------|
| `tally-cli me get --json` | Current authenticated user |
| `tally-cli me get --timezone Europe/Paris --json` | Get user and update stored timezone |

### forms

| Command | Description |
|---------|-------------|
| `tally-cli forms list --json` | List forms (paginated) |
| `tally-cli forms list --limit 10 --json` | List with page size |
| `tally-cli forms list --workspace-ids <id> --json` | Filter by workspace |
| `tally-cli forms get <form-id> --json` | Get form with blocks and settings |
| `tally-cli forms create --title "Contact form" --status PUBLISHED --json` | Minimal form (FORM_TITLE only) |
| `tally-cli forms create --blocks-file ./blocks.json --status DRAFT --json` | Create from full blocks JSON |
| `tally-cli forms create --title "NPS" --workspace-id <id> --json` | Create in a workspace |
| `tally-cli forms update <form-id> --name "New name" --json` | Rename a form |
| `tally-cli forms update <form-id> --status PUBLISHED --json` | Publish a form |
| `tally-cli forms update <form-id> --blocks-file ./blocks.json --json` | Replace blocks |
| `tally-cli forms delete <form-id> --json` | Delete form (trash) |
| `tally-cli forms questions <form-id> --json` | List form questions |
| `tally-cli forms metrics <form-id> --period 7d --json` | Aggregate metrics |
| `tally-cli forms visits <form-id> --period 7d --json` | Visits over time |
| `tally-cli forms submission-stats <form-id> --period 30d --json` | Submission counts over time |
| `tally-cli forms drop-off <form-id> --period 7d --json` | Per-question drop-off |
| `tally-cli forms dimensions <form-id> --period 30d --json` | Source/browser/OS/device/location |

### submissions

| Command | Description |
|---------|-------------|
| `tally-cli submissions list <form-id> --json` | List submissions (full payload with questions) |
| `tally-cli submissions list <form-id> --filter completed --limit 20 --json` | Completed only |
| `tally-cli submissions list <form-id> --filter partial --json` | Partial only |
| `tally-cli submissions list <form-id> --start-date 2026-01-01T00:00:00Z --json` | After date |
| `tally-cli submissions list <form-id> --end-date 2026-01-31T23:59:59Z --json` | Before date |
| `tally-cli submissions list <form-id> --after-id <submission-id> --json` | Cursor after ID |
| `tally-cli submissions get <form-id> <submission-id> --json` | One submission + responses |
| `tally-cli submissions delete <form-id> <submission-id> --json` | Delete a submission |

### workspaces

| Command | Description |
|---------|-------------|
| `tally-cli workspaces list --json` | List workspaces |
| `tally-cli workspaces get <workspace-id> --json` | Workspace with members |
| `tally-cli workspaces create --name "Marketing" --json` | Create workspace (Pro) |
| `tally-cli workspaces update <workspace-id> --name "Growth" --json` | Rename workspace |
| `tally-cli workspaces delete <workspace-id> --json` | Delete workspace + forms (trash) |

### folders

| Command | Description |
|---------|-------------|
| `tally-cli folders list <workspace-id> --json` | List folders (Pro) |
| `tally-cli folders create <workspace-id> --name "Leads" --json` | Create folder (Pro) |
| `tally-cli folders create <workspace-id> --name "Q1" --parent-id <id> --json` | Nested folder |
| `tally-cli folders update <workspace-id> <folder-id> --name "Inbound" --json` | Rename folder |
| `tally-cli folders delete <workspace-id> <folder-id> --json` | Delete folder subtree |

### webhooks

| Command | Description |
|---------|-------------|
| `tally-cli webhooks list --json` | List webhooks |
| `tally-cli webhooks create --form-id <id> --url https://example.com/hook --json` | Create FORM_RESPONSE webhook |
| `tally-cli webhooks create --form-id <id> --url https://example.com/hook --signing-secret s3cr3t --json` | With signing secret |
| `tally-cli webhooks update <webhook-id> --enabled false --json` | Disable webhook |
| `tally-cli webhooks update <webhook-id> --url https://new.example.com/hook --json` | Change URL |
| `tally-cli webhooks delete <webhook-id> --json` | Delete webhook |
| `tally-cli webhooks events <webhook-id> --json` | Delivery events |
| `tally-cli webhooks retry-event <webhook-id> <event-id> --json` | Retry failed delivery |

### organizations

| Command | Description |
|---------|-------------|
| `tally-cli organizations users <organization-id> --json` | List org users |
| `tally-cli organizations remove-user <organization-id> <user-id> --json` | Remove user (or self) |
| `tally-cli organizations invites <organization-id> --json` | List pending invites |
| `tally-cli organizations invite <organization-id> --email teammate@example.com --workspace-ids <id> --json` | Invite to workspaces |
| `tally-cli organizations cancel-invite <organization-id> <invite-id> --json` | Cancel invite |

Organization ID is available from `tally-cli me get --json` (`organizationId`).

## Output Format

`--json` returns a standardized envelope:

```json
{ "ok": true, "data": { ... }, "meta": { "total": 42 } }
```

On error: `{ "ok": false, "error": { "message": "...", "status": 401 } }`

## Quick Reference

```bash
tally-cli --help                     # List all resources and global flags
tally-cli <resource> --help          # List all actions for a resource
tally-cli <resource> <action> --help # Show flags for a specific action
```

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 = success, 1 = API error, 2 = usage error

## Docs

- API intro: https://developers.tally.so/api-reference/introduction
- OpenAPI: https://developers.tally.so/api-reference/openapi.json
