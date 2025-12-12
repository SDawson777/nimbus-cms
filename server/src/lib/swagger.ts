import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Nimbus Cannabis OS CMS API",
      version: "1.0.0",
      description:
        "Enterprise-grade headless CMS API for cannabis retail with multi-tenancy, personalization, scheduling, and compliance features.",
      contact: {
        name: "Nimbus CMS Support",
        email: "support@nimbuscms.io",
      },
      license: {
        name: "Proprietary",
      },
    },
    servers: ((): { url: string; description?: string }[] => {
      const prod =
        process.env.SWAGGER_PROD_URL ||
        "https://nimbus-api-prod.up.railway.app";
      const dev = process.env.SWAGGER_DEV_URL;
      const list = [{ url: prod, description: "Production server" }];
      if (dev) list.push({ url: dev, description: "Development server" });
      return list;
    })(),
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token obtained from admin login",
        },
        ApiKey: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API key for external integrations",
        },
      },
      schemas: {
        Article: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            slug: { type: "string" },
            body: { type: "string" },
            author: { type: "string" },
            publishedAt: { type: "string", format: "date-time" },
            tags: { type: "array", items: { type: "string" } },
          },
        },
        Deal: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            discount: { type: "number" },
            validUntil: { type: "string", format: "date-time" },
            tenantId: { type: "string" },
          },
        },
        Product: {
          type: "object",
          properties: {
            _id: { type: "string" },
            name: { type: "string" },
            sku: { type: "string" },
            price: { type: "number" },
            category: { type: "string" },
            inventory: { type: "number" },
          },
        },
        HealthCheck: {
          type: "object",
          properties: {
            status: { type: "string", example: "ok" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            code: { type: "string" },
            message: { type: "string" },
            details: { type: "object" },
          },
        },
        PaginationQuery: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            pageSize: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
        },
      },
    },
    tags: [
      { name: "Health", description: "Health check endpoints" },
      {
        name: "Content",
        description: "Public content endpoints (articles, deals)",
      },
      { name: "Admin", description: "Protected admin endpoints" },
      {
        name: "Personalization",
        description: "Personalization and recommendations",
      },
      { name: "AI", description: "AI chat and support" },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/index.ts"], // Path to route files with JSDoc
};

export const swaggerSpec = swaggerJsdoc(options);
