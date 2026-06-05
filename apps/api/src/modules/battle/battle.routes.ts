import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ok, paginated } from '../../lib/response';
import { authenticate } from '../../middleware/authenticate';
import { blockMinors } from '../../middleware/minor-guard';
import * as BattleService from './battle.service';

const examCategoryEnum = z.enum([
  'SSC_CGL', 'SSC_CHSL', 'SSC_MTS', 'SSC_GD', 'SSC_CPO',
  'RAILWAY_NTPC', 'RAILWAY_GROUP_D', 'RAILWAY_ALP', 'RAILWAY_JE',
  'UPSC_CSE', 'UPSC_CDS', 'UPSC_NDA',
  'NEET_UG', 'NEET_PG', 'JEE_MAIN', 'JEE_ADVANCED',
  'BOARDS_10TH', 'BOARDS_12TH',
]);

const challengeBody  = z.object({ examCategory: examCategoryEnum });
const matchmakeBody  = z.object({ examCategory: examCategoryEnum });

export default async function battleRoutes(app: FastifyInstance) {
  // Minor guard is LAYER 1 on every route in this module (DPDP firewall).
  const battleAuth = { preHandler: [authenticate, blockMinors] };

  // POST /api/v1/battle/challenge
  // Creates a WAITING battle and returns a shareable inviteUrl.
  app.post('/challenge', battleAuth, async (request, reply) => {
    const body = challengeBody.parse(request.body);
    const result = await BattleService.createChallenge(request.user.id, body.examCategory);
    return reply.status(201).send(ok(result));
  });

  // POST /api/v1/battle/join/:inviteCode
  // Player 2 joins a WAITING battle; notifies player 1 via Socket.io.
  app.post('/join/:inviteCode', battleAuth, async (request, reply) => {
    const { inviteCode } = request.params as { inviteCode: string };
    const result = await BattleService.joinByInviteCode(inviteCode.toUpperCase(), request.user.id);
    return reply.status(200).send(ok(result));
  });

  // POST /api/v1/battle/matchmake
  // Joins a random WAITING battle in the same exam category (or creates one).
  app.post('/matchmake', battleAuth, async (request, reply) => {
    const body = matchmakeBody.parse(request.body);
    const result = await BattleService.matchmake(request.user.id, body.examCategory);
    return reply.status(200).send(ok(result));
  });

  // GET /api/v1/battle/history
  // Paginated list of completed/abandoned battles for the authenticated user.
  // Registered before /:battleId so Fastify's radix tree prefers the static route.
  app.get('/history', battleAuth, async (request, reply) => {
    const q = request.query as { page?: string; limit?: string };
    const page  = Math.max(1, parseInt(q.page  ?? '1',  10));
    const limit = Math.min(50, Math.max(1, parseInt(q.limit ?? '20', 10)));
    const result = await BattleService.getHistory(request.user.id, page, limit);
    return reply.status(200).send(paginated(result.battles, result.total, page, limit));
  });

  // GET /api/v1/battle/:battleId
  app.get('/:battleId', battleAuth, async (request, reply) => {
    const { battleId } = request.params as { battleId: string };
    const battle = await BattleService.getBattle(battleId, request.user.id);
    return reply.status(200).send(ok(battle));
  });

  // POST /api/v1/battle/:battleId/forfeit
  app.post('/:battleId/forfeit', battleAuth, async (request, reply) => {
    const { battleId } = request.params as { battleId: string };
    await BattleService.forfeit(battleId, request.user.id);
    return reply.status(200).send(ok({ forfeited: true }));
  });
}
