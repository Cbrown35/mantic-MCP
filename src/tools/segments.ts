import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'list_segments',
    description: 'Get all contact segments',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
        publishedOnly: { type: 'boolean', description: 'Only published segments' },
      },
    },
  },
  {
    name: 'create_segment',
    description: 'Create a new contact segment',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Segment name' },
        alias: { type: 'string', description: 'Segment alias' },
        description: { type: 'string', description: 'Segment description' },
        isPublished: { type: 'boolean', description: 'Publish immediately' },
        isGlobal: { type: 'boolean', description: 'Global segment' },
        filters: { type: 'array', description: 'Segment filters' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_segment_contacts',
    description: 'Get contacts in a specific segment',
    inputSchema: {
      type: 'object',
      properties: {
        segmentId: { type: 'number', description: 'Segment ID' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
      },
      required: ['segmentId'],
    },
  },
];

export const toolHandlers: Record<string, ToolHandler> = {
  async list_segments(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await client.v1.get('/segments', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total} segments:\n${JSON.stringify(response.data.lists, null, 2)}` }],
    };
  },

  async create_segment(client: MauticApiClient, args: any) {
    const response = await client.v1.post('/segments/new', args);
    return {
      content: [{ type: 'text', text: `Segment created successfully:\n${JSON.stringify(response.data.list, null, 2)}` }],
    };
  },

  async get_segment_contacts(client: MauticApiClient, args: any) {
    const { segmentId, limit, start } = args;
    const params: any = {};
    if (limit) params.limit = Math.min(limit, 200);
    if (start) params.start = start;

    const response = await client.v1.get(`/segments/${segmentId}/contacts`, { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total} contacts in segment:\n${JSON.stringify(response.data.contacts, null, 2)}` }],
    };
  },
};
