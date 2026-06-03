#!/usr/bin/env node

const readline = require('readline');
const OpenSignClaudeIntegration = require('./index');

const PROTOCOL_VERSION = '2024-11-05';

function toMcpTool(tool) {
    return {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.input_schema || { type: 'object', properties: {} }
    };
}

function createIntegrationFromEnv() {
    const apiKey = process.env.OPENSIGN_API_KEY || process.env.CLAUDE_PLUGIN_OPTION_API_KEY;
    const baseURL = process.env.OPENSIGN_BASE_URL || process.env.CLAUDE_PLUGIN_OPTION_BASE_URL;
    return new OpenSignClaudeIntegration(apiKey, baseURL);
}

async function handleJsonRpcMessage(message, integration) {
    if (!message || typeof message !== 'object') {
        return null;
    }

    if (message.method === 'notifications/initialized') {
        return null;
    }

    try {
        switch (message.method) {
            case 'initialize':
                return {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        protocolVersion: message.params?.protocolVersion || PROTOCOL_VERSION,
                        capabilities: {
                            tools: {}
                        },
                        serverInfo: {
                            name: 'opensign',
                            version: '1.0.0'
                        }
                    }
                };

            case 'tools/list':
                return {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        tools: integration.getTools().map(toMcpTool)
                    }
                };

            case 'tools/call': {
                const toolName = message.params?.name;
                const args = message.params?.arguments || {};
                const result = await integration.executeTool(toolName, args);
                return {
                    jsonrpc: '2.0',
                    id: message.id,
                    result: {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(result, null, 2)
                            }
                        ]
                    }
                };
            }

            default:
                return {
                    jsonrpc: '2.0',
                    id: message.id,
                    error: {
                        code: -32601,
                        message: `Method ${message.method} is not implemented`
                    }
                };
        }
    } catch (error) {
        return {
            jsonrpc: '2.0',
            id: message.id,
            error: {
                code: -32000,
                message: error.message
            }
        };
    }
}

function startServer(integration = createIntegrationFromEnv(), input = process.stdin, output = process.stdout) {
    const rl = readline.createInterface({ input });

    rl.on('line', async (line) => {
        if (!line.trim()) {
            return;
        }

        let message;
        try {
            message = JSON.parse(line);
        } catch (error) {
            output.write(`${JSON.stringify({
                jsonrpc: '2.0',
                id: null,
                error: {
                    code: -32700,
                    message: 'Parse error'
                }
            })}\n`);
            return;
        }

        const response = await handleJsonRpcMessage(message, integration);
        if (response) {
            output.write(`${JSON.stringify(response)}\n`);
        }
    });
}

if (require.main === module) {
    startServer();
}

module.exports = {
    handleJsonRpcMessage,
    startServer,
    toMcpTool
};
