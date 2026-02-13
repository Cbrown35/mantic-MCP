import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'list_webhooks',
    description: 'Get all webhooks',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
      },
    },
  },
  {
    name: 'create_webhook',
    description: 'Create new webhook',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Webhook name' },
        description: { type: 'string', description: 'Webhook description' },
        webhookUrl: { type: 'string', description: 'Webhook URL' },
        secret: { type: 'string', description: 'Webhook secret' },
        eventsOrderbyDir: { type: 'string', enum: ['ASC', 'DESC'], description: 'Event order direction' },
        triggers: { type: 'array', items: { type: 'string' }, description: 'Event types to trigger webhook' },
      },
      required: ['name', 'webhookUrl', 'triggers'],
    },
  },
  {
    name: 'upload_file',
    description: 'Upload file to Mautic',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'File path or base64 encoded content' },
        folder: { type: 'string', description: 'Destination folder' },
      },
      required: ['file'],
    },
  },
  {
    name: 'list_reports',
    description: 'Get all reports',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
      },
    },
  },
  {
    name: 'create_report',
    description: 'Create custom report',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Report name' },
        description: { type: 'string', description: 'Report description' },
        source: { type: 'string', description: 'Data source (contacts, companies, etc.)' },
        columns: { type: 'array', items: { type: 'string' }, description: 'Report columns' },
        filters: { type: 'array', description: 'Report filters' },
        groupBy: { type: 'array', items: { type: 'string' }, description: 'Group by columns' },
      },
      required: ['name', 'source', 'columns'],
    },
  },
];

export const toolHandlers: Record<string, ToolHandler> = {
  async list_webhooks(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await client.v1.get('/hooks', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total || 0} webhooks:\n${JSON.stringify(response.data.hooks || response.data, null, 2)}` }],
    };
  },

  async create_webhook(client: MauticApiClient, args: any) {
    const payload: any = {
      name: args.name,
      webhookUrl: args.webhookUrl,
      triggers: args.triggers,
      eventsOrderbyDir: args.eventsOrderbyDir || 'DESC',
    };
    if (args.description) payload.description = args.description;
    if (args.secret) payload.secret = args.secret;

    const response = await client.v1.post('/hooks/new', payload);
    return {
      content: [{ type: 'text', text: `Webhook created successfully:\n${JSON.stringify(response.data.hook, null, 2)}` }],
    };
  },

  async upload_file(client: MauticApiClient, args: any) {
    const payload: any = {
      file: args.file,
      folder: args.folder || 'assets',
    };

    const response = await client.v1.post('/files/new', payload);
    return {
      content: [{ type: 'text', text: `File uploaded successfully:\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  async list_reports(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await client.v1.get('/reports', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total || 0} reports:\n${JSON.stringify(response.data.reports || response.data, null, 2)}` }],
    };
  },

  async create_report(client: MauticApiClient, args: any) {
    const payload: any = {
      name: args.name,
      source: args.source,
      columns: args.columns,
    };
    if (args.description) payload.description = args.description;
    if (args.filters) payload.filters = args.filters;
    if (args.groupBy) payload.groupBy = args.groupBy;

    const response = await client.v1.post('/reports/new', payload);
    return {
      content: [{ type: 'text', text: `Report created successfully:\n${JSON.stringify(response.data.report, null, 2)}` }],
    };
  },
};
