const OpenSignClaudeIntegration = require('./index');

describe('OpenSignClaudeIntegration E2E', () => {
    let integration;

    beforeAll(() => {
        const apiKey = process.env.OPENSIGN_API_KEY || 'opensign.7BG7XjfOD1nBrAsFQnoPKy';
        const baseURL = 'https://staging-app.opensignlabs.com/api/v1.2';
        integration = new OpenSignClaudeIntegration(apiKey, baseURL);
    });

    test('should have defined tools', () => {
        const tools = integration.getTools();
        expect(tools).toBeDefined();
        expect(tools.length).toBeGreaterThan(0);
        expect(tools.some(t => t.name === 'get_user')).toBeTruthy();
    });

    test('get_user should return user details', async () => {
        const result = await integration.executeTool('get_user', {});
        expect(result).toBeDefined();
        expect(result.email).toBeDefined();
    });

    test('get_credits should return credit details', async () => {
        const result = await integration.executeTool('get_credits', {});
        expect(result).toBeDefined();
        expect(result.total_credits).toBeDefined();
    });

    let testContactEmail = `test.contact.${Date.now()}@example.com`;
    test('create_contact should create a new contact', async () => {
        try {
            const result = await integration.executeTool('create_contact', {
                name: 'Test Contact',
                email: testContactEmail,
                phone: '1234567890',
                company: 'Test Company',
                job_title: 'Tester'
            });
            expect(result).toBeDefined();
            expect(result.email).toBe(testContactEmail);
        } catch (error) {
            // Handle if contact already exists, though we use timestamp
            if (error.message.includes('Contact already exists')) {
                console.log('Contact already exists, skipping creation assertion.');
            } else {
                throw error;
            }
        }
    });

    // Create a dummy base64 PDF (a very minimal valid PDF)
    const dummyBase64Pdf = 'JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwvTGVuZ3RoIDMgMCBSL0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp4nDPQM1Qo5ypUMFAwALJMLY31jBQsTAz1LBSKikB8Q7jQKAhfK7EoM0UvOT9XwVFfITNPoaQ0V6G4tCg/TyE3P08hmggA+6IQPgplbmRzdHJlYW0KZW5kb2JqCgozIDAgb2JqCjUyCmVuZG9iagoKMSAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1Jlc291cmNlczw8L0ZvbnQ8PC9GMCA0IDAgUj4+Pj4vQ29udGVudHMgMiAwIFIvUGFyZW50IDUgMCBSPj4KZW5kb2JqCgo0IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L1RpbWVzLVJvbWFuPj4KZW5kb2JqCgo1IDAgb2JqCjw8L1R5cGUvUGFnZXMvQ291bnQgMS9LaWRzWzEgMCBSXT4+CmVuZG9iagoKNiAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgNSAwIFI+PgplbmRvYmoKCjcgMCBvYmoKPDwvUHJvZHVjZXIoR2hvc3RzY3JpcHQgOS41NS4wKS9DcmVhdGlvbkRhdGUoRDoyMDI0MDYwMjIwMjg0MCswMCcwMCcpL01vZERhdGUoRDoyMDI0MDYwMjIwMjg0MCswMCcwMCcpPj4KZW5kb2JqCgp4cmVmCjAgOAowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAxMjUgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMTA2IDAwMDAwIG4gCjAwMDAwMDAyMjMgMDAwMDAgbiAKMDAwMDAwMDMxMSAwMDAwMCBuIAowMDAwMDAwMzY4IDAwMDAwIG4gCjAwMDAwMDA0MTggMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDgvUm9vdCA2IDAgUi9JbmZvIDcgMCBSL0lEIFs8QTM0MjdCRThEOEM5M0E0MjlEMzUxOEMxMkEyMkIzM0Q+PEEzNDI3QkU4RDhDOTNBNDI5RDM1MThDMTJBMjJCMzNEPl0+PgpzdGFydHhyZWYKNTA4CiUlRU9GCg==';

    let draftDocumentId;
    test('create_draft_document should return a draft document url and id', async () => {
        const result = await integration.executeTool('create_draft_document', {
            file: dummyBase64Pdf,
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
        });
        expect(result).toBeDefined();
        expect(result.url).toBeDefined();
        expect(result.document_id || result.objectId).toBeDefined();
        draftDocumentId = result.document_id || result.objectId;
    });

    test('get_document should return document details', async () => {
        if (!draftDocumentId) {
            console.warn('Skipping get_document test as draftDocumentId is not set');
            return;
        }
        const result = await integration.executeTool('get_document', {
            document_id: draftDocumentId
        });
        expect(result).toBeDefined();
        expect(result.objectId).toBe(draftDocumentId);
        expect(result.title).toBe('Test Draft Document');
    });

    test('get_document_list should return a list of draft documents', async () => {
        const result = await integration.executeTool('get_document_list', {
            doctype: 'draft',
            limit: 5,
            skip: 0
        });
        expect(result).toBeDefined();
        // Since the return schema is { result: [...] }
        expect(Array.isArray(result.result)).toBe(true);
    });
});