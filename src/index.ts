#!/usr/bin/env node

/**
 * Mautic MCP Server v2.0 - Mautic 7 (Columba Edition)
 *
 * Full integration with Mautic marketing automation platform.
 * Supports both v1 (FOSRestBundle) and v2 (API Platform) endpoints.
 *
 * Features:
 * - OAuth2 authentication with automatic token refresh
 * - Contact, campaign, email, form, segment management
 * - NEW: Projects (API v2), campaign import/export/clone
 * - NEW: Segment-based email sending, reply tracking
 * - NEW: Campaign analytics (event details, graph stats, map stats)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';

import { MauticApiClient } from './api/client.js';
import { allToolDefinitions, dispatchTool } from './tools/index.js';

// Environment variables for Mautic configuration
const MAUTIC_BASE_URL = process.env.MAUTIC_BASE_URL;
const MAUTIC_CLIENT_ID = process.env.MAUTIC_CLIENT_ID;
const MAUTIC_CLIENT_SECRET = process.env.MAUTIC_CLIENT_SECRET;
const MAUTIC_TOKEN_ENDPOINT = process.env.MAUTIC_TOKEN_ENDPOINT;

if (!MAUTIC_BASE_URL || !MAUTIC_CLIENT_ID || !MAUTIC_CLIENT_SECRET || !MAUTIC_TOKEN_ENDPOINT) {
  throw new Error('Missing required Mautic environment variables: MAUTIC_BASE_URL, MAUTIC_CLIENT_ID, MAUTIC_CLIENT_SECRET, MAUTIC_TOKEN_ENDPOINT');
}

class MauticServer {
  private server: Server;
  private apiClient: MauticApiClient;

  constructor() {
    this.server = new Server(
      {
        name: "mautic-server",
        version: "2.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.apiClient = new MauticApiClient({
      baseUrl: MAUTIC_BASE_URL!,
      clientId: MAUTIC_CLIENT_ID!,
      clientSecret: MAUTIC_CLIENT_SECRET!,
      tokenEndpoint: MAUTIC_TOKEN_ENDPOINT!,
    });

    this.setupToolHandlers();

    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: allToolDefinitions,
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        return await dispatchTool(
          request.params.name,
          this.apiClient,
          request.params.arguments,
        );
      } catch (error) {
        if (error instanceof McpError) {
          throw error;
        }
        if (axios.isAxiosError(error)) {
          const message = MauticApiClient.extractErrorMessage(error);
          return {
            content: [{ type: 'text', text: `Mautic API Error: ${message}` }],
            isError: true,
          };
        }
        throw new McpError(ErrorCode.InternalError, `Unexpected error: ${error}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Mautic MCP server v2.0 running on stdio (Mautic 7 support)');
  }
}

const server = new MauticServer();
server.run().catch(console.error);
