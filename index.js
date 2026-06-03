const axios = require('axios');

class OpenSignClaudeIntegration {
    constructor(apiKey, baseURL = 'https://app.opensignlabs.com/api/v1.2') {
        if (!apiKey) {
            throw new Error('API Key is required');
        }
        this.client = axios.create({
            baseURL,
            headers: {
                'x-api-token': apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    getTools() {
        return [
            {
                name: 'get_user',
                description: 'Get your account details from OpenSign',
                input_schema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_credits',
                description: 'Get details about the credits available to your OpenSign account',
                input_schema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'create_contact',
                description: 'Create a new contact in OpenSign that can act as a signer for documents',
                input_schema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name of the contact' },
                        email: { type: 'string', description: 'Email address of the contact' },
                        phone: { type: 'string', description: 'Phone number of the contact' },
                        company: { type: 'string', description: 'Company name' },
                        job_title: { type: 'string', description: 'Job title' }
                    },
                    required: ['name', 'email']
                }
            },
            {
                name: 'create_draft_document',
                description: 'Generate a new draft document by providing base64 encoded file and signer details',
                input_schema: {
                    type: 'object',
                    properties: {
                        file: { type: 'string', description: 'Base64 encoded PDF file' },
                        title: { type: 'string', description: 'Title of the document' },
                        note: { type: 'string', description: 'Note for signers' },
                        description: { type: 'string', description: 'Description of the document' },
                        signers: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    email: { type: 'string' },
                                    role: { type: 'string', description: 'Role of the signer e.g., CEO, Accountant' },
                                    signer_role: {
                                        type: 'string',
                                        enum: ['signer', 'viewer', 'approver'],
                                        description: 'Role in signing process (default: signer)'
                                    },
                                    widgets: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                type: { type: 'string', enum: ['signature', 'stamp', 'initials', 'email', 'name', 'job title', 'company', 'date', 'textbox', 'checkbox', 'dropdown', 'radio button', 'image', 'number', 'cells'] },
                                                page: { type: 'number' },
                                                x: { type: 'number' },
                                                y: { type: 'number' },
                                                w: { type: 'number' },
                                                h: { type: 'number' }
                                            },
                                            required: ['type', 'page', 'x', 'y', 'w', 'h']
                                        }
                                    }
                                },
                                required: ['name', 'email', 'widgets']
                            }
                        }
                    },
                    required: ['file', 'title', 'signers']
                }
            },
            {
                name: 'create_document',
                description: 'Generate a new document and send it for signing by providing base64 encoded file',
                input_schema: {
                    type: 'object',
                    properties: {
                        file: { type: 'string', description: 'Base64 encoded PDF file' },
                        title: { type: 'string', description: 'Title of the document' },
                        note: { type: 'string', description: 'Note for signers' },
                        description: { type: 'string', description: 'Description of the document' },
                        signers: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    email: { type: 'string' },
                                    role: { type: 'string' },
                                    widgets: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                type: { type: 'string' },
                                                page: { type: 'number' },
                                                x: { type: 'number' },
                                                y: { type: 'number' },
                                                w: { type: 'number' },
                                                h: { type: 'number' }
                                            },
                                            required: ['type', 'page', 'x', 'y', 'w', 'h']
                                        }
                                    }
                                },
                                required: ['name', 'email', 'widgets']
                            }
                        }
                    },
                    required: ['file', 'title', 'signers']
                }
            },
            {
                name: 'get_document',
                description: 'Retrieve details about a specific document using its ID',
                input_schema: {
                    type: 'object',
                    properties: {
                        document_id: { type: 'string', description: 'ID of the document' }
                    },
                    required: ['document_id']
                }
            },
            {
                name: 'get_document_list',
                description: 'Retrieve a list of documents based on their status type',
                input_schema: {
                    type: 'object',
                    properties: {
                        doctype: {
                            type: 'string',
                            enum: ['draft', 'inprogress', 'completed', 'expired', 'declined'],
                            description: 'The status type of documents to retrieve'
                        },
                        limit: { type: 'number', description: 'Maximum number of items to return' },
                        skip: { type: 'number', description: 'Number of items to skip' }
                    },
                    required: ['doctype']
                }
            }
        ];
    }

    async executeTool(name, args) {
        try {
            switch (name) {
                case 'get_user':
                    return await this.getUser();
                case 'get_credits':
                    return await this.getCredits();
                case 'create_contact':
                    return await this.createContact(args);
                case 'create_draft_document':
                    return await this.createDraftDocument(args);
                case 'create_document':
                    return await this.createDocument(args);
                case 'get_document':
                    return await this.getDocument(args.document_id);
                case 'get_document_list':
                    return await this.getDocumentList(args.doctype, args.limit, args.skip);
                default:
                    throw new Error(`Tool ${name} is not implemented`);
            }
        } catch (error) {
            if (error.response) {
                throw new Error(`OpenSign API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
            }
            throw error;
        }
    }

    async getUser() {
        const response = await this.client.get('/getuser');
        return response.data;
    }

    async getCredits() {
        const response = await this.client.get('/getcredits');
        return response.data;
    }

    async createContact(contactData) {
        const response = await this.client.post('/createcontact', contactData);
        return response.data;
    }

    async createDraftDocument(documentData) {
        const response = await this.client.post('/draftdocument', documentData);
        return response.data;
    }

    async createDocument(documentData) {
        const response = await this.client.post('/createdocument', documentData);
        return response.data;
    }

    async getDocument(documentId) {
        const response = await this.client.get(`/document/${documentId}`);
        return response.data;
    }

    async getDocumentList(doctype, limit = 10, skip = 0) {
        const response = await this.client.get(`/documentlist/${doctype}`, {
            params: { limit, skip }
        });
        return response.data;
    }
}

module.exports = OpenSignClaudeIntegration;