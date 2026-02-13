import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'list_companies',
    description: 'Get all companies',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
      },
    },
  },
  {
    name: 'create_company',
    description: 'Create new company',
    inputSchema: {
      type: 'object',
      properties: {
        companyname: { type: 'string', description: 'Company name' },
        companyemail: { type: 'string', description: 'Company email' },
        companyphone: { type: 'string', description: 'Company phone' },
        companyaddress1: { type: 'string', description: 'Address line 1' },
        companyaddress2: { type: 'string', description: 'Address line 2' },
        companycity: { type: 'string', description: 'City' },
        companystate: { type: 'string', description: 'State' },
        companyzipcode: { type: 'string', description: 'Zip code' },
        companycountry: { type: 'string', description: 'Country' },
        companywebsite: { type: 'string', description: 'Website URL' },
      },
      required: ['companyname'],
    },
  },
  {
    name: 'add_contact_to_company',
    description: 'Associate contact with company',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'number', description: 'Contact ID' },
        companyId: { type: 'number', description: 'Company ID' },
      },
      required: ['contactId', 'companyId'],
    },
  },
  {
    name: 'create_note',
    description: 'Add note to contact or company',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Note text' },
        type: { type: 'string', enum: ['general', 'email', 'call', 'meeting'], description: 'Note type' },
        contactId: { type: 'number', description: 'Contact ID (if adding to contact)' },
        companyId: { type: 'number', description: 'Company ID (if adding to company)' },
      },
      required: ['text', 'type'],
    },
  },
  {
    name: 'get_contact_notes',
    description: 'Get all notes for a contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'number', description: 'Contact ID' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'list_tags',
    description: 'Get all available tags',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
      },
    },
  },
  {
    name: 'create_tag',
    description: 'Create new tag',
    inputSchema: {
      type: 'object',
      properties: {
        tag: { type: 'string', description: 'Tag name' },
      },
      required: ['tag'],
    },
  },
  {
    name: 'add_contact_tags',
    description: 'Add tags to contact',
    inputSchema: {
      type: 'object',
      properties: {
        contactId: { type: 'number', description: 'Contact ID' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Array of tag names' },
      },
      required: ['contactId', 'tags'],
    },
  },
  {
    name: 'list_categories',
    description: 'Get all categories',
    inputSchema: {
      type: 'object',
      properties: {
        bundle: { type: 'string', description: 'Category type (asset, email, etc.)' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
      },
    },
  },
  {
    name: 'create_category',
    description: 'Create new category',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Category title' },
        alias: { type: 'string', description: 'Category alias' },
        description: { type: 'string', description: 'Category description' },
        bundle: { type: 'string', description: 'Category type' },
        color: { type: 'string', description: 'Hex color code' },
      },
      required: ['title', 'bundle'],
    },
  },
];

export const toolHandlers: Record<string, ToolHandler> = {
  async list_companies(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;

    const response = await client.v1.get('/companies', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total || 0} companies:\n${JSON.stringify(response.data.companies || response.data, null, 2)}` }],
    };
  },

  async create_company(client: MauticApiClient, args: any) {
    const response = await client.v1.post('/companies/new', args);
    return {
      content: [{ type: 'text', text: `Company created successfully:\n${JSON.stringify(response.data.company, null, 2)}` }],
    };
  },

  async add_contact_to_company(client: MauticApiClient, args: any) {
    const { contactId, companyId } = args;
    await client.v1.post(`/companies/${companyId}/contact/${contactId}/add`);
    return {
      content: [{ type: 'text', text: `Contact ${contactId} added to company ${companyId} successfully` }],
    };
  },

  async create_note(client: MauticApiClient, args: any) {
    const payload: any = { text: args.text, type: args.type || 'general' };
    if (args.contactId) payload.contact = args.contactId;
    if (args.companyId) payload.company = args.companyId;

    const response = await client.v1.post('/notes/new', payload);
    return {
      content: [{ type: 'text', text: `Note created successfully:\n${JSON.stringify(response.data.note, null, 2)}` }],
    };
  },

  async get_contact_notes(client: MauticApiClient, args: any) {
    const { contactId, limit } = args;
    const params: any = {};
    if (limit) params.limit = Math.min(limit, 200);

    const response = await client.v1.get(`/contacts/${contactId}/notes`, { params });
    return {
      content: [{ type: 'text', text: `Contact ${contactId} notes:\n${JSON.stringify(response.data.notes || response.data, null, 2)}` }],
    };
  },

  async list_tags(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await client.v1.get('/tags', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total || 0} tags:\n${JSON.stringify(response.data.tags || response.data, null, 2)}` }],
    };
  },

  async create_tag(client: MauticApiClient, args: any) {
    const response = await client.v1.post('/tags/new', { tag: args.tag });
    return {
      content: [{ type: 'text', text: `Tag created successfully:\n${JSON.stringify(response.data.tag, null, 2)}` }],
    };
  },

  async add_contact_tags(client: MauticApiClient, args: any) {
    const { contactId, tags } = args;
    const response = await client.v1.post(`/contacts/${contactId}/contact/add`, { tags });
    return {
      content: [{ type: 'text', text: `Tags added to contact ${contactId} successfully:\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  async list_categories(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.bundle) params.bundle = args.bundle;
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await client.v1.get('/categories', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total || 0} categories:\n${JSON.stringify(response.data.categories || response.data, null, 2)}` }],
    };
  },

  async create_category(client: MauticApiClient, args: any) {
    const response = await client.v1.post('/categories/new', args);
    return {
      content: [{ type: 'text', text: `Category created successfully:\n${JSON.stringify(response.data.category, null, 2)}` }],
    };
  },
};
