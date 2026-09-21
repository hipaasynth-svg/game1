import Fastify, { type FastifyInstance } from 'fastify';
import type pg from 'pg';
import { defaultGameConfig, type GameConfig } from '@game1/game-engine';
import { createPlayer, getPlayerBalance, PlayerNotFoundError } from './players.js';
import { InsufficientFundsError, playSpin } from './spin.js';
import { gcToMicros, microsToGc } from './money.js';

export interface BuildAppOptions {
  pool: pg.Pool;
  config?: GameConfig;
}

export function buildApp({ pool, config = defaultGameConfig }: BuildAppOptions): FastifyInstance {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ ok: true }));

  app.post('/players', async (_request, reply) => {
    const { playerId, balanceMicros } = await createPlayer(pool);
    reply.code(201);
    return { playerId, balanceGc: microsToGc(balanceMicros) };
  });

  app.get<{ Params: { id: string } }>('/players/:id/balance', async (request, reply) => {
    try {
      const balanceMicros = await getPlayerBalance(pool, request.params.id);
      return { playerId: request.params.id, balanceGc: microsToGc(balanceMicros) };
    } catch (err) {
      if (err instanceof PlayerNotFoundError) {
        reply.code(404);
        return { error: err.message };
      }
      throw err;
    }
  });

  app.post<{ Params: { id: string }; Body: { betGc: number } }>(
    '/players/:id/spin',
    {
      schema: {
        body: {
          type: 'object',
          required: ['betGc'],
          properties: { betGc: { type: 'number', exclusiveMinimum: 0 } },
        },
      },
    },
    async (request, reply) => {
      const betMicros = gcToMicros(request.body.betGc);
      try {
        const outcome = await playSpin(pool, request.params.id, betMicros, config);
        return {
          playerId: request.params.id,
          betGc: microsToGc(outcome.betMicros),
          winGc: microsToGc(outcome.winMicros),
          balanceGc: microsToGc(outcome.balanceMicros),
          round: outcome.round,
        };
      } catch (err) {
        if (err instanceof PlayerNotFoundError) {
          reply.code(404);
          return { error: err.message };
        }
        if (err instanceof InsufficientFundsError) {
          reply.code(402);
          return { error: err.message };
        }
        throw err;
      }
    },
  );

  return app;
}
