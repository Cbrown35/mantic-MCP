import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolHandler, ToolResult } from '../types/index.js';
import { compileMjml } from '../utils/mjml.js';

const CUSTOM_MJML_DESCRIPTION =
  'MJML source for the GrapesJS email builder. Saving it makes the email open in the builder\'s MJML ' +
  '(drag and drop) editor instead of its HTML or code mode. If customHtml is omitted, it is compiled from this MJML.';

/** Request keys Mautic's builder plugin reads; only this file may set them. */
const RESERVED_BUILDER_KEYS = ['grapesjsbuilder', 'emailform'];

const TRANSLATION_PARENT_KEYS = ['translationParent', 'templateTranslationParent', 'segmentTranslationParent'];

function errorResult(text: string): ToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

/**
 * Turn the tool's `customMjml` argument into the request body Mautic's
 * GrapesJsBuilderBundle reads (`grapesjsbuilder.customMjml`).
 *
 * Mautic sets the email's HTML from the same request whenever `grapesjsbuilder`
 * is present, so a request with MJML but no `customHtml` would empty the HTML
 * that gets sent. To keep the two in step, missing HTML is compiled from the MJML.
 * The MJML is compiled either way, so MJML the parser cannot read is refused.
 */
async function applyCustomMjml(
  fields: Record<string, any>,
  customMjml: unknown,
  options: { clearEditorState: boolean },
): Promise<{ notes: string[] } | { error: string }> {
  if (typeof customMjml !== 'string' || !customMjml.trim()) {
    return { error: 'customMjml must be a non-empty MJML string.' };
  }

  let compiled;
  try {
    compiled = await compileMjml(customMjml);
  } catch (error) {
    return { error: `Could not compile customMjml: ${error instanceof Error ? error.message : String(error)}` };
  }

  const notes: string[] = [];
  if (isBlank(fields.customHtml)) {
    fields.customHtml = compiled.html;
    notes.push('customHtml was compiled from customMjml.');
  } else {
    notes.push(
      'customHtml was stored as given. It is not checked against customMjml, and the builder replaces it ' +
      'with its own compile of the MJML the next time the email is saved there.',
    );
  }
  if (compiled.warnings.length) {
    notes.push(`MJML warnings (not blocking):\n- ${compiled.warnings.join('\n- ')}`);
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

/**
 * Callers must not send the keys Mautic's builder plugin reads (`grapesjsbuilder`,
 * `emailform`) themselves: either can empty the email's HTML or put it out of
 * step with the MJML, and both would bypass the checks in this file.
 * `customMjml` is the supported way in.
 */
function rawBuilderPayloadError(fields: Record<string, any>): string | null {
  const found = RESERVED_BUILDER_KEYS.filter(key => Object.prototype.hasOwnProperty.call(fields, key));
  return found.length
    ? `Do not send ${found.join(' or ')} directly; pass the MJML as customMjml and this tool builds the builder payload.`
    : null;
}

/**
 * Mautic 6's email form resets two things on every API PATCH that does not
 * send them: dynamic content goes back to the default (its variants and
 * filters are lost) and a translation is unlinked from its parent. Mautic 7.2
 * works around this on the server. Sending the email's current values makes a
 * partial update partial on every version.
 */
function keepFieldsMauticResets(fields: Record<string, any>, current: Record<string, any>): void {
  if (!Object.prototype.hasOwnProperty.call(fields, 'dynamicContent') && Array.isArray(current.dynamicContent)) {
    fields.dynamicContent = current.dynamicContent;
  }

  const parent = current.translationParent;
  const parentId = parent && typeof parent === 'object' ? parent.id : parent;
  if (parentId && !TRANSLATION_PARENT_KEYS.some(key => Object.prototype.hasOwnProperty.call(fields, key))) {
    // Mautic 6 picks the parent field by the emailType in the same request.
    if (fields.emailType === undefined && current.emailType) fields.emailType = current.emailType;
    const key = fields.emailType === 'list' ? 'segmentTranslationParent' : 'templateTranslationParent';
    fields[key] = parentId;
  }
}

/**
 * Notes and problems to report after Mautic saved an email that was sent with MJML.
 * Mautic drops the MJML silently when its builder plugin is unpublished.
 */
function checkSavedMjml(email: any, customMjml: string): { error?: string; notes: string[] } {
  const notes: string[] = [];
  if (email?.template === 'mautic_code_mode') {
    notes.push(
      'This email uses the code-mode theme, which turns the builder off. Choose a builder theme in Mautic ' +
      'to edit it in the builder.',
    );
  }
  if (email?.grapesjsbuilder?.customMjml !== customMjml) {
    return {
      error:
        'Mautic saved the email but did not store the MJML (is the GrapesJS Builder plugin published?). ' +
        'The HTML was saved; the builder will not show this MJML.',
      notes,
    };
  }
  return { notes };
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
            'so the next save in the builder overwrites this HTML. Must be a boolean. Default false.',
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
    const rawError = rawBuilderPayloadError(fields);
    if (rawError) return errorResult(rawError);

    let notes: string[] = [];
    if (customMjml !== undefined) {
      const result = await applyCustomMjml(fields, customMjml, { clearEditorState: false });
      if ('error' in result) return errorResult(result.error);
      notes = result.notes;
    }

    const response = await client.v1.post('/emails/new', fields);
    const email = response.data.email;
    let headline = 'Email template created successfully.';
    let isError = false;
    if (customMjml !== undefined) {
      const check = checkSavedMjml(email, customMjml);
      notes.push(...check.notes);
      if (check.error) { headline = `Email template ${email?.id ?? ''} created, with a problem: ${check.error}`; isError = true; }
    }
    return {
      content: [{ type: 'text', text: withNotes(headline, notes) + `\n${JSON.stringify(email, null, 2)}` }],
      ...(isError ? { isError: true } : {}),
    };
  },

  async update_email(client: MauticApiClient, args: any) {
    const { id, customMjml, allowMjmlDesync, ...fields } = args ?? {};
    if (!/^[1-9]\d*$/.test(String(id ?? ''))) return errorResult('id must be a positive whole number.');
    const rawError = rawBuilderPayloadError(fields);
    if (rawError) return errorResult(rawError);
    if (allowMjmlDesync !== undefined && typeof allowMjmlDesync !== 'boolean') {
      return errorResult('allowMjmlDesync must be true or false.');
    }
    if (customMjml === undefined && Object.keys(fields).length === 0) {
      return errorResult('Nothing to update: give at least one field besides id.');
    }
    if (customMjml === undefined && Object.prototype.hasOwnProperty.call(fields, 'customHtml') && isBlank(fields.customHtml)) {
      return errorResult('customHtml cannot be empty: that would leave the email with nothing to send.');
    }

    let notes: string[] = [];
    if (customMjml !== undefined) {
      const result = await applyCustomMjml(fields, customMjml, { clearEditorState: true });
      if ('error' in result) return errorResult(result.error);
      notes = result.notes;
    }

    const current = (await client.v1.get(`/emails/${id}`)).data?.email ?? {};
    if (customMjml === undefined && fields.customHtml !== undefined && allowMjmlDesync !== true
        && current.grapesjsbuilder?.customMjml) {
      return errorResult(
        `Email ${id} was built in the GrapesJS builder and has MJML source. Changing only customHtml leaves ` +
        'that MJML as it is, so the next save in the builder would overwrite the change. Send customMjml instead ' +
        '(the HTML is compiled from it), or set allowMjmlDesync to true to change the HTML anyway.',
      );
    }
    keepFieldsMauticResets(fields, current);

    const response = await client.v1.patch(`/emails/${id}/edit`, fields);
    const email = response.data.email;
    let headline = `Email ${id} updated successfully.`;
    let isError = false;
    if (customMjml !== undefined) {
      const check = checkSavedMjml(email, customMjml);
      notes.push(...check.notes);
      if (check.error) { headline = `Email ${id} updated, with a problem: ${check.error}`; isError = true; }
    }
    return {
      content: [{ type: 'text', text: withNotes(headline, notes) + `\n${JSON.stringify(email, null, 2)}` }],
      ...(isError ? { isError: true } : {}),
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
