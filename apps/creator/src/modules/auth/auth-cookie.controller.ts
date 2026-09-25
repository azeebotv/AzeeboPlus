import { Controller, Post, Delete, Body, Res } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

@ApiTags('Auth')
@Controller('auth')
export class AuthCookieController {
  @Post('cookie')
  @ApiOperation({ summary: 'Set auth tokens as httpOnly cookies' })
  setCookie(
    @Body() body: { access_token: string; refresh_token: string },
    @Res() res: Response
  ): void {
    if (body.access_token) {
      res.cookie('access_token', body.access_token, COOKIE_OPTIONS);
    }
    if (body.refresh_token) {
      res.cookie('refresh_token', body.refresh_token, {
        ...COOKIE_OPTIONS,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }
    res.json({ success: true });
  }

  @Delete('cookie')
  @ApiOperation({ summary: 'Clear auth cookies' })
  clearCookie(@Res() res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
    res.json({ success: true });
  }
}
