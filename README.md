# OpenSign Claude Integration

This repository contains the standalone Claude integration for OpenSign API v1.2. It exposes OpenSign e-signature operations as Claude tool definitions and provides execution helpers for calling the OpenSign API.

It also includes Claude Code plugin metadata and a bundled stdio MCP server so Claude can use the OpenSign tools directly after the plugin is installed and configured with an OpenSign API key.

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
```
