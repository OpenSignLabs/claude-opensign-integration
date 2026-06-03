# OpenSign Claude Integration

This repository contains the standalone Claude integration for OpenSign API v1.2. It exposes OpenSign e-signature operations as Claude tool definitions and provides execution helpers for calling the OpenSign API.

## Tools

- `get_user`: Get OpenSign account details.
- `get_credits`: Retrieve account credit details.
- `create_contact`: Add a new contact to the address book.
- `create_draft_document`: Generate a draft document with signer widgets.
- `create_document`: Create and send a document for signing.
- `get_document`: Retrieve a document by ID.
- `get_document_list`: List documents by status.

## Usage

```javascript
const OpenSignClaudeIntegration = require('./index');

const openSign = new OpenSignClaudeIntegration('<YOUR_OPENSIGN_API_KEY>');
const tools = openSign.getTools();
```

Pass `tools` to Claude when sending a request through the Anthropic SDK. When Claude returns a `tool_use`, call `executeTool(toolUse.name, toolUse.input)` and return the result to Claude as a `tool_result`.
