# Mautic MCP Server

A comprehensive Model Context Protocol (MCP) server for Mautic 7 (Columba Edition) marketing automation platform. Supports both v1 (FOSRestBundle) and v2 (API Platform) endpoints with 68 tools.

[![GitHub Stars](https://img.shields.io/github/stars/Cbrown35/mantic-MCP?style=social)](https://github.com/Cbrown35/mantic-MCP/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/Cbrown35/mantic-MCP)](https://github.com/Cbrown35/mantic-MCP/issues)
[![GitHub License](https://img.shields.io/github/license/Cbrown35/mantic-MCP)](https://github.com/Cbrown35/mantic-MCP/blob/main/LICENSE)

## Quick Start

```bash
# Clone and setup
git clone https://github.com/Cbrown35/mantic-MCP.git
cd mantic-MCP
npm install

# Configure your Mautic credentials
cp .env.example .env
# Edit .env with your Mautic API credentials

# Build and run
npm run build
```

Then add the server to your MCP configuration and start using natural language commands like:
- "Search for all contacts with gmail in their email"
- "Create a new project to organize my Q1 campaign resources"
- "Clone campaign 5 and export it for staging"
- "Send email template 12 to its assigned segment"

## What's New in v2.0 (Mautic 7 Support)

### Projects (API v2)
Organize marketing resources under a single logical structure using Mautic 7's new API Platform v2 endpoints.
- **list_projects**, **get_project**, **create_project**, **update_project**, **patch_project**, **delete_project**

### Campaign Import/Export
Move complete campaign setups between environments.
- **clone_campaign** - Clone an existing campaign
- **export_campaign** - Export campaign data with all related assets
- **import_campaign** - Import a campaign from JSON data

### Campaign Analytics
- **get_campaign_event_details** - Detailed metrics for campaign events
- **get_campaign_graph_stats** - Campaign graph statistics for date ranges
- **get_campaign_map_stats** - Geographic map statistics

### Segment-Based Email Sending
- **send_email_to_segment** - Send email to assigned segments with real-time audience adaptation

### Email Reply Tracking
- **record_email_reply** - Record email replies by tracking hash
- **get_email_graph_stats** - Email graph statistics for date ranges

### Deprecation Notice
SMS API classes have been removed in Mautic 7. The `list_sms` and `create_sms` tools include deprecation warnings.

## Features

### Authentication
- OAuth2 authentication with automatic token refresh
- Secure credential management through environment variables
- Dual API support: v1 (FOSRestBundle) and v2 (API Platform)

### Contact Management (6 tools)
- **create_contact** - Create new contacts with custom fields
- **update_contact** - Update existing contact information
- **get_contact** - Retrieve contact details by ID or email
- **search_contacts** - Search contacts with filters and pagination
- **delete_contact** - Remove contacts from Mautic
- **add_contact_to_segment** - Add contacts to specific segments

### Campaign Management (13 tools)
- **list_campaigns** - Get all campaigns with status and statistics
- **get_campaign** - Get detailed campaign information
- **create_campaign** - Create new campaigns
- **add_contact_to_campaign** - Add contacts to campaigns
- **create_campaign_with_automation** - Create campaigns with full event automation
- **execute_campaign** - Manually execute/trigger campaigns
- **get_campaign_contacts** - Get contacts in a campaign with their status
- **clone_campaign** - Clone an existing campaign (Mautic 7)
- **export_campaign** - Export campaign data with assets (Mautic 7)
- **import_campaign** - Import campaign from JSON data (Mautic 7)
- **get_campaign_event_details** - Campaign event metrics (Mautic 7)
- **get_campaign_graph_stats** - Campaign graph statistics (Mautic 7)
- **get_campaign_map_stats** - Campaign geographic stats (Mautic 7)

### Email Operations (8 tools)
- **send_email** - Send emails to specific contacts
- **list_emails** - Get all email templates and campaigns
- **get_email** - Get detailed email information
- **create_email_template** - Create new email templates
- **get_email_stats** - Get email performance statistics
- **send_email_to_segment** - Send email to segments (Mautic 7)
- **record_email_reply** - Record email reply by tracking hash (Mautic 7)
- **get_email_graph_stats** - Email graph statistics (Mautic 7)

### Form Management (3 tools)
- **list_forms** - Get all forms with submission counts
- **get_form** - Get form details and fields
- **get_form_submissions** - Get form submission data

### Segment Management (3 tools)
- **list_segments** - Get all contact segments
- **create_segment** - Create new contact segments with filters
- **get_segment_contacts** - Get contacts in a specific segment

### Content Management (7 tools)
- **list_assets** - Get all assets (PDFs, images, documents)
- **get_asset** - Get asset details by ID
- **create_asset** - Create new assets (local or remote)
- **list_pages** - Get all landing pages
- **create_page** - Create new landing pages
- **list_sms** - Get all SMS templates [DEPRECATED in Mautic 7]
- **create_sms** - Create SMS templates [DEPRECATED in Mautic 7]

### Business Entities (10 tools)
- **list_companies** - Get all companies
- **create_company** - Create new companies
- **add_contact_to_company** - Associate contacts with companies
- **create_note** - Add notes to contacts or companies
- **get_contact_notes** - Get all notes for a contact
- **list_tags** - Get all available tags
- **create_tag** - Create new tags
- **add_contact_tags** - Add tags to contacts
- **list_categories** - Get all categories
- **create_category** - Create new categories

### Advanced Features (7 tools)
- **add_contact_points** - Add points to contacts
- **subtract_contact_points** - Subtract points from contacts
- **list_stages** - Get all lifecycle stages
- **change_contact_stage** - Change contact's lifecycle stage
- **list_contact_fields** - Get all contact custom fields
- **create_contact_field** - Create new contact custom fields
- **get_contact_activity** - Get contact interaction history

### Integration & Automation (5 tools)
- **list_webhooks** - Get all webhooks
- **create_webhook** - Create new webhooks
- **upload_file** - Upload files to Mautic
- **list_reports** - Get all reports
- **create_report** - Create custom reports

### Project Management - API v2 (6 tools, Mautic 7)
- **list_projects** - List all projects
- **get_project** - Get project details
- **create_project** - Create a new project
- **update_project** - Fully update an existing project
- **patch_project** - Partially update a project
- **delete_project** - Delete a project

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Access to a Mautic 7 instance with API credentials

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Cbrown35/mantic-MCP.git
   cd mantic-MCP
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your Mautic API credentials:
   ```env
   MAUTIC_BASE_URL=https://your-mautic-instance.com/api/
   MAUTIC_CLIENT_ID=your_client_id_here
   MAUTIC_CLIENT_SECRET=your_client_secret_here
   MAUTIC_TOKEN_ENDPOINT=https://your-mautic-instance.com/oauth/v2/token
   ```

4. **Build the server:**
   ```bash
   npm run build
   ```

5. **Configure MCP settings:**
   Add the server to your MCP configuration file:
   ```json
   {
     "mcpServers": {
       "mautic-server": {
         "command": "node",
         "args": ["/path/to/mautic-server/build/index.js"],
         "env": {
           "MAUTIC_BASE_URL": "https://your-mautic-instance.com/api/",
           "MAUTIC_CLIENT_ID": "your_client_id",
           "MAUTIC_CLIENT_SECRET": "your_client_secret",
           "MAUTIC_TOKEN_ENDPOINT": "https://your-mautic-instance.com/oauth/v2/token"
         },
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

## Architecture

### Dual API Support

Mautic 7 has a three-tier API architecture:

| Layer | Purpose | Endpoints |
|-------|---------|-----------|
| **API Platform 4.x** | New v2 REST endpoints (JSON-LD/Hydra) | `/api/v2/projects` |
| **FOSRestBundle** | Existing v1 endpoints | `/api/contacts`, `/api/campaigns`, etc. |
| **FOSOAuthServerBundle** | OAuth2 authentication | `/oauth/v2/token` |

The MCP server automatically manages both API versions. v1 endpoints use the configured `MAUTIC_BASE_URL` directly, while v2 endpoints are derived automatically.

### Project Structure

```
src/
├── index.ts              # Entry point: server setup and startup
├── types/                # TypeScript interfaces
│   ├── common.ts         # Shared types (OAuth2Token, ToolResult, etc.)
│   ├── contacts.ts       # MauticContact interface
│   ├── campaigns.ts      # MauticCampaign interface
│   ├── emails.ts         # MauticEmail interface
│   ├── forms.ts          # MauticForm interface
│   ├── segments.ts       # MauticSegment interface
│   └── projects.ts       # MauticProject interface (Mautic 7)
├── api/
│   └── client.ts         # Dual API client (v1 + v2) with OAuth2
└── tools/
    ├── index.ts           # Tool registry and dispatch
    ├── contacts.ts        # Contact tools
    ├── campaigns.ts       # Campaign tools (includes Mautic 7 additions)
    ├── emails.ts          # Email tools (includes Mautic 7 additions)
    ├── forms.ts           # Form tools
    ├── segments.ts        # Segment tools
    ├── projects.ts        # Project tools (Mautic 7 API v2)
    ├── content.ts         # Asset, page, and SMS tools
    ├── business.ts        # Company, note, tag, and category tools
    ├── advanced.ts        # Points, stages, fields, and activity tools
    └── integration.ts     # Webhook, file, and report tools
```

## Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MAUTIC_BASE_URL` | Your Mautic API base URL | `https://your-mautic.com/api/` |
| `MAUTIC_CLIENT_ID` | OAuth2 Client ID | `1_abc123...` |
| `MAUTIC_CLIENT_SECRET` | OAuth2 Client Secret | `secret123...` |
| `MAUTIC_TOKEN_ENDPOINT` | OAuth2 Token Endpoint | `https://your-mautic.com/oauth/v2/token` |

### Obtaining Mautic API Credentials

1. Log into your Mautic instance as an administrator
2. Go to Settings > Configuration > API Settings
3. Enable API access
4. Go to Settings > API Credentials
5. Create a new API credential with OAuth2 authorization
6. Note down the Client ID and Client Secret

## Error Handling

The server includes comprehensive error handling:
- Automatic OAuth2 token refresh
- Detailed error messages from both v1 and v2 API formats
- Graceful handling of authentication failures
- Retry logic for transient errors

## Security

- All credentials are stored as environment variables
- OAuth2 tokens are automatically refreshed
- No sensitive data is logged or exposed
- Secure HTTPS communication with Mautic API

## Development

To modify or extend the server:

1. Edit the source code in the `src/` directory
2. Add new tools by creating a file in `src/tools/` and importing it in `src/tools/index.ts`
3. Build the server: `npm run build`
4. Test with the MCP Inspector: `npm run inspector`

## Contributing

We welcome contributions! Please see the repository for contribution guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk) v1.26.0
- Integrates with [Mautic 7](https://www.mautic.org/) (Columba Edition)
