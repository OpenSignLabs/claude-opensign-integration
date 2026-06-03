jest.mock('axios');

const axios = require('axios');
const OpenSignClaudeIntegration = require('./index');

describe('OpenSignClaudeIntegration', () => {
    let integration;
    let mockClient;

    beforeEach(() => {
        mockClient = {
            get: jest.fn(),
            post: jest.fn()
        };
        axios.create.mockReturnValue(mockClient);
        integration = new OpenSignClaudeIntegration('test-api-key', 'https://api.example.test');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('requires an API key', () => {
        expect(() => new OpenSignClaudeIntegration()).toThrow('API Key is required');
    });

    test('configures axios with OpenSign API headers', () => {
        expect(axios.create).toHaveBeenCalledWith({
            baseURL: 'https://api.example.test',
            headers: {
                'x-api-token': 'test-api-key',
                'Content-Type': 'application/json'
            }
        });
    });

    test('should have defined tools', () => {
        const tools = integration.getTools();
        expect(tools).toBeDefined();
        expect(tools.length).toBeGreaterThan(0);
        expect(tools.some(t => t.name === 'get_user')).toBeTruthy();
    });

    test('get_user should return user details', async () => {
        mockClient.get.mockResolvedValue({ data: { email: 'user@example.com' } });

        const result = await integration.executeTool('get_user', {});

        expect(mockClient.get).toHaveBeenCalledWith('/getuser');
        expect(result).toBeDefined();
        expect(result.email).toBe('user@example.com');
    });

    test('get_credits should return credit details', async () => {
        mockClient.get.mockResolvedValue({ data: { total_credits: 42 } });

        const result = await integration.executeTool('get_credits', {});

        expect(mockClient.get).toHaveBeenCalledWith('/getcredits');
        expect(result).toBeDefined();
        expect(result.total_credits).toBe(42);
    });

    test('create_contact should create a new contact', async () => {
        const contact = {
            name: 'Test Contact',
            email: 'test.contact@example.com',
            phone: '1234567890',
            company: 'Test Company',
            job_title: 'Tester'
        };
        mockClient.post.mockResolvedValue({ data: contact });

        const result = await integration.executeTool('create_contact', contact);

        expect(mockClient.post).toHaveBeenCalledWith('/createcontact', contact);
        expect(result).toEqual(contact);
    });

    test('create_draft_document should return a draft document url and id', async () => {
        const documentData = {
            file: 'base64-pdf',
            title: 'Test Draft Document',
            signers: [
                {
                    name: 'Test Signer',
                    email: 'testsigner@example.com',
                    widgets: [
                        {
                            type: 'signature',
                            page: 1,
                            x: 100,
                            y: 100,
                            w: 100,
                            h: 50
                        }
                    ]
                }
            ]
        };
        mockClient.post.mockResolvedValue({ data: { url: 'https://example.test/draft', document_id: 'doc-123' } });

        const result = await integration.executeTool('create_draft_document', documentData);

        expect(mockClient.post).toHaveBeenCalledWith('/draftdocument', documentData);
        expect(result).toEqual({ url: 'https://example.test/draft', document_id: 'doc-123' });
    });

    test('create_document should send a document for signing', async () => {
        const documentData = {
            file: 'base64-pdf',
            title: 'Test Document',
            signers: [
                {
                    name: 'Test Signer',
                    email: 'testsigner@example.com',
                    widgets: [{ type: 'signature', page: 1, x: 100, y: 100, w: 100, h: 50 }]
                }
            ]
        };
        mockClient.post.mockResolvedValue({ data: { objectId: 'doc-456' } });

        const result = await integration.executeTool('create_document', documentData);

        expect(mockClient.post).toHaveBeenCalledWith('/createdocument', documentData);
        expect(result).toEqual({ objectId: 'doc-456' });
    });

    test('get_document should return document details', async () => {
        mockClient.get.mockResolvedValue({ data: { objectId: 'doc-123', title: 'Test Draft Document' } });

        const result = await integration.executeTool('get_document', {
            document_id: 'doc-123'
        });

        expect(mockClient.get).toHaveBeenCalledWith('/document/doc-123');
        expect(result.objectId).toBe('doc-123');
        expect(result.title).toBe('Test Draft Document');
    });

    test('get_document_list should return a list of draft documents', async () => {
        mockClient.get.mockResolvedValue({ data: { result: [{ objectId: 'doc-123' }] } });

        const result = await integration.executeTool('get_document_list', {
            doctype: 'draft',
            limit: 5,
            skip: 0
        });

        expect(mockClient.get).toHaveBeenCalledWith('/documentlist/draft', {
            params: { limit: 5, skip: 0 }
        });
        expect(Array.isArray(result.result)).toBe(true);
    });

    test('formats OpenSign API errors', async () => {
        mockClient.get.mockRejectedValue({
            response: {
                status: 401,
                data: { error: 'Unauthorized' }
            }
        });

        await expect(integration.executeTool('get_user', {}))
            .rejects
            .toThrow('OpenSign API Error: 401 - {"error":"Unauthorized"}');
    });

    test('rejects unknown tools', async () => {
        await expect(integration.executeTool('unknown_tool', {}))
            .rejects
            .toThrow('Tool unknown_tool is not implemented');
    });
});
