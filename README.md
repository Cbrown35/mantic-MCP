# Mautic MCP Server

A comprehensive Model Context Protocol (MCP) server that provides full integration with Mautic marketing automation platform.

[![GitHub Stars](https://img.shields.io/github/stars/minholi/mautic-mcp?style=social)](https://github.com/minholi/mautic-mcp/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/minholi/mautic-mcp)](https://github.com/minholi/mautic-mcp/issues)
[![GitHub License](https://img.shields.io/github/license/minholi/mautic-mcp)](https://github.com/minholi/mautic-mcp/blob/main/LICENSE)

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/minholi/mautic-mcp.git
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
- "Create a new contact named John Doe"
- "List all email campaigns"

## Features

This MCP server provides complete access to your Mautic instance with the following capabilities:

### 🔐 Authentication
- Basic authentication with username and password
- Secure credential management through environment variables

### 👥 Contact Management
- **create_contact** - Create new contacts with custom fields
- **update_contact** - Update existing contact information
- **get_contact** - Retrieve contact details by ID or email
- **search_contacts** - Search contacts with filters and pagination
- **delete_contact** - Remove contacts from Mautic
- **add_contact_to_segment** - Add contacts to specific segments

### 📧 Campaign Management
- **list_campaigns** - Get all campaigns with status and statistics
- **get_campaign** - Get detailed campaign information
- **create_campaign** - Create new campaigns
- **add_contact_to_campaign** - Add contacts to campaigns
- **create_campaign_with_automation** - Create campaigns with full event automation (🔥 NEW)
- **execute_campaign** - Manually execute/trigger campaigns (🔥 NEW)
- **get_campaign_contacts** - Get contacts in a campaign with their status (🔥 NEW)

### ✉️ Email Operations
- **send_email** - Send emails to specific contacts
- **list_emails** - Get all email templates and campaigns
- **get_email** - Get detailed email information
- **create_email_template** - Create new email templates
- **get_email_stats** - Get email performance statistics

### 📝 Form Management
- **list_forms** - Get all forms with submission counts
- **get_form** - Get form details and fields
- **get_form_submissions** - Get form submission data

### 🎯 Segment Management
- **list_segments** - Get all contact segments
- **create_segment** - Create new contact segments with filters
- **get_segment_contacts** - Get contacts in a specific segment

### 📊 Analytics & Reporting
- **get_contact_activity** - Get contact interaction history
- **get_email_stats** - Get email performance statistics
- **list_reports** - Get all reports (⭐ NEW)
- **create_report** - Create custom reports (⭐ NEW)

### 📎 Content Management
- **list_assets** - Get all assets (PDFs, images, documents) (⭐ NEW)
- **get_asset** - Get asset details by ID (⭐ NEW)
- **create_asset** - Create new assets (local or remote) (⭐ NEW)
- **list_pages** - Get all landing pages (⭐ NEW)
- **create_page** - Create new landing pages (⭐ NEW)
- **list_sms** - Get all SMS templates (⭐ NEW)
- **create_sms** - Create SMS templates (⭐ NEW)

### 🏢 Business Entities
- **list_companies** - Get all companies (⭐ NEW)
- **create_company** - Create new companies (⭐ NEW)
- **add_contact_to_company** - Associate contacts with companies (⭐ NEW)
- **create_note** - Add notes to contacts or companies (⭐ NEW)
- **get_contact_notes** - Get all notes for a contact (⭐ NEW)
- **list_tags** - Get all available tags (⭐ NEW)
- **create_tag** - Create new tags (⭐ NEW)
- **add_contact_tags** - Add tags to contacts (⭐ NEW)
- **list_categories** - Get all categories (⭐ NEW)
- **create_category** - Create new categories (⭐ NEW)

### 🎯 Advanced Features
- **add_contact_points** - Add points to contacts (📈 NEW)
- **subtract_contact_points** - Subtract points from contacts (📈 NEW)
- **list_stages** - Get all lifecycle stages (📈 NEW)
- **change_contact_stage** - Change contact's lifecycle stage (📈 NEW)
- **list_contact_fields** - Get all contact custom fields (📈 NEW)
- **create_contact_field** - Create new contact custom fields (📈 NEW)

### 🔧 Integration & Automation
- **list_webhooks** - Get all webhooks (🔧 NEW)
- **create_webhook** - Create new webhooks (🔧 NEW)
- **upload_file** - Upload files to Mautic (🔧 NEW)

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Access to a Mautic instance with API credentials

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/minholi/mautic-mcp.git
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
   MAUTIC_USERNAME=your_username_here
   MAUTIC_PASSWORD=your_password_here
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
           "MAUTIC_USERNAME": "your_username",
           "MAUTIC_PASSWORD": "your_password"
         },
         "disabled": false,
         "autoApprove": []
       }
     }
   }
   ```

## Configuration

### Environment Variables

The server requires the following environment variables:

| Variable | Description | Example |
|----------|-------------|---------|
| `MAUTIC_BASE_URL` | Your Mautic API base URL | `https://your-mautic.com/api/` |
| `MAUTIC_USERNAME` | Your Mautic username | `admin` |
| `MAUTIC_PASSWORD` | Your Mautic password | `your_password` |

### Obtaining Mautic API Credentials

1. Log into your Mautic instance as an administrator
2. Go to Settings → Configuration → API Settings
3. Enable API access and ensure Basic Auth is enabled
4. Use your Mautic admin username and password for authentication

## Usage Examples

Once the server is running, you can use it through MCP tool calls:

### Create a Contact
```
Create a new contact with email "john@example.com", first name "John", and last name "Doe"
```

### Search Contacts
```
Search for all contacts with "gmail" in their email address
```

### Send Email
```
Send email template ID 5 to contact ID 123
```

### Get Campaign Statistics
```
Get detailed information for campaign ID 10
```

### List Forms
```
Show me all published forms with their submission counts
```

## API Endpoints

The server connects to your Mautic instance at `https://mailer.dzind.com/api/` and uses the following main endpoints:

- `/contacts` - Contact management
- `/campaigns` - Campaign operations
- `/emails` - Email management
- `/forms` - Form operations
- `/segments` - Segment management

## Error Handling

The server includes comprehensive error handling:
- Basic authentication for simple setup
- Detailed error messages from Mautic API
- Graceful handling of authentication failures
- Retry logic for transient errors

## Security

- All credentials are stored as environment variables
- Basic authentication with username/password
- No sensitive data is logged or exposed
- Secure HTTPS communication with Mautic API

## Development

To modify or extend the server:

1. Edit the source code in `src/index.ts`
2. Build the server: `npm run build`
3. The server will automatically reload with your changes

## 🚀 Deployment

### Production Deployment

1. **Clone and build:**
   ```bash
   git clone https://github.com/minholi/mautic-mcp.git
   cd mantic-MCP
   npm install
   npm run build
   ```

2. **Set up environment variables** in your production environment
3. **Configure your MCP client** to point to the built server
4. **Monitor logs** for any authentication or API issues

### Docker Deployment (Coming Soon)

Docker support is planned for easier deployment and scaling.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork:**
   ```bash
   git clone https://github.com/yourusername/mantic-MCP.git
   cd mantic-MCP
   ```

3. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Install dependencies:**
   ```bash
   npm install
   ```

5. **Make your changes** and test thoroughly
6. **Build and test:**
   ```bash
   npm run build
   # Test your changes with a real Mautic instance
   ```

7. **Commit and push:**
   ```bash
   git add .
   git commit -m "Add your feature description"
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request** on GitHub

### Contribution Guidelines

- Follow TypeScript best practices
- Add comprehensive error handling
- Update documentation for new features
- Test with real Mautic instances when possible
- Maintain backward compatibility

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/Cbrown35/mantic-MCP/issues) with:

- Clear description of the problem or feature
- Steps to reproduce (for bugs)
- Your environment details (Node.js version, Mautic version, etc.)
- Expected vs actual behavior

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- Integrates with [Mautic](https://www.mautic.org/) marketing automation platform
- Inspired by the need for seamless marketing automation integration

## Support

This server provides comprehensive integration with Mautic's REST API. For specific API documentation, refer to your Mautic instance's API documentation.

### Getting Help

- 📖 [Documentation](https://github.com/Cbrown35/mantic-MCP/blob/main/README.md)
- 🐛 [Report Issues](https://github.com/Cbrown35/mantic-MCP/issues)
- 💬 [Discussions](https://github.com/Cbrown35/mantic-MCP/discussions)
- 📧 Contact: [Create an issue](https://github.com/Cbrown35/mantic-MCP/issues/new) for support
