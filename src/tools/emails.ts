import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolHandler, ToolResult } from '../types/index.js';
import { compileMjml } from '../utils/mjml.js';

const CUSTOM_MJML_DESCRIPTION =
  'MJML source for the GrapesJS email builder. Saving it makes the email editable in the builder ' +
  '(drag and drop) instead of opening as read-only code. If customHtml is omitted, it is compiled from this MJML.';

function errorResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}

/**
 * Turn the tool's `customMjml` argument into the request body Mautic's
 * GrapesJsBuilderBundle reads (`grapesjsbuilder.customMjml`).
 *
 * Mautic sets the email's HTML from the same request whenever `grapesjsbuilder`
 * is present, so a request with MJML but no `customHtml` would empty the HTML
 * that gets sent. To keep the two in step, missing HTML is compiled from the MJML.
 */
async function applyCustomMjml(
  fields: Record<string, any>,
  customMjml: unknown,
  options: { clearEditorState: boolean },
): Promise<{ notes: string[] } | { error: string }> {
  if (typeof customMjml !== 'string' || !customMjml.trim()) {
    return { error: 'customMjml must be a non-empty MJML string.' };
  }

  const notes: string[] = [];
  if (fields.customHtml === undefined || fields.customHtml === null || fields.customHtml === '') {
    let compiled;
    try {
      compiled = await compileMjml(customMjml);
    } catch (error) {
      return { error: `Could not compile customMjml: ${error instanceof Error ? error.message : String(error)}` };
    }
    fields.customHtml = compiled.html;
    notes.push('customHtml was compiled from customMjml.');
    if (compiled.warnings.length) {
      notes.push(`MJML warnings (the email was still saved):\n- ${compiled.warnings.join('\n- ')}`);
    }
  }

  fields.grapesjsbuilder = { customMjml };
  if (options.clearEditorState) {
    // Mautic 7.2+ also keeps the builder's own project data and loads it over the
    // MJML when the builder opens; clear it so the builder shows the new MJML.
    fields.grapesjsbuilder.editorState = null;
  }
  return { notes };
}

function withNotes(text: string, notes: string[]): string {
  return notes.length ? `${text}\n${notes.join('\n')}` : text;
}

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
        customMjml: { type: 'string', description: CUSTOM_MJML_DESCRIPTION },
        plainText: { type: 'string', description: 'Plain text content' },
        emailType: { type: 'string', enum: ['template', 'list'], description: 'Email type' },
        isPublished: { type: 'boolean', description: 'Publish immediately' },
      },
      required: ['name', 'subject'],
    },
  },
  {
    name: 'update_email',
    description:
      'Update an existing email. Only the fields given are changed. For an email built in the GrapesJS builder, ' +
      'send customMjml (its HTML is compiled from it) so the builder and the sent HTML stay the same.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Email ID' },
        name: { type: 'string', description: 'Email name' },
        subject: { type: 'string', description: 'Email subject' },
        fromAddress: { type: 'string', description: 'From email address' },
        fromName: { type: 'string', description: 'From name' },
        replyToAddress: { type: 'string', description: 'Reply-to email address' },
        customHtml: { type: 'string', description: 'HTML content' },
        customMjml: { type: 'string', description: CUSTOM_MJML_DESCRIPTION },
        plainText: { type: 'string', description: 'Plain text content' },
        isPublished: { type: 'boolean', description: 'Published or not' },
        allowMjmlDesync: {
          type: 'boolean',
          description:
            'Allow changing only customHtml on an email that has builder MJML. The MJML is left as it was, ' +
            'so the next save in the builder overwrites this HTML. Default false.',
        },
      },
      required: ['id'],
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
    const { customMjml, ...fields } = args ?? {};
    let notes: string[] = [];
    if (customMjml !== undefined) {
      const result = await applyCustomMjml(fields, customMjml, { clearEditorState: false });
      if ('error' in result) return errorResult(result.error);
      notes = result.notes;
    }

    const response = await client.v1.post('/emails/new', fields);
    return {
      content: [{
        type: 'text',
        text: withNotes('Email template created successfully.', notes) +
          `\n${JSON.stringify(response.data.email, null, 2)}`,
      }],
    };
  },

  async update_email(client: MauticApiClient, args: any) {
    const { id, customMjml, allowMjmlDesync, ...fields } = args ?? {};
    if (id === undefined || id === null) return errorResult('id is required.');

    let notes: string[] = [];
    if (customMjml !== undefined) {
      const result = await applyCustomMjml(fields, customMjml, { clearEditorState: true });
      if ('error' in result) return errorResult(result.error);
      notes = result.notes;
    } else if (fields.customHtml !== undefined && !allowMjmlDesync) {
      const current = await client.v1.get(`/emails/${id}`);
      if (current.data?.email?.grapesjsbuilder?.customMjml) {
        return errorResult(
          `Email ${id} was built in the GrapesJS builder and has MJML source. Changing only customHtml leaves ` +
          'that MJML as it is, so the next save in the builder would overwrite the change. Send customMjml instead ' +
          '(the HTML is compiled from it), or set allowMjmlDesync to true to change the HTML anyway.',
        );
      }
    }

    if (Object.keys(fields).length === 0) {
      return errorResult('Nothing to update: give at least one field besides id.');
    }

    const response = await client.v1.patch(`/emails/${id}/edit`, fields);
    return {
      content: [{
        type: 'text',
        text: withNotes(`Email ${id} updated successfully.`, notes) +
          `\n${JSON.stringify(response.data.email, null, 2)}`,
      }],
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
