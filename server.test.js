const { handleJsonRpcMessage, toMcpTool } = require('./server');

describe('OpenSign MCP server', () => {
    const integration = {
        getTools: jest.fn(() => [
            {
                name: 'get_user',
                description: 'Get your account details from OpenSign',
                input_schema: { type: 'object', properties: {} }
            }
        ]),
        executeTool: jest.fn()
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('converts Claude tool schema to MCP tool schema', () => {
        expect(toMcpTool(integration.getTools()[0])).toEqual({
            name: 'get_user',
            description: 'Get your account details from OpenSign',
            inputSchema: { type: 'object', properties: {} }
        });
    });

    test('responds to initialize', async () => {
        const response = await handleJsonRpcMessage({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: { protocolVersion: '2024-11-05' }
        }, integration);

        expect(response.result.serverInfo.name).toBe('opensign');
        expect(response.result.capabilities.tools).toEqual({});
    });

    test('lists OpenSign tools', async () => {
        const response = await handleJsonRpcMessage({
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list'
        }, integration);

        expect(response.result.tools).toHaveLength(1);
        expect(response.result.tools[0].name).toBe('get_user');
    });

    test('calls OpenSign tools', async () => {
        integration.executeTool.mockResolvedValue({ email: 'user@example.com' });

        const response = await handleJsonRpcMessage({
            jsonrpc: '2.0',
            id: 3,
            method: 'tools/call',
            params: {
                name: 'get_user',
                arguments: {}
            }
        }, integration);

        expect(integration.executeTool).toHaveBeenCalledWith('get_user', {});
        expect(response.result.content[0].type).toBe('text');
        expect(JSON.parse(response.result.content[0].text)).toEqual({ email: 'user@example.com' });
    });

    test('returns MCP errors for failed tool calls', async () => {
        integration.executeTool.mockRejectedValue(new Error('OpenSign API Error'));

        const response = await handleJsonRpcMessage({
            jsonrpc: '2.0',
            id: 4,
            method: 'tools/call',
            params: {
                name: 'get_user',
                arguments: {}
            }
        }, integration);

        expect(response.error.code).toBe(-32000);
        expect(response.error.message).toBe('OpenSign API Error');
    });
});
