import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export const toolDefinitions: ToolDefinition[] = [
  // Existing campaign tools
  {
    name: 'list_campaigns',
    description: 'Get all campaigns with status and statistics',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
        publishedOnly: { type: 'boolean', description: 'Only published campaigns' },
      },
    },
  },
  {
    name: 'get_campaign',
    description: 'Get detailed campaign information',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Campaign ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_campaign',
    description: 'Create a new campaign',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        description: { type: 'string', description: 'Campaign description' },
        isPublished: { type: 'boolean', description: 'Publish immediately' },
        publishUp: { type: 'string', description: 'Publish start date (YYYY-MM-DD HH:MM:SS)' },
        publishDown: { type: 'string', description: 'Publish end date (YYYY-MM-DD HH:MM:SS)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'add_contact_to_campaign',
    description: 'Add a contact to a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'number', description: 'Campaign ID' },
        contactId: { type: 'number', description: 'Contact ID' },
      },
      required: ['campaignId', 'contactId'],
    },
  },
  {
    name: 'create_campaign_with_automation',
    description: 'Create campaign with full event automation including triggers, actions, and canvas settings',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        description: { type: 'string', description: 'Campaign description' },
        isPublished: { type: 'boolean', description: 'Publish immediately' },
        allowRestart: { type: 'boolean', description: 'Allow campaign restart' },
        events: {
          type: 'array',
          description: 'Array of campaign events (triggers/actions)',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Event ID (use new1, new2, etc.)' },
              name: { type: 'string', description: 'Event name' },
              type: { type: 'string', description: 'Event type (e.g., email.send, lead.field_value)' },
              eventType: { type: 'string', enum: ['action', 'condition', 'decision'] },
              order: { type: 'number', description: 'Event order' },
              properties: { type: 'object', description: 'Event-specific properties' },
              triggerMode: { type: 'string', enum: ['immediate', 'interval'] },
              triggerInterval: { type: 'number' },
              triggerIntervalUnit: { type: 'string', enum: ['i', 'h', 'd', 'm', 'y'] },
              decisionPath: { type: 'string', enum: ['yes', 'no'] },
              parent: { type: 'object', properties: { id: { type: 'string' } } },
            },
          },
        },
        segments: { type: 'array', description: 'Segment IDs to trigger campaign', items: { type: 'number' } },
        forms: { type: 'array', description: 'Form IDs to trigger campaign', items: { type: 'number' } },
        canvasSettings: { type: 'object', description: 'Visual campaign builder settings' },
      },
      required: ['name'],
    },
  },
  {
    name: 'execute_campaign',
    description: 'Manually execute/trigger a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'number', description: 'Campaign ID' },
        contactIds: { type: 'array', items: { type: 'number' }, description: 'Optional: specific contacts' },
      },
      required: ['campaignId'],
    },
  },
  {
    name: 'get_campaign_contacts',
    description: 'Get contacts in a campaign with their status',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'number', description: 'Campaign ID' },
        start: { type: 'number', description: 'Starting offset' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
      },
      required: ['campaignId'],
    },
  },

  // NEW Mautic 7 campaign tools
  {
    name: 'clone_campaign',
    description: 'Clone an existing campaign (Mautic 7)',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'number', description: 'ID of the campaign to clone' },
      },
      required: ['campaignId'],
    },
  },
  {
    name: 'export_campaign',
    description: 'Export campaign data with all related assets (Mautic 7)',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'number', description: 'Campaign ID to export' },
      },
      required: ['campaignId'],
    },
  },
  {
    name: 'import_campaign',
    description: 'Import a campaign from JSON data (Mautic 7)',
    inputSchema: {
      type: 'object',
      properties: {
        campaignData: { type: 'object', description: 'Campaign JSON data to import' },
      },
      required: ['campaignData'],
    },
  },
  {
    name: 'get_campaign_event_details',
    description: 'Get detailed metrics for a specific campaign event (Mautic 7)',
    inputSchema: {
      type: 'object',
      properties: {
        eventId: { type: 'number', description: 'Campaign event ID' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
      },
      required: ['eventId'],
    },
  },
  {
    name: 'get_campaign_graph_stats',
    description: 'Get campaign graph statistics for a date range (Mautic 7)',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'number', description: 'Campaign ID' },
        dateFrom: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        dateTo: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
      required: ['campaignId', 'dateFrom', 'dateTo'],
    },
  },
  {
    name: 'get_campaign_map_stats',
    description: 'Get campaign geographic map statistics for a date range (Mautic 7)',
    inputSchema: {
      type: 'object',
      properties: {
        campaignId: { type: 'number', description: 'Campaign ID' },
        dateFrom: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        dateTo: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
      required: ['campaignId', 'dateFrom', 'dateTo'],
    },
  },
];

export const toolHandlers: Record<string, ToolHandler> = {
  async list_campaigns(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await client.v1.get('/campaigns', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total} campaigns:\n${JSON.stringify(response.data.campaigns, null, 2)}` }],
    };
  },

  async get_campaign(client: MauticApiClient, args: any) {
    const { id } = args;
    const response = await client.v1.get(`/campaigns/${id}`);
    return {
      content: [{ type: 'text', text: `Campaign details:\n${JSON.stringify(response.data.campaign, null, 2)}` }],
    };
  },

  async create_campaign(client: MauticApiClient, args: any) {
    const response = await client.v1.post('/campaigns/new', args);
    return {
      content: [{ type: 'text', text: `Campaign created successfully:\n${JSON.stringify(response.data.campaign, null, 2)}` }],
    };
  },

  async add_contact_to_campaign(client: MauticApiClient, args: any) {
    const { campaignId, contactId } = args;
    await client.v1.post(`/campaigns/${campaignId}/contact/${contactId}/add`);
    return {
      content: [{ type: 'text', text: `Contact ${contactId} added to campaign ${campaignId} successfully` }],
    };
  },

  async create_campaign_with_automation(client: MauticApiClient, args: any) {
    const payload: any = {
      name: args.name,
      description: args.description || '',
      isPublished: args.isPublished !== undefined ? args.isPublished : true,
      allowRestart: args.allowRestart || false,
    };

    if (args.events?.length > 0) payload.events = args.events;
    if (args.segments?.length > 0) payload.lists = args.segments.map((id: number) => ({ id }));
    if (args.forms?.length > 0) payload.forms = args.forms.map((id: number) => ({ id }));
    if (args.canvasSettings) payload.canvasSettings = args.canvasSettings;

    const response = await client.v1.post('/campaigns/new', payload);
    return {
      content: [{ type: 'text', text: `Campaign with automation created successfully:\n${JSON.stringify(response.data.campaign, null, 2)}` }],
    };
  },

  async execute_campaign(client: MauticApiClient, args: any) {
    const { campaignId, contactIds } = args;
    const payload: any = {};
    if (contactIds?.length > 0) payload.contactIds = contactIds;

    const response = await client.v1.post(`/campaigns/${campaignId}/trigger`, payload);
    return {
      content: [{ type: 'text', text: `Campaign ${campaignId} executed successfully:\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  async get_campaign_contacts(client: MauticApiClient, args: any) {
    const { campaignId, start, limit } = args;
    const params: any = {};
    if (start) params.start = start;
    if (limit) params.limit = Math.min(limit, 200);

    const response = await client.v1.get(`/campaigns/${campaignId}/contacts`, { params });
    return {
      content: [{ type: 'text', text: `Campaign ${campaignId} contacts:\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  // NEW Mautic 7 handlers
  async clone_campaign(client: MauticApiClient, args: any) {
    const { campaignId } = args;
    const response = await client.v1.post(`/campaigns/clone/${campaignId}`);
    return {
      content: [{ type: 'text', text: `Campaign ${campaignId} cloned successfully:\n${JSON.stringify(response.data.campaign || response.data, null, 2)}` }],
    };
  },

  async export_campaign(client: MauticApiClient, args: any) {
    const { campaignId } = args;
    const response = await client.v1.get(`/campaigns/export/${campaignId}`);
    return {
      content: [{ type: 'text', text: `Campaign ${campaignId} export data:\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  async import_campaign(client: MauticApiClient, args: any) {
    const { campaignData } = args;
    const response = await client.v1.post('/campaigns/import', campaignData);
    return {
      content: [{ type: 'text', text: `Campaign imported successfully:\n${JSON.stringify(response.data.campaign || response.data, null, 2)}` }],
    };
  },

  async get_campaign_event_details(client: MauticApiClient, args: any) {
    const { eventId, limit, start } = args;
    const params: any = {};
    if (limit) params.limit = Math.min(limit, 200);
    if (start) params.start = start;

    const response = await client.v1.get(`/campaigns/events/${eventId}`, { params });
    return {
      content: [{ type: 'text', text: `Campaign event ${eventId} details:\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  async get_campaign_graph_stats(client: MauticApiClient, args: any) {
    const { campaignId, dateFrom, dateTo } = args;
    const response = await client.v1.get(`/campaigns/${campaignId}`, {
      params: { dateFrom, dateTo },
    });
    return {
      content: [{ type: 'text', text: `Campaign ${campaignId} stats (${dateFrom} to ${dateTo}):\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  async get_campaign_map_stats(client: MauticApiClient, args: any) {
    const { campaignId, dateFrom, dateTo } = args;
    const response = await client.v1.get(`/campaigns/${campaignId}`, {
      params: { dateFrom, dateTo },
    });
    return {
      content: [{ type: 'text', text: `Campaign ${campaignId} map stats (${dateFrom} to ${dateTo}):\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },
};
