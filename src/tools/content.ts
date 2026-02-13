import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'list_assets',
    description: 'Get all assets (PDFs, images, documents)',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
        publishedOnly: { type: 'boolean', description: 'Only published assets' },
      },
    },
  },
  {
    name: 'get_asset',
    description: 'Get asset details by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Asset ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_asset',
    description: 'Create new asset (local or remote)',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Asset title' },
        description: { type: 'string', description: 'Asset description' },
        storageLocation: { type: 'string', enum: ['local', 'remote'], description: 'Storage location' },
        file: { type: 'string', description: 'File path (local) or URL (remote)' },
        category: { type: 'number', description: 'Category ID' },
        isPublished: { type: 'boolean', description: 'Publish immediately' },
      },
      required: ['title', 'storageLocation', 'file'],
    },
  },
  {
    name: 'list_pages',
    description: 'Get all landing pages',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
        publishedOnly: { type: 'boolean', description: 'Only published pages' },
      },
    },
  },
  {
    name: 'create_page',
    description: 'Create new landing page',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Page title' },
        alias: { type: 'string', description: 'Page alias' },
        customHtml: { type: 'string', description: 'Custom HTML content' },
        template: { type: 'string', description: 'Template name' },
        isPublished: { type: 'boolean', description: 'Publish immediately' },
        publishUp: { type: 'string', description: 'Publish start date' },
        publishDown: { type: 'string', description: 'Publish end date' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_sms',
    description: '[DEPRECATED in Mautic 7] Get all SMS templates - SMS API classes have been removed',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
      },
    },
  },
  {
    name: 'create_sms',
    description: '[DEPRECATED in Mautic 7] Create SMS template - SMS API classes have been removed',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'SMS name' },
        message: { type: 'string', description: 'SMS message content' },
        isPublished: { type: 'boolean', description: 'Publish immediately' },
      },
      required: ['name', 'message'],
    },
  },
];

export const toolHandlers: Record<string, ToolHandler> = {
  async list_assets(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await client.v1.get('/assets', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total || 0} assets:\n${JSON.stringify(response.data.assets || response.data, null, 2)}` }],
    };
  },

  async get_asset(client: MauticApiClient, args: any) {
    const { id } = args;
    const response = await client.v1.get(`/assets/${id}`);
    return {
      content: [{ type: 'text', text: `Asset details:\n${JSON.stringify(response.data.asset, null, 2)}` }],
    };
  },

  async create_asset(client: MauticApiClient, args: any) {
    const payload: any = {
      title: args.title,
      description: args.description || '',
      storageLocation: args.storageLocation,
      isPublished: args.isPublished !== undefined ? args.isPublished : true,
    };

    if (args.storageLocation === 'local') {
      payload.tempName = args.file;
    } else {
      payload.remotePath = args.file;
    }
    if (args.category) payload.category = args.category;

    const response = await client.v1.post('/assets/new', payload);
    return {
      content: [{ type: 'text', text: `Asset created successfully:\n${JSON.stringify(response.data.asset, null, 2)}` }],
    };
  },

  async list_pages(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await client.v1.get('/pages', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total || 0} pages:\n${JSON.stringify(response.data.pages || response.data, null, 2)}` }],
    };
  },

  async create_page(client: MauticApiClient, args: any) {
    const payload: any = {
      title: args.title,
      isPublished: args.isPublished !== undefined ? args.isPublished : true,
    };
    if (args.alias) payload.alias = args.alias;
    if (args.customHtml) payload.customHtml = args.customHtml;
    if (args.template) payload.template = args.template;
    if (args.publishUp) payload.publishUp = args.publishUp;
    if (args.publishDown) payload.publishDown = args.publishDown;

    const response = await client.v1.post('/pages/new', payload);
    return {
      content: [{ type: 'text', text: `Landing page created successfully:\n${JSON.stringify(response.data.page, null, 2)}` }],
    };
  },

  async list_sms(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await client.v1.get('/smses', { params });
    return {
      content: [{ type: 'text', text: `[WARNING] SMS API is deprecated in Mautic 7. This endpoint may not work.\nFound ${response.data.total || 0} SMS templates:\n${JSON.stringify(response.data.smses || response.data, null, 2)}` }],
    };
  },

  async create_sms(client: MauticApiClient, args: any) {
    const payload: any = {
      name: args.name,
      message: args.message,
      isPublished: args.isPublished !== undefined ? args.isPublished : true,
    };

    const response = await client.v1.post('/smses/new', payload);
    return {
      content: [{ type: 'text', text: `[WARNING] SMS API is deprecated in Mautic 7. This endpoint may not work.\nSMS template created successfully:\n${JSON.stringify(response.data.sms, null, 2)}` }],
    };
  },
};
