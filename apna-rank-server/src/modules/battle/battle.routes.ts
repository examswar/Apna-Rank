import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';
import { blockMinors } from '../../shared/middleware/minor-guard';

const challengeBody = z.object({
  examCategory: z.string(),
});

// Battle real-time communication is via Socket.io (/battle namespace).
// These REST endpoints handle session creation and history only.
export default async function battleRoutes(app: FastifyInstance) {
  // All battle routes: adult (18+) students only
  const adultAuth = { preHandler: [authenticate, blockMinors] };

  // POST /api/v1/battle/challenge — create challenge, returns battle_id
  app.post('/challenge', adultAuth, async (request, reply) => {
    const body = challengeBody.parse(request.body);
    // TODO: BattleService.createChallenge(request.user.id, body.examCategory)
    // Selects battle questions using spaced-revision pool from student's Galti Notebook
    return reply.status(201).send(ok({ battleId: 'TODO', status: 'waiting' }));
  });

  // POST /api/v1/battle/matchmake — auto-match with same exam category
  app.post('/matchmake', adultAuth, async (request, reply) => {
    const body = challengeBody.parse(request.body);
    // TODO: BattleService.matchmake(request.user.id, body.examCategory)
    // Finds WAITING battle created < 60s ago, same examCategory
    return reply.status(200).send(ok({ battleId: 'TODO', status: 'waiting' }));
  });

  // GET /api/v1/battle/history — past battle results
  // Must be registered BEFORE /:id so "history" is not swallowed as an id param
  app.get('/history', adultAuth, async (request, reply) => {
    // TODO: BattleService.getHistory(request.user.id)
    return reply.status(200).send(ok({ battles: [] }));
  });

  // GET /api/v1/battle/:id — battle room state (for reconnection)
  app.get('/:id', adultAuth, async (request, reply) => {
    const { id } = request.params as { id: string };
    // TODO: BattleService.getBattleState(id, request.user.id)
    return reply.status(200).send(ok({ battleId: id, status: 'waiting' }));
  });
}
