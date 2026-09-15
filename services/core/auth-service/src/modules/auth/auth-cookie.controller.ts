import { Controller, Post, Delete, Get, Body, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { Public } from '@azeebo/security';

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * httpOnly cookie management for SPA clients (admin/creator/web panels).
 *
 * The client apps log in via /auth/login (JSON body response) and then call
 * POST /auth/cookie to move the tokens into httpOnly cookies so subsequent
 * requests authenticate via the cookie fallback in ServiceAuthGuard /
 * GatewayAuthGuard. POST /auth/csrf bootstraps the CSRF double-submit cookie.
 *
 * NOTE: This lives in auth-service because the gateway forwards
 * /api/v1/auth/* here — the standalone admin/creator apps mount an identical
 * controller locally for direct (non-gateway) access.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthCookieController {
  @Public()
  @Post('cookie')
  @ApiOperation({ summary: 'Set auth tokens as httpOnly cookies' })
  setCookie(
    @Body() body: { access_token?: string; refresh_token?: string },
    @Res() res: Response
  ): void {
    // The gateway injects x-user-* headers for authenticated callers; the
    // tokens themselves arrive in the body from the SPA that just logged in.
    if (body?.access_token) {
      res.cookie('access_token', body.access_token, COOKIE_OPTIONS);
    }
    if (body?.refresh_token) {
      res.cookie('refresh_token', body.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }
    res.json({ success: true });
  }

  @Public()
  @Delete('cookie')
  @ApiOperation({ summary: 'Clear auth cookies' })
  clearCookie(@Res() res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.json({ success: true });
  }

  @Public()
  @Get('csrf')
  @ApiOperation({ summary: 'Bootstrap the CSRF double-submit cookie' })
  csrf(@Req() req: Request, @Res() res: Response): void {
    // Mirrors the gateway CsrfMiddleware cookie contract: httpOnly + strict,
    // token readable by the client via the X-CSRF-Token response header.
    let token = req.cookies?.['_csrf'];
    if (!token) {
      token = randomBytes(32).toString('hex');
      res.cookie('_csrf', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as const,
        path: '/',
      });
    }
    res.setHeader('X-CSRF-Token', token);
    res.json({ success: true });
  }
}
