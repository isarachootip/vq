import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'vService Installer Management System API',
      version: '1.0.0',
      description: 'API Documentation for vService Installer Management System (Users, Zones, Technicians, Standard Costs, Integrations, and LINE Bot)',
      contact: {
        name: 'vService Engineering Team',
      },
    },
    servers: [
      {
        url: 'https://vibepjm.online',
        description: 'Production Server',
      },
      {
        url: 'http://localhost:80',
        description: 'Local Development Server',
      },
    ],
    tags: [
      { name: 'System', description: 'System health and database status' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Zones', description: 'Coverage zones management' },
      { name: 'Technicians', description: 'Technician profile and skill management' },
      { name: 'Standard Costs', description: 'Standard cost and pricing management' },
      { name: 'Integrations', description: 'BuildFlow / E-ordering dispatch and audit logs' },
      { name: 'LINE Webhook', description: 'LINE OA integration endpoints' },
    ],
    paths: {
      '/api/health': {
        get: {
          tags: ['System'],
          summary: 'Check API Health Status',
          responses: {
            200: {
              description: 'System is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', example: '2026-08-02T15:00:00.000Z' },
                      database: { type: 'string', example: 'connected' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/db/status': {
        get: {
          tags: ['System'],
          summary: 'Check PostgreSQL Database Connection Status',
          responses: {
            200: {
              description: 'Database connection details',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      connected: { type: 'boolean', example: true },
                      mode: { type: 'string', example: 'postgresql' },
                      time: { type: 'string', example: '2026-08-02T15:00:00.000Z' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'Get all users',
          responses: {
            200: { description: 'List of users' },
          },
        },
        post: {
          tags: ['Users'],
          summary: 'Create a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string', example: 'tech001' },
                    name: { type: 'string', example: 'สมชาย ช่างดี' },
                    role: { type: 'string', example: 'Technician' },
                    email: { type: 'string', example: 'somchai@example.com' },
                    phone: { type: 'string', example: '0812345678' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User created' },
          },
        },
      },
      '/api/users/{id}': {
        put: {
          tags: ['Users'],
          summary: 'Update existing user',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'User updated' } },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete user by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'User deleted' } },
        },
      },
      '/api/users/bulk': {
        post: {
          tags: ['Users'],
          summary: 'Bulk create/import users',
          responses: { 200: { description: 'Bulk users created' } },
        },
      },
      '/api/zones': {
        get: {
          tags: ['Zones'],
          summary: 'Get all coverage zones',
          responses: { 200: { description: 'List of zones' } },
        },
      },
      '/api/zones/bulk': {
        post: {
          tags: ['Zones'],
          summary: 'Bulk create/import zones',
          responses: { 200: { description: 'Bulk zones created' } },
        },
      },
      '/api/zones/{id}': {
        delete: {
          tags: ['Zones'],
          summary: 'Delete zone by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Zone deleted' } },
        },
      },
      '/api/technicians': {
        get: {
          tags: ['Technicians'],
          summary: 'Get all technicians',
          responses: { 200: { description: 'List of technicians' } },
        },
      },
      '/api/technicians/bulk': {
        post: {
          tags: ['Technicians'],
          summary: 'Bulk create/import technicians',
          responses: { 200: { description: 'Bulk technicians created' } },
        },
      },
      '/api/technicians/{id}': {
        delete: {
          tags: ['Technicians'],
          summary: 'Delete technician by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Technician deleted' } },
        },
      },
      '/api/standard-costs': {
        get: {
          tags: ['Standard Costs'],
          summary: 'Get standard costs list',
          responses: { 200: { description: 'List of standard costs' } },
        },
      },
      '/api/standard-costs/bulk': {
        post: {
          tags: ['Standard Costs'],
          summary: 'Bulk create standard costs',
          responses: { 200: { description: 'Bulk standard costs created' } },
        },
      },
      '/api/standard-costs/{id}': {
        delete: {
          tags: ['Standard Costs'],
          summary: 'Delete standard cost by ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Standard cost deleted' } },
        },
      },
      '/api/buildflow/dispatch': {
        post: {
          tags: ['Integrations'],
          summary: 'Dispatch work order to BuildFlow / STS system',
          responses: { 200: { description: 'Work order dispatched successfully' } },
        },
      },
      '/api/integration-logs': {
        get: {
          tags: ['Integrations'],
          summary: 'Get integration audit logs',
          responses: { 200: { description: 'List of audit logs' } },
        },
        delete: {
          tags: ['Integrations'],
          summary: 'Clear all integration audit logs',
          responses: { 200: { description: 'Logs cleared successfully' } },
        },
      },
      '/api/line/config': {
        get: {
          tags: ['LINE Webhook'],
          summary: 'Get LINE OA Configuration',
          responses: { 200: { description: 'LINE configuration' } },
        },
        post: {
          tags: ['LINE Webhook'],
          summary: 'Save LINE OA Configuration',
          responses: { 200: { description: 'Configuration saved' } },
        },
      },
      '/api/line/conversations': {
        get: {
          tags: ['LINE Webhook'],
          summary: 'Get LINE conversation history',
          responses: { 200: { description: 'List of conversations' } },
        },
      },
      '/api/line/reply': {
        post: {
          tags: ['LINE Webhook'],
          summary: 'Send reply to LINE user',
          responses: { 200: { description: 'Reply sent' } },
        },
      },
      '/api/line/clear': {
        post: {
          tags: ['LINE Webhook'],
          summary: 'Clear LINE conversation history',
          responses: { 200: { description: 'Conversations cleared' } },
        },
      },
    },
  },
  apis: ['./server.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
