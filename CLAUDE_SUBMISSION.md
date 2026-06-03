# Claude Integration for OpenSign API v1.2

This package provides a seamless integration between Claude and OpenSign, allowing Claude to perform e-signature operations like creating draft documents, managing contacts, and sending documents directly via tools!

The repository also ships Claude Code plugin metadata and a bundled stdio MCP server. When installed as a Claude Code plugin, it prompts for an OpenSign API key as a sensitive user configuration value and exposes the OpenSign operations as MCP tools.

## How to use it with Claude

1. **Include the Tool Definitions:**
   You can retrieve the schemas for the tools by instantiating the integration and calling `getTools()`:

   ```javascript
   const OpenSignClaudeIntegration = require('./index');
   const openSign = new OpenSignClaudeIntegration('<YOUR_OPENSIGN_API_KEY>');

   const tools = openSign.getTools();
   // Pass `tools` to Claude when sending a request via @anthropic-ai/sdk
   ```

2. **Execute Claude's Tool Requests:**
   When Claude responds with a `tool_use` instruction, pass the tool name and arguments directly back to the integration to execute it against the OpenSign API:

   ```javascript
   if (claudeResponse.stop_reason === 'tool_use') {
       const toolUse = claudeResponse.content.find(c => c.type === 'tool_use');

       // Execute the OpenSign operation
       const result = await openSign.executeTool(toolUse.name, toolUse.input);

       // Pass `result` back to Claude as a tool_result
   }
   ```

## Supported Tools

- `get_user`: Get your OpenSign account details.
- `get_credits`: Retrieve the details about credits available on your account.
- `create_contact`: Add a new contact to your address book.
- `create_draft_document`: Generate a new draft document by supplying a base64 encoded PDF and signer details.
- `create_document`: Create and instantly send a document for signing.
- `get_document`: Retrieve details for a specific document by its ID.
- `get_document_list`: Retrieve a list of documents by their status (e.g., draft, completed, inprogress).

## Claude Code Plugin Test

Install dependencies and run:

```bash
npm test
```

To smoke-test the MCP server manually:

```bash
printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | OPENSIGN_API_KEY=<YOUR_OPENSIGN_API_KEY> node server.js
```

## Example: Creating a Draft Document via Claude

Claude can automatically formulate a request to create a draft document if provided with context (e.g., "Please upload this base64 PDF as a draft document for john@example.com to sign."). Claude will format the widgets and signers correctly, utilizing the schema provided in `getTools()`.
