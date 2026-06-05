import type { Server as SocketServer, Namespace, Socket } from 'socket.io';
import { createPublicKey, verify as cryptoVerify } from 'crypto';
import { redis, KEYS } from '../../lib/redis';
import { config } from '../../lib/config';
import { battleNsRef } from './battle-ns';
import { resolveBattle } from './battle.service';
import type { JwtPayload } from '../../lib/types';

// Verify an RS256 JWT using Node's built-in crypto module.
// Returns the decoded payload or throws on invalid signature / expiry.
function verifyJwt(token: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed JWT');

  const [headerB64, payloadB64, sigB64] = parts;
  const data      = Buffer.from(`${headerB64}.${payloadB64}`);
  const signature = Buffer.from(sigB64, 'base64url');
  const pubKey    = createPublicKey(config.jwtPublicKey);

  const valid = cryptoVerify('SHA256', data, pubKey, signature);
  if (!valid) throw new Error('Invalid JWT signature');

  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as JwtPayload;
  if (payload.exp && payload.exp < Date.now() / 1000) throw new Error('JWT expired');

  return payload;
}

interface BattleSocket extends Socket {
  userId?: string;
  battleId?: string;
}

interface BattleState {
  status: string;
  player1Id: string;
  player2Id: string | null;
  questionCount: number;
  timeLimitSecs: number;
}

export function setupBattleNamespace(io: SocketServer): void {
  const ns: Namespace = io.of('/battle');
  battleNsRef.set(ns);

  ns.on('connection', (socket: BattleSocket) => {
    // ── join_battle ─────────────────────────────────────────────
    // Client sends its access token (can't use httpOnly cookie in WS).
    socket.on('join_battle', async (data: { battleId: string; token: string }) => {
      try {
        const payload = verifyJwt(data.token);

        if (payload.isMinor) {
          socket.emit('error', { code: 'MINOR_RESTRICTED', message: 'Battle is 18+ only' });
          return;
        }

        const stateRaw = await redis.get(KEYS.battleState(data.battleId));
        if (!stateRaw) {
          socket.emit('error', { code: 'NOT_FOUND', message: 'Battle not found' });
          return;
        }

        const state: BattleState = JSON.parse(stateRaw);
        if (payload.sub !== state.player1Id && payload.sub !== state.player2Id) {
          socket.emit('error', { code: 'FORBIDDEN', message: 'You are not a player in this battle' });
          return;
        }

        socket.userId = payload.sub;
        socket.battleId = data.battleId;

        socket.join(`battle:${data.battleId}`);
        socket.to(`battle:${data.battleId}`).emit('opponent_joined', { userId: payload.sub });
        socket.emit('joined', { battleId: data.battleId, status: state.status });
      } catch {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
      }
    });

    // ── submit_answer ───────────────────────────────────────────
    socket.on('submit_answer', async (data: {
      battleId: string;
      questionId: string;
      selectedOption: string | null;
      timeSpentSecs?: number | null;
    }) => {
      const { userId, battleId: socketBattleId } = socket;
      if (!userId || socketBattleId !== data.battleId) {
        socket.emit('error', { code: 'UNAUTHORIZED', message: 'Call join_battle first' });
        return;
      }

      try {
        const stateRaw = await redis.get(KEYS.battleState(data.battleId));
        if (!stateRaw) return;

        const state: BattleState = JSON.parse(stateRaw);
        if (state.status !== 'active') return;

        // Upsert answer (player may change answer before submitting all)
        const answerKey = KEYS.battleAnswers(data.battleId, userId);
        const existing = await redis.get(answerKey);
        const answers: AnswerEntry[] = existing ? JSON.parse(existing) : [];

        const entry: AnswerEntry = {
          questionId: data.questionId,
          selectedOption: data.selectedOption ?? null,
          timeSpentSecs: data.timeSpentSecs ?? null,
        };

        const idx = answers.findIndex((a) => a.questionId === data.questionId);
        if (idx >= 0) answers[idx] = entry;
        else answers.push(entry);

        await redis.set(answerKey, JSON.stringify(answers), 'EX', 3600);

        // Tell the opponent how many questions this player has answered (not which)
        socket.to(`battle:${data.battleId}`).emit('opponent_answered', {
          answeredCount: answers.length,
          totalQuestions: state.questionCount,
        });

        // Both players finished → resolve immediately
        if (!state.player2Id) return;
        const otherPlayerId = userId === state.player1Id ? state.player2Id : state.player1Id;
        const otherRaw = await redis.get(KEYS.battleAnswers(data.battleId, otherPlayerId));
        const otherAnswers: AnswerEntry[] = otherRaw ? JSON.parse(otherRaw) : [];

        if (answers.length >= state.questionCount && otherAnswers.length >= state.questionCount) {
          await resolveBattle(data.battleId);
        }
      } catch (err) {
        console.error('[battle:socket] submit_answer error:', err);
      }
    });

    // ── disconnect ─────────────────────────────────────────────
    // The BullMQ timer job handles cleanup if the player never reconnects.
    // A graceful rejoin within the timer window is handled automatically
    // because the battle state remains in Redis.
    socket.on('disconnect', () => {
      const { userId, battleId } = socket;
      if (userId && battleId) {
        console.log(`[battle:socket] player ${userId} disconnected from battle ${battleId}`);
      }
    });
  });
}

interface AnswerEntry {
  questionId: string;
  selectedOption: string | null;
  timeSpentSecs: number | null;
}
