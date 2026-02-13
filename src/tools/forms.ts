import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'list_forms',
    description: 'Get all forms with submission counts',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
        publishedOnly: { type: 'boolean', description: 'Only published forms' },
      },
    },
  },
  {
    name: 'get_form',
    description: 'Get form details and fields',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Form ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_form_submissions',
    description: 'Get form submission data',
    inputSchema: {
      type: 'object',
      properties: {
        formId: { type: 'number', description: 'Form ID' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
        dateFrom: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        dateTo: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
      required: ['formId'],
    },
  },
];

export const toolHandlers: Record<string, ToolHandler> = {
  async list_forms(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await client.v1.get('/forms', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total} forms:\n${JSON.stringify(response.data.forms, null, 2)}` }],
    };
  },

  async get_form(client: MauticApiClient, args: any) {
    const { id } = args;
    const response = await client.v1.get(`/forms/${id}`);
    return {
      content: [{ type: 'text', text: `Form details:\n${JSON.stringify(response.data.form, null, 2)}` }],
    };
  },

  async get_form_submissions(client: MauticApiClient, args: any) {
    const { formId, limit, start, dateFrom, dateTo } = args;
    const params: any = {};
    if (limit) params.limit = Math.min(limit, 200);
    if (start) params.start = start;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const response = await client.v1.get(`/forms/${formId}/submissions`, { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total} form submissions:\n${JSON.stringify(response.data.submissions, null, 2)}` }],
    };
  },
};
