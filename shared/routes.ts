import { z } from 'zod';
import { insertTaskSchema, tasks, users } from './schema';

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
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    submitted: {
      method: 'GET' as const,
      path: '/api/tasks/submitted',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/tasks/:id',
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      // Важно: coerce.date() превращает строку из формы в объект Date
      input: insertTaskSchema.extend({ deadline: z.coerce.date() }),
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    submitEvidence: {
      method: 'POST' as const,
      path: '/api/tasks/:id/evidence',
      input: z.object({ evidenceUrl: z.string() }),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    complete: {
      method: 'POST' as const,
      path: '/api/tasks/:id/complete',
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    fail: {
      method: 'POST' as const,
      path: '/api/tasks/:id/fail',
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  users: {
    me: {
      method: 'GET' as const,
      path: '/api/users/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
      }
    },
    // Изменили на синхронизацию депозита из блокчейна
    addFunds: {
      method: 'POST' as const,
      path: '/api/users/funds',
      input: z.object({ 
        amount: z.number().positive(),
        txHash: z.string() // Добавили хэш транзакции вместо Robokassa
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      }
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