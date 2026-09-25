import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  Version,
  VERSION_NEUTRAL,
  Inject,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { Response } from 'express';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Public } from '@azeebo/security';
import { JwtService } from '@nestjs/jwt';
import { CreatorService } from './creator.service';

/**
 * Public, unauthenticated challenge board pages.
 *
 * Shared leaderboard links must render for logged-out viewers AND produce a
 * social preview card. Two routes cooperate:
 *
 *  - GET /boards/:challengeId — the page itself. Serves client/dist/index.html
 *    with OG/Twitter meta tags injected (challenge title, prize, top entry)
 *   so link unfurls render a preview card for crawlers and chat apps.
 *  - GET /api/v1/creator/boards/:challengeId — read-only board data
 *    (server strips userIds; display names already masked upstream).
 *
 * Deliberately OUTSIDE the CreatorController's JwtAuthGuard/RolesGuard:
 * these are the only public surfaces of the portal. The data endpoint is
 * read-only, projection-minimal, and rate-limited at the gateway.
 *
 * @Public() exempts both from the portal's global ServiceAuthGuard. The page
 * route is VERSION_NEUTRAL so the shareable URL is /boards/:id (clean), while
 * the data endpoint stays versioned at /v1/creator/boards/:id like every API.
 */
@Public()
@Controller()
export class PublicBoardsController {
  // Explicit @Inject tokens: the portal compiles without design:paramtypes
  // (no emitDecoratorMetadata under tsx), so bare param types don't resolve.
  constructor(
    @Inject(CreatorService) private readonly creatorService: CreatorService,
    @Inject(JwtService) private readonly jwtService: JwtService
  ) {}

  @Get('creator/boards/:challengeId')
  async getPublicBoard(@Param('challengeId') challengeId: string, @Req() req: Request) {
    const board = await this.creatorService.getChallengeLeaderboard(challengeId);
    // Best-effort identity: if the viewer holds a valid session cookie, tell
    // them WHICH rows are theirs via a per-row boolean. The userIds themselves
    // stay stripped — an anonymous viewer gets booleans that are all false,
    // which leaks nothing.
    const viewerId = this.resolveViewerId(req);
    // Strip user identifiers — public consumers get display names only.
    return {
      success: true,
      data: {
        challenge: board.challenge,
        totalEntries: board.totalEntries,
        entries: board.entries.map((e) => ({
          position: e.position,
          displayName: e.displayName,
          status: e.status,
          submittedAt: e.submittedAt,
          isOwn: viewerId !== null && e.userId === viewerId,
        })),
      },
    };
  }

  /**
   * Resolve the viewer's user id from their session cookie (or Bearer header),
   * without ever throwing — this endpoint must stay usable logged-out.
   */
  private resolveViewerId(req: Request): string | null {
    const authHeader = req.headers['authorization'];
    const token =
      authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies?.['access_token'];
    if (!token) return null;
    try {
      const payload = this.jwtService.verify<{ sub?: string }>(token, {
        audience: 'azeebo-api',
        issuer: 'azeebo-auth',
      });
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }

  @Version(VERSION_NEUTRAL)
  @Get('boards/:challengeId')
  async getBoardPage(
    @Param('challengeId') challengeId: string,
    @Res() res: Response
  ): Promise<void> {
    const indexPath = join(
      __dirname,
      '..',
      '..',
      'client',
      'dist',
      'index.html'
    );
    if (!existsSync(indexPath)) {
      // Client not built (dev serves it via Vite instead) — nothing to tag.
      throw new NotFoundException('Client build not available');
    }

    const board = await this.creatorService.getChallengeLeaderboard(challengeId);
    const hasEntries = board.entries.length > 0;
    const winner = hasEntries ? board.entries[0] : null;

    // prize arrives as a Prisma Decimal serialized to string ("100") — parse
    // defensively so the OG description shows "Prize ₦100", not a fallback.
    const prizeValue = Number(board.challenge.prize);
    const prize =
      Number.isFinite(prizeValue) && prizeValue > 0
        ? `Prize ₦${prizeValue.toLocaleString()}`
        : null;
    const title = `${board.challenge.title} — Challenge Leaderboard | Azeebo+`;
    const description = hasEntries
      ? `${board.totalEntries} entries · ${prize ?? 'Live leaderboard'} · Winner: ${winner!.displayName}`
      : `${board.totalEntries} entries · ${prize ?? 'Live leaderboard'} · Winner announced soon`;

    const html = readFileSync(indexPath, 'utf8');
    const ogTags = [
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="Azeebo+ Creator Portal" />`,
      `<meta property="og:title" content="${escapeHtml(title)}" />`,
      `<meta property="og:description" content="${escapeHtml(description)}" />`,
      `<meta name="twitter:card" content="summary" />`,
      `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
      `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    ].join('\n    ');

    res.type('html').send(html.replace('</title>', `</title>\n    ${ogTags}`));
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
