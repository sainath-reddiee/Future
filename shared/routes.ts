
import { z } from 'zod';
import { insertTradeSchema, trades, insertSignalSchema, signals, portfolio, marketData } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  trades: {
    list: {
      method: 'GET' as const,
      path: '/api/trades',
      responses: {
        200: z.array(z.custom<typeof trades.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/trades',
      input: insertTradeSchema,
      responses: {
        201: z.custom<typeof trades.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    close: {
      method: 'POST' as const,
      path: '/api/trades/:id/close',
      input: z.object({ exitLogic: z.string(), exitPrice: z.number() }),
      responses: {
        200: z.custom<typeof trades.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  signals: {
    list: {
      method: 'GET' as const,
      path: '/api/signals',
      responses: {
        200: z.array(z.custom<typeof signals.$inferSelect>()),
      },
    },
    // Trigger AI analysis manually for demo purposes
    analyze: {
      method: 'POST' as const,
      path: '/api/signals/analyze',
      input: z.object({ headline: z.string() }), // Simulating incoming news
      responses: {
        201: z.custom<typeof signals.$inferSelect>(),
        500: errorSchemas.internal,
      },
    }
  },
  portfolio: {
    get: {
      method: 'GET' as const,
      path: '/api/portfolio',
      responses: {
        200: z.custom<typeof portfolio.$inferSelect>(),
      },
    }
  },
  marketData: {
    get: {
      method: 'GET' as const,
      path: '/api/market-data',
      responses: {
        200: z.custom<typeof marketData.$inferSelect>(),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
