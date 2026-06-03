import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
import { z } from "zod";
import OpenSignClaudeIntegration from "./index.js";
import workerAuth from "./worker-auth.js";

const DEFAULT_BASE_URL = "https://app.opensignlabs.com/api/v1.2";
const { getBearerToken } = workerAuth;
const WIDGET_TYPES = [
  "signature",
  "stamp",
  "initials",
  "email",
  "name",
  "job title",
  "company",
  "date",
  "textbox",
  "checkbox",
  "dropdown",
  "radio button",
  "image",
  "number",
  "cells",
];

function createIntegration(env = {}, apiKey = "") {
  if (!apiKey) {
    throw new Error(
      "OpenSign API key is required. Send it as an Authorization: Bearer <OPENSIGN_API_KEY> header."
    );
  }

  return new OpenSignClaudeIntegration(apiKey, env.OPENSIGN_BASE_URL || DEFAULT_BASE_URL);
}

function toolResult(result) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

function registerOpenSignTool(server, env, apiKey, name, description, inputSchema = {}) {
  server.registerTool(name, { description, inputSchema }, async (args) => {
    const integration = createIntegration(env, apiKey);
    return toolResult(await integration.executeTool(name, args || {}));
  });
}

const widgetSchema = z.object({
  type: z.enum(WIDGET_TYPES),
  page: z.number(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

const signerSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  role: z.string().optional(),
  signer_role: z.enum(["signer", "viewer", "approver"]).optional(),
  widgets: z.array(widgetSchema),
});

const documentSchema = {
  file: z.string(),
  title: z.string(),
  note: z.string().optional(),
  description: z.string().optional(),
  signers: z.array(signerSchema),
};

export function createOpenSignMcpServer(env = {}, apiKey = "") {
  const server = new McpServer({
    name: "opensign",
    version: "1.0.0",
  });

  registerOpenSignTool(
    server,
    env,
    apiKey,
    "get_user",
    "Get your account details from OpenSign"
  );
  registerOpenSignTool(
    server,
    env,
    apiKey,
    "get_credits",
    "Get details about the credits available to your OpenSign account"
  );
  registerOpenSignTool(
    server,
    env,
    apiKey,
    "create_contact",
    "Create a new contact in OpenSign that can act as a signer for documents",
    {
      name: z.string(),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().optional(),
      job_title: z.string().optional(),
    }
  );
  registerOpenSignTool(
    server,
    env,
    apiKey,
    "create_draft_document",
    "Generate a new draft document by providing base64 encoded file and signer details",
    documentSchema
  );
  registerOpenSignTool(
    server,
    env,
    apiKey,
    "create_document",
    "Generate a new document and send it for signing by providing base64 encoded file",
    documentSchema
  );
  registerOpenSignTool(
    server,
    env,
    apiKey,
    "get_document",
    "Retrieve details about a specific document using its ID",
    {
      document_id: z.string(),
    }
  );
  registerOpenSignTool(
    server,
    env,
    apiKey,
    "get_document_list",
    "Retrieve a list of documents based on their status type",
    {
      doctype: z.enum(["draft", "inprogress", "completed", "expired", "declined"]),
      limit: z.number().optional(),
      skip: z.number().optional(),
    }
  );

  return server;
}

export default {
  async fetch(request, env, ctx) {
    const apiKey = getBearerToken(request);
    const handler = createMcpHandler(createOpenSignMcpServer(env, apiKey), {
      route: "/mcp",
    });

    return handler(request, env, ctx);
  },
};

export { getBearerToken };
