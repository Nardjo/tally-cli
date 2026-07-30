# tally-cli

CLI for the [Tally](https://tally.so) forms API. Made with [api2cli.dev](https://api2cli.dev).

Base URL: `https://api.tally.so` · Auth: Bearer API key

## Install

```bash
# From source (local)
npx api2cli bundle tally
npx api2cli link tally

# Or after publishing to the registry
npx api2cli install Nardjo/tally-cli
```

## AgentSkill

```bash
# Linked automatically by api2cli link
# Or install skill only:
npx skills add Nardjo/tally-cli
```

## Auth

Get an API key from [Tally settings](https://tally.so/settings/api-keys).

```bash
tally-cli auth set "your-token"
tally-cli auth test
tally-cli me get --json
```

Token path: `~/.config/tokens/tally-cli.txt`

## Usage

```bash
tally-cli --help
tally-cli forms list --json
tally-cli submissions list <form-id> --filter completed --json
tally-cli forms metrics <form-id> --period 7d --json
```

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
| `tally-cli forms update <form-id> --name "New name" --json` | Rename a form |
| `tally-cli forms update <form-id> --status PUBLISHED --json` | Publish a form |
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
| `tally-cli submissions list <form-id> --json` | List submissions |
| `tally-cli submissions list <form-id> --filter completed --limit 20 --json` | Completed only |
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
| `tally-cli folders update <workspace-id> <folder-id> --name "Inbound" --json` | Rename folder |
| `tally-cli folders delete <workspace-id> <folder-id> --json` | Delete folder subtree |

### webhooks

| Command | Description |
|---------|-------------|
| `tally-cli webhooks list --json` | List webhooks |
| `tally-cli webhooks create --form-id <id> --url https://example.com/hook --json` | Create webhook |
| `tally-cli webhooks update <webhook-id> --enabled false --json` | Disable webhook |
| `tally-cli webhooks delete <webhook-id> --json` | Delete webhook |
| `tally-cli webhooks events <webhook-id> --json` | Delivery events |
| `tally-cli webhooks retry-event <webhook-id> <event-id> --json` | Retry failed delivery |

### organizations

| Command | Description |
|---------|-------------|
| `tally-cli organizations users <organization-id> --json` | List org users |
| `tally-cli organizations remove-user <organization-id> <user-id> --json` | Remove user |
| `tally-cli organizations invites <organization-id> --json` | List pending invites |
| `tally-cli organizations invite <organization-id> --email a@b.com --workspace-ids <id> --json` | Invite |
| `tally-cli organizations cancel-invite <organization-id> <invite-id> --json` | Cancel invite |

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

`--json` envelope:

```json
{ "ok": true, "data": { ... }, "meta": { "total": 42 } }
```

Exit codes: 0 = success, 1 = API error, 2 = usage error

## Docs

- https://developers.tally.so
- OpenAPI: https://developers.tally.so/api-reference/openapi.json
