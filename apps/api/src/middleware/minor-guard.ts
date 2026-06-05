import { FastifyRequest, FastifyReply } from 'fastify';
import { MinorRestrictedError } from '../lib/errors';

// Layer 1 of the DPDP minor data firewall.
// Applied as preHandler on routes that expose public/social/competitive features.
// Layer 2: service queries always add isMinorData: false filter
// Layer 3: Postgres RLS policy as safety net
export async function blockMinors(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  if (request.user.isMinor) {
    throw new MinorRestrictedError();
  }
}
