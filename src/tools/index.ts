import type { MauticApiClient } from '../api/client.js';
import type { ToolDefinition, ToolResult } from '../types/index.js';

import * as contacts from './contacts.js';
import * as campaigns from './campaigns.js';
import * as emails from './emails.js';
import * as forms from './forms.js';
import * as segments from './segments.js';
import * as content from './content.js';
import * as business from './business.js';
import * as advanced from './advanced.js';
import * as integration from './integration.js';
import * as projects from './projects.js';

const modules = [
  contacts,
  campaigns,
  emails,
  forms,
  segments,
  content,
  business,
  advanced,
  integration,
  projects,
];

export const allToolDefinitions: ToolDefinition[] = modules.flatMap(m => m.toolDefinitions);

const allHandlers: Record<string, (client: MauticApiClient, args: any) => Promise<ToolResult>> = {};
for (const mod of modules) {
  Object.assign(allHandlers, mod.toolHandlers);
}

export async function dispatchTool(
  toolName: string,
  client: MauticApiClient,
  args: any,
): Promise<ToolResult> {
  const handler = allHandlers[toolName];
  if (!handler) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
      isError: true,
    };
  }
  return handler(client, args);
}
