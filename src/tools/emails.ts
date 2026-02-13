import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolHandler } from '../types/index.js';

export const toolDefinitions: ToolDefinition[] = [
  // Existing email tools
  {
    name: 'send_email',
    description: 'Send an email to specific contacts',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'number', description: 'Email template ID' },
        contactIds: { type: 'array', items: { type: 'number' }, description: 'Array of contact IDs' },
        contactEmails: { type: 'array', items: { type: 'string' }, description: 'Array of contact emails' },
      },
    },
  },
  {
    name: 'list_emails',
    description: 'Get all email templates and campaigns',
    inputSchema: {
      type: 'object',
      properties: {
        search: { type: 'string', description: 'Search term' },
        limit: { type: 'number', description: 'Number of results', maximum: 200 },
        start: { type: 'number', description: 'Starting offset' },
        publishedOnly: { type: 'boolean', description: 'Only published emails' },
      },
    },
  },
  {
    name: 'get_email',
    description: 'Get detailed email information',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Email ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'create_email_template',
    description: 'Create a new email template',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Email name' },
        subject: { type: 'string', description: 'Email subject' },
        fromAddress: { type: 'string', description: 'From email address' },
        fromName: { type: 'string', description: 'From name' },
        replyToAddress: { type: 'string', description: 'Reply-to email address' },
        customHtml: { type: 'string', description: 'HTML content' },
        plainText: { type: 'string', description: 'Plain text content' },
        emailType: { type: 'string', enum: ['template', 'list'], description: 'Email type' },
        isPublished: { type: 'boolean', description: 'Publish immediately' },
      },
      required: ['name', 'subject'],
    },
  },
  {
    name: 'get_email_stats',
    description: 'Get email performance statistics',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'number', description: 'Email ID' },
      },
      required: ['emailId'],
    },
  },

  // NEW Mautic 7 email tools
  {
    name: 'send_email_to_segment',
    description: 'Send email to its assigned segment(s) with real-time audience adaptation (Mautic 7)',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'number', description: 'Email ID (must be a segment/list email)' },
      },
      required: ['emailId'],
    },
  },
  {
    name: 'record_email_reply',
    description: 'Record an email reply by tracking hash (Mautic 7)',
    inputSchema: {
      type: 'object',
      properties: {
        trackingHash: { type: 'string', description: 'The email tracking hash' },
      },
      required: ['trackingHash'],
    },
  },
  {
    name: 'get_email_graph_stats',
    description: 'Get email graph statistics for a date range (Mautic 7)',
    inputSchema: {
      type: 'object',
      properties: {
        emailId: { type: 'number', description: 'Email ID' },
        isVariant: { type: 'boolean', description: 'Whether this is a variant email' },
        dateFrom: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        dateTo: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
      required: ['emailId', 'dateFrom', 'dateTo'],
    },
  },
];

export const toolHandlers: Record<string, ToolHandler> = {
  async send_email(client: MauticApiClient, args: any) {
    const { emailId, contactIds, contactEmails } = args;
    const data: any = { id: emailId };
    if (contactIds) data.contactIds = contactIds;
    if (contactEmails) data.contactEmails = contactEmails;

    const response = await client.v1.post(`/emails/${emailId}/contact/send`, data);
    return {
      content: [{ type: 'text', text: `Email sent successfully:\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  async list_emails(client: MauticApiClient, args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await client.v1.get('/emails', { params });
    return {
      content: [{ type: 'text', text: `Found ${response.data.total} emails:\n${JSON.stringify(response.data.emails, null, 2)}` }],
    };
  },

  async get_email(client: MauticApiClient, args: any) {
    const { id } = args;
    const response = await client.v1.get(`/emails/${id}`);
    return {
      content: [{ type: 'text', text: `Email details:\n${JSON.stringify(response.data.email, null, 2)}` }],
    };
  },

  async create_email_template(client: MauticApiClient, args: any) {
    const response = await client.v1.post('/emails/new', args);
    return {
      content: [{ type: 'text', text: `Email template created successfully:\n${JSON.stringify(response.data.email, null, 2)}` }],
    };
  },

  async get_email_stats(client: MauticApiClient, args: any) {
    const { emailId } = args;
    const response = await client.v1.get(`/emails/${emailId}/stats`);
    return {
      content: [{ type: 'text', text: `Email statistics:\n${JSON.stringify(response.data.stats, null, 2)}` }],
    };
  },

  // NEW Mautic 7 handlers
  async send_email_to_segment(client: MauticApiClient, args: any) {
    const { emailId } = args;
    const response = await client.v1.post(`/emails/${emailId}/send`);
    return {
      content: [{ type: 'text', text: `Email ${emailId} sent to segment successfully:\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  async record_email_reply(client: MauticApiClient, args: any) {
    const { trackingHash } = args;
    const response = await client.v1.post(`/emails/reply/${trackingHash}`);
    return {
      content: [{ type: 'text', text: `Email reply recorded for tracking hash ${trackingHash}:\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },

  async get_email_graph_stats(client: MauticApiClient, args: any) {
    const { emailId, isVariant, dateFrom, dateTo } = args;
    const variant = isVariant ? 1 : 0;
    const response = await client.v1.get(`/emails/${emailId}`, {
      params: { dateFrom, dateTo },
    });
    return {
      content: [{ type: 'text', text: `Email ${emailId} stats (${dateFrom} to ${dateTo}):\n${JSON.stringify(response.data, null, 2)}` }],
    };
  },
};
