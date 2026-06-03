# OpenSign Claude Integration

This repository contains the standalone Claude integration for OpenSign API v1.2. It exposes OpenSign e-signature operations as Claude tool definitions and provides execution helpers for calling the OpenSign API.

It also includes Claude Code plugin metadata and a bundled stdio MCP server so Claude can use the OpenSign tools directly after the plugin is installed and configured with an OpenSign API key.

The same MCP tools can be deployed as a remote MCP server on Cloudflare Workers. The Worker endpoint is `/mcp` and reads each user's OpenSign API key from a per-request bearer token.

## Tools

- `get_user`: Get OpenSign account details.
- `get_credits`: Retrieve account credit details.
- `create_contact`: Add a new contact to the address book.
- `create_draft_document`: Generate a draft document with signer widgets.
- `create_document`: Create and send a document for signing.
- `get_document`: Retrieve a document by ID.
- `get_document_list`: List documents by status.

## Claude Code plugin usage

The plugin manifest is in `.claude-plugin/plugin.json`. When the plugin is enabled, Claude Code prompts for:

- OpenSign API key
- OpenSign API base URL, defaulting to `https://app.opensignlabs.com/api/v1.2`

The API key is declared as a sensitive plugin option and is passed only to the bundled MCP subprocess.

The MCP server can be started manually for local validation:

```bash
OPENSIGN_API_KEY=<YOUR_OPENSIGN_API_KEY> npm run start:mcp
```

## Cloudflare Workers remote MCP deployment

The Worker configuration is in `wrangler.toml`. It deploys `worker.mjs` as a stateless remote MCP server at `/mcp`.

The Worker does not store a shared OpenSign API key. MCP clients must send the end user's key on each request:

```text
Authorization: Bearer <USER_OPENSIGN_API_KEY>
```

1. Install dependencies:

```bash
npm ci
```

2. Log in to Cloudflare:

```bash
npx wrangler login
```

3. Optionally override the API base URL if you are not using production:

```bash
npx wrangler secret put OPENSIGN_BASE_URL
```

If omitted, `OPENSIGN_BASE_URL` defaults to `https://app.opensignlabs.com/api/v1.2` from `wrangler.toml`.

4. Validate the Worker bundle:

```bash
npm run check:worker
```

5. Deploy:

```bash
npm run deploy:worker
```

After deployment, the remote MCP URL will be:

```text
https://opensign-claude-mcp.<YOUR_CLOUDFLARE_SUBDOMAIN>.workers.dev/mcp
```

For local Worker testing, create a local `.dev.vars` file that is not committed:

```text
OPENSIGN_BASE_URL=https://app.opensignlabs.com/api/v1.2
```

Then run:

```bash
npm run dev:worker
```

Then call the MCP endpoint with the test user's key as a bearer token.

## SDK usage

```javascript
const OpenSignClaudeIntegration = require('./index');

const openSign = new OpenSignClaudeIntegration('<YOUR_OPENSIGN_API_KEY>');
const tools = openSign.getTools();
```

Pass `tools` to Claude when sending a request through the Anthropic SDK. When Claude returns a `tool_use`, call `executeTool(toolUse.name, toolUse.input)` and return the result to Claude as a `tool_result`.

## Tests

```bash
npm ci
npm test
npm run check:worker
```
