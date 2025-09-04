#!/usr/bin/env node

/**
 * Comprehensive Mautic MCP Server
 * 
 * This MCP server provides full integration with Mautic marketing automation platform.
 * It supports contact management, campaigns, emails, forms, segments, and analytics.
 * 
 * Features:
 * - Basic authentication with username/password
 * - Contact CRUD operations and search
 * - Campaign management and statistics
 * - Email operations and templates
 * - Form management and submissions
 * - Segment management
 * - Analytics and reporting
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance, AxiosError } from 'axios';

// Environment variables for Mautic configuration
const MAUTIC_BASE_URL = process.env.MAUTIC_BASE_URL;
const MAUTIC_USERNAME = process.env.MAUTIC_USERNAME;
const MAUTIC_PASSWORD = process.env.MAUTIC_PASSWORD;

if (!MAUTIC_BASE_URL || !MAUTIC_USERNAME || !MAUTIC_PASSWORD) {
  throw new Error('Missing required Mautic environment variables: MAUTIC_BASE_URL, MAUTIC_USERNAME, MAUTIC_PASSWORD');
}

// Basic authentication credentials
interface BasicAuthCredentials {
  username: string;
  password: string;
}

// Type definitions for Mautic API responses
interface MauticContact {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  dateAdded?: string;
  dateModified?: string;
  lastActive?: string;
  points: number;
  [key: string]: any;
}

interface MauticCampaign {
  id: number;
  name: string;
  description?: string;
  isPublished: boolean;
  publishUp?: string;
  publishDown?: string;
  dateAdded?: string;
  createdBy?: string;
  stats?: {
    sentCount: number;
    readCount: number;
    clickCount: number;
  };
}

interface MauticEmail {
  id: number;
  name: string;
  subject?: string;
  fromAddress?: string;
  fromName?: string;
  replyToAddress?: string;
  customHtml?: string;
  plainText?: string;
  template?: string;
  emailType?: string;
  publishUp?: string;
  publishDown?: string;
  readCount?: number;
  sentCount?: number;
  revision?: number;
  assetAttachments?: any[];
  variantStartDate?: string;
  variantSentCount?: number;
  variantReadCount?: number;
  variantClickCount?: number;
  variantUnsubscribedCount?: number;
  variantBounceCount?: number;
}

interface MauticForm {
  id: number;
  name: string;
  alias?: string;
  description?: string;
  isPublished: boolean;
  publishUp?: string;
  publishDown?: string;
  dateAdded?: string;
  createdBy?: string;
  submissionCount?: number;
  fields?: any[];
}

interface MauticSegment {
  id: number;
  name: string;
  alias?: string;
  description?: string;
  isPublished: boolean;
  isGlobal: boolean;
  filters?: any[];
  dateAdded?: string;
  createdBy?: string;
}

class MauticServer {
  private server: Server;
  private axiosInstance: AxiosInstance;
  private credentials: BasicAuthCredentials;

  constructor() {
    this.server = new Server(
      {
        name: "mautic-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.credentials = {
      username: MAUTIC_USERNAME!,
      password: MAUTIC_PASSWORD!
    };

    this.axiosInstance = axios.create({
      baseURL: MAUTIC_BASE_URL,
      timeout: 30000,
      auth: {
        username: this.credentials.username,
        password: this.credentials.password
      }
    });

    this.setupToolHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }


  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        // Contact Management Tools
        {
          name: 'create_contact',
          description: 'Create a new contact in Mautic',
          inputSchema: {
            type: 'object',
            properties: {
              email: { type: 'string', description: 'Contact email address' },
              firstName: { type: 'string', description: 'First name' },
              lastName: { type: 'string', description: 'Last name' },
              phone: { type: 'string', description: 'Phone number' },
              company: { type: 'string', description: 'Company name' },
              position: { type: 'string', description: 'Job position' },
              customFields: { type: 'object', description: 'Custom field values' },
            },
            required: ['email'],
          },
        },
        {
          name: 'update_contact',
          description: 'Update an existing contact',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Contact ID' },
              email: { type: 'string', description: 'Contact email address' },
              firstName: { type: 'string', description: 'First name' },
              lastName: { type: 'string', description: 'Last name' },
              phone: { type: 'string', description: 'Phone number' },
              company: { type: 'string', description: 'Company name' },
              position: { type: 'string', description: 'Job position' },
              customFields: { type: 'object', description: 'Custom field values' },
            },
            required: ['id'],
          },
        },
        {
          name: 'get_contact',
          description: 'Get contact details by ID or email',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Contact ID' },
              email: { type: 'string', description: 'Contact email address' },
            },
          },
        },
        {
          name: 'search_contacts',
          description: 'Search contacts with filters and pagination',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'Search term' },
              limit: { type: 'number', description: 'Number of results (max 200)', maximum: 200 },
              start: { type: 'number', description: 'Starting offset for pagination' },
              orderBy: { type: 'string', description: 'Field to order by' },
              orderByDir: { type: 'string', enum: ['ASC', 'DESC'], description: 'Order direction' },
              publishedOnly: { type: 'boolean', description: 'Only published contacts' },
              minimal: { type: 'boolean', description: 'Return minimal contact data' },
            },
          },
        },
        {
          name: 'delete_contact',
          description: 'Delete a contact from Mautic',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number', description: 'Contact ID to delete' },
            },
            required: ['id'],
          },
        },
        {
          name: 'add_contact_to_segment',
          description: 'Add a contact to a specific segment',
          inputSchema: {
            type: 'object',
            properties: {
              contactId: { type: 'number', description: 'Contact ID' },
              segmentId: { type: 'number', description: 'Segment ID' },
            },
            required: ['contactId', 'segmentId'],
          },
        },

        // Campaign Management Tools
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

        // Email Management Tools
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

        // Form Management Tools
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

        // Segment Management Tools
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

        // Enhanced Campaign Automation Tools (PRIORITY 1)
        {
          name: 'create_campaign_with_automation',
          description: 'Create campaign with full event automation including triggers, actions, and canvas settings',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Campaign name' },
              description: { type: 'string', description: 'Campaign description' },
              isPublished: { type: 'boolean', default: true },
              allowRestart: { type: 'boolean', default: false },
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
                    triggerMode: { type: 'string', enum: ['immediate', 'interval'], default: 'immediate' },
                    triggerInterval: { type: 'number', default: 1 },
                    triggerIntervalUnit: { type: 'string', enum: ['i', 'h', 'd', 'm', 'y'], default: 'd' },
                    decisionPath: { type: 'string', enum: ['yes', 'no'], description: 'For decision events' },
                    parent: { type: 'object', properties: { id: { type: 'string' } } }
                  }
                }
              },
              segments: {
                type: 'array',
                description: 'Segment IDs to trigger campaign',
                items: { type: 'number' }
              },
              forms: {
                type: 'array',
                description: 'Form IDs to trigger campaign',
                items: { type: 'number' }
              },
              canvasSettings: {
                type: 'object',
                description: 'Visual campaign builder settings',
                properties: {
                  nodes: { type: 'array' },
                  connections: { type: 'array' }
                }
              }
            },
            required: ['name']
          }
        },
        {
          name: 'execute_campaign',
          description: 'Manually execute/trigger a campaign',
          inputSchema: {
            type: 'object',
            properties: {
              campaignId: { type: 'number' },
              contactIds: { type: 'array', items: { type: 'number' }, description: 'Optional: specific contacts' }
            },
            required: ['campaignId']
          }
        },
        {
          name: 'get_campaign_contacts',
          description: 'Get contacts in a campaign with their status',
          inputSchema: {
            type: 'object',
            properties: {
              campaignId: { type: 'number' },
              start: { type: 'number', default: 0 },
              limit: { type: 'number', default: 100 }
            },
            required: ['campaignId']
          }
        },

        // Content Management APIs (PRIORITY 2)
        {
          name: 'list_assets',
          description: 'Get all assets (PDFs, images, documents)',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string' },
              limit: { type: 'number', maximum: 200 },
              start: { type: 'number', default: 0 },
              publishedOnly: { type: 'boolean', default: true }
            }
          }
        },
        {
          name: 'get_asset',
          description: 'Get asset details by ID',
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'number' }
            },
            required: ['id']
          }
        },
        {
          name: 'create_asset',
          description: 'Create new asset (local or remote)',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              storageLocation: { type: 'string', enum: ['local', 'remote'] },
              file: { type: 'string', description: 'File path (local) or URL (remote)' },
              category: { type: 'number', description: 'Category ID' },
              isPublished: { type: 'boolean', default: true }
            },
            required: ['title', 'storageLocation', 'file']
          }
        },
        {
          name: 'list_pages',
          description: 'Get all landing pages',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string' },
              limit: { type: 'number', maximum: 200 },
              start: { type: 'number', default: 0 },
              publishedOnly: { type: 'boolean', default: true }
            }
          }
        },
        {
          name: 'create_page',
          description: 'Create new landing page',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              alias: { type: 'string' },
              customHtml: { type: 'string' },
              template: { type: 'string' },
              isPublished: { type: 'boolean', default: true },
              publishUp: { type: 'string', description: 'Publish start date' },
              publishDown: { type: 'string', description: 'Publish end date' }
            },
            required: ['title']
          }
        },
        {
          name: 'list_sms',
          description: 'Get all SMS templates',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string' },
              limit: { type: 'number', maximum: 200 }
            }
          }
        },
        {
          name: 'create_sms',
          description: 'Create SMS template',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              message: { type: 'string' },
              isPublished: { type: 'boolean', default: true }
            },
            required: ['name', 'message']
          }
        },

        // Business Entity APIs (PRIORITY 3)
        {
          name: 'list_companies',
          description: 'Get all companies',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string' },
              limit: { type: 'number', maximum: 200 },
              start: { type: 'number', default: 0 }
            }
          }
        },
        {
          name: 'create_company',
          description: 'Create new company',
          inputSchema: {
            type: 'object',
            properties: {
              companyname: { type: 'string' },
              companyemail: { type: 'string' },
              companyphone: { type: 'string' },
              companyaddress1: { type: 'string' },
              companyaddress2: { type: 'string' },
              companycity: { type: 'string' },
              companystate: { type: 'string' },
              companyzipcode: { type: 'string' },
              companycountry: { type: 'string' },
              companywebsite: { type: 'string' }
            },
            required: ['companyname']
          }
        },
        {
          name: 'add_contact_to_company',
          description: 'Associate contact with company',
          inputSchema: {
            type: 'object',
            properties: {
              contactId: { type: 'number' },
              companyId: { type: 'number' }
            },
            required: ['contactId', 'companyId']
          }
        },
        {
          name: 'create_note',
          description: 'Add note to contact or company',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              type: { type: 'string', enum: ['general', 'email', 'call', 'meeting'] },
              contactId: { type: 'number', description: 'Contact ID (if adding to contact)' },
              companyId: { type: 'number', description: 'Company ID (if adding to company)' }
            },
            required: ['text', 'type']
          }
        },
        {
          name: 'get_contact_notes',
          description: 'Get all notes for a contact',
          inputSchema: {
            type: 'object',
            properties: {
              contactId: { type: 'number' },
              limit: { type: 'number', default: 100 }
            },
            required: ['contactId']
          }
        },
        {
          name: 'list_tags',
          description: 'Get all available tags',
          inputSchema: {
            type: 'object',
            properties: {
              search: { type: 'string' },
              limit: { type: 'number', maximum: 200 }
            }
          }
        },
        {
          name: 'create_tag',
          description: 'Create new tag',
          inputSchema: {
            type: 'object',
            properties: {
              tag: { type: 'string' }
            },
            required: ['tag']
          }
        },
        {
          name: 'add_contact_tags',
          description: 'Add tags to contact',
          inputSchema: {
            type: 'object',
            properties: {
              contactId: { type: 'number' },
              tags: { type: 'array', items: { type: 'string' } }
            },
            required: ['contactId', 'tags']
          }
        },
        {
          name: 'list_categories',
          description: 'Get all categories',
          inputSchema: {
            type: 'object',
            properties: {
              bundle: { type: 'string', description: 'Category type (asset, email, etc.)' },
              limit: { type: 'number', maximum: 200 }
            }
          }
        },
        {
          name: 'create_category',
          description: 'Create new category',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              alias: { type: 'string' },
              description: { type: 'string' },
              bundle: { type: 'string' },
              color: { type: 'string', description: 'Hex color code' }
            },
            required: ['title', 'bundle']
          }
        },

        // Advanced Feature APIs (PRIORITY 4)
        {
          name: 'add_contact_points',
          description: 'Add points to contact',
          inputSchema: {
            type: 'object',
            properties: {
              contactId: { type: 'number' },
              points: { type: 'number' },
              eventName: { type: 'string', default: 'API Point Addition' },
              actionName: { type: 'string', default: 'Manual' }
            },
            required: ['contactId', 'points']
          }
        },
        {
          name: 'subtract_contact_points',
          description: 'Subtract points from contact',
          inputSchema: {
            type: 'object',
            properties: {
              contactId: { type: 'number' },
              points: { type: 'number' },
              eventName: { type: 'string', default: 'API Point Subtraction' },
              actionName: { type: 'string', default: 'Manual' }
            },
            required: ['contactId', 'points']
          }
        },
        {
          name: 'list_stages',
          description: 'Get all lifecycle stages',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', maximum: 200 }
            }
          }
        },
        {
          name: 'change_contact_stage',
          description: 'Change contact\'s lifecycle stage',
          inputSchema: {
            type: 'object',
            properties: {
              contactId: { type: 'number' },
              stageId: { type: 'number' }
            },
            required: ['contactId', 'stageId']
          }
        },
        {
          name: 'list_contact_fields',
          description: 'Get all contact custom fields',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', maximum: 200 }
            }
          }
        },
        {
          name: 'create_contact_field',
          description: 'Create new contact custom field',
          inputSchema: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              alias: { type: 'string' },
              type: { type: 'string', enum: ['text', 'textarea', 'email', 'number', 'select', 'multiselect', 'boolean', 'date', 'datetime'] },
              defaultValue: { type: 'string' },
              isRequired: { type: 'boolean', default: false },
              isPubliclyUpdatable: { type: 'boolean', default: false },
              properties: { type: 'object', description: 'Field type specific properties' }
            },
            required: ['label', 'type']
          }
        },

        // Integration & Automation APIs (PRIORITY 5)
        {
          name: 'list_webhooks',
          description: 'Get all webhooks',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', maximum: 200 }
            }
          }
        },
        {
          name: 'create_webhook',
          description: 'Create new webhook',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              webhookUrl: { type: 'string' },
              secret: { type: 'string' },
              eventsOrderbyDir: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
              triggers: { type: 'array', items: { type: 'string' }, description: 'Event types to trigger webhook' }
            },
            required: ['name', 'webhookUrl', 'triggers']
          }
        },
        {
          name: 'upload_file',
          description: 'Upload file to Mautic',
          inputSchema: {
            type: 'object',
            properties: {
              file: { type: 'string', description: 'File path or base64 encoded content' },
              folder: { type: 'string', default: 'assets' }
            },
            required: ['file']
          }
        },
        {
          name: 'list_reports',
          description: 'Get all reports',
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', maximum: 200 }
            }
          }
        },
        {
          name: 'create_report',
          description: 'Create custom report',
          inputSchema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              source: { type: 'string', description: 'Data source (contacts, companies, etc.)' },
              columns: { type: 'array', items: { type: 'string' } },
              filters: { type: 'array' },
              groupBy: { type: 'array', items: { type: 'string' } }
            },
            required: ['name', 'source', 'columns']
          }
        },

        // Analytics and Reporting Tools
        {
          name: 'get_contact_activity',
          description: 'Get contact interaction history',
          inputSchema: {
            type: 'object',
            properties: {
              contactId: { type: 'number', description: 'Contact ID' },
              search: { type: 'string', description: 'Search term' },
              includeEvents: { type: 'array', items: { type: 'string' }, description: 'Event types to include' },
              excludeEvents: { type: 'array', items: { type: 'string' }, description: 'Event types to exclude' },
              dateFrom: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
              dateTo: { type: 'string', description: 'End date (YYYY-MM-DD)' },
              limit: { type: 'number', description: 'Number of results', maximum: 200 },
            },
            required: ['contactId'],
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
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        switch (request.params.name) {
          // Contact Management
          case 'create_contact':
            return await this.createContact(request.params.arguments);
          case 'update_contact':
            return await this.updateContact(request.params.arguments);
          case 'get_contact':
            return await this.getContact(request.params.arguments);
          case 'search_contacts':
            return await this.searchContacts(request.params.arguments);
          case 'delete_contact':
            return await this.deleteContact(request.params.arguments);
          case 'add_contact_to_segment':
            return await this.addContactToSegment(request.params.arguments);

          // Campaign Management
          case 'list_campaigns':
            return await this.listCampaigns(request.params.arguments);
          case 'get_campaign':
            return await this.getCampaign(request.params.arguments);
          case 'create_campaign':
            return await this.createCampaign(request.params.arguments);
          case 'add_contact_to_campaign':
            return await this.addContactToCampaign(request.params.arguments);

          // Enhanced Campaign Automation
          case 'create_campaign_with_automation':
            return await this.createCampaignWithAutomation(request.params.arguments);
          case 'execute_campaign':
            return await this.executeCampaign(request.params.arguments);
          case 'get_campaign_contacts':
            return await this.getCampaignContacts(request.params.arguments);

          // Content Management APIs
          case 'list_assets':
            return await this.listAssets(request.params.arguments);
          case 'get_asset':
            return await this.getAsset(request.params.arguments);
          case 'create_asset':
            return await this.createAsset(request.params.arguments);
          case 'list_pages':
            return await this.listPages(request.params.arguments);
          case 'create_page':
            return await this.createPage(request.params.arguments);
          case 'list_sms':
            return await this.listSms(request.params.arguments);
          case 'create_sms':
            return await this.createSms(request.params.arguments);

          // Business Entity APIs
          case 'list_companies':
            return await this.listCompanies(request.params.arguments);
          case 'create_company':
            return await this.createCompany(request.params.arguments);
          case 'add_contact_to_company':
            return await this.addContactToCompany(request.params.arguments);
          case 'create_note':
            return await this.createNote(request.params.arguments);
          case 'get_contact_notes':
            return await this.getContactNotes(request.params.arguments);
          case 'list_tags':
            return await this.listTags(request.params.arguments);
          case 'create_tag':
            return await this.createTag(request.params.arguments);
          case 'add_contact_tags':
            return await this.addContactTags(request.params.arguments);
          case 'list_categories':
            return await this.listCategories(request.params.arguments);
          case 'create_category':
            return await this.createCategory(request.params.arguments);

          // Advanced Feature APIs
          case 'add_contact_points':
            return await this.addContactPoints(request.params.arguments);
          case 'subtract_contact_points':
            return await this.subtractContactPoints(request.params.arguments);
          case 'list_stages':
            return await this.listStages(request.params.arguments);
          case 'change_contact_stage':
            return await this.changeContactStage(request.params.arguments);
          case 'list_contact_fields':
            return await this.listContactFields(request.params.arguments);
          case 'create_contact_field':
            return await this.createContactField(request.params.arguments);

          // Integration & Automation APIs
          case 'list_webhooks':
            return await this.listWebhooks(request.params.arguments);
          case 'create_webhook':
            return await this.createWebhook(request.params.arguments);
          case 'upload_file':
            return await this.uploadFile(request.params.arguments);
          case 'list_reports':
            return await this.listReports(request.params.arguments);
          case 'create_report':
            return await this.createReport(request.params.arguments);

          // Email Management
          case 'send_email':
            return await this.sendEmail(request.params.arguments);
          case 'list_emails':
            return await this.listEmails(request.params.arguments);
          case 'get_email':
            return await this.getEmail(request.params.arguments);
          case 'create_email_template':
            return await this.createEmailTemplate(request.params.arguments);

          // Form Management
          case 'list_forms':
            return await this.listForms(request.params.arguments);
          case 'get_form':
            return await this.getForm(request.params.arguments);
          case 'get_form_submissions':
            return await this.getFormSubmissions(request.params.arguments);

          // Segment Management
          case 'list_segments':
            return await this.listSegments(request.params.arguments);
          case 'create_segment':
            return await this.createSegment(request.params.arguments);
          case 'get_segment_contacts':
            return await this.getSegmentContacts(request.params.arguments);

          // Analytics
          case 'get_contact_activity':
            return await this.getContactActivity(request.params.arguments);
          case 'get_email_stats':
            return await this.getEmailStats(request.params.arguments);

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        if (axios.isAxiosError(error)) {
          const message = error.response?.data?.errors?.[0]?.message || 
                          error.response?.data?.error?.message || 
                          error.message;
          return {
            content: [{ type: 'text', text: `Mautic API Error: ${message}` }],
            isError: true,
          };
        }
        throw new McpError(ErrorCode.InternalError, `Unexpected error: ${error}`);
      }
    });
  }

  // Contact Management Methods
  private async createContact(args: any) {
    const response = await this.axiosInstance.post('/contacts/new', args);
    return {
      content: [{ 
        type: 'text', 
        text: `Contact created successfully:\n${JSON.stringify(response.data.contact, null, 2)}` 
      }],
    };
  }

  private async updateContact(args: any) {
    const { id, ...updateData } = args;
    const response = await this.axiosInstance.patch(`/contacts/${id}/edit`, updateData);
    return {
      content: [{ 
        type: 'text', 
        text: `Contact updated successfully:\n${JSON.stringify(response.data.contact, null, 2)}` 
      }],
    };
  }

  private async getContact(args: any) {
    const { id, email } = args;
    let response;
    
    if (id) {
      response = await this.axiosInstance.get(`/contacts/${id}`);
    } else if (email) {
      const searchResponse = await this.axiosInstance.get('/contacts', {
        params: { search: `email:${email}`, limit: 1 }
      });
      if (searchResponse.data.total === 0) {
        return {
          content: [{ type: 'text', text: `No contact found with email: ${email}` }],
        };
      }
      const contactId = Object.keys(searchResponse.data.contacts)[0];
      response = await this.axiosInstance.get(`/contacts/${contactId}`);
    } else {
      throw new McpError(ErrorCode.InvalidParams, 'Either id or email must be provided');
    }

    return {
      content: [{ 
        type: 'text', 
        text: `Contact details:\n${JSON.stringify(response.data.contact, null, 2)}` 
      }],
    };
  }

  private async searchContacts(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.orderBy) params.orderBy = args.orderBy;
    if (args?.orderByDir) params.orderByDir = args.orderByDir;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;
    if (args?.minimal) params.minimal = args.minimal;

    const response = await this.axiosInstance.get('/contacts', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total} contacts:\n${JSON.stringify(response.data.contacts, null, 2)}` 
      }],
    };
  }

  private async deleteContact(args: any) {
    const { id } = args;
    await this.axiosInstance.delete(`/contacts/${id}/delete`);
    return {
      content: [{ type: 'text', text: `Contact ${id} deleted successfully` }],
    };
  }

  private async addContactToSegment(args: any) {
    const { contactId, segmentId } = args;
    const response = await this.axiosInstance.post(`/segments/${segmentId}/contact/${contactId}/add`);
    return {
      content: [{ 
        type: 'text', 
        text: `Contact ${contactId} added to segment ${segmentId} successfully` 
      }],
    };
  }

  // Campaign Management Methods
  private async listCampaigns(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await this.axiosInstance.get('/campaigns', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total} campaigns:\n${JSON.stringify(response.data.campaigns, null, 2)}` 
      }],
    };
  }

  private async getCampaign(args: any) {
    const { id } = args;
    const response = await this.axiosInstance.get(`/campaigns/${id}`);
    return {
      content: [{ 
        type: 'text', 
        text: `Campaign details:\n${JSON.stringify(response.data.campaign, null, 2)}` 
      }],
    };
  }

  private async createCampaign(args: any) {
    const response = await this.axiosInstance.post('/campaigns/new', args);
    return {
      content: [{ 
        type: 'text', 
        text: `Campaign created successfully:\n${JSON.stringify(response.data.campaign, null, 2)}` 
      }],
    };
  }

  private async addContactToCampaign(args: any) {
    const { campaignId, contactId } = args;
    const response = await this.axiosInstance.post(`/campaigns/${campaignId}/contact/${contactId}/add`);
    return {
      content: [{ 
        type: 'text', 
        text: `Contact ${contactId} added to campaign ${campaignId} successfully` 
      }],
    };
  }

  // Enhanced Campaign Automation Methods
  private async createCampaignWithAutomation(args: any) {
    const payload: any = {
      name: args.name,
      description: args.description || '',
      isPublished: args.isPublished !== undefined ? args.isPublished : true,
      allowRestart: args.allowRestart || false
    };

    // Add events if provided
    if (args.events && args.events.length > 0) {
      payload.events = args.events;
    }

    // Add segments (lists) if provided
    if (args.segments && args.segments.length > 0) {
      payload.lists = args.segments.map((segmentId: number) => ({ id: segmentId }));
    }

    // Add forms if provided
    if (args.forms && args.forms.length > 0) {
      payload.forms = args.forms.map((formId: number) => ({ id: formId }));
    }

    // Add canvas settings if provided
    if (args.canvasSettings) {
      payload.canvasSettings = args.canvasSettings;
    }

    const response = await this.axiosInstance.post('/campaigns/new', payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Campaign with automation created successfully:\n${JSON.stringify(response.data.campaign, null, 2)}` 
      }],
    };
  }

  private async executeCampaign(args: any) {
    const { campaignId, contactIds } = args;
    const payload: any = {};
    
    if (contactIds && contactIds.length > 0) {
      payload.contactIds = contactIds;
    }

    const response = await this.axiosInstance.post(`/campaigns/${campaignId}/trigger`, payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Campaign ${campaignId} executed successfully:\n${JSON.stringify(response.data, null, 2)}` 
      }],
    };
  }

  private async getCampaignContacts(args: any) {
    const { campaignId, start, limit } = args;
    const params: any = {};
    if (start) params.start = start;
    if (limit) params.limit = Math.min(limit, 200);

    const response = await this.axiosInstance.get(`/campaigns/${campaignId}/contacts`, { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Campaign ${campaignId} contacts:\n${JSON.stringify(response.data, null, 2)}` 
      }],
    };
  }

  // Content Management Methods
  private async listAssets(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await this.axiosInstance.get('/assets', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} assets:\n${JSON.stringify(response.data.assets || response.data, null, 2)}` 
      }],
    };
  }

  private async getAsset(args: any) {
    const { id } = args;
    const response = await this.axiosInstance.get(`/assets/${id}`);
    return {
      content: [{ 
        type: 'text', 
        text: `Asset details:\n${JSON.stringify(response.data.asset, null, 2)}` 
      }],
    };
  }

  private async createAsset(args: any) {
    const payload: any = {
      title: args.title,
      description: args.description || '',
      storageLocation: args.storageLocation,
      isPublished: args.isPublished !== undefined ? args.isPublished : true
    };

    if (args.storageLocation === 'local') {
      payload.tempName = args.file;
    } else {
      payload.remotePath = args.file;
    }

    if (args.category) {
      payload.category = args.category;
    }

    const response = await this.axiosInstance.post('/assets/new', payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Asset created successfully:\n${JSON.stringify(response.data.asset, null, 2)}` 
      }],
    };
  }

  private async listPages(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await this.axiosInstance.get('/pages', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} pages:\n${JSON.stringify(response.data.pages || response.data, null, 2)}` 
      }],
    };
  }

  private async createPage(args: any) {
    const payload: any = {
      title: args.title,
      isPublished: args.isPublished !== undefined ? args.isPublished : true
    };

    if (args.alias) payload.alias = args.alias;
    if (args.customHtml) payload.customHtml = args.customHtml;
    if (args.template) payload.template = args.template;
    if (args.publishUp) payload.publishUp = args.publishUp;
    if (args.publishDown) payload.publishDown = args.publishDown;

    const response = await this.axiosInstance.post('/pages/new', payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Landing page created successfully:\n${JSON.stringify(response.data.page, null, 2)}` 
      }],
    };
  }

  private async listSms(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await this.axiosInstance.get('/smses', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} SMS templates:\n${JSON.stringify(response.data.smses || response.data, null, 2)}` 
      }],
    };
  }

  private async createSms(args: any) {
    const payload: any = {
      name: args.name,
      message: args.message,
      isPublished: args.isPublished !== undefined ? args.isPublished : true
    };

    const response = await this.axiosInstance.post('/smses/new', payload);
    return {
      content: [{ 
        type: 'text', 
        text: `SMS template created successfully:\n${JSON.stringify(response.data.sms, null, 2)}` 
      }],
    };
  }

  // Business Entity Methods
  private async listCompanies(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;

    const response = await this.axiosInstance.get('/companies', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} companies:\n${JSON.stringify(response.data.companies || response.data, null, 2)}` 
      }],
    };
  }

  private async createCompany(args: any) {
    const response = await this.axiosInstance.post('/companies/new', args);
    return {
      content: [{ 
        type: 'text', 
        text: `Company created successfully:\n${JSON.stringify(response.data.company, null, 2)}` 
      }],
    };
  }

  private async addContactToCompany(args: any) {
    const { contactId, companyId } = args;
    const response = await this.axiosInstance.post(`/companies/${companyId}/contact/${contactId}/add`);
    return {
      content: [{ 
        type: 'text', 
        text: `Contact ${contactId} added to company ${companyId} successfully` 
      }],
    };
  }

  private async createNote(args: any) {
    const payload: any = {
      text: args.text,
      type: args.type || 'general'
    };

    let endpoint = '/notes/new';
    if (args.contactId) {
      payload.lead = args.contactId;
    }
    if (args.companyId) {
      payload.company = args.companyId;
    }

    const response = await this.axiosInstance.post(endpoint, payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Note created successfully:\n${JSON.stringify(response.data.note, null, 2)}` 
      }],
    };
  }

  private async getContactNotes(args: any) {
    const { contactId, limit } = args;
    const params: any = {};
    if (limit) params.limit = Math.min(limit, 200);

    const response = await this.axiosInstance.get(`/contacts/${contactId}/notes`, { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Contact ${contactId} notes:\n${JSON.stringify(response.data.notes || response.data, null, 2)}` 
      }],
    };
  }

  private async listTags(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await this.axiosInstance.get('/tags', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} tags:\n${JSON.stringify(response.data.tags || response.data, null, 2)}` 
      }],
    };
  }

  private async createTag(args: any) {
    const response = await this.axiosInstance.post('/tags/new', { tag: args.tag });
    return {
      content: [{ 
        type: 'text', 
        text: `Tag created successfully:\n${JSON.stringify(response.data.tag, null, 2)}` 
      }],
    };
  }

  private async addContactTags(args: any) {
    const { contactId, tags } = args;
    const response = await this.axiosInstance.post(`/contacts/${contactId}/contact/add`, { tags });
    return {
      content: [{ 
        type: 'text', 
        text: `Tags added to contact ${contactId} successfully:\n${JSON.stringify(response.data, null, 2)}` 
      }],
    };
  }

  private async listCategories(args: any) {
    const params: any = {};
    if (args?.bundle) params.bundle = args.bundle;
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await this.axiosInstance.get('/categories', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} categories:\n${JSON.stringify(response.data.categories || response.data, null, 2)}` 
      }],
    };
  }

  private async createCategory(args: any) {
    const response = await this.axiosInstance.post('/categories/new', args);
    return {
      content: [{ 
        type: 'text', 
        text: `Category created successfully:\n${JSON.stringify(response.data.category, null, 2)}` 
      }],
    };
  }

  // Advanced Feature Methods
  private async addContactPoints(args: any) {
    const { contactId, points, eventName, actionName } = args;
    const payload = {
      eventName: eventName || 'API Point Addition',
      actionName: actionName || 'Manual',
      points: points
    };

    const response = await this.axiosInstance.post(`/contacts/${contactId}/points/plus/${points}`, payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Added ${points} points to contact ${contactId} successfully:\n${JSON.stringify(response.data, null, 2)}` 
      }],
    };
  }

  private async subtractContactPoints(args: any) {
    const { contactId, points, eventName, actionName } = args;
    const payload = {
      eventName: eventName || 'API Point Subtraction',
      actionName: actionName || 'Manual',
      points: points
    };

    const response = await this.axiosInstance.post(`/contacts/${contactId}/points/minus/${points}`, payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Subtracted ${points} points from contact ${contactId} successfully:\n${JSON.stringify(response.data, null, 2)}` 
      }],
    };
  }

  private async listStages(args: any) {
    const params: any = {};
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await this.axiosInstance.get('/stages', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} stages:\n${JSON.stringify(response.data.stages || response.data, null, 2)}` 
      }],
    };
  }

  private async changeContactStage(args: any) {
    const { contactId, stageId } = args;
    const response = await this.axiosInstance.post(`/contacts/${contactId}/stages/${stageId}/add`);
    return {
      content: [{ 
        type: 'text', 
        text: `Contact ${contactId} stage changed to ${stageId} successfully:\n${JSON.stringify(response.data, null, 2)}` 
      }],
    };
  }

  private async listContactFields(args: any) {
    const params: any = {};
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await this.axiosInstance.get('/fields/contact', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} contact fields:\n${JSON.stringify(response.data.fields || response.data, null, 2)}` 
      }],
    };
  }

  private async createContactField(args: any) {
    const payload: any = {
      label: args.label,
      type: args.type,
      isRequired: args.isRequired || false,
      isPubliclyUpdatable: args.isPubliclyUpdatable || false
    };

    if (args.alias) payload.alias = args.alias;
    if (args.defaultValue) payload.defaultValue = args.defaultValue;
    if (args.properties) payload.properties = args.properties;

    const response = await this.axiosInstance.post('/fields/contact/new', payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Contact field created successfully:\n${JSON.stringify(response.data.field, null, 2)}` 
      }],
    };
  }

  // Integration & Automation Methods
  private async listWebhooks(args: any) {
    const params: any = {};
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await this.axiosInstance.get('/hooks', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} webhooks:\n${JSON.stringify(response.data.hooks || response.data, null, 2)}` 
      }],
    };
  }

  private async createWebhook(args: any) {
    const payload: any = {
      name: args.name,
      webhookUrl: args.webhookUrl,
      triggers: args.triggers,
      eventsOrderbyDir: args.eventsOrderbyDir || 'DESC'
    };

    if (args.description) payload.description = args.description;
    if (args.secret) payload.secret = args.secret;

    const response = await this.axiosInstance.post('/hooks/new', payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Webhook created successfully:\n${JSON.stringify(response.data.hook, null, 2)}` 
      }],
    };
  }

  private async uploadFile(args: any) {
    const payload: any = {
      file: args.file,
      folder: args.folder || 'assets'
    };

    // Note: This is a simplified implementation. Real file upload would need proper multipart/form-data handling
    const response = await this.axiosInstance.post('/files/new', payload);
    return {
      content: [{ 
        type: 'text', 
        text: `File uploaded successfully:\n${JSON.stringify(response.data, null, 2)}` 
      }],
    };
  }

  private async listReports(args: any) {
    const params: any = {};
    if (args?.limit) params.limit = Math.min(args.limit, 200);

    const response = await this.axiosInstance.get('/reports', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total || 0} reports:\n${JSON.stringify(response.data.reports || response.data, null, 2)}` 
      }],
    };
  }

  private async createReport(args: any) {
    const payload: any = {
      name: args.name,
      source: args.source,
      columns: args.columns
    };

    if (args.description) payload.description = args.description;
    if (args.filters) payload.filters = args.filters;
    if (args.groupBy) payload.groupBy = args.groupBy;

    const response = await this.axiosInstance.post('/reports/new', payload);
    return {
      content: [{ 
        type: 'text', 
        text: `Report created successfully:\n${JSON.stringify(response.data.report, null, 2)}` 
      }],
    };
  }

  // Email Management Methods
  private async sendEmail(args: any) {
    const { emailId, contactIds, contactEmails } = args;
    const data: any = { id: emailId };
    
    if (contactIds) data.contactIds = contactIds;
    if (contactEmails) data.contactEmails = contactEmails;

    const response = await this.axiosInstance.post(`/emails/${emailId}/contact/send`, data);
    return {
      content: [{ 
        type: 'text', 
        text: `Email sent successfully:\n${JSON.stringify(response.data, null, 2)}` 
      }],
    };
  }

  private async listEmails(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await this.axiosInstance.get('/emails', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total} emails:\n${JSON.stringify(response.data.emails, null, 2)}` 
      }],
    };
  }

  private async getEmail(args: any) {
    const { id } = args;
    const response = await this.axiosInstance.get(`/emails/${id}`);
    return {
      content: [{ 
        type: 'text', 
        text: `Email details:\n${JSON.stringify(response.data.email, null, 2)}` 
      }],
    };
  }

  private async createEmailTemplate(args: any) {
    const response = await this.axiosInstance.post('/emails/new', args);
    return {
      content: [{ 
        type: 'text', 
        text: `Email template created successfully:\n${JSON.stringify(response.data.email, null, 2)}` 
      }],
    };
  }

  // Form Management Methods
  private async listForms(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await this.axiosInstance.get('/forms', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total} forms:\n${JSON.stringify(response.data.forms, null, 2)}` 
      }],
    };
  }

  private async getForm(args: any) {
    const { id } = args;
    const response = await this.axiosInstance.get(`/forms/${id}`);
    return {
      content: [{ 
        type: 'text', 
        text: `Form details:\n${JSON.stringify(response.data.form, null, 2)}` 
      }],
    };
  }

  private async getFormSubmissions(args: any) {
    const { formId, limit, start, dateFrom, dateTo } = args;
    const params: any = {};
    if (limit) params.limit = Math.min(limit, 200);
    if (start) params.start = start;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const response = await this.axiosInstance.get(`/forms/${formId}/submissions`, { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total} form submissions:\n${JSON.stringify(response.data.submissions, null, 2)}` 
      }],
    };
  }

  // Segment Management Methods
  private async listSegments(args: any) {
    const params: any = {};
    if (args?.search) params.search = args.search;
    if (args?.limit) params.limit = Math.min(args.limit, 200);
    if (args?.start) params.start = args.start;
    if (args?.publishedOnly) params.publishedOnly = args.publishedOnly;

    const response = await this.axiosInstance.get('/segments', { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total} segments:\n${JSON.stringify(response.data.lists, null, 2)}` 
      }],
    };
  }

  private async createSegment(args: any) {
    const response = await this.axiosInstance.post('/segments/new', args);
    return {
      content: [{ 
        type: 'text', 
        text: `Segment created successfully:\n${JSON.stringify(response.data.list, null, 2)}` 
      }],
    };
  }

  private async getSegmentContacts(args: any) {
    const { segmentId, limit, start } = args;
    const params: any = {};
    if (limit) params.limit = Math.min(limit, 200);
    if (start) params.start = start;

    const response = await this.axiosInstance.get(`/segments/${segmentId}/contacts`, { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Found ${response.data.total} contacts in segment:\n${JSON.stringify(response.data.contacts, null, 2)}` 
      }],
    };
  }

  // Analytics Methods
  private async getContactActivity(args: any) {
    const { contactId, search, includeEvents, excludeEvents, dateFrom, dateTo, limit } = args;
    const params: any = {};
    if (search) params.search = search;
    if (includeEvents) params.includeEvents = includeEvents;
    if (excludeEvents) params.excludeEvents = excludeEvents;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (limit) params.limit = Math.min(limit, 200);

    const response = await this.axiosInstance.get(`/contacts/${contactId}/activity`, { params });
    return {
      content: [{ 
        type: 'text', 
        text: `Contact activity:\n${JSON.stringify(response.data.events, null, 2)}` 
      }],
    };
  }

  private async getEmailStats(args: any) {
    const { emailId } = args;
    const response = await this.axiosInstance.get(`/emails/${emailId}/stats`);
    return {
      content: [{ 
        type: 'text', 
        text: `Email statistics:\n${JSON.stringify(response.data.stats, null, 2)}` 
      }],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Mautic MCP server running on stdio');
  }
}

const server = new MauticServer();
server.run().catch(console.error);
