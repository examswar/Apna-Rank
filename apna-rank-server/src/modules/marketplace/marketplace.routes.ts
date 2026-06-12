import { FastifyInstance } from 'fastify';
import { ok, paginated } from '../../shared/response';
import { authenticate } from '../../shared/middleware/authenticate';

export default async function marketplaceRoutes(app: FastifyInstance) {
  // GET /api/v1/marketplace — public test marketplace
  // Filtered by examCategory, price range, teacher, subject
  app.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { examCategory, minPrice, maxPrice, page = '1', limit = '20' } =
      request.query as Record<string, string>;
    // TODO: MarketplaceService.browse({ examCategory, minPrice, maxPrice, page, limit })
    return reply.status(200).send(ok({ tests: [], total: 0 }));
  });

  // GET /api/v1/marketplace/purchased — tests student has already purchased
  app.get('/purchased', { preHandler: authenticate }, async (request, reply) => {
    // TODO: MarketplaceService.getPurchased(request.user.id)
    return reply.status(200).send(ok({ tests: [] }));
  });
}
